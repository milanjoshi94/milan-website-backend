const router = require('express').Router();
const Razorpay = require('razorpay');
const jwt = require('jsonwebtoken');
const Purchase = require('../models/Purchase');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const crypto = require('crypto');

router.post('/api/webhook', async (req, res) => {
    // SECURITY: Verify the webhook actually came from Razorpay
    const secret = 'YOUR_WEBHOOK_SECRET'; // You set this in Razorpay dashboard
    const signature = req.headers['x-razorpay-signature'];
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature === expectedSignature) {
        const { event, payload } = req.body;

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const userEmail = payment.email; // Razorpay sends the email user typed

            // Save to your "Purchase" collection
            await Purchase.findOneAndUpdate(
                { email: userEmail },
                { 
                    email: userEmail, 
                    razorpay_payment_id: payment.id,
                    status: 'paid' 
                },
                { upsert: true }
            );
        }
        res.status(200).send('ok');
    } else {
        res.status(400).send('invalid signature');
    }
});

router.post('/verify-purchase', async (req, res) => {
    const { email } = req.body;

    // Look for a successful purchase with this email
    const purchase = await Purchase.findOne({ email: email, status: 'paid' });

    if (purchase) {
        // Create the JWT token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '365d' });
        
        return res.json({ 
            success: true, 
            token: token,
            message: "Access Granted!" 
        });
    } else {
        return res.status(404).json({ 
            success: false, 
            message: "No paid course found for this email. If you just paid, wait 10 seconds and try again." 
        });
    }
});

// The ONLY route you need for the hosted page flow
// router.post(`/verify-redirect/payment_id={razorpay_payment_id}`, async (req, res) => {
//   const { payment_id } = req.body;
//   try {
//     const payment = await rzp.payments.fetch(payment_id);

//     if (payment.status === 'captured') {
//       const userEmail = payment.email || payment.contact;
//       await Purchase.findOneAndUpdate(
//         { email: userEmail },
//         {
//           email: userEmail,
//           razorpay_payment_id: payment_id,
//           amount: payment.amount
//         },
//         { upsert: true }
//       );

//       const token = jwt.sign({ email: userEmail }, process.env.JWT_SECRET, { expiresIn: '36500d' });
//       res.json({ success: true, token });
//     } else {
//       res.status(400).json({ success: false, message: "Payment not completed" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Verification Failed" });
//   }
// });

// router.post('/restore-access', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const purchase = await Purchase.findOne({ email });

//     if (!purchase) {
//       return res.status(404).json({ success: false, message: "No purchase found with this email" });
//     }

//     const token = jwt.sign(
//       { email: purchase.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "36500d" }
//     );

//     res.json({ success: true, token });

//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

module.exports = router;