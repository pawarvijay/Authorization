
const express = require('express');
const { caslMiddleware } = require('../middleware/casl');
const router = express.Router();


const Purchases = require('../models/Purchases');

// Create
router.post('/', caslMiddleware('create', 'purchases'), async (req, res) => {
    try {
        const purchase = new Purchases({ ...req.body });
        await purchase.save();
        res.status(201).json(purchase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read all
router.get('/', caslMiddleware('read', 'purchases'), async (req, res) => {
    try {
        const purchases = await Purchases.find();
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read one
router.get('/:id', caslMiddleware('read', 'purchases'), async (req, res) => {
    try {
        const purchase = await Purchases.findOne({ id: req.params.id });
        if (!purchase) return res.status(404).json({ error: 'Not found' });
        res.json(purchase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update
router.put('/:id', caslMiddleware('update', 'purchases'), async (req, res) => {
    try {
        const purchase = await Purchases.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: false }
        );
        if (!purchase) return res.status(404).json({ error: 'Not found' });
        res.json(purchase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update vendor only
// Note: CASL middleware enforces that the user must have `read` on 'purchases'
// (central policy) before evaluating this `update` permission. This endpoint
// updates only the `vendor` field and returns the updated document.
router.patch('/:id/vendor', caslMiddleware('update', 'purchases'), async (req, res) => {
    try {
        const { vendor } = req.body;
        const purchase = await Purchases.findOneAndUpdate(
            { id: req.params.id },
            { $set: { vendor } },
            { new: false }
        );
        if (!purchase) return res.status(404).json({ error: 'Not found' });
        res.json(purchase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete
router.delete('/:id', caslMiddleware('delete', 'purchases'), async (req, res) => {
    try {
        const result = await Purchases.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
