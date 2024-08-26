// homeRoute.js

import express from "express";
const router = express.Router();
import { isAuthenticated, authorizeRole } from "../utils/isAuthenticated.js";
import singleUpload from "../middleware/multer.js";
import {
  getHomeData,
  createHomeData,
  updateHomeData,
} from "../controllers/homeController.js";

router.route("/home").get(getHomeData);
router
  .route("/create-home")
  .post(isAuthenticated, authorizeRole("admin"), singleUpload, createHomeData);
router
  .route("/update-home/:id")
  .put(isAuthenticated, authorizeRole("admin"), singleUpload, updateHomeData);

export default router;
