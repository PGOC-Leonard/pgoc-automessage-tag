import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom"; // Correct import
import {jwtDecode} from "jwt-decode"; // Ensure the correct import for jwt-decode
import Sidebar from "../components/Sidebar.js";
import Header from "../components/Header.js";
import './Layout.css'; 

const MainPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    
  const navigate = useNavigate(); // Initialize navigate function

  useEffect(() => {

    document.body.style.background = 'white';  // Ensure background is white
    document.body.style.margin = '0'; 
    document.body.style.justifyContent = 'start'
    document.body.style.alignItems = 'start' // Reset body margin to ensure full layout
    // Check token expiration on component mount
    ///checkTokenExpiration();
    ///checkInactivity();

    // Set up event listeners for user activity (mouse move, key press)
    const activityEvents = ["mousemove", "keydown", "scroll"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, updateActivityTime)
    );

    // Optionally, you could set an interval to check every few seconds
    //const inactivityInterval = setInterval(checkInactivity, 10000); // Check inactivity every 10 seconds
    //const interval = setInterval(checkTokenExpiration, 10000); // Check every 10 seconds for token expiration

    // Cleanup on component unmount
    return () => {
      document.body.style.background = '';
      document.body.style.margin = '';
      document.body.style.justifyContent = ''
      document.body.style.alignItems = ''
      //clearInterval(interval);
      //clearInterval(inactivityInterval);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, updateActivityTime)
      );
    };
  }, []); // Empty dependency array to run the effect only on mount/unmount

  // Logout and clear session
  const handleLogout = () => {
    // Clear token and authentication status from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.clear();
    // Redirect to login page
    navigate("/"); // Navigate to the login page
  };

  // Check for token expiration
  const checkTokenExpiration = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, logging out...");
      handleLogout();
      return;
    }

    try {
      // Decode the token to get the expiration time
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Get current time in seconds

      console.log("Decoded token:", decodedToken);
      console.log("Current time:", currentTime);

      // Check if the token is expired
      if (decodedToken.exp < currentTime) {
        console.log("Token expired, logging out...");
        handleLogout();
      }
    } catch (error) {
      console.log("Error decoding token:", error);
      handleLogout();
    }
  };

  // Check for inactivity (5 minutes)
  const checkInactivity = () => {
    const lastActivityTime = localStorage.getItem("lastActivityTime");
    const currentTime = Date.now();

    // If 5 minutes (300,000ms) have passed since the last activity, log the user out
    if (lastActivityTime && currentTime - lastActivityTime >= 5 * 60 * 1000) {
      alert("You have been logged out due to inactivity for 5 minutes.");
      console.log("User is AFK for 5 minutes, logging out...");
      handleLogout();
    }
  };

  // Update the last activity time whenever there's user activity
  const updateActivityTime = () => {
    localStorage.setItem("lastActivityTime", Date.now());
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} /> {/* Pass sidebarOpen state to Sidebar */}

      {/* Main content area */}
      <div className={`mainContent ${sidebarOpen ? 'sidebarOpen' : 'sidebarClosed'}`}>
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} handleLogout={handleLogout} sidebarOpen={sidebarOpen} />
        
        {/* Content area (dynamic based on route) */}
        <div className="contentArea">
          <Outlet />  {/* This will render the current route's component */}
        </div>
      </div>
    </div>
  );
};
export default MainPage;
