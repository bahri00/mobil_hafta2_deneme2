const express = require('express');
const ExpertQuestion = require('../models/ExpertQuestion');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/expert-questions — get current user's questions
router.get('/', auth, async (req, res) => {
    try {
        const questions = await ExpertQuestion.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json(questions.map(q => ({
            id: q._id,
            type: q.type,
            question: q.question,
            status: q.status,
            answer: q.answer,
            date: q.createdAt.toISOString().split('T')[0],
        })));
    } catch (err) {
        console.error('Get expert questions error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// POST /api/expert-questions — submit a new question
router.post('/', auth, async (req, res) => {
    try {
        const { type, question, audioBase64, audioMimeType } = req.body;
        if (!type || !['text', 'voice', 'video'].includes(type)) {
            return res.status(400).json({ error: 'Geçerli bir soru türü seçin (text, voice, video)' });
        }
        if (type === 'text' && !question?.trim()) {
            return res.status(400).json({ error: 'Yazılı sorular için soru metni gereklidir' });
        }
        if (type === 'voice' && !audioBase64) {
            return res.status(400).json({ error: 'Sesli sorular için ses kaydı gereklidir' });
        }

        const q = await ExpertQuestion.create({
            userId: req.userId,
            type,
            question: question?.trim() ?? '',
            audioBase64: audioBase64 ?? null,
            audioMimeType: audioMimeType ?? null,
            status: 'pending',
        });

        res.status(201).json({
            id: q._id,
            type: q.type,
            question: q.question,
            status: q.status,
            answer: q.answer,
            date: q.createdAt.toISOString().split('T')[0],
        });
    } catch (err) {
        console.error('Create expert question error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
