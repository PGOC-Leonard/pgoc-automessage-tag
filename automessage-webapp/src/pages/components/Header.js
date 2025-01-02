import React, { useState, useEffect } from "react";
import {
  IconButton,
  Avatar,
  Menu,
  Typography,
  Button,
  CircularProgress,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import Cropper from "react-easy-crop";
import "./Header.css";
import Logo from "../../assets/PGOC_TOP_LEFT_ICON.png";

const Header = ({ toggleSidebar, handleLogout, sidebarOpen }) => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [anchorEl, setAnchorEl] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const userId = localStorage.getItem("user_id");
  const isMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setUserData(data.user_data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAvatarClick = () => {
    document.getElementById("avatar-file-input").click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setCropDialogOpen(true);
    }
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImage = async () => {
    const canvas = document.createElement("canvas");
    const image = await createImageFromFile(imageFile);
    const ctx = canvas.getContext("2d");

    const { width, height } = croppedAreaPixels;
    canvas.width = 800;
    canvas.height = 800;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      width,
      height,
      0,
      0,
      800,
      800
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleSaveAvatar = async () => {
    try {
      const croppedImageFile = await getCroppedImage();
  
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("profile_image", croppedImageFile);
  
      const response = await fetch(`${apiUrl}/change-profile`, {
        method: "PUT",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to update profile image");
      }
  
      await fetchUserData();
    } catch (error) {
      console.error("Error saving profile image:", error);
    } finally {
      setCropDialogOpen(false);
    }
  };
  

  const createImageFromFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  return (
    <header className="header">
      <div className="header-left">
        <IconButton onClick={toggleSidebar} className="menuButton">
          {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
        <img src={Logo} alt="Logo" className="header-logo" />
      </div>

      <span className="title">Philippian Group of Companies, Inc.</span>

      <IconButton onClick={handleAvatarClick} className="avatar-btn">
        <Avatar
          src={userData?.profile_image ? `data:image/jpeg;base64,${userData.profile_image}` : ""}
          alt="User Avatar"
        >
          {userData ? userData.username?.[0]?.toUpperCase() : ""}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <div style={{ padding: "16px", textAlign: "center", width: "250px" }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Avatar
              src={userData?.profile_image ? `data:image/jpeg;base64,${userData.profile_image}` : ""}
              alt="Profile Avatar"
              sx={{ width: 80, height: 80, marginBottom: "16px" }}
            />
            <IconButton
              onClick={handleEditAvatarClick}
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "white",
                boxShadow: 1,
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <input
              type="file"
              id="avatar-file-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </Box>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Typography variant="body1">{userData?.username || "Unknown User"}</Typography>
              <Typography variant="body2">{userData?.email || "No email available"}</Typography>
            </>
          )}
          <Button
            onClick={() => {
              handleMenuClose();
              handleLogout();
            }}
            variant="contained"
            startIcon={<LogoutIcon />}
            style={{ backgroundColor: "#a70000", marginTop: 16 }}
          >
            Logout
          </Button>
        </div>
      </Menu>

      <Dialog open={cropDialogOpen} onClose={() => setCropDialogOpen(false)}>
        <DialogContent style={{ position: "relative", height: "400px", width: "400px" }}>
          {imageFile && (
            <Cropper
              image={URL.createObjectURL(imageFile)}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAvatar} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  );
};

export default Header;
