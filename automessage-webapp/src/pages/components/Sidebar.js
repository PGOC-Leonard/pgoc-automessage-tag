import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Import the CSS for the sidebar
import { FaRegEnvelope, FaTag } from 'react-icons/fa'; // Import icons for AutoMessage and AutoTag

const Sidebar = ({ sidebarOpen }) => {
  return (
    <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <ul>
        <li className="sidebar-item">
          <Link to="/main" className="sidebarLink">
            <FaRegEnvelope className="sidebar-icon" /> {/* Icon for AutoMessage */}
            {sidebarOpen && <span className="sidebar-text">Auto Message</span>}
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/main/autotag" className="sidebarLink">
            <FaTag className="sidebar-icon" /> {/* Icon for AutoTag */}
            {sidebarOpen && <span className="sidebar-text">Auto Tag</span>}
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
