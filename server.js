import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import nodemailer from 'nodemailer';

const app = express();

app.use(cors());
app.use(express.json());

const DB_CONNECTION_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sim_mobile_db';

mongoose.connect(DB_CONNECTION_URI)
    .then(() => console.log('System connectivity stable: Connected to MongoDB Cluster Matrix.'))
    .catch(err => console.error('CRITICAL: Cluster synchronization handshake rejected.', err));

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

app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Direct Mongoose to read from your specific 'admin' collection dynamically
        const adminCollection = mongoose.connection.db.collection('admin');
        
        // 2. Locate the document matching the username field exactly
        const adminUser = await adminCollection.findOne({ username: username });

        if (!adminUser) {
            return res.status(401).json({ message: 'Invalid server terminal clearance privileges.' });
        }

        // 3. Verify the hashed password matching verification pipeline
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid system terminal security access credentials.' });
        }

        res.status(200).json({ 
            message: 'Administrative node handshake successful.', 
            token: 'secure-admin-terminal-session-token' 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error processing credentials.', error: error.message });
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
    isReviewed: { type: Boolean, default: false },
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
app.post('/api/user/request-code', async (req, res) => {
    try {
        const { email, actionType, secondaryEmail } = req.body;
        if (!email) return res.status(400).json({ message: 'Missing routing address parameters.' });

        // Helper function inside scope to run isolated generation blocks
        async function dispatchEmailToken(targetMail, typeLabel) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await Verification.findOneAndUpdate(
                { email: targetMail, actionType: typeLabel },
                { code, lastRequestedAt: Date.now(), createdAt: Date.now() },
                { upsert: true }
            );

            await transporter.sendMail({
                from: '"Sim & Mobile Security" <willauunsw@gmail.com>',
                to: targetMail,
                subject: `[SECURITY MATRIX] Code for ${typeLabel.toUpperCase()}`,
                html: `<div style="background: #0b0f19; color: #fff; padding: 25px; font-family: monospace; border: 1px solid #00f3ff; border-radius: 12px;">
                        <h3>SECURITY CLEARANCE PARAMETER TOKEN</h3>
                        <p>Context target: ${typeLabel.toUpperCase()}</p>
                        <h1 style="color: #fadb5f; letter-spacing: 4px;">${code}</h1>
                       </div>`
            });
        }

        // Check 60-second anti-spam lock across channels before sending
        const existing = await Verification.findOne({ email, actionType });
        if (existing && (Date.now() - new Date(existing.lastRequestedAt).getTime()) / 1000 < 60) {
            return res.status(429).json({ message: 'Rate limit active. Wait before re-requesting payload structures.' });
        }

        if (actionType === 'update_identity' && secondaryEmail && secondaryEmail !== email) {
            // Dual pipeline trigger: dispatch to both nodes independently
            await dispatchEmailToken(email, 'update_identity_old');
            await dispatchEmailToken(secondaryEmail, 'update_identity_new');
            res.status(200).json({ isDualEmailMode: true, message: 'Dual clearance credentials emitted to old and new mailboxes.' });
        } else {
            // Single pipeline dispatch
            await dispatchEmailToken(email, actionType);
            res.status(200).json({ isDualEmailMode: false, message: 'Single channel clearance credentials emitted.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Token distribution sequence crashed.', error: error.message });
    }
});

// (PUT /api/user/update-profile) Upgraded for dual verification comparison loops
app.put('/api/user/update-profile', async (req, res) => {
    try {
        const { currentEmail, fullName, email, primaryCode, secondaryCode } = req.body;

        if (email !== currentEmail) {
            // Strict enforcement evaluation against dual records matching inputs
            const oldRecord = await Verification.findOne({ email: currentEmail, actionType: 'update_identity_old' });
            const newRecord = await Verification.findOne({ email: email, actionType: 'update_identity_new' });

            if (!oldRecord || !newRecord) return res.status(400).json({ message: 'Verification validation state logs incomplete.' });
            if (oldRecord.code !== primaryCode?.toString().trim() || newRecord.code !== secondaryCode?.toString().trim()) {
                return res.status(400).json({ message: 'Security code mismatch detected on binding nodes.' });
            }

            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ message: 'Target email is already occupied.' });

            await Verification.deleteMany({ _id: { $in: [oldRecord._id, newRecord._id] } });
        } else {
            // Single fallback matching route path
            const record = await Verification.findOne({ email: currentEmail, actionType: 'update_identity' });
            if (!record || record.code !== primaryCode?.toString().trim()) {
                return res.status(400).json({ message: 'Identity validation clearance parameter mismatch.' });
            }
            await Verification.deleteOne({ _id: record._id });
        }

        const updatedUser = await User.findOneAndUpdate({ email: currentEmail }, { fullName, email }, { returnDocument: 'after' });
        res.status(200).json({ message: 'Identity parameters modified successfully.', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Pipeline synchronization error.', error: error.message });
    }
});

// (PUT /api/user/update-password) Kept standard but reads custom payload parameter wrappers
app.put('/api/user/update-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword, verificationCode } = req.body;
        const record = await Verification.findOne({ email, actionType: 'reset_password' });
        
        if (!record || record.code !== verificationCode?.toString().trim()) {
            return res.status(400).json({ message: 'Cryptographic validation parameter token rejected.' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: 'Authentication verification checkpoint failed.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        await Verification.deleteOne({ _id: record._id });
        res.status(200).json({ message: 'Passkey modification accepted.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal pipeline fault.', error: error.message });
    }
});
const reviewSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customerName: { type: String, required: true },
    device: { type: String, required: true },
    service: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Gate Router 1: Validate if Protocol ID exists AND is strictly status 'Completed'
app.get('/api/reviews/verify-gate/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'Malformed sequence ID parameter format.' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Target order protocol node not found.' });
        }

        // Strict Enforcement Gate Rule: Must be 'Completed'
        if (booking.status !== 'Completed') {
            return res.status(403).json({ message: 'Access denied. Protocol state must be flagged COMPLETED to submit feedback.' });
        }

        // Integrity Check: Prevent duplicate reviews for a single protocol record
        const reviewExists = await Review.findOne({ bookingId });
        if (reviewExists) {
            return res.status(400).json({ message: 'Validation block: Review token already issued for this protocol block.' });
        }

        res.status(200).json({ message: 'Clearance cleared.', booking });
    } catch (error) {
        res.status(500).json({ message: 'Internal validation gate error.', error: error.message });
    }
});
app.post('/api/reviews', async (req, res) => {
    try {
        const { bookingId, customerName, device, service, rating, content } = req.body;

        // 1. Direct standard ObjectId query mapping lookup
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Target order protocol node not found.' });
        }

        // 2. Strict Boolean operational state double-check
        if (booking.isReviewed) {
            return res.status(400).json({ message: 'Validation lock: This node has already committed feedback parameters.' });
        }

        // 3. Commit new review payload block to database
        const newReview = new Review({
            bookingId: booking._id,
            customerName,
            device,
            service,
            rating,
            content
        });
        await newReview.save();

        // 4. Atomically toggle operational state and save standard Mongoose document model
        booking.isReviewed = true;
        await booking.save();

        res.status(201).json({ message: 'Review committed and booking state locked successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to commit review payload block.', error: error.message });
    }
});

