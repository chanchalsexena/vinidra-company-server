// examRoute.js

import express from "express";
const router = express.Router();
import { isAuthenticated, authorizeRole } from "../utils/isAuthenticated.js";
import {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam,
  createRazorpayOrder,
  verifyPayment,
  startExamAttempt,
  getAllExamAttempts,
  submitExamAttempt,
  enrollForExam,
  getTop10Scores,
  getResult,
  generateExamReport,
  submitExamReview,
  getAllExamsWithRatings
} from "../controllers/examController.js";

router.route("/exam").get(getAllExams);
router.route("/exam/:id").get(getSingleExam);
router.route("/exam/order").post(isAuthenticated, createRazorpayOrder);
router.route("/exam/verify").post(isAuthenticated, verifyPayment);
router.route("/exam/attempt/:id").post(isAuthenticated, startExamAttempt);
router.route("/exam/attempt").get(isAuthenticated, getAllExamAttempts);
router.route("/exam/attempt/:id").put(isAuthenticated, submitExamAttempt);
router.route("/exam/review/:id").post(isAuthenticated, submitExamReview);
router.route("/exam/enroll").post(isAuthenticated, enrollForExam);
router.route("/exam/top10/:id").get(isAuthenticated, getTop10Scores);
router.route("/exam/result/:id").get(isAuthenticated, getResult);
router.route("/exams-with-ratings").get(getAllExamsWithRatings);

router
  .route("/exam")
  .post(isAuthenticated, authorizeRole("admin", "teacher"), createExam);
router
  .route("/exam/:id")
  .put(isAuthenticated, authorizeRole("admin", "teacher"), updateExam);
router
  .route("/exam/:id")
  .delete(isAuthenticated, authorizeRole("admin", "teacher"), deleteExam);
router
  .route("/exam/report/:id")
  .get(isAuthenticated, authorizeRole("admin", "teacher"), generateExamReport);

export default router;
