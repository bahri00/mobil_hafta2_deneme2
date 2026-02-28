const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, specialty, hospital, birthDate, city } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Ad, e-posta ve parola gereklidir' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Parola en az 6 karakter olmalıdır' });
        }

        const userRole = role === 'doctor' ? 'doctor' : 'patient';

        // Doktor kaydında uzmanlık alanı zorunlu
        if (userRole === 'doctor' && !specialty) {
            return res.status(400).json({ error: 'Uzmanlık alanı gereklidir' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            birthDate: birthDate ? birthDate.trim() : '',
            city: city ? city.trim() : '',
            passwordHash,
            role: userRole,
            // Doktor kayıtları admin onayı bekler; hastalar direkt aktif
            status: userRole === 'doctor' ? 'pending' : 'active',
            specialty: specialty ? specialty.trim() : '',
            hospital: hospital ? hospital.trim() : '',
        });

        // Doktor kaydında token döndürme — önce onay gerekli
        if (userRole === 'doctor') {
            return res.status(201).json({
                pending: true,
                message: 'Uzman kaydınız alındı. Admin onayından sonra giriş yapabilirsiniz.',
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, birthDate: user.birthDate, city: user.city },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve parola gereklidir' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'E-posta veya parola hatalı' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'E-posta veya parola hatalı' });
        }

        // Onay bekleyen veya reddedilen doktorlar giriş yapamaz
        if (user.status === 'pending') {
            return res.status(403).json({ error: 'Hesabınız henüz admin tarafından onaylanmadı. Lütfen daha sonra tekrar deneyin.' });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({ error: 'Uzman başvurunuz reddedildi. Daha fazla bilgi için bizimle iletişime geçin.' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, birthDate: user.birthDate, city: user.city },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/auth/me — verify token and return current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        res.json({ id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, birthDate: user.birthDate, city: user.city });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PATCH /api/auth/profile — update current user profile (birthDate, city etc)
router.patch('/profile', require('../middleware/auth'), async (req, res) => {
    try {
        const { birthDate, city } = req.body;
        const updateData = {};
        if (birthDate !== undefined) updateData.birthDate = birthDate.trim();
        if (city !== undefined) updateData.city = city.trim();

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json({
            message: 'Profil güncellendi',
            user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, birthDate: user.birthDate, city: user.city }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
