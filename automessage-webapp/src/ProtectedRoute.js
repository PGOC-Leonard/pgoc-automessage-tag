import React from 'react';
import { Navigate } from 'react-router-dom';

// ProtectedRoute component to check if the user is authenticated
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" />;
  }

  // Render the protected element if authenticated
  return element;
};

export default ProtectedRoute;
