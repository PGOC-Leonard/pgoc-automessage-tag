import React from "react";
import { IconButton, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu"; // Material Icon for sidebar toggle
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"; // Material Icon for back
import LogoutIcon from "@mui/icons-material/Logout"; // Material Icon for logout
import "./Header.css"; // Import the external CSS file
import Logo from "../../assets/PGOC_TOP_LEFT_ICON.png"; // Import the logo

const Header = ({ toggleSidebar, handleLogout, sidebarOpen }) => {
  return (
    <header className="header">
      {/* Left side: Sidebar toggle button and logo */}
      <div className="header-left">
        <IconButton onClick={toggleSidebar} className="menuButton">
          {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
        <img src={Logo} alt="Logo" className="header-logo" />
      </div>

      {/* Center: Dashboard title */}
      <span className="title">Philippian Group of Companies, Inc.</span>

      {/* Right side: Logout button */}
      <Button
        onClick={handleLogout}
        variant="contained"
        className="logout-btn"
        startIcon={<LogoutIcon />}
      >
        Logout
      </Button>
    </header>
  );
};

export default Header;
