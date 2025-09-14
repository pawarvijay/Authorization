
const express = require('express');
const { caslMiddleware } = require('../middleware/casl');
const router = express.Router();


const Sales = require('../models/Sales');

// Create
router.post('/', caslMiddleware('create', 'sales'), async (req, res) => {
    try {
        const sale = new Sales({ ...req.body });
        await sale.save();
        res.status(201).json(sale);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read all
router.get('/', caslMiddleware('read', 'sales'), async (req, res) => {
    try {
        const sales = await Sales.find();
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read one
router.get('/:id', caslMiddleware('read', 'sales'), async (req, res) => {
    try {
        const sale = await Sales.findOne({ id: req.params.id });
        if (!sale) return res.status(404).json({ error: 'Not found' });
        res.json(sale);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update
router.put('/:id', caslMiddleware('update', 'sales'), async (req, res) => {
    try {
        const sale = await Sales.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (!sale) return res.status(404).json({ error: 'Not found' });
        res.json(sale);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete
router.delete('/:id', caslMiddleware('delete', 'sales'), async (req, res) => {
    try {
        const result = await Sales.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
