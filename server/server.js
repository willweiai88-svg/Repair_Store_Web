import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI;
console.log(MONGO_URI)
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connect DataBase Successfully'))
    .catch(err => console.error('Error: ', err));

// This is the Schema for the Services
const serviceSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    service: { type: String, required: true },
    price: { type: Number, required: true },
    memberPrice: { type: Number, required: true }
});

// This is the Schema for the user
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Service = mongoose.model('Service', serviceSchema);


// We need to check how many data we have right nows
async function seedDatabase() {
    try {
        const count = await Service.countDocuments();
        if (count === 0) {
            console.log('The data is empty. Please fill the data: ');
        } else {
            console.log(`📊Already: ${count} records in the system.`);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}
seedDatabase();

// API Interfaces

// Get all the services cost
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: '获取数据失败', error: err.message });
    }
});
// (POST /api/register) for user register
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 1. check whether the email has used before
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

        // 2. encode the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. create a new user and store into the data base
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// (POST /api/login) for login user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // 2. check the mathching password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // 3. login successfully
        res.status(200).json({ 
            message: 'Login successful!', 
            user: { id: user._id, fullName: user.fullName, email: user.email } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// This is for the booking info
const bookingSchema = new mongoose.Schema({
    isMember: { type: Boolean, default: false },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    phone: { type: String, required: true },
    device: { type: String, required: true },
    service: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    notes: { type: String },
    status: { type: String, default: 'Pending' }, // status: Pending, Repaired, Completed
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// (POST /api/bookings) for register the booking
app.post('/api/bookings', async (req, res) => {
    try {
        // 1. get the info from the frontend (req.body)
        const bookingData = req.body;

        // 2. create a new booking record
        const newBooking = new Booking(bookingData);

        // 3. save it into MongoDB
        await newBooking.save();

        // 4. give the booking id and messaege to frontend
        res.status(201).json({ 
            message: 'Booking created successfully!', 
            bookingId: newBooking._id 
        });
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: 'Server error during booking.', error: error.message });
    }
});

// get specific user's bookings info before
app.get('/api/my-bookings', async (req, res) => {
    try {
        const { email } = req.query;
        const bookings = await Booking.find({ customerEmail: email }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history.' });
    }
});

// for admin, we will list all bookings
app.get('/api/admin/bookings', async (req, res) => {
    try {
        // we sort the bookings, and list the newest one at the top
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch administrative data.', error: error.message });
    }
});

// change the info of specific bookings
app.put('/api/admin/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;
        
        // findByIdAndUpdate to update the info
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { returnDocument: 'after' }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Order protocol not found.' });
        }

        res.json({ 
            message: 'Protocol status updated successfully!', 
            booking: updatedBooking 
        });
    } catch (error) {
        res.status(500).json({ message: 'Update failed.', error: error.message });
    }
});

// This is shema for the enquiry
const enquirySchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    service: String,
    model: String,
    description: String,
    status: { type: String, default: 'New' }, // default: New
    createdAt: { type: Date, default: Date.now }
});
const Enquiry = mongoose.model('Enquiry', enquirySchema);

// handle to submit the Enquiry API
app.post('/api/enquiries', async (req, res) => {
    try {
        const newEnquiry = new Enquiry(req.body);
        await newEnquiry.save();
        res.status(201).json({ message: 'Enquiry submitted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit enquiry' });
    }
});

// handle Admin can fetch all Enquiry API
app.get('/api/admin/enquiries', async (req, res) => {
    try {
        // sort all of the enquiry
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }); 
        res.json(enquiries);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch enquiries' });
    }
});

// update the enquiry info
app.put('/api/admin/enquiries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
    
        const updatedEnquiry = await Enquiry.findByIdAndUpdate(
            id, 
            { status: status }, 
            { returnDocument: 'after' }
        );

        if (!updatedEnquiry) {
            return res.status(404).json({ error: 'Enquiry not found' });
        }

        res.json({ message: 'Status updated successfully', enquiry: updatedEnquiry });
    } catch (err) {
        console.error("Error updating enquiry:", err);
        res.status(500).json({ error: 'Failed to update enquiry status' });
    }
});


// Start the server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));