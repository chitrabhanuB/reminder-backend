require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const reminderRoutes = require('./routes/reminderRoutes');
const userRoutes = require('./routes/userRoutes');
const verifyUser = require('./middleware/verifyUser'); // ✅ Import from middleware
const Reminder = require("./models/reminder");
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase client (used by verifyUser middleware, keep as is)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// CORS setup (allow your frontend at port 8080)
app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger to see incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Debugging middleware: log POST bodies hitting /api/reminders (before verifyUser)
app.use('/api/reminders', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('📩 Incoming POST /api/reminders headers:', req.headers && {
      authorization: req.headers.authorization,
      'content-type': req.headers['content-type'],
    });
    console.log('📩 Incoming POST /api/reminders body:', req.body);
  }
  next();
});

// User routes (no auth required for initial user-creation endpoint if you implemented it that way)
app.use("/api/users", userRoutes);

// Protected route example: Fetch reminders for a specific user (keeps verifyUser)
app.get("/api/reminders/:userId", verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📦 Fetching reminders for user:", userId);

    const reminders = await Reminder.find({ user_id: userId }).sort({ due_date: 1 });
    console.log("✅ Found reminders:", reminders);

    res.status(200).json({ success: true, reminders });
  } catch (error) {
    console.error("❌ Error fetching reminders:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch reminders" });
  }
});

// Simple health/test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend connected successfully!" });
});

// Apply verifyUser for the rest of reminder routes (your existing routes file)
app.use('/api/reminders', reminderRoutes);

app.use("/api/reminders", require("./routes/reminderRoutes"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.once('open', () => {
  console.log("📂 Connected to database:", mongoose.connection.name);
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
