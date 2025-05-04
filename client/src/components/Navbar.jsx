import React, { useState } from "react";
import "./Navbar.css";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Navbar = ({ fileName }) => {
  const { user, setUser } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.get("http://localhost:5000/auth/logout", {
      withCredentials: true,
    });
    setUser(null);
    navigate("/login");
  };

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
          <strong>User:</strong> {user ? user.name : "Guest"}
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
