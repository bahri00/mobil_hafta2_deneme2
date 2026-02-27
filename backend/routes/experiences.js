const express = require('express');
const Experience = require('../models/Experience');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/experiences — public, returns all experiences newest first
router.get('/', async (req, res) => {
    try {
        const experiences = await Experience.find()
            .sort({ createdAt: -1 })
            .lean();

        res.json(experiences.map(e => ({
            id: e._id,
            title: e.title,
            summary: e.summary,
            content: e.content,
            author: e.author,
            date: e.createdAt ? e.createdAt.toISOString().split('T')[0] : '',
        })));
    } catch (err) {
        console.error('Get experiences error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// POST /api/experiences — authenticated, create new experience
router.post('/', auth, async (req, res) => {
    try {
        const { title, summary, content, author } = req.body;
        if (!title || !summary || !content || !author) {
            return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
        }

        const experience = await Experience.create({
            title: title.trim(),
            summary: summary.trim(),
            content: content.trim(),
            author: author.trim(),
            userId: req.userId,
        });

        res.status(201).json({
            id: experience._id,
            title: experience.title,
            summary: experience.summary,
            content: experience.content,
            author: experience.author,
            date: experience.createdAt.toISOString().split('T')[0],
        });
    } catch (err) {
        console.error('Create experience error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
