// Extracted receipt parsing logic for incremental refactor.
// Currently mirrors the inline version in items.js so behavior stays identical.
// Next step will be to import this in items.js and remove the duplicate there.

function parseReceiptText(text) {
  const lines = text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items = [];
  const priceRegex = /(\d+[\.,]\d{2})$/; // price at end (optional)

  for (const rawLine of lines) {
    if (/subtotal|total|tax|change|visa|mastercard|debit|cash|thank/i.test(rawLine)) continue;
    if (rawLine.length < 3) continue;

    const priceMatch = rawLine.match(priceRegex);
    let working = rawLine;
    let price = null;
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(',', '.'));
      working = rawLine.slice(0, rawLine.lastIndexOf(priceMatch[1])).trim();
    }
    // Strip leading codes / SKUs
    working = working.replace(/^[#\-\d\s]{1,10}/, '').trim();
    // Normalize spacing
    working = working.replace(/\s{2,}/g, ' ');
    if (!working) continue;
    const normalized = working.toLowerCase();
    items.push({ rawLine, name: normalized, display: working, price });
  }

  return {
    items,
    summary: {
      count: items.length
    }
  };
}

module.exports = { parseReceiptText };
