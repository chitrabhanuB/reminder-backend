require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const reminderRoutes = require('./routes/reminderRoutes');
const userRoutes = require('./routes/userRoutes');
const verifyUser = require('./middleware/verifyUser');
const Reminder = require("./models/reminder");
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ✅ CORS setup
app.use(
  cors({
    origin: ["https://reminder-frontend1.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root route (to avoid Unexpected token '<')
app.get("/", (req, res) => {
  res.send("✅ Backend is live and reachable");
});

// ✅ Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ User routes
app.use("/api/users", userRoutes);

// ✅ Protected reminder route
app.get("/api/reminders/:userId", verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📦 Fetching reminders for user:", userId);

    const reminders = await Reminder.find({ user_id: userId }).sort({ due_date: 1 });
    res.status(200).json({ success: true, reminders });
  } catch (error) {
    console.error("❌ Error fetching reminders:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch reminders" });
  }
});

// ✅ Health route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend connected successfully!" });
});

// ✅ Reminder routes
app.use('/api/reminders', reminderRoutes);

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.once('open', () => {
  console.log("📂 Connected to database:", mongoose.connection.name);
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
