import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI;
const serviceSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    series: { type: String, required: true },
    service: { type: String, required: true },
    price: { type: Number, required: true },
    memberPrice: { type: Number, required: true }
});

const Service = mongoose.model('Service', serviceSchema);

async function importData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅Connect Successully');

        const data = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf-8'));

        await Service.deleteMany();
        console.log('🗑️Already deleted old data');

        await Service.insertMany(data);
        console.log(`✨ import ${data.length} records`);

        process.exit();
    } catch (error) {
        console.error('❌Error:', error);
        process.exit(1);
    }
}

importData();