import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import notify from "../components/Toast";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
} from "@mui/material";

const SignupPage = ({ onSwitchToLogin }) => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false); // Tracks email verification
  const [verificationStatus, setVerificationStatus] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false); // Tracks the email verification process
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const domain = window.location.host;

  const handleRequestVerification = async () => {
    if (!validateEmail(email)) {
      notify("Please enter a valid email address", "error");
      return;
    }

    setVerifying(true);
    setVerificationStatus("Requesting verification...");

    try {
      const response = await fetch(`${apiUrl}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, domain }),
      });

      const data = await response.json();
      if (response.ok) {
        setVerificationStatus("Verification code sent. Please check your email.");
        notify("Verification code sent!", "success");
      } else {
        setVerificationStatus(data.message || "Failed to send verification code.");
        notify(data.message || "Failed to send verification code.", "error");
      }
    } catch (error) {
      setVerificationStatus("An error occurred.");
      notify("An error occurred while requesting verification.", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setIsEmailVerified(false); // Reset verification status if code is empty
      setVerificationStatus("");
      return;
    }

    setVerifying(true);
    setVerificationStatus("Verifying code...");

    try {
      const response = await fetch(
        `${apiUrl}/verify-email/${verificationCode}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      if (response.ok) {
        setIsEmailVerified(true);
        setVerificationStatus("Email verified successfully!");
        notify("Email verified successfully!", "success");
      } else {
        setIsEmailVerified(false);
        setVerificationStatus(data.message || "Invalid verification code.");
        notify(data.message || "Invalid verification code.", "error");
      }
    } catch (error) {
      setIsEmailVerified(false);
      setVerificationStatus("An error occurred.");
      notify("An error occurred during verification.", "error");
    } finally {
      setVerifying(false);
    }
  };

  // useEffect to trigger code verification whenever verificationCode changes
  useEffect(() => {
    if (verificationCode) {
      handleVerifyCode();
    }
  }, [verificationCode]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!isEmailVerified) {
      notify("Please verify your email before registering.", "error");
      return;
    }

    if (!username || !email || !password || !confirmPassword || !gender) {
      setErrorMessage("All fields are required");
      notify("All fields are required", "error");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      notify("Passwords do not match", "error");
      return;
    }

    const signUpData = { username, email, password, gender, domain };

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signUpData),
      });

      const data = await response.json();

      if (response.ok) {
        notify(data.message || "Registration successful!", "success");
        setTimeout(() => onSwitchToLogin(), 3000);
      } else {
        setErrorMessage(data.message || "Registration failed");
        notify(data.message || "Registration failed", "error");
      }
    } catch (error) {
      setErrorMessage("An error occurred while registering");
      notify("An error occurred while registering", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <form onSubmit={handleSignUp}>
        <h1
          style={{
            fontSize: "25px",
            marginBottom: "10px",
            fontFamily: "Montserrat",
            fontWeight: "700",
            color: "black",
          }}
        >
          Create Account
        </h1>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <div className="verification-section">
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verification Code"
          />
          <button
            type="button"
            onClick={handleRequestVerification}
            disabled={verifying}
          >
            {verifying ? <CircularProgress size={16} /> : "Get Code"}
          </button>
        </div>
        <small>{verificationStatus}</small>

        <div className="pass-input-div">
          <input
            type={passwordVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <span
            onClick={() => setPasswordVisible(!passwordVisible)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              zIndex: 2,
              color: "#888",
            }}
          >
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="pass-input-div">
          <input
            type={confirmPasswordVisible ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
          <span
            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              zIndex: 2,
              color: "#888",
            }}
          >
            {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <FormControl component="fieldset" required>
          <FormLabel component="legend">Gender</FormLabel>
          <RadioGroup
            row
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <FormControlLabel
              value="male"
              control={<Radio />}
              label={<span style={{ fontSize: "12px" }}>Male</span>}
            />
            <FormControlLabel
              value="female"
              control={<Radio />}
              label={<span style={{ fontSize: "12px" }}>Female</span>}
            />
          </RadioGroup>
        </FormControl>

        <button type="submit" disabled={!isEmailVerified || loading}>
          {loading ? <CircularProgress size={24} /> : "Register"}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
