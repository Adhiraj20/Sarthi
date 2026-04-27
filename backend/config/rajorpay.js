const Razorpay = require('razorpay');

let instance = null;

try {
    if (process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET) {
        instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET
        });
        console.log("✅ Razorpay initialized successfully");
    } else {
        console.warn("⚠️ Razorpay credentials missing - payment features may not work");
    }
} catch (error) {
    console.error("❌ Razorpay initialization error:", error.message);
}

exports.instance = instance;