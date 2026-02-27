const express = require('express');
const SymptomEntry = require('../models/SymptomEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/symptom-entries — get all entries for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const entries = await SymptomEntry.find({ userId: req.userId }).lean();
        // Return as a map: { "YYYY-MM-DD": { symptoms, note } }
        const entryMap = {};
        for (const e of entries) {
            entryMap[e.date] = {
                symptoms: e.symptoms.map(s => ({
                    id: s._id,
                    label: s.label,
                    severity: s.severity,
                })),
                note: e.note,
            };
        }
        res.json(entryMap);
    } catch (err) {
        console.error('Get symptom entries error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PUT /api/symptom-entries/:date — upsert entry for a specific date
router.put('/:date', auth, async (req, res) => {
    try {
        const { date } = req.params; // expected: YYYY-MM-DD
        const { symptoms, note } = req.body;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Geçersiz tarih formatı (YYYY-MM-DD bekleniyor)' });
        }

        const entry = await SymptomEntry.findOneAndUpdate(
            { userId: req.userId, date },
            { $set: { symptoms: symptoms ?? [], note: note ?? '' } },
            { upsert: true, new: true }
        );

        res.json({
            date: entry.date,
            symptoms: entry.symptoms.map(s => ({
                id: s._id,
                label: s.label,
                severity: s.severity,
            })),
            note: entry.note,
        });
    } catch (err) {
        console.error('Upsert symptom entry error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
