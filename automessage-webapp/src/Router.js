import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'; // Import the ProtectedRoute component

import MainPage from './pages/mainscreen/MainPage';
import AutoMessagePage from './pages/ui/AutoMessage';
import AutoTagPage from './pages/ui/AutoTag';
import LandingPage from './pages/registration/LandingPage';
import NotFoundPage from './NotFound';
// Import the layout component

function Router() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} /> {/* Login route */}
      
      <Route path="/main" element={<ProtectedRoute element={<MainPage />} />}>
        <Route index element={<ProtectedRoute element={<AutoMessagePage />} />} /> {/* Default route for the main dashboard */}
        <Route path="automessage" element={<ProtectedRoute element={<AutoMessagePage />} />} />
        <Route path="autotag" element={<ProtectedRoute element={<AutoTagPage />} />} />
      </Route>
      {/* Catch-all route for undefined paths */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default Router;
