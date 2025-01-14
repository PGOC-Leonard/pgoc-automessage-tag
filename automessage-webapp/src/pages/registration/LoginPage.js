import React, { useState, useEffect } from "react";
import Logo from "../../assets/PGOC_TOP_LEFT_ICON.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css'; 
import { isTokenExpired } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';
import notify from '../components/Toast';
import { CircularProgress } from '@mui/material'; // Import CircularProgress

const LoginPage = () => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [usernameOrEmail, setUsernameOrEmail] = useState(''); // Changed to accept either username or email
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate(); // State for password visibility

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      // If token is valid, redirect to /main
      navigate('/main');
    }
  }, [navigate]);

  const handleOnSubmit = (evt) => {
    evt.preventDefault(); // Prevent default form submission behavior
    handleLogin();
  };

  const handleLogin = async () => {
    // Validate input fields
    if (!usernameOrEmail || !password) {
      setErrorMessage('Please enter both username/email and password');
      return;
    }

    // Extract domain from current URL
    const domain = window.location.hostname;


    // Prepare login data (username/email, password, and domain)
    const loginData = { 
      username: usernameOrEmail, 
      password, 
      domain 
    };

    setLoading(true); // Set loading to true before making the API request

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token in localStorage
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('redis_key', data.redis_key);  // Store the token
        localStorage.setItem('isAuthenticated', 'true'); // Store isAuthenticated flag
        
        // Show success message in toast
        notify(data.message || 'Login successful! Redirecting to main screen.', 'success');

        // Initialize lastActivityTime
        localStorage.setItem("lastActivityTime", Date.now());
        
        // Delay the navigation to MainScreen to allow the toast to show
        setTimeout(() => {
          navigate('/main');  // Navigate to the '/main' route after the toast message is displayed
        }, 3000);  // 3 seconds delay
      } else {
        // If authentication failed, show the error message from the backend
        setErrorMessage(data.message || 'Invalid credentials');
        notify(data.message || 'Invalid credentials', 'error');
      }
    } catch (error) {
      // Handle network or API request errors
      setErrorMessage('An error occurred while trying to log in');
      notify('An error occurred while trying to log in', 'error');
      console.error('Login failed:', error);
    } finally {
      setLoading(false); // Set loading to false after the API request completes
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="form-container sign-in-container">
      <form onSubmit={handleOnSubmit}>
        <div className="login-logo">
          <img src={Logo} alt="Logo" />
        </div>
        <h1 className="login-page-title">Log in</h1>
        {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Display error message */}

        <input
          type="text"
          placeholder="Username / Email"
          name="email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
        />
        <div className="pass-input-div">
          <input
            type={passwordVisible ? "text" : "password"} // Toggle input type
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Add eye icon to toggle visibility */}
          <span className="password-toggle" onClick={togglePasswordVisibility}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <a href="#/forgot-password">Forgot your password?</a>
        
        {/* Button that becomes disabled and shows a loading spinner while waiting for response */}
        <button type="submit" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Log In"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
