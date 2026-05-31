import bcrypt from 'bcryptjs';

async function generateHash() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123#', salt);
    console.log('Your Hashed Password is:', hashedPassword);
}

generateHash();