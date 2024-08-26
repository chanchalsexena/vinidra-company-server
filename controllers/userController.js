// userController.js

import User from "../models/userModel.js";
import CatchAsyncError from "../middleware/CatchAsyncError.js";
import sendToken from "../utils/sendToken.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import getDataUri from "../utils/dataUri.js";
import { ErrorHandler, handleError } from "../utils/ErrorHandler.js";
import cloudinary from "cloudinary";

export const registerUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { username, fullname, email, password } = req.body;
    const hasNumber = /\d/;
    const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const hasAlphabet = /[a-zA-Z]/;

    if (username.length < 6) {
      throw new ErrorHandler(
        "Username must be at least 6 characters long",
        400
      );
    }
    if (!hasNumber.test(username)) {
      throw new ErrorHandler("Username must contain at least one number", 400);
    }
    if (!hasSpecialCharacter.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one special character",
        400
      );
    }
    if (!hasAlphabet.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one alphabet",
        400
      );
    }
    if (!fullname) {
      throw new ErrorHandler("Please enter your full name", 400);
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new ErrorHandler("Email already exists", 400);
    }
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new ErrorHandler("Username already exists", 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      fullname,
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();

    // Save user with verification token
    await user.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `Please click on the following link to verify your email: \n\n${verificationLink}`;
    await sendMail(user.email, "Account Verification", message);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Verification email sent.",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Resend Verification Email => /api/v1/resend-verification-email
export const resendVerificationEmail = CatchAsyncError(
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        throw new ErrorHandler("User not found with this email", 404);
      }

      if (user.isVerified) {
        throw new ErrorHandler("Email is already verified", 400);
      }

      // Generate  verification token
      const verificationToken = user.generateVerificationToken();
      await user.save();

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      const message = `Please click on the following link to verify your email: \n\n${verificationLink}`;
      await sendMail(user.email, "Account Verification", message);

      res.status(200).json({
        success: true,
        message: "Verification email resent successfully.",
      });
    } catch (err) {
      handleError(err, res);
    }
  }
);

// Verify Email => /api/v1/verify-email/:token

export const verifyEmail = CatchAsyncError(async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      verificationTokenExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      throw new ErrorHandler("Invalid or expired verification token", 400);
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Login user => /api/v1/login

export const loginUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password is entered by user
    if (!email || !password) {
      throw new ErrorHandler("Please enter email & password", 400);
    }

    // Finding user in database
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ErrorHandler("Invalid Email or Password", 401);
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new ErrorHandler(
        "Your account is not verified. Please verify your account",
        400
      );
    }

    // Check if password is correct
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      throw new ErrorHandler("Invalid Email or Password", 401);
    }

    sendToken(user, 200, res, "Login Successful");
  } catch (err) {
    handleError(err, res);
  }
});

// Forgot Password => /api/v1/forgot-password

export const forgotPassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw new ErrorHandler("User not found with this email", 404);
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset password url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `Your password reset token is as follows:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

    try {
      await sendMail(user.email, "Password Recovery", message);

      res.status(200).json({
        success: true,
        message: `Email sent to: ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      throw new ErrorHandler(error.message, 500);
    }
  } catch (err) {
    handleError(err, res);
  }
});

// Reset Password => /api/v1/reset-password/:token

export const resetPassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    // Hash URL token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ErrorHandler(
        "Password reset token is invalid or has been expired",
        400
      );
    }

    if (password !== confirmPassword) {
      throw new ErrorHandler("Password does not match", 400);
    }

    // Setup new password
    user.password = password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Logout user => /api/v1/logout

export const logout = CatchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Get currently logged in user details => /api/v1/me

