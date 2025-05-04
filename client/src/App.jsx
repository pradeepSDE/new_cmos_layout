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
import axios from "axios";
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
axios.defaults.withCredentials = true;
const App = () => {
  // TODO: Add authentication state management
  const isAuthenticated = true; // This should come from your auth state

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/layouts" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/layouts"
            element={
              <ProtectedRoute>
                <LayoutList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/layouts/new"
            element={
              <ProtectedRoute>
                <LayoutEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/layouts/:id"
            element={
              <ProtectedRoute>
                <LayoutEditor />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
