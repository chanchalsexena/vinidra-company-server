import moongose from 'mongoose';
const { Schema } = moongose;

const statsSchema = new Schema({
    users: {
        type: Number,
        default: 0
    },
    teachers: {
        type: Number,
        default: 0
    },
    students: {
        type: Number,
        default: 0
    },
    courses: {
        type: Number,
        default: 0
    },
    exams: {
        type: Number,
        default: 0
    },
    subscriptions: {
        type: Number,
        default: 0
    },
    admins: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

const Stats = moongose.model('Stats', statsSchema);

export default Stats;