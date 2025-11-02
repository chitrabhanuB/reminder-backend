const express = require('express');
const router = express.Router();
const Reminder = require('../models/reminder');

// ✅ Create new reminder
router.post('/', async (req, res) => {
  try {
    console.log("📩 [DEBUG] Reminder POST route hit");
    console.log("📦 Full Request body received:", req.body);

    // check if backend is actually getting body
    if (!req.body) {
      console.log("❌ req.body is undefined or empty");
      return res.status(400).json({ message: "Empty request body" });
    }

    const { user_id, bill_name, amount, due_date, priority, frequency } = req.body;
    console.log("📋 Extracted fields:", { user_id, bill_name, amount, due_date, priority, frequency });

    if (!user_id || !bill_name || !due_date) {
      console.log("⚠️ Missing required fields");
      return res.status(400).json({ message: 'user_id, bill_name and due_date are required' });
    }

    const reminder = new Reminder({
      user_id,
      bill_name,
      amount: amount ?? null,
      due_date,
      priority: priority ?? 'medium',
      frequency: frequency ?? 'monthly',
      is_paid: false,
    });

    await reminder.save();
    console.log("✅ Reminder saved successfully:", reminder);
    return res.status(201).json({ success: true, reminder });
  } catch (err) {
    console.error("❌ POST /api/reminders error:", err.message, err.stack);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ Fetch all reminders for a user
router.get('/:user_id', async (req, res) => {
  try {
    const reminders = await Reminder.find({ user_id: req.params.user_id }).sort({ due_date: 1 });
    return res.status(200).json({ success: true, reminders });
  } catch (err) {
    console.error('❌ Error fetching reminders:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch reminders' });
  }
});

// ✅ Fetch today's reminders
router.get('/today/:user_id', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const reminders = await Reminder.find({
      user_id: req.params.user_id,
      due_date: { $gte: startOfDay, $lte: endOfDay },
      is_paid: false,
    });

    return res.status(200).json({ success: true, reminders });
  } catch (err) {
    console.error('❌ Error fetching today’s reminders:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Delete a reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    return res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting reminder:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete reminder' });
  }
});

// ✅ Mark reminder as paid
router.put('/:id/mark-paid', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, { is_paid: true }, { new: true });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    return res.json({ success: true, reminder });
  } catch (err) {
    console.error('❌ Error marking as paid:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update reminder' });
  }
});

module.exports = router;
