const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// POST /api/admin/login — ADMIN_SECRET ile giriş
router.post('/login', (req, res) => {
    const { secret } = req.body;
    if (!secret || secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Hatalı admin şifresi' });
    }
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
});

// GET /api/admin/doctors — tüm doktor kayıtlarını listele
router.get('/doctors', adminAuth, async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' })
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PATCH /api/admin/doctors/:id/approve — doktoru onayla
router.patch('/doctors/:id/approve', adminAuth, async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'doctor' },
            { status: 'active' },
            { new: true }
        ).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'Doktor bulunamadı' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PATCH /api/admin/doctors/:id/reject — doktoru reddet
router.patch('/doctors/:id/reject', adminAuth, async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'doctor' },
            { status: 'rejected' },
            { new: true }
        ).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'Doktor bulunamadı' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
