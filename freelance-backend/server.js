require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes'); // Import

const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString(); // We save the raw string here
  }
}));
app.use(cors());

// Connect Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// Use Routes
app.use('/api/payments', paymentRoutes); // All routes will now start with /api/payments/...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));