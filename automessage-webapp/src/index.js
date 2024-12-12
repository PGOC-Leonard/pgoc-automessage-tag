import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Ensure the document has fully loaded before rendering React
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement); // Create root for React 18
  root.render(
  
      <App />
  
  );
}
