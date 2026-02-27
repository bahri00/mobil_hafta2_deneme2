const express = require('express');
const BloodTest = require('../models/BloodTest');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/blood-tests — upload a blood test image (base64)
router.post('/', auth, async (req, res) => {
    try {
        const { imageBase64, imageMimeType, fileName, note } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Görüntü verisi gereklidir' });
        }

        // Validate base64 size (max ~5MB decoded ≈ ~6.7MB base64)
        const sizeInBytes = Buffer.byteLength(imageBase64, 'base64');
        if (sizeInBytes > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Dosya boyutu 5 MB\'ı aşıyor. Lütfen daha küçük bir görüntü seçin.' });
        }

        const bloodTest = await BloodTest.create({
            userId: req.userId,
            imageBase64,
            imageMimeType: imageMimeType || 'image/jpeg',
            fileName: fileName || 'blood-test.jpg',
            note: note || '',
        });

        res.status(201).json({
            id: bloodTest._id,
            fileName: bloodTest.fileName,
            note: bloodTest.note,
            createdAt: bloodTest.createdAt,
        });
    } catch (err) {
        console.error('Blood test upload error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/blood-tests — list all uploads for the user (without image data)
router.get('/', auth, async (req, res) => {
    try {
        const tests = await BloodTest.find({ userId: req.userId })
            .select('-imageBase64') // don't send image in list
            .sort({ createdAt: -1 })
            .lean();

        res.json(tests.map(t => ({
            id: t._id,
            fileName: t.fileName,
            note: t.note,
            date: t.createdAt.toISOString().split('T')[0],
        })));
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/blood-tests/:id/image — get full image data
router.get('/:id/image', auth, async (req, res) => {
    try {
        const test = await BloodTest.findOne({ _id: req.params.id, userId: req.userId });
        if (!test) return res.status(404).json({ error: 'Tahlil bulunamadı' });

        res.json({
            imageBase64: test.imageBase64,
            imageMimeType: test.imageMimeType,
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
