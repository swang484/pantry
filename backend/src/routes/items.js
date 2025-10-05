const express = require('express');
const multer = require('multer');
// Gemini-only parsing (manual/Tesseract removed)
let parseReceiptWithGemini;
try {
  ({ parseReceiptWithGemini } = require('../lib/geminiParser'));
} catch (e) {
  console.error('[items route] Gemini parser unavailable:', e.message);
}
// Prisma for persisting pantry items
const { prisma } = require('../lib/prisma');

const router = express.Router();

// Multer setup (memory storage since we just need the buffer for OCR)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!/image\/(png|jpe?g|webp)/i.test(file.mimetype)) {
      return cb(new Error('Only PNG, JPG, JPEG, or WEBP images are allowed'));
    }
    cb(null, true);
  }
});

// Health / info endpoint
router.get('/health', (req, res) => {
  const defaultMode = 'gemini';
  const strategies = [ 'gemini' ];
  res.json({
    status: 'OK',
    message: 'Items (receipt) parser route ready',
    ocrEnabled: false,
    defaultMode,
    availableStrategies: strategies
  });
});

// In-memory receipt store (lightweight placeholder until persistence is added)
if (!global.__receiptStore) {
  global.__receiptStore = { counter: 0, receipts: [] }; // { id, items, richItems, rawText, createdAt, strategy }
}

// POST /api/items/parse - Upload a receipt image and parse items using Gemini only
// Query params:
//   (raw, rich no longer meaningful without manual OCR, kept for forward compatibility)
router.post('/parse', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use form field name "receipt".' });
  }
  if (!parseReceiptWithGemini) {
    return res.status(500).json({ error: 'Gemini parser not initialized (check GEMINI_API_KEY)' });
  }

  const wantRaw = false; // raw OCR removed
  const wantRich = false;

  try {
    const start = Date.now();
    let rawText = undefined; // no OCR now
    let parsed = { items: [] };
    let itemNames = [];
    let strategy = 'gemini';
    let geminiModelUsed = undefined;
    try {
      const llm = await parseReceiptWithGemini(req.file.buffer);
      itemNames = llm.items;
      geminiModelUsed = llm.model;
    } catch (e) {
      return res.status(500).json({ error: 'Gemini parsing failed', detail: e.message });
    }

    // Persist each item as quantity "1" (string) if not already present.
    // If an identical name exists, we could choose to increment. For now just append a new row.
    // Future enhancement: add uniqueness constraint or aggregate quantity.
    if (itemNames.length) {
      // Perform inserts sequentially to keep it simple (small lists typical); could batch with createMany.
      for (const name of itemNames) {
        try {
          await prisma.pantryItem.create({ data: { name, quantity: '1', expiry: null } });
        } catch (e) {
          console.warn('[items.parse] failed to insert pantry item', name, e.message);
        }
      }
    }

    // Create a receipt record
    const receiptId = `r_${Date.now()}_${++global.__receiptStore.counter}`;
    const record = {
      id: receiptId,
      createdAt: new Date().toISOString(),
      items: itemNames,
  richItems: parsed.items,
      rawText: undefined,
      strategy
    };
    global.__receiptStore.receipts.push(record);

    const response = {
      receiptId,
      items: itemNames,
      meta: {
        count: itemNames.length,
        schemaVersion: '1.0',
        strategy,
        timingMs: Date.now() - start,
        geminiModel: geminiModelUsed
      }
    };

  // rawText and richItems omitted in Gemini-only mode

    return res.json(response);
  } catch (err) {
    console.error('OCR parse error:', err);
    return res.status(500).json({ error: 'Failed to parse receipt', detail: err.message });
  }
});

// GET /api/items/models - list available Gemini models for the configured API key
// Optional query params:
//   contains=flash (case-insensitive substring filter on model name/displayName)
router.get('/models', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'Missing GEMINI_API_KEY' });
  const filterSub = (req.query.contains || '').toString().toLowerCase();
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  const url = `${baseUrl}?key=${apiKey}`;
  try {
    // Use global fetch (Node 18+). If unavailable, give instructive error.
    if (typeof fetch !== 'function') {
      return res.status(500).json({ error: 'fetch not available in this Node runtime (requires Node 18+)' });
    }
    const resp = await fetch(url);
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(resp.status).json({ error: 'Failed to fetch models', detail: txt.slice(0, 500) });
    }
    const json = await resp.json();
    let models = Array.isArray(json.models) ? json.models : [];
    models = models.map(m => ({
      name: m.name,
      displayName: m.displayName,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      supportedGenerationMethods: m.supportedGenerationMethods,
      state: m.state,
      releasePhase: m.releasePhase,
    }));
    if (filterSub) {
      models = models.filter(m =>
        (m.name && m.name.toLowerCase().includes(filterSub)) ||
        (m.displayName && m.displayName.toLowerCase().includes(filterSub))
      );
    }
    return res.json({ count: models.length, models });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list models', detail: e.message });
  }
});

// GET /api/items/:receiptId  - retrieve stored minimal receipt (optionally rich & raw)
router.get('/:receiptId', (req, res) => {
  const { receiptId } = req.params;
  const wantRaw = !!req.query.raw;
  const wantRich = !!req.query.rich;
  const store = global.__receiptStore;
  const rec = store.receipts.find(r => r.id === receiptId);
  if (!rec) return res.status(404).json({ error: 'Receipt not found' });
  return res.json({
    receiptId: rec.id,
    items: rec.items,
    meta: {
      count: rec.items.length,
      schemaVersion: '1.0',
      strategy: rec.strategy,
      createdAt: rec.createdAt
    },
    rawText: wantRaw ? rec.rawText : undefined,
    richItems: wantRich ? rec.richItems : undefined
  });
});

// POST /api/items/compare - stub comparison of manual vs LLM extracted lists
// Body: { manual: string[], llm: string[] }
router.post('/compare', express.json(), (req, res) => {
  const { manual = [], llm = [] } = req.body || {};
  const manualSet = new Set(manual.map(n => n.toLowerCase()));
  const llmSet = new Set(llm.map(n => n.toLowerCase()));
  const agreed = [...manualSet].filter(n => llmSet.has(n));
  const manualOnly = [...manualSet].filter(n => !llmSet.has(n));
  const llmOnly = [...llmSet].filter(n => !manualSet.has(n));
  // Conflicts (future use): placeholder empty now; could detect spelling differences
  const response = {
    comparison: {
      agreed,
      manualOnly,
      llmOnly,
      conflicts: []
    },
    meta: {
      manualCount: manual.length,
      llmCount: llm.length,
      agreedCount: agreed.length
    }
  };
  return res.json(response);
});

// (Inline parser removed; now using external module.)

module.exports = router;