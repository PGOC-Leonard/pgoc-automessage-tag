import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import notify from "../components/Toast"; // Import toast notification component
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress, // Import CircularProgress
} from "@mui/material"; // Import MUI components

const SignupPage = ({ onSwitchToLogin }) => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState(""); // New state for gender

  const [errorMessage, setErrorMessage] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regular expression for validating email
    return emailRegex.test(email);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!username || !email || !password || !confirmPassword || !gender) {
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
    const signUpData = { username, email, password, gender };
    setLoading(true); // Set loading to true before making the API request

    try {
      const response = await fetch(`${apiUrl}/register`, {
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
    } finally {
      setLoading(false); // Set loading to false after the API request completes
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
        <h1 className="login-page-title">Create Account</h1>
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
        <div style={{ height: "5px" }}></div>

        {/* Gender Selector using MUI Radio buttons */}
        <div className="gender-selector">
          <FormControl component="fieldset" required>
            <FormLabel component="legend">Gender</FormLabel>
            <RadioGroup
              row
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              aria-label="gender"
            >
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="female" control={<Radio />} label="Female" />
            </RadioGroup>
          </FormControl>
        </div>

        <div style={{ height: "20px" }}></div>
        
        <button type="submit" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Register"}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
