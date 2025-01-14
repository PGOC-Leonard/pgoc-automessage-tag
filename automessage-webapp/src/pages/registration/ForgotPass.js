import React, { useState } from "react";
import Logo from "../../assets/PGOC_TOP_LEFT_ICON.png";
import notify from "../components/Toast";
import { CircularProgress } from "@mui/material";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      notify("Please enter your email", "error");
      return;
    }

    // Extract domain from the current window location
    const domain = window.location.host;

    setLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch(`${apiUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, domain }), // Include domain in request body
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Password reset instructions have been sent to your email.");
        notify(data.message || "Password reset instructions sent!", "success");
      } else {
        notify(data.message || "Failed to send password reset instructions", "error");
      }
    } catch (error) {
      console.error("Forgot password failed:", error);
      notify("An error occurred while trying to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md relative">
        <div className="text-center mb-4">
          <img src={Logo} alt="Logo" className="mx-auto w-20 h-20" />
          <h1 className="text-2xl font-bold text-red-600 mt-4">Forgot Password</h1>
          <p className="text-gray-700 mt-2">
            Enter the email address associated with your account to request a password reset link.
          </p>
        </div>
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 w-full">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-[120px] bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400"
          >
            {loading ? <CircularProgress size={24} className="text-white" /> : "Submit"}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/" className="text-blue-600 hover:underline">
            Or go back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
