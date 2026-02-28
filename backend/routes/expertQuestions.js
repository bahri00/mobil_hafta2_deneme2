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
            answerType: q.answerType,
            answer: q.answer,
            answerAudioBase64: q.answerAudioBase64,
            answerAudioMimeType: q.answerAudioMimeType,
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
            answerType: q.answerType,
            answer: q.answer,
            answerAudioBase64: q.answerAudioBase64,
            answerAudioMimeType: q.answerAudioMimeType,
            date: q.createdAt.toISOString().split('T')[0],
        });
    } catch (err) {
        console.error('Create expert question error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/expert-questions/all — get ALL questions (Doctor only)
router.get('/all', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        if (!currentUser || currentUser.role !== 'doctor') {
            return res.status(403).json({ error: 'Yetki yok. Sadece uzman doktorlar görebilir.' });
        }

        const questions = await ExpertQuestion.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json(questions.map(q => ({
            id: q._id,
            type: q.type,
            question: q.question,
            audioBase64: q.audioBase64,
            audioMimeType: q.audioMimeType,
            status: q.status,
            answerType: q.answerType,
            answer: q.answer,
            answerAudioBase64: q.answerAudioBase64,
            answerAudioMimeType: q.answerAudioMimeType,
            date: q.createdAt.toISOString().split('T')[0],
            patient: q.userId ? { name: q.userId.name, email: q.userId.email } : { name: 'Bilinmiyor' },
        })));
    } catch (err) {
        console.error('Get all expert questions error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PATCH /api/expert-questions/:id/answer — submit an answer (Doctor only)
router.patch('/:id/answer', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        if (!currentUser || currentUser.role !== 'doctor') {
            return res.status(403).json({ error: 'Yetki yok.' });
        }

        const { answerType, answer, answerAudioBase64, answerAudioMimeType } = req.body;

        const q = await ExpertQuestion.findById(req.params.id);
        if (!q) {
            return res.status(404).json({ error: 'Soru bulunamadı.' });
        }

        if (answerType === 'voice') {
            if (!answerAudioBase64) return res.status(400).json({ error: 'Ses kaydı gereklidir.' });
            q.answerType = 'voice';
            q.answerAudioBase64 = answerAudioBase64;
            q.answerAudioMimeType = answerAudioMimeType || 'audio/m4a';
            q.answer = '(Sesli Yanıt)';
        } else {
            if (!answer || !answer.trim()) return res.status(400).json({ error: 'Cevap metni gereklidir.' });
            q.answerType = 'text';
            q.answer = answer.trim();
        }

        q.status = 'answered';
        await q.save();

        res.json({
            id: q._id,
            type: q.type,
            question: q.question,
            status: q.status,
            answerType: q.answerType,
            answer: q.answer,
            answerAudioBase64: q.answerAudioBase64,
            answerAudioMimeType: q.answerAudioMimeType,
            date: q.createdAt.toISOString().split('T')[0],
        });
    } catch (err) {
        console.error('Answer expert question error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
