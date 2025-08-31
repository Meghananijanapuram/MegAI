import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

export default function HomeWrapper({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);

      // Clear state so toast shows only once
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <>
      {children}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
