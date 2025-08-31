import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

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
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/thread`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Unauthorized or server error:", response.status);
        setAllThreads([]);
        return;
      }

      const res = await response.json();

      if (Array.isArray(res)) {
        const filteredData = res.map((thread) => ({
          threadId: thread.threadId,
          title: thread.title,
        }));
        setAllThreads(filteredData);
      } else {
        console.error("Unexpected response:", res);
        setAllThreads([]);
      }
    } catch (err) {
      console.error("Failed to fetch threads", err);
      setAllThreads([]);
    }
  };

   useEffect(() => {
    getAllThreads();
  }, []);

  useEffect(() => {
    if (user) {
      getAllThreads();
    } else {
      setAllThreads([]); 
    }
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
    } catch (err) {
      console.error("Failed to load thread", err);
      setPrevChats([]);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/thread/${threadId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const res = await response.json();
      console.log(res);

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
        <img
          src="src/assets/blacklogo.png"
          alt="gpt logo"
          className="logo"
        />
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
