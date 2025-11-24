// src/server.js
const express = require('express');
const path = require('path');
const CoordinatorAgent = require('./agents/coordinator');

// --- Configuration ---
const PORT = process.env.PORT || 3002;
const app = express();
const coordinator = new CoordinatorAgent();

// --- Middleware ---
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve static files

// --- API Endpoint ---
app.post('/api/query', async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing query in request body.' });
    }

    console.log(`[Coordinator] Received query: "${query}"`);

    try {
        // Orchestrate the multi-agent flow
        const result = await coordinator.orchestrate(query);

        console.log(`[Coordinator] Final result generated for query: "${query}"`);
        res.json(result);

    } catch (error) {
        console.error(`[Coordinator] Orchestration failed for query "${query}":`, error.message);
        // Return a generic error to the client, logging details on the server
        res.status(500).json({
            query: query,
            error: true,
            message: error.message || 'An unknown error occurred during agent orchestration.',
            details: error.details || null
        });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`\n🤖 Multi-Agent Orchestrator Server running on http://localhost:${PORT}`);
    console.log(`\nFrontend served at: http://localhost:${PORT}/index.html`);
    console.log(`API endpoint: POST /api/query`);
});

// For Vercel/Serverless environments, exporting the app is often necessary.
module.exports = app;