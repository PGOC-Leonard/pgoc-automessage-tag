import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import RouterComponent from './Router';  // Import your router component

function App() {
  return (
    <Router>
      <div className="App">
      <ToastContainer
      autoClose={1500}
      pauseOnFocusLoss={false}
      pauseOnHover={false}
       />
        <RouterComponent />  {/* Use the Router component here */}
      </div>
    </Router>
  );
}

export default App;
