// examModel.js

import mongoose from "mongoose";
const { Schema } = mongoose;

const questionSchema = new Schema({
  text: {
    en: { type: String },
    hi: { type: String },
  },
  options: {
    en: [{ type: String }],
    hi: [{ type: String }],
  },
  correctOptionIndex: {
    type: [Number], // Change this to an array of numbers
    required: true,
  },
  marks: {
    type: Number,
    required: true,
  },
  negativeMarks: {
    type: Number,
  },
  image: {
    type: String,
  },
  subject: {
    type: String,
    required: true,
  },
  isMultiOption: {
    // New field to indicate multi-option questions
    type: Boolean,
    required: true,
  },
});

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  institution: {
    type: String
    // required: true,
  },
  module: {
    name: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
  },
  rules: {
    type: [String],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const examAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userImage: {
    type: String, // Base64 encoded image or URL of the image if stored elsewhere
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  answers: [
    {
      questionId: {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      selectedOptionIndex: {
        type: Number,
        required: true,
      },
    },
  ],
  incorrectQuestions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  score: {
    type: Number,
  },
  status: {
    type: String,
    default: "incomplete",
  },
  subjectWiseMarks: {
    type: Map,
    of: new mongoose.Schema({
      score: { type: Number, default: 0 },
      totalMarks: { type: Number, default: 0 },
    }),
  },
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      // default: 0
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },
  }
});

const examPaymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  signature: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
});

const Exam = mongoose.model("Exam", examSchema);
const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);
const ExamPayment = mongoose.model("ExamPayment", examPaymentSchema);

export { Exam, ExamAttempt, ExamPayment };
