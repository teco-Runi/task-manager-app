const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: "https://tasksmanagersapp.netlify.app", // correct Netlify URL
    methods: ["GET","POST","PUT","DELETE"],
    credentials: true
}));
app.use(express.json());

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

// ===== SIGNUP ROUTE =====
app.post("/signup", async (req,res)=>{
    try{
        const { username, email, password } = req.body;
        if(!username || !email || !password) return res.status(400).json({ message:"All fields required" });

        const existingUser = await User.findOne({ $or: [{email},{username}] });
        if(existingUser) return res.status(400).json({ message:"Username or email exists" });

        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message:"User registered successfully" });
    } catch(err){
        console.error(err);
        res.status(500).json({ message:"Server error" });
    }
});

// ===== LOGIN ROUTE =====
app.post("/login", async (req,res)=>{
    try{
        const { email, password } = req.body;
        if(!email || !password) return res.status(400).json({ message:"All fields required" });

        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ message:"Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({ message:"Invalid credentials" });

        res.status(200).json({ message:"Login successful", user:{ username:user.username, email:user.email } });
    } catch(err){
        console.error(err);
        res.status(500).json({ message:"Server error" });
    }
});

// ===== TASK SCHEMA & ROUTES =====
const taskSchema = new mongoose.Schema({
    email: { type:String, required:true },
    taskText: { type:String, required:true },
    status: { type:String, default:"Pending" }
});
const Task = mongoose.model("Task", taskSchema);

app.get("/tasks", async (req,res)=>{
    try{
        const tasks = await Task.find({ email:req.query.email });
        res.json(tasks);
    } catch(err){ res.status(500).json({ message:"Server error" }); }
});

app.post("/tasks", async (req,res)=>{
    try{
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch(err){ res.status(500).json({ message:"Server error" }); }
});

app.put("/tasks/:id", async (req,res)=>{
    try{
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new:true });
        res.json(updatedTask);
    } catch(err){ res.status(500).json({ message:"Server error" }); }
});

app.delete("/tasks/:id", async (req,res)=>{
    try{
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message:"Task deleted" });
    } catch(err){ res.status(500).json({ message:"Server error" }); }
});

// ===== START SERVER =====
app.listen(PORT, ()=>console.log(`🚀 Server running on port ${PORT}`));
