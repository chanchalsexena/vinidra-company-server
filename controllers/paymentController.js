// paymentController.js

import CatchAsyncError from "../middleware/CatchAsyncError.js";
import { ErrorHandler, handleError } from "../utils/ErrorHandler.js";
import User from "../models/userModel.js";
import crypto from "crypto";
import Payment from "../models/paymentModel.js";
import instance from "../middleware/instance.js";

// Buy Subscription

export const buySubscription = CatchAsyncError(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);
  if (!user) throw new ErrorHandler("User not found", 404);
  if (user.subscription.status === "active")
    throw new ErrorHandler("You already have an active subscription", 400);
  if (user.role === "admin")
    throw new ErrorHandler("Admin cannot buy subscription", 400);
  const plan_id = process.env.PLAN_ID || "plan_Nm5LXtsjDGRtmK";
  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;
  await user.save();
  res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
    status: subscription.status,
    message: "Subscription created successfully",
  });
});

// Payment Verification

export const paymentVerification = CatchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;
  const { id } = req.user;
  const user = await User.findById(id);
  if (!user) throw new ErrorHandler("User not found", 404);
  const subscription_id = user.subscription.id;
  const generate_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");
  const isAuthentic = generate_signature === razorpay_signature;
  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfailed`);
  // Database Here
  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });
  user.subscription.status = "active";
  await user.save();
  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

// Get Razorpay Key

export const getRazorPayKey = CatchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

// Cancel Subscription

export const cancelSubscription = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const subscriptionId = user.subscription.id;
  let refund = false;
  await instance.subscriptions.cancel(subscriptionId);
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });
  const gap = Date.now() - payment.createdAt;
  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;
  if (refundTime > gap) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }
  await payment.deleteOne();
  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled successfully you will get refund in 7 days"
      : "Subscription cancelled successfully but you will not get a refund because the refund time is less than 7 days",
  });
});
