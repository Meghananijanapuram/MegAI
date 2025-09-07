// ChatWindow.jsx
import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "./MyContext.jsx";
import Chat from "./Chat.jsx";
import { ScaleLoader } from "react-spinners";
import "./ChatWindow.css";
import { v1 as uuidv1 } from "uuid";

import { clearGuestChats } from "../public/utils/guestStorage.js";

const TEMP_THREADS_KEY = "megai_temp_threads"; // array of { threadId, title }
const tempChatsKey = (threadId) => `megai_temp_chat_${threadId}`;

const getTempThreads = () =>
  JSON.parse(localStorage.getItem(TEMP_THREADS_KEY) || "[]");
const saveTempThreads = (threads) =>
  localStorage.setItem(TEMP_THREADS_KEY, JSON.stringify(threads));
const getTempChats = (threadId) =>
  JSON.parse(localStorage.getItem(tempChatsKey(threadId)) || "[]");
const saveTempChats = (threadId, chats) =>
  localStorage.setItem(tempChatsKey(threadId), JSON.stringify(chats));
const deleteTempChat = (threadId) => {
  const threads = getTempThreads().filter((t) => t.threadId !== threadId);
  saveTempThreads(threads);
  localStorage.removeItem(tempChatsKey(threadId));
};

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    prevChats,
    setPrevChats,
    setNewChat,
    setAllThreads,
    newChat,
    user,
    setUser,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);

  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Fetch current logged-in user and set in context (only once)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/user/loggedIn`,
          { credentials: "include" }
        );
        const data = await res.json();
        setUser(data?.user || null);
        // If anonymous, hydrate local threads into state so Sidebar shows them
        if (!data?.user) {
          setAllThreads(getTempThreads());

          setNewChat(true);
          setPrevChats([]);
          setCurrThreadId(null);
          setPrompt("");
          setReply(null);
          setUser(null);
        } else {
          // when logged in, fetch server threads
          clearGuestChats();

          const thr = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/thread`,
            {
              credentials: "include",
            }
          );
          const threads = await thr.json();
          setAllThreads(threads);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
        setAllThreads(getTempThreads());
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
        method: "GET",
        credentials: "include",
      });

      setUser(null);
      setAllThreads([]);
      setPrevChats([]);
      setCurrThreadId(null);
      setPrompt("");
      setReply(null);
      setNewChat(true);

      stopSpeaking();

      navigate("/", { state: { successMessage: "Logged out successfully!" } });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getReply = async () => {
    if (!prompt.trim()) return;
    setIsVoiceInput(false);
    stopSpeaking();
    // ensure threadId
    let threadId = currThreadId;
    if (!threadId || newChat) {
      threadId = uuidv1();
      setCurrThreadId(threadId);
      setNewChat(false);

      // add thread to UI list (temporarily). We'll persist either to DB or localStorage below
      setAllThreads((prev) => [
        { threadId, title: prompt.slice(0, 30) || "New Chat" },
        ...prev,
      ]);
    }

    setLoading(true);
    setNewChat(false);

    try {
      // ALWAYS call backend to generate the assistant's reply
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // keep cookies included; backend will check req.user
          body: JSON.stringify({
            message: prompt,
            threadId: threadId,
          }),
        }
      );

      if (!response.ok) {
        // backend might still return 401 for thread listing; but chat endpoint should be allowed
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      // data = { reply: "...", saved: true/false } from backend (see server change below)

      // push to chat window
      const newPrev = [
        ...prevChats,
        { role: "user", content: prompt },
        { role: "assistant", content: data.reply },
      ];
      setPrevChats(newPrev);
      setReply(data.reply);

      stopSpeaking();

      if (isVoiceInput) {
        speakText(data.reply);
      }

      // if saved on server (logged-in), refresh server thread list
      if (data.saved || user) {
        try {
          const threadsResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/thread`,
            { credentials: "include" }
          );
          if (threadsResponse.ok) {
            const updatedThreads = await threadsResponse.json();
            setAllThreads(updatedThreads);
          }
        } catch (err) {
          console.error("Failed to refresh threads from server:", err);
        }
      } else {
        // anonymous: persist only to localStorage
        saveTempChats(threadId, newPrev);

        // ensure temp threads list contains this thread with title
        const existing = getTempThreads();
        const alreadyExists = existing.find((t) => t.threadId === threadId);
        if (!alreadyExists) {
          const newTemp = [
            { threadId, title: prompt.slice(0, 30) || "New Chat" },
            ...existing,
          ];
          saveTempThreads(newTemp);
          setAllThreads(newTemp);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reply:", err);
    } finally {
      setPrompt("");
      setLoading(false);
    }
  };

  /* voice / speech helpers (unchanged) */
  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    stopSpeaking();

    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsVoiceInput(true);
        getReply();
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    }

    if (!listening) {
      recognitionRef.current.start();
      setListening(true);
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>
          MegAI <i className="fa-solid fa-angle-down"></i>
        </span>

        {user ? (
          <div className="userIconDiv" onClick={handleProfileClick}>
            <span className="userIcon">
              <i className="fa-solid fa-user"></i>
            </span>
          </div>
        ) : (
          <div className="authButtons">
            <Link to="/login" className="navbar-btn btn btn-light">
              Log in
            </Link>
            <Link
              to="/signup"
              className=" navbar-btn btn btn-outline-secondary"
            >
              Sign up for free
            </Link>
          </div>
        )}
      </div>

      {user && isOpen && (
        <div className="dropDown">
          <div className="dropDownItem">
            <i className="fa-solid fa-gear"></i> Settings
          </div>
          <div className="dropDownItem">
            <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
          </div>
          <div className="dropDownItem" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span className="link">Log out</span>
          </div>
        </div>
      )}

      <Chat />
      <ScaleLoader color="#fff" loading={loading}></ScaleLoader>

      <div className="chatInput">
        <div className="inputBox">
          <input
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? getReply() : "")}
          />

          <div id="mic" onClick={handleVoiceInput}>
            <i
              className={`fa-solid fa-microphone ${
                listening ? "listening" : ""
              }`}
              style={{ color: listening ? "red" : "inherit" }}
            ></i>
          </div>

          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p className="info">
          MegAI can make mistakes. Check important info.{" "}
          <a href="#" className="info-link">
            See Cookie Preferences
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
