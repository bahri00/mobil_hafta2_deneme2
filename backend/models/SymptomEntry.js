const mongoose = require('mongoose');

const LoggedSymptomSchema = new mongoose.Schema({
    label: { type: String, required: true },
    severity: { type: Number, enum: [1, 2, 3], required: true }, // 1=Hafif, 2=Orta, 3=Şiddetli
}, { _id: true });

const SymptomEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    symptoms: [LoggedSymptomSchema],
    note: { type: String, default: '' },
}, { timestamps: true });

// One entry per user per day
SymptomEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SymptomEntry', SymptomEntrySchema);
