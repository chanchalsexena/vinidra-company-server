// courseController.js

import CatchAsyncError from "../middleware/CatchAsyncError.js";
import { ErrorHandler, handleError } from "../utils/ErrorHandler.js";
import Course from "../models/courseModel.js";
import User from "../models/userModel.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";

// Create a new course => /api/v1/new-course

export const createCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const createdBy = req.user._id;
    const file = req.file;

    if (!title || !description || !category) {
      throw new ErrorHandler("Please fill all the fields", 400);
    }
    if (!file) {
      throw new ErrorHandler("Please upload a file", 400);
    }
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
      folder: "vinidraexam/course",
    });
    let newCourse = new Course({
      title,
      description,
      category,
      poster: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      createdBy,
    });
    await newCourse.save();
    res.status(201).json({
      success: true,
      course: newCourse,
      message: "Course created successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Get all courses => /api/v1/courses

export const getAllCourses = CatchAsyncError(async (req, res, next) => {
  try {
    const keyword = req.query.keyword || "";
    const category = req.query.category || "";
    const course = await Course.find({
      title: { $regex: keyword, $options: "i" },
      category: { $regex: category, $options: "i" },
    }).select("-lectures");
    res.status(200).json({
      success: true,
      course,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Get Course Lectures => /api/v1/course/:id

export const getCourseLectures = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      throw new ErrorHandler("Course not found", 404);
    }
    course.views = course?.views + 1;
    await course.save();
    res.status(200).json({
      success: true,
      lectures: course?.lectures,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Add Lecture => /api/v1/course/:id/add-lecture

export const addLecture = CatchAsyncError(async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;
  const file = req.file;
  if (!file) {
    throw new ErrorHandler("Please upload a file", 400);
  }
  if (!title || !description) {
    throw new ErrorHandler("Please fill all the fields", 400);
  }
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(
    fileUri.content,
    {
      folder: "vinidraexam/lecture",
      resource_type: "video",
      timeout: 600000,
    },
    (err, result) => {
      if (err) {
        throw new ErrorHandler(err.message, 500);
      }
    }
  );
  const course = await Course.findById(id);
  if (!course) {
    throw new ErrorHandler("Course not found", 404);
  }
  course.lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  course.numOfVideos = course?.lectures.length;
  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture added successfully",
  });
});

// Add To Playlist => /api/v1/course/:id/add-to-playlist

export const addToPlaylist = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw new ErrorHandler("Course not found", 404);
  }
  const isCourseAdded = user.playlist.find(
    (item) => item.course.toString() === req.params.id
  );
  if (isCourseAdded) {
    throw new ErrorHandler("Course is already added to playlist", 400);
  }
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });
  await user.save();
  res.status(200).json({
    success: true,
    message: "Course added to playlist successfully",
  });
});

// Remove From Playlist => /api/v1/course/:id/remove-from-playlist

export const removeFromPlaylist = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw new ErrorHandler("Course not found", 404);
  }
  user.playlist = user.playlist.filter(
    (item) => item.course.toString() !== req.params.id
  );
  await user.save();
  res.status(200).json({
    success: true,
    message: "Course removed from playlist successfully",
  });
});

// Delete Course => /api/v1/course/:id

export const deleteCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      throw new ErrorHandler("Course not found", 404);
    }
    await cloudinary.v2.uploader.destroy(course.poster.public_id, {
      folder: "vinidraexam/course",
    });
    for (let i = 0; i < course.lectures.length; i++) {
      await cloudinary.v2.uploader.destroy(course.lectures[i].video.public_id, {
        folder: "vinidraexam/lecture",
        resource_type: "video",
      });
    }
    await course.deleteOne();
    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Delete Lecture => /api/v1/delete-lecture

export const deleteLecture = CatchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Course not found", 404);
  }
  const lecture = course.lectures.find(
    (item) => item._id.toString() === lectureId
  );
  if (!lecture) {
    throw new ErrorHandler("Lecture not found", 404);
  }
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    folder: "vinidraexam/lecture",
    resource_type: "video",
  });
  course.lectures = course.lectures.filter(
    (item) => item._id.toString() !== lectureId
  );
  course.numOfVideos = course?.lectures.length;
  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture deleted successfully",
  });
});
