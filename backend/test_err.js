const http = require('http');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function doTest() {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await mongoose.connection.db.collection('users').findOne({ role: 'doctor' });
    const pat = await mongoose.connection.db.collection('users').findOne({ role: { $ne: 'doctor' } });
    const token = jwt.sign({ userId: doc._id.toString() }, process.env.JWT_SECRET);
    const patId = pat._id.toString();

    http.get('http://localhost:3001/api/patients/' + patId + '/profile', { headers: { 'Authorization': 'Bearer ' + token } }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const errData = JSON.parse(data);
            console.log('Error Message =>', errData.details);
            console.log('Error Stack =>', errData.stack);
        });
    });
    setTimeout(() => mongoose.disconnect(), 2000);
}
doTest();
