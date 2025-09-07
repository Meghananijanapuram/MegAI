import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import LocalStrategy from "passport-local";
import User from "../models/user.js";
import chatRouter from "../routes/chat.js";
import userRouter from "../routes/user.js";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();

app.use(cookieParser(process.env.SECRET_CODE));
app.use(express.json());

const allowedOrigins = [
  "https://meg-ai.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

const sessionOptions = {
  secret: process.env.SECRET_CODE,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  },
};
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/api", chatRouter);
app.use("/user", userRouter);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB Connected!");
  } catch (err) {
    console.error("Failed to connect with db", err);
  }
};
connectDB();

export default app;
