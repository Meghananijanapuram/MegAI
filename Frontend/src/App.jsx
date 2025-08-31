import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect } from "react";
import { v1 as uuidv1 } from "uuid";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(null);
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [user, setUser] = useState(null); 

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);


  const providerValues = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    prevChats,
    setPrevChats,
    newChat,
    setNewChat,
    allThreads,
    setAllThreads,
    user,
    setUser,
  };

  return (
    <MyContext.Provider value={providerValues}>
      <ToastContainer position="top-right" autoClose={2000} />
      <Routes>
        <Route
          path="/"
          element={
            <div className="app">
              <Sidebar />
              <ChatWindow />
            </div>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </MyContext.Provider>
  );
}

export default App;
