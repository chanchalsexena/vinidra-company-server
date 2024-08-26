import Faq from "../models/faqModel.js";
import CatchAsyncError from "../middleware/CatchAsyncError.js";
import { ErrorHandler, handleError } from "../utils/ErrorHandler.js";

// Get all FAQs
export const getFaqs = CatchAsyncError(async (req, res, next) => {
    const faqs = await Faq.find();
    res.status(200).json({
        success: true,
        data: faqs,
    });
});

// Get single FAQ
export const getSingleFaq = CatchAsyncError(async (req, res, next) => {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
        return next(new ErrorHandler("FAQ not found", 404));
    }
    res.status(200).json({
        success: true,
        data: faq,
    });
});

// Create new FAQ
export const createFaq = CatchAsyncError(async (req, res, next) => {
    try {
        const { question, answer } = req.body;
        if (!question || !answer) {
            throw new ErrorHandler("Please fill in all fields", 400);
        }

        const faq = await Faq.create({ question, answer });

        res.status(201).json({
            success: true,
            message: "FAQ created successfully",
            data: faq,
        });
    } catch (error) {
        handleError(error, res);
    }
});

// Update FAQ
export const updateFaq = CatchAsyncError(async (req, res, next) => {
    try {
        const faq = await Faq.findById(req.params.id);

        if (!faq) {
            throw new ErrorHandler("FAQ not found", 404);
        }

        faq.question = req.body.question || faq.question;
        faq.answer = req.body.answer || faq.answer;

        await faq.save();

        res.status(200).json({
            success: true,
            message: "FAQ updated successfully",
            data: faq,
        });
    } catch (error) {
        handleError(error, res);
    }
});
