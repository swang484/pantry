require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced diagnostics: capture unhandled errors early
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
});

let prisma; // lazy import only if available
try {
    ({ prisma } = require('./src/lib/prisma'));
} catch (e) {
    console.warn('[startup] Prisma not loaded yet:', e.message);
}

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/pantry', require('./src/routes/pantry'));
app.use('/api/cooks', require('./src/routes/cooks'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/items', require('./src/routes/items')); // Receipt OCR & parsing
app.use('/api/recipes', require('./src/routes/recipes'));
app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/profiles', require('./src/routes/profiles'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Pantry Backend API is running!',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

async function start() {
    // Optional startup probe for Prisma connectivity (will not block if prisma missing)
    if (prisma) {
        try {
            // Simple lightweight query to ensure the engine can start
            await prisma.$queryRaw`SELECT 1`;
            console.log('[startup] Prisma connectivity OK');
        } catch (e) {
            console.error('[startup] Prisma connectivity failed:', e.message);
        }
    }
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
}

start().catch(e => {
    console.error('[startup] Fatal error before listen:', e);
    process.exit(1);
});
