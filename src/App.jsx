import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LayoutEditor from "./components/LayoutEditor";
import Login from "./components/Login";
import Signup from "./components/Signup";
import "./App.css";

const App = () => {
  // TODO: Add authentication state management
  const isAuthenticated = false; // This should come from your auth state

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <LayoutEditor />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
