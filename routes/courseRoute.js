// courseRoute.js

import express from "express";
const router = express.Router();
import { isAuthenticated, authorizeRole } from "../utils/isAuthenticated.js";
import singleUpload from "../middleware/multer.js";
import {
  createCourse,
  getAllCourses,
  getCourseLectures,
  addLecture,
  addToPlaylist,
  removeFromPlaylist,
  deleteCourse,
  deleteLecture,
} from "../controllers/courseController.js";

router.route("/get-course").get(getAllCourses);
router
  .route("/create-course")
  .post(
    isAuthenticated,
    authorizeRole("admin", "teacher"),
    singleUpload,
    createCourse
  );
router
  .route("/course/:id")
  .delete(isAuthenticated, authorizeRole("admin", "teacher"), deleteCourse);
router
  .route("/course/:id/add-lecture")
  .post(
    isAuthenticated,
    authorizeRole("admin", "teacher"),
    singleUpload,
    addLecture
  );
router.route("/get-course/:id").get(getCourseLectures);
router.route("/course/:id/add-to-playlist").put(isAuthenticated, addToPlaylist);
router
  .route("/course/:id/remove-from-playlist")
  .put(isAuthenticated, removeFromPlaylist);
router
  .route("/delete-lecture")
  .delete(isAuthenticated, authorizeRole("admin", "teacher"), deleteLecture);
export default router;
