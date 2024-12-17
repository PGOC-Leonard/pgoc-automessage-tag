import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import notify from "../components/Toast"; // Import toast notification component

const SignupPage = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    // Regular expression for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required");
      notify("All fields are required", "error");
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      notify("Please enter a valid email address", "error");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      notify("Passwords do not match", "error");
      return;
    }

    // Prepare the sign-up data
    const signUpData = { username, email, password };

    try {
      const response = await fetch("http://192.168.0.19:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signUpData),
      });

      const data = await response.json();

      if (response.ok) {
        notify(data.message || "Registration successful! You can now log in.", "success");
        setTimeout(() => {
          onSwitchToLogin();
        }, 3000);
      } else {
        setErrorMessage(data.message || "Registration failed");
        notify(data.message || "Registration failed", "error");
      }
    } catch (error) {
      setErrorMessage("An error occurred while trying to register");
      notify("An error occurred while trying to register", "error");
      console.error("Sign up failed:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <div className="form-container sign-up-container">
      <form onSubmit={handleSignUp}>
        <h1 className="login-page-title" >Create Account</h1>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <input
          type="text"
          name="name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <div className="pass-input-div">
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <span className="password-toggle" onClick={togglePasswordVisibility}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div className="pass-input-div">
          <input
            type={confirmPasswordVisible ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
          <span
            className="password-toggle"
            onClick={toggleConfirmPasswordVisibility}
          >
            {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div style={{ height: "20px" }}></div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default SignupPage;
