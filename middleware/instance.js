// instance.js

import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config({ path: "../config/.env" });

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY || "rzp_live_0MfiMGmoqbASNZ",
  key_secret: process.env.RAZORPAY_API_SECRET || "DK053vOHqWGksjJo6hTN6z6k"
});

export default instance;
