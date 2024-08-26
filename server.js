// server.js

import connectDB from "./config/db.js";
import app from "./app.js";
import http from "http";
import cloudinary from "cloudinary";
import nodeCron from "node-cron";

const server = http.createServer(app);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

nodeCron.schedule(" 0 0 0 1 * *", async () => {
  try {
    await Stats.create({});
  } catch (err) {
    console.log(err);
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  connectDB();
});
