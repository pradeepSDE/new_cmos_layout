import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { useUser } from "../../context/UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // TODO: Implement actual login logic here
      console.log("Login attempt with:", { email, password });
      setUser({ name: email.split("@")[0], email }); // Set user context with placeholder
      navigate("/layouts"); // Redirect to layouts page after successful login
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  const handleGoogleSignup = () => {
    console.log("Google signup attempt");
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="google-button-container">
          <button
            type="button"
            onClick={() => {
              window.location.href = "http://localhost:5000/auth/google";
            }}
            className="auth-button-google"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
              className="google-logo"
            />
            Sign in with Google
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">
            Login
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