// Gate Router 3: Fetch all reviews stream logs
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Failed to sync stream reviews pipeline.', error: error.message });
    }
});
// (POST /api/reviews/check-status) to check which booking IDs already have reviews
app.post('/api/reviews/check-status', async (req, res) => {
    try {
        const { bookingIds } = req.body;
        if (!Array.isArray(bookingIds)) {
            return res.status(400).json({ message: 'Invalid payload block format.' });
        }
        
        // Find all review entries matching this batch of booking IDs
        const existingReviews = await Review.find({ bookingId: { $in: bookingIds } });
        const reviewedIds = existingReviews.map(r => r.bookingId.toString());
        
        res.json({ reviewedIds });
    } catch (error) {
        res.status(500).json({ message: 'Pipeline tracking failure.', error: error.message });
    }
});

// Initialize Standard Gmail Transport Matrix Engine
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'simandobusiness@gmail.com',
        pass: process.env.GMAIL_PASS || 'qeiw tmwy pzyz ewyq'
    }
});

// Ephemeral Verification Passkey Schema Matrix Definition
const verificationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    actionType: { type: String, required: true },
    code: { type: String, required: true },
    lastRequestedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now, expires: 300 }
});

verificationSchema.index({ email: 1, actionType: 1 }, { unique: true });
const Verification = mongoose.model('Verification', verificationSchema);

// (POST /api/user/request-code) With strict 60s cooldown block & real Gmail integration
app.post('/api/user/request-code', async (req, res) => {
    try {
        const { email, actionType } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Missing target network identity node parameter.' });
        }

        const existingRecord = await Verification.findOne({ email, actionType });
        if (existingRecord) {
            const timeElapsed = (Date.now() - new Date(existingRecord.lastRequestedAt).getTime()) / 1000;
            if (timeElapsed < 60) {
                const remainingSeconds = Math.ceil(60 - timeElapsed);
                return res.status(429).json({ 
                    message: `RATE LIMIT TRIGGERED: Anti-spam lock active. Re-initialize pipeline in ${remainingSeconds}s.` 
                });
            }
        }

        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

        await Verification.findOneAndUpdate(
            { email, actionType },
            { 
                code: generatedCode, 
                lastRequestedAt: Date.now(),
                createdAt: Date.now()
            },
            { upsert: true, new: true }
        );

        const mailOptions = {
            from: '"Sim & Mobile Security Matrix" <willauunsw@gmail.com>',
            to: email,
            subject: `[SECURITY VERIFICATION] Authorization Code for ${actionType.toUpperCase()}`,
            html: `
                <div style="background-color: #0b0f19; color: #ffffff; padding: 30px; font-family: monospace; border: 1px solid #00f3ff; border-radius: 16px;">
                    <h2 style="color: #00f3ff; margin-bottom: 20px; letter-spacing: 2px;">SIM & MOBILE // SECURITY TERMINAL</h2>
                    <p style="color: #9ca3af; font-size: 14px;">An authentication token payload has been generated for your profile node.</p>
                    <div style="background-color: rgba(0, 243, 255, 0.05); border: 1px dashed rgba(0, 243, 255, 0.3); padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px;">
                        <span style="font-size: 32px; font-weight: bold; color: #fadb5f; letter-spacing: 6px; text-shadow: 0 0 10px rgba(250,219,95,0.3);">${generatedCode}</span>
                    </div>
                    <p style="color: #ef4444; font-size: 11px;">[WARNING] This clearance token expires in 5 minutes and will be forcefully wiped from the mainframe data cluster upon consumption.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Security authorization code dispatched successfully via real network node relay.' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to broadcast secure authorization token.', error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));