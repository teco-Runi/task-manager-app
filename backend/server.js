// server.js
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));


// ===== USER SCHEMA =====
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// ===== SIGNUP ROUTE =====
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("Signup request:", req.body);

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check for existing user by username or email
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        console.log("User saved:", newUser);
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Signup error:", err.message);

        // Duplicate key error handling
        if (err.code === 11000) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        res.status(500).json({ message: "Server error" });
    }
});

// ===== LOGIN ROUTE =====
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request:", req.body);

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        res.status(200).json({
            message: "Login successful",
            user: { username: user.username, email: user.email }
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


// Task schema
const taskSchema = new mongoose.Schema({
    email: { type: String, required: true },
    taskText: { type: String, required: true },
    status: { type: String, default: "Pending" }
});
const Task = mongoose.model("Task", taskSchema);

// Get tasks for a user
app.get("/tasks", async (req,res)=>{
    try {
        const tasks = await Task.find({ email: req.query.email });
        res.json(tasks);
    } catch(err){ res.status(500).json({message:"Server error"}); }
});

// Add task
app.post('/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Update task
app.put("/tasks/:id", async (req,res)=>{
    try{
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {new:true});
        res.json(updatedTask);
    } catch(err){ res.status(500).json({message:"Server error"}); }
});

// Delete task
app.delete("/tasks/:id", async (req,res)=>{
    try{
        await Task.findByIdAndDelete(req.params.id);
        res.json({message:"Task deleted"});
    } catch(err){ res.status(500).json({message:"Server error"}); }
});
