const express = require('express');
const User = require('../models/User');
const SymptomEntry = require('../models/SymptomEntry');
const BloodTest = require('../models/BloodTest');
const ExpertQuestion = require('../models/ExpertQuestion');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure the user is a doctor
async function requireDoctor(req, res, next) {
    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser || currentUser.role !== 'doctor') {
            return res.status(403).json({ error: 'Yetki yok. Sadece uzman doktorlar erişebilir.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// GET /api/patients — get all patients (Doctor only)
router.get('/', auth, requireDoctor, async (req, res) => {
    try {
        // Eski kayıtların role alanı boş olabiliyor, bu yüzden 'doctor' olmayan herkesi hasta kabul edebiliriz
        const patients = await User.find({ role: { $ne: 'doctor' } })
            .select('name email createdAt birthDate city')
            .sort({ createdAt: -1 })
            .lean();

        res.json(patients.map(p => ({
            id: p._id,
            name: p.name,
            email: p.email,
            joinDate: p.createdAt ? p.createdAt.toISOString().split('T')[0] : 'Bilinmiyor',
            birthDate: p.birthDate || 'Bilinmiyor',
            city: p.city || 'Bilinmiyor',
        })));
    } catch (err) {
        console.error('Get patients error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/patients/:id/profile — get a specific patient's profile data
router.get('/:id/profile', auth, requireDoctor, async (req, res) => {
    try {
        const patientId = req.params.id;

        // 1. Get patient info
        const patient = await User.findOne({ _id: patientId, role: { $ne: 'doctor' } }).select('name email createdAt birthDate city');
        if (!patient) {
            return res.status(404).json({ error: 'Hasta bulunamadı.' });
        }

        // 2. Get their symptom entries
        const symptomEntries = await SymptomEntry.find({ userId: patientId }).sort({ date: -1 }).lean();
        const symptomsMap = {};
        symptomEntries.forEach(entry => {
            symptomsMap[entry.date] = {
                symptoms: entry.symptoms,
                note: entry.note
            };
        });

        // 3. Get their blood tests
        const bloodTests = await BloodTest.find({ userId: patientId }).sort({ testDate: -1 }).lean();
        const formattedBloodTests = bloodTests.map(t => ({
            id: t._id,
            testDate: (t.testDate || t.createdAt) ? new Date(t.testDate || t.createdAt).toISOString().split('T')[0] : 'Bilinmiyor',
            hemoglobin: t.hemoglobin,
            wbc: t.wbc,
            platelets: t.platelets,
            neutrophils: t.neutrophils,
            notes: t.notes || t.note,
            imageBase64: t.imageBase64,
            imageMimeType: t.imageMimeType,
        }));

        // 4. Get their expert questions
        const questions = await ExpertQuestion.find({ userId: patientId }).sort({ createdAt: -1 }).lean();
        const formattedQuestions = questions.map(q => ({
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
            date: q.createdAt ? q.createdAt.toISOString().split('T')[0] : 'Bilinmiyor',
        }));

        res.json({
            id: patient._id,
            name: patient.name,
            email: patient.email,
            birthDate: patient.birthDate || 'Bilinmiyor',
            city: patient.city || 'Bilinmiyor',
            joinDate: patient.createdAt ? patient.createdAt.toISOString().split('T')[0] : 'Bilinmiyor',
            symptomEntries: symptomsMap,
            bloodTests: formattedBloodTests,
            questions: formattedQuestions,
        });

    } catch (err) {
        console.error('Get patient profile error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
