// Helper to call OpenAI Vision/Text model to extract item names from a receipt image.
// Exports: parseReceiptWithOpenAI(buffer) -> { items: string[], rawModelText?: string }

const OpenAI = require('openai');

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a receipt item extraction engine. Return ONLY a JSON object with shape:
{ "items": ["item name", ...] }
Rules:
- items array must contain distinct lowercase product/food item names.
- Exclude totals, tax, payment lines, greetings.
- Normalize whitespace, lowercase, singular where obvious.
- If nothing found, return { "items": [] }.
No extra commentary.`;

async function parseReceiptWithOpenAI(buffer) {
  if (!client) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.');
  }
  const base64 = buffer.toString('base64');
  const input = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: [
        { type: 'input_text', text: 'Extract items from this receipt image.' },
        { type: 'input_image', image_url: `data:image/jpeg;base64,${base64}` }
      ]
    }
  ];

  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: input,
    temperature: 0,
    response_format: { type: 'json_object' }
  });

  // Depending on SDK version, adjust how to access content
  const message = resp.choices?.[0]?.message;
  let text = '';
  if (message?.content) {
    if (Array.isArray(message.content)) {
      text = message.content.map(part => (typeof part === 'string' ? part : part.text || '')).join('\n');
    } else {
      text = message.content;
    }
  }
  if (!text) text = JSON.stringify(message);

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // Attempt naive extraction of first JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { json = JSON.parse(match[0]); } catch (e2) { throw new Error('Failed to parse JSON from model output'); }
    } else {
      throw new Error('Model did not return JSON');
    }
  }
  if (!Array.isArray(json.items)) json.items = [];
  const items = [...new Set(json.items.map(i => String(i).trim().toLowerCase()).filter(Boolean))];
  return { items, rawModelText: process.env.INCLUDE_MODEL_RAW ? text : undefined };
}

module.exports = { parseReceiptWithOpenAI };
