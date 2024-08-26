//userRoutes.js

import express from "express";
const router = express.Router();
import { isAuthenticated, authorizeRole } from "../utils/isAuthenticated.js";
import {
  registerUser,
  resendVerificationEmail,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  logout,
  getUserProfile,
  changePassword,
  updateProfile,
  updateAvatar,
  addAdmin,
  addUser,
  getAllUsers,
  addTeacher,
  getAllTeachers,
  getAllAdmins,
  deleteTeacher,
  deleteUser,
  changeRole,
  sendMailToAll,
  sendMailToOne,
} from "../controllers/userController.js";
import singleUpload from "../middleware/multer.js";

// For All
router.route("/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/register").post(registerUser);
router.route("/resend-verification-email").post(resendVerificationEmail);
router.route("/verify-email/:token").post(verifyEmail);
router.route("/forget-password").post(forgotPassword);
router.route("/reset-password/:token").put(resetPassword);
router.route("/me").get(isAuthenticated, getUserProfile);
router.route("/change-password").put(isAuthenticated, changePassword);
router.route("/update-profile").put(isAuthenticated, updateProfile);
router.route("/update-avatar").put(isAuthenticated, singleUpload, updateAvatar);

// For Admin

router
  .route("/add-admin")
  .post(isAuthenticated, authorizeRole("admin"), addAdmin);
router
  .route("/users")
  .get(isAuthenticated, authorizeRole("admin", "teacher"), getAllUsers);
router
  .route("/add-teacher")
  .post(isAuthenticated, authorizeRole("admin"), addTeacher);
router
  .route("/teachers")
  .get(isAuthenticated, authorizeRole("admin"), getAllTeachers);
router
  .route("/admins")
  .get(isAuthenticated, authorizeRole("admin"), getAllAdmins);
router
  .route("/delete-teacher/:id")
  .delete(isAuthenticated, authorizeRole("admin"), deleteTeacher);
router
  .route("/delete-user/:id")
  .delete(isAuthenticated, authorizeRole("admin"), deleteUser);
router
  .route("/change-role/:id")
  .put(isAuthenticated, authorizeRole("admin"), changeRole);
router
  .route("/add-user")
  .post(isAuthenticated, authorizeRole("admin", "teacher"), addUser);
router
  .route("/send-mail")
  .post(isAuthenticated, authorizeRole("admin", "teacher"), sendMailToAll);
router
  .route("/send-mail/:id")
  .post(isAuthenticated, authorizeRole("admin", "teacher"), sendMailToOne);

export default router;
