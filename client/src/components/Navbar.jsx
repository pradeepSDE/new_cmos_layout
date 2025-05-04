import React, { useState } from "react";
import "./Navbar.css";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const Navbar = ({ fileName }) => {
  const { user, setUser } = useUser();
  console.log(user)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.get("http://localhost:5000/auth/logout", {
      withCredentials: true,
    });
    setUser(null);
    navigate("/login");
  };

  // Use user.photo if available, otherwise generate a placeholder avatar
  const avatarUrl =
    user && user.avatar
      ? user.avatar
      : user && user.name
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name
        )}&background=1976d2&color=fff&size=64`
      : `https://ui-avatars.com/api/?name=G&background=1976d2&color=fff&size=64`;
      console.log(avatarUrl)
  return (
    <nav className="navbar">
      {fileName && (
        <div className="navbar-file">
          <strong>File:</strong> {fileName || "Untitled Layout"}
        </div>
      )}
      <div className="navbar-user-dropdown">
        <div
          className="navbar-user-trigger"
          onClick={() => setDropdownOpen((open) => !open)}
          tabIndex={0}
        >
          <img src={avatarUrl} alt="User Avatar" className="navbar-avatar" />
        </div>
        {dropdownOpen && user && (
          <div className="navbar-dropdown-menu">
            <div className="navbar-dropdown-item">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="navbar-dropdown-item">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="navbar-dropdown-divider" />
            <button className="navbar-dropdown-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
