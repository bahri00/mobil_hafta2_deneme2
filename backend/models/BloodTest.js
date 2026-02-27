const mongoose = require('mongoose');

const BloodTestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    // Store image as base64 string
    imageBase64: { type: String, required: true },
    imageMimeType: { type: String, default: 'image/jpeg' },
    fileName: { type: String, default: 'blood-test.jpg' },
}, { timestamps: true });

module.exports = mongoose.model('BloodTest', BloodTestSchema);
