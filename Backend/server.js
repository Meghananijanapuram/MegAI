import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import LocalStrategy from "passport-local";
import User from "./models/user.js";
import chatRouter from "./routes/chat.js";
import userRouter from "./routes/user.js";

import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cookieParser(process.env.SECRET_CODE));

const sessionOptions = {
    secret : process.env.SECRET_CODE,
    resave : false, 
    saveUninitialized : false,
    cookie : {
        expires :Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
        sameSite: "lax",
    },
}

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true,               
  })
);

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/api", chatRouter);
app.use("/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected!");
    } catch(err) {
        console.log("Failed to connect with db",err);
    }
}