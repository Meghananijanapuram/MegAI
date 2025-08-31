import express from "express";
import Thread from "../models/Thread.js";
import getGroqAPIResponse from "../utils/groqai.js";
import isLoggedIn from "../middleware.js";

const router = express.Router();

// Get all threads for logged-in user
router.get("/thread", isLoggedIn, async (req, res) => {
  try {
    const threads = await Thread.find({ owner: req.user._id }).sort({ updatedAt: -1 });

    return res.json(threads || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json([]);
  }
});

// Get particular thread (only if belongs to user)
router.get("/thread/:threadId", isLoggedIn, async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOne({ threadId, owner: req.user._id });

    if (!thread) {
      return res.status(404).json([]);
    }

    return res.json(thread.messages || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json([]);
  }
});

// Delete thread (only if belongs to user)
router.delete("/thread/:threadId", isLoggedIn, async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOneAndDelete({ threadId, owner: req.user._id });

    if (!thread) {
      return res.status(404).json({ success: false, message: "Thread not found" });
    }

    return res.status(200).json({ success: true, message: "Thread successfully deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to delete chat" });
  }
});

//Chat route (supports guest mode)
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let thread = null;

    if (req.user) {
      thread = await Thread.findOne({ threadId, owner: req.user._id });
    }

    if (!thread) {
      if (!req.user) {
  
        const assistantReply = await getGroqAPIResponse(message);
        return res.json({ reply: assistantReply });
      }

      thread = new Thread({
        threadId,
        title: message,
        messages: [{ role: "user", content: message }],
        owner: req.user._id,
      });
    } else {
      thread.messages.push({ role: "user", content: message });
    }

    const assistantReply = await getGroqAPIResponse(message);

    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();

    await thread.save();

    return res.json({ reply: assistantReply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