export const getUserProfile = CatchAsyncError(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Update / Change password => /api/v1/change-password

export const changePassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ErrorHandler("Please enter old and new password", 400);
    }

    const user = await User.findById(req.user.id).select("+password");

    // Check previous user password
    const isMatched = await user.comparePassword(oldPassword);
    if (!isMatched) {
      throw new ErrorHandler("Old password is incorrect", 400);
    }

    user.password = newPassword;

    if (oldPassword === newPassword) {
      throw new ErrorHandler(
        "Password is same as previous password. Please enter a new password",
        400
      );
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

    sendToken(user, 200, res, "Password updated successfully");
  } catch (err) {
    handleError(err, res);
  }
});

// Update user profile => /api/v1/update-profile
export const updateProfile = CatchAsyncError(async (req, res, next) => {
  try {
    const { username, fullname, email } = req.body;
    const user = await User.findById(req.user.id);
    const hasNumber = /\d/;
    const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const hasAlphabet = /[a-zA-Z]/;
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    // Check if username exists in request body
    if (username) {
      // Check if same username is not already taken
      const userExists = await User.findOne({ username: username });
      if (userExists && userExists.username !== user.username) {
        throw new ErrorHandler("Username already taken", 400);
      }
      if (username.length < 6) {
        throw new ErrorHandler(
          "Username must be at least 6 characters long",
          400
        );
      }
      if (!hasNumber.test(username)) {
        throw new ErrorHandler(
          "Username must contain at least one number",
          400
        );
      }
      if (!hasSpecialCharacter.test(username)) {
        throw new ErrorHandler(
          "Username must contain at least one special character",
          400
        );
      }
      if (!hasAlphabet.test(username)) {
        throw new ErrorHandler(
          "Username must contain at least one alphabet",
          400
        );
      }
      // If all validations pass, update the username
      user.username = username;
    }
    // Check if email exists in request body
    if (email) {
      // Check if same email is not already taken
      const userExists = await User.findOne({ email: email });
      if (userExists && userExists.email !== user.email) {
        throw new ErrorHandler("Email already taken", 400);
      }
      // If email is provided and validation passes, update the email
      user.email = email;
    }
    // Update fullname if provided
    if (fullname) {
      user.fullname = fullname || user.fullname;
    }
    // Save the updated user object
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

//  Update Avatar => /api/v1/update-avatar

export const updateAvatar = CatchAsyncError(async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    const file = req.file;
    const fileUri = getDataUri(file);
    if (!file) {
      throw new ErrorHandler("Please upload an image", 400);
    }
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
      folder: "vinidraexam/profilepic",
      crop: "scale",
    });

    if (user.avatar && user.avatar.public_id) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id, {
        folder: "vinidraexam/profilepic",
      });
    }

    user.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile pic updated successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

//  Add Admin without email verification => /api/v1/add-admin

