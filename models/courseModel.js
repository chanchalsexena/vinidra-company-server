import moongose from 'mongoose';
const { Schema } = moongose;

const courseSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        minlength: [10, "Description must be at least 10 characters"],
    },
    poster: {
        public_id: {
            type: String,
            required: [true, "Public Id is required"],
        },
        url: {
            type: String,
            required: [true, "Url is required"]
        }
    },
    lectures: [
        {
            title: {
                type: String,
                required: [true, "Title is required"],
                minlength: [3, "Title must be at least 3 characters"],
                maxLength: [50, "Title must be less than 50 characters"],
            },
            description: {
                type: String,
                required: [true, "Description is required"],
                minlength: [10, "Description must be at least 10 characters"],
            },
            video: {
                public_id: {
                    type: String,
                    required: [true, "Public Id is required"],
                },
                url: {
                    type: String,
                    required: [true, "Url is required"],
                }
            },
        }
    ],
    views: {
        type: Number,
        default: 0
    },
    numOfVideos: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: [true, "Category is required"],
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, { timestamps: true });

const Course = moongose.model('Course', courseSchema);

export default Course;