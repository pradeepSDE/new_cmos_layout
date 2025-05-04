import React from "react";
import "./Navbar.css";
import { useUser } from "../context/UserContext";

const Navbar = ({ fileName }) => {
  const { user } = useUser();
  return (
    <nav className="navbar">
      <div className="navbar-file">
        <strong>File:</strong> {fileName || "Untitled Layout"}
      </div>
      <div className="navbar-user">
        <strong>User:</strong> {user ? user.name : "Guest"}
        {user && <span className="navbar-email">({user.email})</span>}
      </div>
    </nav>
  );
};

export default Navbar;
