// ===== SERVER SETUP =====
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
// Enable CORS for all origins (Render serves frontend & backend together)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Parse JSON
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

// ===== USER SCHEMA =====
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// ===== TASK SCHEMA =====
const taskSchema = new mongoose.Schema({
    email: { type: String, required: true },
    taskText: { type: String, required: true },
    status: { type: String, default: "Pending" }
});
const Task = mongoose.model("Task", taskSchema);

// ===== SIGNUP ROUTE =====
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ message: "All fields required" });

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser)
            return res.status(400).json({ message: "Username or email exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===== LOGIN ROUTE =====
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "All fields required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        res.status(200).json({ message: "Login successful", user: { username: user.username, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===== TASK ROUTES =====
// Get tasks
app.get("/tasks", async (req, res) => {
    try {
        const tasks = await Task.find({ email: req.query.email });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Add task
app.post("/tasks", async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Update task
app.put("/tasks/:id", async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete task
app.delete("/tasks/:id", async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===== SPA SUPPORT =====
// For any unknown route, serve index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START SERVER =====
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
