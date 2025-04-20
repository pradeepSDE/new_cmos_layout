import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LayoutEditor from "./components/LayoutEditor";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import "./App.css";
import Layout from "./components/Layout/Layout";

const App = () => {
  // TODO: Add authentication state management
  const isAuthenticated = true; // This should come from your auth state

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
};

export default App;
