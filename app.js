// app.js

import express from "express";
import path from "path";
import cors from "cors";
import cookie from "cookie-parser";
import env from "dotenv";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import jwt from "jsonwebtoken";
import userRoute from "./routes/userRoute.js";
import contactRoute from "./routes/contactRoute.js";
import courseRoute from "./routes/courseRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import examRoute from "./routes/examRoute.js";
import homeRoute from "./routes/homeRoute.js";
import faqRoute from "./routes/faqRoute.js";
import passportConfig from "./utils/passport.js";

const app = express();
env.config({ path: "./config/.env" });

// Handle Form Data
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    limit: "100mb",
  })
);

// Enable CORS
const allowedOrigins = process.env.FRONTEND_URLS.split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use(cookie());

// Initialize session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: process.env.DB_URL }),
    cookie: { secure: process.env.NODE_ENV }, // Secure should be true in production with HTTPS
  })
);

// Initialize passport
passportConfig(app);

// Routes
app.use(
  "/api/v1",
  userRoute,
  contactRoute,
  courseRoute,
  paymentRoute,
  examRoute,
  homeRoute,
  faqRoute
);

// Middleware to set redirect URL in session based on origin
app.use((req, res, next) => {
  if (req.query.redirectUrl) {
    req.session.redirectUrl = req.query.redirectUrl;
  } else if (req.headers.referer) {
    allowedOrigins.forEach((url) => {
      if (req.headers.referer.startsWith(url)) {
        req.session.redirectUrl = url;
      }
    });
  }
  next();
});

// Google OAuth Routes
app.get("/auth/google", (req, res, next) => {
  const redirectUrl = req.query.redirectUrl || allowedOrigins[0];
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: redirectUrl, // Use the state parameter to pass the redirect URL
  })(req, res, next);
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    // Generate JWT token and set it in the cookie
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    });

    res.cookie("token", token, {
      httpOnly: true,
      // secure: false,
      secure: process.env.NODE_ENV,
      maxAge: process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    });

    // Get the redirect URL from the state parameter
    const redirectUrl = req.query.state || allowedOrigins[0];
    res.redirect(`${redirectUrl}/profile`);
  }
);

// Endpoint to fetch user data
app.get("/api/v1/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// Handle logout
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to log out" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to destroy session" });
      }
      res.clearCookie("connect.sid");
      res.clearCookie("token");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
});

app.get("/test", (req, res) => {
  res.status(200).json({ message: "Hello from server" });
});

// Serve multiple front-end applications
const __dirname = path.resolve();

allowedOrigins.forEach((url, index) => {
  const appPath = `app${index + 1}`;
  app.use(
    `/${appPath}`,
    express.static(path.join(__dirname, `client/${appPath}`))
  );
  app.get(`/${appPath}/*`, (req, res) => {
    res.sendFile(path.join(__dirname, `client/${appPath}`, "index.html"));
  });
});

app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

export default app;
