const mongoose = require('mongoose');

const ExpertQuestionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'voice', 'video'], required: true },
    question: { type: String, default: '' },
    audioBase64: { type: String, default: null },
    audioMimeType: { type: String, default: null },
    status: { type: String, enum: ['pending', 'answered'], default: 'pending' },
    answer: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ExpertQuestion', ExpertQuestionSchema);
