import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const LogIn = () => {
  const navigate = useNavigate();
  const [Email, setEmail] = useState("");
  const [Pass, setPass] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/login/", {
        email: Email,
        password: Pass
      });

      toast.success(response.data.message || "Login successful!");

      localStorage.setItem("user", JSON.stringify(response.data));
      setTimeout(() => {
        if (response.data.role === "central") {
          navigate("/dashboard");
        } else if (response.data.role === "client") {
          navigate("/dashboardClient");
        } else {
          navigate("/dashboard"); // fallback
        }
      }, 2000);

    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong!";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      {/* Toast Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={2000} 
        theme="colored" 
        style={{ zIndex: 999999, top: 70 }}
      />

      <div className="auth-left">
        <img src="/login.png" alt="" />
      </div>
      <div className="auth-right">
        <div className="login-box">
          <h1>Log In</h1>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPass(e.target.value)}
              required
            />
            <button type="submit" className="login-btn">
              Log in
            </button>

            <div className="divider">or</div>

            {/* <button type="button" className="google-btn">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
              />
              Log in with Google
            </button> */}
          </form>

          <p className="login-text">
            Don’t have an Account? <Link to="/signup">Sign up</Link>
          </p>

          <div className="social-icons">
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-twitter"></i>
            <i className="fab fa-linkedin-in"></i>
            <i className="fab fa-instagram"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
