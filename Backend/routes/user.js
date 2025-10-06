import express from "express";
import "dotenv/config";
import User from "../models/user.js";
import passport from "passport";

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.logIn(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json({
        success: true,
        message: "User registered & logged in successfully",
        user: {
          id: registeredUser._id,
          username: registeredUser.username,
          email: registeredUser.email,
        },
      });
    });
  } catch (err) {
    console.error("Signup Error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists!",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Signup failed",
    });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: info.message || "Invalid username or password",
        });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Login failed" });
      }

      return res.status(200).json({
        success: true,
        message: "Logged in successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

router.get("/loggedIn", (req, res) => {
  try {
    const loggedIn =
      typeof req.isAuthenticated === "function" ? req.isAuthenticated() : false;

    console.log("Session:", req.session);
    console.log("Authenticated:", req.isAuthenticated());

    res.json({
      loggedIn,
      user: loggedIn ? req.user : null,
    });
  } catch (err) {
    console.error("Error in /loggedIn:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
