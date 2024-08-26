import express from "express";
const router = express.Router();
import {
  contactUs,
  requestCourse,
  getDashboardStats,
} from "../controllers/contactController.js";
import { isAuthenticated, authorizeRole } from "../utils/isAuthenticated.js";
router.route("/contact").post(contactUs);
router.route("/requestCourse").post(requestCourse);
router
  .route("/admin/stats")
  .get(isAuthenticated, authorizeRole("admin"), getDashboardStats);

export default router;
