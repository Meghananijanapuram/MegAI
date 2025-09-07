// Sidebar.jsx
import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import blackLogo from "./assets/blacklogo.png";

const TEMP_THREADS_KEY = "megai_temp_threads";
const tempChatsKey = (threadId) => `megai_temp_chat_${threadId}`;

const getTempThreads = () =>
  JSON.parse(localStorage.getItem(TEMP_THREADS_KEY) || "[]");
const saveTempThreads = (threads) =>
  localStorage.setItem(TEMP_THREADS_KEY, JSON.stringify(threads));
const getTempChats = (threadId) =>
  JSON.parse(localStorage.getItem(tempChatsKey(threadId)) || "[]");
const deleteTempChat = (threadId) => {
  const threads = getTempThreads().filter((t) => t.threadId !== threadId);
  saveTempThreads(threads);
  localStorage.removeItem(tempChatsKey(threadId));
};

function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
    user,
  } = useContext(MyContext);

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const getAllThreads = async () => {
    try {
      if (user) {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/thread`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.error("Failed fetching threads:", response.status);
          setAllThreads([]);
          return;
        }

        const res = await response.json();
        setAllThreads(res);
      } else {
        // anonymous --> load from localStorage
        setAllThreads(getTempThreads());
      }
    } catch (err) {
      console.error("Failed to fetch threads", err);
      setAllThreads(user ? [] : getTempThreads());
    }
  };

  useEffect(() => {
    getAllThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // when auth state changes, refresh thread source
    getAllThreads();
    if (!user) {
      setPrevChats([]); // clear loaded chats (will load from localStorage when user clicks)
      setCurrThreadId(null);
    } else {
      // optionally clear temp prev chats (or you might want to migrate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    stopSpeaking();
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    stopSpeaking();
    try {
      if (user) {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/thread/${newThreadId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.error("Unauthorized or not found:", response.status);
          setPrevChats([]);
          return;
        }

        const res = await response.json();
        setPrevChats(res);
        setNewChat(false);
        setReply(null);
      } else {
        // anonymous -> load from localStorage
        const tmp = getTempChats(newThreadId);
        setPrevChats(tmp || []);
        setNewChat(false);
        setReply(null);
      }
    } catch (err) {
      console.error("Failed to load thread", err);
      setPrevChats([]);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      if (user) {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/thread/${threadId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.error("Failed to delete on server", response.status);
        } else {
          const res = await response.json();
          console.log(res);
        }
      } else {
        // anonymous -> delete localStorage
        deleteTempChat(threadId);
      }

      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId)
      );

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (err) {
      console.error("Failed to delete thread", err);
    }
  };

  return (
    <section className="sidebar">
      <button onClick={createNewChat}>
        <img src={blackLogo} alt="gpt logo" className="logo" />
        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      <ul className="history">
        {allThreads.length === 0 && <p>No previous chats yet!</p>}
        {allThreads?.map((thread) => (
          <li
            key={thread.threadId}
            onClick={() => changeThread(thread.threadId)}
            className={thread.threadId === currThreadId ? "highlighted" : ""}
          >
            {thread.title}
            <i
              className="fa-solid fa-trash"
              onClick={(e) => {
                e.stopPropagation();
                deleteThread(thread.threadId);
              }}
            ></i>
          </li>
        ))}
      </ul>

      <div className="sign">
        <p>By Meghana &hearts;</p>
      </div>
    </section>
  );
}

export default Sidebar;
