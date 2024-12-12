import React, { useState } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import "./Login.modules.css";  // Ensure this CSS is properly imported

export default function LandingPage() {
  const [type, setType] = useState("signIn"); // State to toggle between "signIn" and "signUp"

  // Toggle the active state based on button click
  const handleOnClick = (text) => {
    if (text !== type) {
      setType(text); // Update the state to toggle components
    }
  };

  // Dynamically set the container class based on the state
  const containerClass =
    "container " + (type === "signUp" ? "right-panel-active" : "");

  return (
    <div className="landing-page">
      <div className={containerClass} id="container">
        {/* LoginPage or SignupPage rendering based on the state */}
        {type === "signIn" && <LoginPage />}
        {type === "signUp" && <SignupPage onSwitchToLogin={() => setType("signIn")} />}
        
        <div className="overlay-container">
          <div className="overlay">
            {/* Left Panel (for SignIn) */}
            <div className="overlay-panel overlay-left">
              <h1 classname="h1">Welcome Philippians</h1>
              <p>To use the AutoMessage App, Login with your credentials</p>
              <button
                className="ghost"
                id="signIn"
                onClick={() => handleOnClick("signIn")}
              >
                Log In
              </button>
            </div>

            {/* Right Panel (for SignUp) */}
            <div className="overlay-panel overlay-right">
              <h1>Hello, Philippians!</h1>
              <p>Enter your Account details to start using our AutoMessage App</p>
              <button
                className="ghost"
                id="signUp"
                onClick={() => handleOnClick("signUp")}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
