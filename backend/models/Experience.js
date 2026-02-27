const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isSeeded: { type: Boolean, default: false }, // For initial mock data
}, { timestamps: true });

module.exports = mongoose.model('Experience', ExperienceSchema);
