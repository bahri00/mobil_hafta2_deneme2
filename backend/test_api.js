const http = require('http');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function doTest() {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Get a doctor
    const doc = await mongoose.connection.db.collection('users').findOne({ role: 'doctor' });
    // 2. Get a patient
    const pat = await mongoose.connection.db.collection('users').findOne({ role: { $ne: 'doctor' } });

    if (!doc || !pat) return console.log('Doc or pat missing');

    const token = jwt.sign({ userId: doc._id.toString() }, process.env.JWT_SECRET || 'gizli_anahtar_123');
    const patId = pat._id.toString();
    console.log('Fetching patient:', patId);

    const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/patients/' + patId + '/profile',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log('Response:', data));
    });
    req.on('error', console.error);
    req.end();

    setTimeout(() => mongoose.disconnect(), 2000);
}
doTest();
