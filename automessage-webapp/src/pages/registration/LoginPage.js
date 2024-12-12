import React, { useState , useEffect } from "react";
import Logo from "../../assets/PGOC_TOP_LEFT_ICON.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css'; 
import { isTokenExpired } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';
import notify from '../components/Toast'


const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState(''); // Changed to accept either username or email
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); 
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate(); // State for password visibility


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      // If token is valid, redirect to /main
      navigate('/main');
    }
  }, [navigate]);


  const handleOnSubmit = (evt) => {
    handleLogin();
  };


  const handleLogin = async (e) => {
    e.preventDefault();

    // Perform simple validation (optional)
    if (!usernameOrEmail || !password) {
      setErrorMessage('Please enter both username/email and password');
      return;
    }

    // Prepare login data (either username or email with password)
    const loginData = { username: usernameOrEmail, password };

    try {
      // Make the POST request to your API (replace with your actual backend URL)
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token in localStorage
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
        <input
          type="email"
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
        <a href="#">Forgot your password?</a>
        <button onClick={handleLogin}>Log In</button>
      </form>
    </div>
  );
}

export default LoginPage;
