// isAuthenticated.js

import CatchAsyncError from '../middleware/CatchAsyncError.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

export const isAuthenticated = CatchAsyncError(async (req, res, next) => {
    try {
        const { token } = req.cookies;
        console.log("hiiiiiiiiiiiiiiiiiiii", token);
        if (!token) {
            throw new ErrorHandler('Login first to access this resource', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        throw new ErrorHandler('Login first to access this resource', 401);
    }
});

export const authorizeRole = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new ErrorHandler(
            `Role (${req.user.role}) is not allowed to access this resource`,
            403
          )
        );
      }
      next();
    };
  };

export default isAuthenticated;