export const addAdmin = CatchAsyncError(async (req, res, next) => {
  try {
    const { username, fullname, email, password } = req.body;
    const emailExists = await User.findOne({ email });
    const hasNumber = /\d/;
    const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const hasAlphabet = /[a-zA-Z]/;

    if (username.length < 6) {
      throw new ErrorHandler(
        "Username must be at least 6 characters long",
        400
      );
    }
    if (!hasNumber.test(username)) {
      throw new ErrorHandler("Username must contain at least one number", 400);
    }
    if (!hasSpecialCharacter.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one special character",
        400
      );
    }
    if (!hasAlphabet.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one alphabet",
        400
      );
    }
    if (emailExists) {
      throw new ErrorHandler("Email already exists", 400);
    }
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new ErrorHandler("Username already exists", 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "admin",
      isVerified: true,
      fullname,
    });

    res.status(201).json({
      success: true,
      message: "Admin added successfully.",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Get all users => /api/v1/users

export const getAllUsers = CatchAsyncError(async (req, res, next) => {
  try {
    const searchTerm = req.query.search || "";
    const sortBy = req.query.sort || "name";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const query = { role: "student" };
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }
    const sortOptions = {};
    if (sortBy === "name" || sortBy === "email") {
      sortOptions[sortBy] = 1;
    }
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(limit * (page - 1));
    res.status(200).json({
      success: true,
      users,
      totalUsers,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Add Teacher Admin => /api/v1/add-teacher

export const addTeacher = CatchAsyncError(async (req, res, next) => {
  try {
    const { username, fullname, email, password } = req.body;
    const emailExists = await User.findOne({ email });
    const hasNumber = /\d/;
    const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const hasAlphabet = /[a-zA-Z]/;

    if (username.length < 6) {
      throw new ErrorHandler(
        "Username must be at least 6 characters long",
        400
      );
    }
    if (!hasNumber.test(username)) {
      throw new ErrorHandler("Username must contain at least one number", 400);
    }
    if (!hasSpecialCharacter.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one special character",
        400
      );
    }
    if (!hasAlphabet.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one alphabet",
        400
      );
    }
    if (emailExists) {
      throw new ErrorHandler("Email already exists", 400);
    }
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new ErrorHandler("Username already exists", 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "teacher",
      isVerified: true,
      fullname,
    });

    res.status(201).json({
      success: true,
      message: "Teacher added successfully.",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Get All Teachers => /api/v1/teachers

export const getAllTeachers = CatchAsyncError(async (req, res, next) => {
  try {
    const searchTerm = req.query.search || "";
    const sortBy = req.query.sort || "name";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const query = { role: "teacher" };
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }
    const sortOptions = {};
    if (sortBy === "name" || sortBy === "email") {
      sortOptions[sortBy] = 1;
    }
    const totalTeachers = await User.countDocuments(query);
    const teachers = await User.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(limit * (page - 1));
    res.status(200).json({
      success: true,
      teachers,
      totalTeachers,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Get All Admins => /api/v1/admins

export const getAllAdmins = CatchAsyncError(async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const searchTerm = req.query.search || "";
    const sortBy = req.query.sort || "name";
    const query = { role: "admin" };
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }
    const sortOptions = {};
    if (sortBy === "name" || sortBy === "email") {
      sortOptions[sortBy] = 1;
    }

    const totalAdmins = await User.countDocuments(query);
    const admins = await User.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(limit * (page - 1));

    res.status(200).json({
      success: true,
      admins,
      totalAdmins,
    });
  } catch (err) {
    handleError(err, res);
  }
});

export const addUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { username, fullname, email, password } = req.body;
    // Username must have number, special character, and alphabets
    const hasNumber = /\d/;
    const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const hasAlphabet = /[a-zA-Z]/;

    if (username.length < 6) {
      throw new ErrorHandler(
        "Username must be at least 6 characters long",
        400
      );
    }
    if (!hasNumber.test(username)) {
      throw new ErrorHandler("Username must contain at least one number", 400);
    }
    if (!hasSpecialCharacter.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one special character",
        400
      );
    }
    if (!hasAlphabet.test(username)) {
      throw new ErrorHandler(
        "Username must contain at least one alphabet",
        400
      );
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new ErrorHandler("Email already exists", 400);
    }
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new ErrorHandler("Username already exists", 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      isVerified: true,
      fullname,
    });

    res.status(201).json({
      success: true,
      message: "User added successfully.",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Delete Student Admin  => /api/v1/delete-user/:id

export const deleteUser = CatchAsyncError(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Delete Teacher Admin  => /api/v1/delete-teacher/:id

export const deleteTeacher = CatchAsyncError(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Change  User Role => /api/v1/change-role/:id

export const changeRole = CatchAsyncError(async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    user.role = role;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Send Mail to all users => /api/v1/send-mail

export const sendMailToAll = CatchAsyncError(async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    const users = await User.find({ role: "student" });
    users.forEach(async (user) => {
      await sendMail(user.email, subject, message);
    });
    res.status(200).json({
      success: true,
      message: "Mail sent to all users successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Send Mail to One User => /api/v1/send-mail/:id

export const sendMailToOne = CatchAsyncError(async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }
    await sendMail(user.email, subject, message);
    res.status(200).json({
      success: true,
      message: "Mail sent to user successfully",
    });
  } catch (err) {
    handleError(err, res);
  }
});
