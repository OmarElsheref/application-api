// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const cors = require('cors'); // Import the cors middleware

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes


// MongoDB connection
mongoose.connect('mongodb+srv://omar:omar@cluster0.rsdgr1i.mongodb.net/flutter_app_db', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define MongoDB schemas
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String // 'user', 'doctor', or 'admin'
});

const doctorSchema = new mongoose.Schema({
    username: String,
    password: String,
    specialty: String
});

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);

// Routes for authentication
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ username: user.username, role: user.role }, 'secret_key');
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for user registration
app.post('/api/register/user', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new User({ username, password: hashedPassword, role: 'user' });
        await user.save();
        res.json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for doctor registration
app.post('/api/register/doctor', async (req, res) => {
    const { username, password, specialty } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const doctor = new Doctor({ username, password: hashedPassword, specialty });
        await doctor.save();
        res.json({ message: 'Doctor created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for admin registration
app.post('/api/register/admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const admin = new User({ username, password: hashedPassword, role: 'admin' });
        await admin.save();
        res.json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for fetching available doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Socket.io setup
const server = app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
const io = new Server(server);

// Real-time conversation
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});
