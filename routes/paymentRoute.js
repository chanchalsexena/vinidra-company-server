// paymentRoute.js

import express from "express";
import { isAuthenticated } from "../utils/isAuthenticated.js";
import {
  buySubscription,
  cancelSubscription,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/paymentController.js";

const router = express.Router();

router.route("/buy-subscription").get(isAuthenticated, buySubscription);

router
  .route("/cancel-subscription")
  .delete(isAuthenticated, cancelSubscription);

router.route("/razorpay-key").get(isAuthenticated, getRazorPayKey);

router
  .route("/payment-verification")
  .post(isAuthenticated, paymentVerification);

export default router;
