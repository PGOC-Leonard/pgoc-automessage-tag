// src/pages/NotFoundPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css'; // Import the CSS file

function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000); // 10000ms = 10 seconds

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for doesn't exist.</p>
      <p>Redirecting to the homepage in 10 seconds...</p>
      
      {/* Immediate redirect link */}
      <p>
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className="link" // Applying the CSS class
        >
          Click here to go back to the homepage immediately.
        </a>
      </p>
    </div>
  );
}

export default NotFoundPage;
