// faqRoute.js

import express from "express";
const router = express.Router();
import { isAuthenticated, authorizeRole } from "../utils/isAuthenticated.js";
import {
  getFaqs,
  getSingleFaq,
  createFaq,
  updateFaq,
} from "../controllers/faqController.js";

router.route("/faq").get(getFaqs);
router.route("/faq/:id").get(getSingleFaq);
router.route("/faq").post(isAuthenticated, authorizeRole("admin"), createFaq);
router
  .route("/faq/:id")
  .put(isAuthenticated, authorizeRole("admin"), updateFaq);
export default router;
