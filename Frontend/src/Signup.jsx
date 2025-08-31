import "./Signup.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Signup Data:", formData);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/user/signup`,
        options
      );

      const res = await response.json();
      console.log("Server Response:", res);

      if (response.ok) {
        navigate("/", { state: { successMessage: "Account created successfully!" } });
      } else {
        toast.error(res.message || "Something went wrong!");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <form
        className="signup-form p-4 rounded needs-validation"
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 className="text-center mb-4">Sign Up</h2>

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
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <div className="form-text">
            We'll never share your email with anyone else.
          </div>
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
          Sign Up
        </button>

        <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
