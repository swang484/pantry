// Gemini (Google Generative AI) based receipt parsing helper
// Exports: parseReceiptWithGemini(buffer) -> { items: string[], rawModelText?: string }
// Requires env: GEMINI_API_KEY and optional GEMINI_MODEL.
// We attempt a small list of known model name variants to smooth over naming changes.

const { GoogleGenerativeAI } = require('@google/generative-ai');

let client = null;
if (process.env.GEMINI_API_KEY) {
  client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Canonical model preference order. We will prepend an explicit env override if provided.
// Newer 2.5 Flash variants first, then 1.5 fallbacks.
const MODEL_CANDIDATES_BASE = [
  'gemini-2.5-flash',            // latest mid-size multimodal (plain id)
  'gemini-2.5-flash-001',        // versioned
  'models/gemini-2.5-flash',     // fully-qualified name (API sometimes requires one form)
  'models/gemini-2.5-flash-001', // fully-qualified versioned
  'gemini-1.5-flash',            // legacy / fallback
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

const PROMPT = `You are a smart grocery receipt parser that extracts and normalizes food items into clean, human-readable names.

Return ONLY valid JSON with this shape:
{
  "items": ["item name", ...]
}

Rules:
- Extract ONLY product or food names.
- Normalize brand abbreviations and shorthand into generic ingredient names.
  - e.g., "WFM CLEMENTINE BAG" → "clementines"
  - "IMA TOMATO BASIL S" → "tomato basil sauce"
  - "BC NF VAN GRK YGRT" → "vanilla greek yogurt"
  - "BRM THCK RLD OATS" → "rolled oats"
- Remove prices, weights, quantities, or store codes.
- Exclude lines for tax, subtotal, total, refunds, payment methods, or greetings.
- Lowercase all items, singular or plural as appropriate.
- Return DISTINCT values only.
- Keep things in their simplest and SINGULAR state (e.g., "banana" instead of "bananas" and "potato" instead of "yukon gold potato").
- If nothing is found, return:
  { "items": [] }

Example:
Input text:
"""
WFM CLEMENTINE BAG 6.99
IMA TOMATO BASIL S 3.99
365 LT CHNK TUNA 2.59
SUBTOTAL 12.57
"""

Expected output:
{
  "items": ["clementines", "tomato basil sauce", "chunk light tuna"]
}`;

async function tryModel(modelName, buffer) {
  const model = client.getGenerativeModel({ model: modelName });
  const base64 = buffer.toString('base64');
  const imagePart = {
    inlineData: {
      data: base64,
      mimeType: 'image/jpeg'
    }
  };
  const result = await model.generateContent([
    { text: PROMPT },
    imagePart
  ]);
  const response = await result.response;
  const text = response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { json = JSON.parse(match[0]); } catch (e2) {
        throw new Error(`Failed to parse JSON from Gemini output for model ${modelName}`);
      }
    } else {
      throw new Error(`Gemini did not return JSON for model ${modelName}`);
    }
  }
  if (!Array.isArray(json.items)) json.items = [];
  const items = [...new Set(json.items.map(i => String(i).trim().toLowerCase()).filter(Boolean))];
  return { items, rawModelText: process.env.INCLUDE_MODEL_RAW ? text : undefined, model: modelName };
}

async function parseReceiptWithGemini(buffer) {
  if (!client) throw new Error('Gemini client not initialized (set GEMINI_API_KEY)');

  const userModel = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim();
  const tried = [];
  const candidates = userModel
    ? [userModel, ...MODEL_CANDIDATES_BASE.filter(m => m !== userModel)]
    : MODEL_CANDIDATES_BASE;

  let lastErr = null;
  for (const m of candidates) {
    try {
      const result = await tryModel(m, buffer);
      // Attach which model actually succeeded so caller can surface it.
      return result;
    } catch (e) {
      tried.push(m);
      lastErr = e;
      // Only continue fallback for 404 / not found / unsupported errors.
      const msg = String(e.message || e);
      if (!/not found|404|unsupported|No such model/i.test(msg)) {
        break; // Non-availability error; stop early.
      }
    }
  }
  const triedList = tried.join(', ');
  const baseMsg = `All Gemini model candidates failed (tried: ${triedList}).`;
  throw new Error(baseMsg + (lastErr ? ` Last error: ${lastErr.message || lastErr}` : ''));
}

module.exports = { parseReceiptWithGemini };
