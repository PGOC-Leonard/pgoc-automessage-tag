import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'; // Import the ProtectedRoute component

import MainPage from './pages/mainscreen/MainPage';
import AutoMessagePage from './pages/ui/AutoMessage';
import AutoTagPage from './pages/ui/AutoTag';
import LandingPage from './pages/registration/LandingPage';
// Import the layout component

function Router() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} /> {/* Login route */}
      
      <Route path="/main" element={<MainPage />}>
        <Route index element={<AutoMessagePage />} /> {/* Default route for the main dashboard */}
        <Route path="automessage" element={<AutoMessagePage />} />
        <Route path="autotag" element={<AutoTagPage />} />
      </Route>
    </Routes>
  );
}

export default Router;
