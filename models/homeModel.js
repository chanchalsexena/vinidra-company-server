import moongose from 'mongoose';
const { Schema } = moongose;

const homeSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
});

const Home = moongose.model('Home', homeSchema);

export default Home;