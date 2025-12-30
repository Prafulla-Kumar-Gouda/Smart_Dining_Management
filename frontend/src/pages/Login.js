import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./Login.css"; 
import { FiMail, FiLock, FiUser, FiKey, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (error || resetMessage) {
      const timer = setTimeout(() => {
        setError("");
        setResetMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, resetMessage]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await api.post("/login", { email, password });
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        console.log("Login successful, token stored:", response.data.token);
        setTimeout(() => {
          setIsLoading(false);
          navigate("/home");
        }, 1000);
      } else {
        setIsLoading(false);
        setError(response.data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error.response?.data || error.message);
      setError("Invalid email or password. Please check your credentials.");
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage("");
    setError("");

    try {
      const response = await api.post("/request-password-reset", { email: resetEmail });
      setResetMessage(response.data.message);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Reset request failed:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to send reset email.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="modern-login-container">
      <div className="login-content">
        <motion.div 
          className="login-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="brand-container">
            <motion.div 
              className="brand-icon"
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <FiUser />
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Chanakya Cafetaria
            </motion.h1>
          </div>
          <motion.p 
            className="brand-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Delicious food, delightful experience
          </motion.p>
        </motion.div>

        <div className="login-form-container">
          <AnimatePresence mode="wait">
            {!showResetForm ? (
              <motion.form
                key="login-form"
                className="modern-form"
                onSubmit={handleLogin}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome Back
                </motion.h2>
                
                <motion.div 
                  className="modern-input-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <span className="input-icon"><FiMail /></span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="input-highlight"></div>
                </motion.div>

                <motion.div 
                  className="modern-input-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <span className="input-icon"><FiLock /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="input-highlight"></div>
                  <span className="password-toggle" onClick={togglePasswordVisibility}>
                    {showPassword ? "Hide" : "Show"}
                  </span>
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="modern-error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiAlertCircle className="message-icon" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  className="modern-button login-button"
                  type="submit"
                  disabled={isLoading}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", marginRight: "8px" }}
                    >
                      ⟳
                    </motion.div>
                  ) : null}
                  {isLoading ? "Logging in..." : "Log In"}
                </motion.button>
                
                <motion.div
                  className="form-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <a className="modern-link" onClick={() => navigate("/signup")}>
                    <FiUser /> Create Account
                  </a>
                  <a
                    className="modern-link"
                    onClick={() => setShowResetForm(true)}
                  >
                    <FiKey /> Forgot Password?
                  </a>
                </motion.div>
              </motion.form>
            ) : (
              <motion.form
                key="reset-form"
                className="modern-form"
                onSubmit={handleRequestReset}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Reset Password
                </motion.h2>
                
                <motion.div 
                  className="modern-input-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <span className="input-icon"><FiMail /></span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <div className="input-highlight"></div>
                </motion.div>

                <AnimatePresence>
                  {(error || resetMessage) && (
                    <motion.div
                      className={error ? "modern-error-message" : "modern-success-message"}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {error ? (
                        <FiAlertCircle className="message-icon" />
                      ) : (
                        <FiCheckCircle className="message-icon" />
                      )}
                      <span>{error || resetMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  className="modern-button reset-button"
                  type="submit"
                  disabled={isLoading}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", marginRight: "8px" }}
                    >
                      ⟳
                    </motion.div>
                  ) : null}
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </motion.button>
                
                <motion.div
                  className="form-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <a className="modern-link back-link" onClick={() => setShowResetForm(false)}>
                    ← Back to Login
                  </a>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="decoration-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
    </div>
  );
};

export default Login;