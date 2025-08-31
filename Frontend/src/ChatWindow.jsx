import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "./MyContext.jsx";
import Chat from "./Chat.jsx";
import { ScaleLoader } from "react-spinners";
import "./ChatWindow.css";
import { v1 as uuidv1 } from "uuid";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    setPrevChats,
    setNewChat,
    setAllThreads,
    newChat,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [listening, setListening] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);

  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/user/loggedIn`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
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

    let threadId = currThreadId;
    if (!threadId || newChat) {
      threadId = uuidv1();
      setCurrThreadId(threadId);
      setNewChat(false);

      setAllThreads((prev) => [
        { threadId, title: prompt.slice(0, 30) || "New Chat" },
        ...prev,
      ]);
    }

    setLoading(true);
    setNewChat(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message: prompt,
            threadId: threadId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      setPrevChats((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: data.reply },
      ]);
      setReply(data.reply);

      stopSpeaking();

      if (isVoiceInput) {
        speakText(data.reply);
      }

      const threadsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/thread`,
        { credentials: "include" }
      );
      const updatedThreads = await threadsResponse.json();
      setAllThreads(updatedThreads);
    } catch (err) {
      console.error("Failed to fetch reply:", err);
    } finally {
      setPrompt("");
      setLoading(false);
    }
  };

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
