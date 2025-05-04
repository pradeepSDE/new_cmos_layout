import React from "react";
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
import LayoutList from "./components/LayoutList";
import HomeLayoutEditor from "./components/HomeLayoutEditor";
import axios from 'axios'
axios.defaults.withCredentials = true;
const App = () => {
  // TODO: Add authentication state management
  const isAuthenticated = true; // This should come from your auth state

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <HomeLayoutEditor />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/layouts" element={<LayoutList />} />
        <Route path="/layouts/new" element={<LayoutEditor />} />
        <Route path="/layouts/:id" element={<LayoutEditor />} />
      </Routes>
    </Router>
  );
};

export default App;
