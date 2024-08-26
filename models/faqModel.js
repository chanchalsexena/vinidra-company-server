import mongoose from 'mongoose';

const { Schema } = mongoose;

const faqSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
});

const Faq = mongoose.model('Faq', faqSchema);

export default Faq;
