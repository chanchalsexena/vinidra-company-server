import Home from '../models/homeModel.js';
import CatchAsyncError from '../middleware/CatchAsyncError.js';
import { ErrorHandler, handleError } from '../utils/ErrorHandler.js';
import cloudinary from 'cloudinary';
import getDataUri from '../utils/dataUri.js';

// Get all home data
export const getHomeData = CatchAsyncError(async (req, res, next) => {
    try {
        const home = await Home.find();

        res.status(200).json({
            success: true,
            home
        });
    }
    catch (error) {
        handleError(error, res);
    }
});

// Create new home data

export const createHomeData = CatchAsyncError(async (req, res, next) => {
    try {
        const { title, description, } = req.body;

        if (!title || !description) {
            throw new ErrorHandler('Please fill all the fields', 400);
        }
        const file = req.file;
        if (!file) {
            throw new ErrorHandler('Please upload an image', 400);
        }
        const fileUrl = getDataUri(file);
        const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
            folder: 'vinidraexam/home',
            crop: 'scale'
        });
        const newHome = await Home.create({
            title,
            description,
            image: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }            
        });

        res.status(201).json({
            success: true,
            message: 'Home data created successfully',
            newHome
        });
    } catch (error) {
        handleError(error, res);
    }
});


export const updateHomeData = CatchAsyncError(async (req, res, next) => {
    try {
        const home = await Home.findById(req.params.id);
        if (!home) {
            throw new ErrorHandler('Home data not found', 404);
        }
        const { title, description } = req.body;
        const file = req.file;

        if (file) {
            const fileUrl = getDataUri(file);
            if (home.image && home.image.public_id) {
                await cloudinary.v2.uploader.destroy(home.image.public_id, {
                    folder: 'vinidraexam/home'
                });
            }
            const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
                folder: 'vinidraexam/home',
                crop: 'scale'
            });

            home.image = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        if (title) home.title = title;
        if (description) home.description = description;
        await home.save();

        res.status(200).json({
            success: true,
            home,
            message: 'Home data updated successfully'
        });
    } catch (error) {
        handleError(error, res);
    }
});
