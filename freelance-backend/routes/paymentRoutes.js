const router = require('express').Router();
const Razorpay = require('razorpay');
const jwt = require('jsonwebtoken');
const Purchase = require('../models/Purchase');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


router.post("/webhook", async (req, res) => {

  try {

    const payment = req.body.payload.payment.entity;

    await Purchase.create({
      email: payment.email,
      phone: payment.contact,
      razorpay_payment_id: payment.id,
      amount: payment.amount
    });

    res.status(200).send("ok");

  } catch (err) {
    res.status(500).send("error");
  }

});
// The ONLY route you need for the hosted page flow
router.post('/verify-redirect', async (req, res) => {
  const { payment_id } = req.body;
  try {
    const payment = await rzp.payments.fetch(payment_id);

    if (payment.status === 'captured') {
      const userEmail = payment.email || payment.contact;
      await Purchase.findOneAndUpdate(
        { email: userEmail },
        {
          email: userEmail,
          razorpay_payment_id: payment_id,
          amount: payment.amount
        },
        { upsert: true }
      );

      const token = jwt.sign({ email: userEmail }, process.env.JWT_SECRET, { expiresIn: '36500d' });
      res.json({ success: true, token });
    } else {
      res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    res.status(500).json({ error: "Verification Failed" });
  }
});

router.post('/restore-access', async (req, res) => {
  const { email } = req.body;

  try {
    const purchase = await Purchase.findOne({ email });

    if (!purchase) {
      return res.status(404).json({ success: false, message: "No purchase found with this email" });
    }

    const token = jwt.sign(
      { email: purchase.email },
      process.env.JWT_SECRET,
      { expiresIn: "36500d" }
    );

    res.json({ success: true, token });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;