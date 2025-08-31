import "./Signup.css"; // or Login.css
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // no ToastContainer here

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/user/login`,
        options
      );
      const res = await response.json();

      if (response.ok) {
        navigate("/", { state: { successMessage: "Logged in successfully!" } });
      } else {
        toast.error(res.message || "Login failed. Try again.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <form
        className="signup-form p-4 rounded needs-validation"
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 className="text-center mb-4">Login</h2>

        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-custom w-100">
          Login
        </button>

        <p className="mt-3 text-center">
          Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
