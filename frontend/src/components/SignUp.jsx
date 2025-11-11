import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const SignUp = () => {
  const navigate = useNavigate();
  const [Email, setEmail] = useState("");
  const [Pass, setPass] = useState("");
  const [Hospital, setHospital] = useState("");
  const [Role, setRole] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Pass.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/signup/", {
        email: Email,
        password: Pass,
        hospital: Hospital,
        role: Role,
      });

      toast.success(response.data.message || "Signup successful!");
      setTimeout(() => navigate("/login"), 1000);

      // Reset form fields
      // setEmail("");
      // setPass("");
      // setHospital("");
      // setRole("");
    } catch (err) {
      if (err.response && err.response.data.email) {
        toast.error(err.response.data.email[0]);
      } else if (err.response && err.response.data.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="auth-container">
      {/* Left Image */}
      <div className="auth-left">
        <img src="/signup.png" alt="Signup visual" />
      </div>

      {/* Right Form Section */}
      <div className="auth-right">
        <div className="signup-box">
          <h1>Sign Up</h1>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={Email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              value={Pass}
              placeholder="Password"
              onChange={(e) => setPass(e.target.value)}
              required
            />
            <input
              type="text"
              value={Hospital}
              placeholder="Hospital / Clinic / Medical Establishment Name"
              onChange={(e) => setHospital(e.target.value)}
              required
            />
            <select
              className="role-select"
              value={Role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              <option value="client">Client</option>
              <option value="central">Central Auth</option>
            </select>

            <button type="submit" className="signup-btn">
              Sign Up
            </button>
          </form>

          <p className="signup-text">
            Already have an Account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
