const express = require('express');
const mongoose = require('mongoose');
const salesRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchase');

const app = express();
app.use(express.json());

// API routes
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);

// Error handler
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

module.exports = app;
