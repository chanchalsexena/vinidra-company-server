// db.js

import mongoose from 'mongoose';

const connectDB = async () => {
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/vinidraexam';
    try {
        const connection = await mongoose.connect(dbUrl);

        console.log(`Database connected with ${connection.connection.host}`);
    } catch (err) {
        console.log(err);
        setTimeout(connectDB, 3000);
    }
};

export default connectDB;
