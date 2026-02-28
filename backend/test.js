require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testQuery() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('Fetching patient profile query using Mongoose models...');

        const patients = await User.find({ role: { $ne: 'doctor' } });
        console.log(`Found ${patients.length} patients.`);

        if (patients.length > 0) {
            const patId = patients[0]._id.toString();
            console.log(`Testing query for patient ID: ${patId}`);

            const patient = await User.findOne({ _id: patId, role: { $ne: 'doctor' } }).select('name email createdAt');
            console.log('Query result:', patient ? 'Success! Name: ' + patient.name : 'Not found');
        }
    } catch (err) {
        console.error('Test error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}
testQuery();
