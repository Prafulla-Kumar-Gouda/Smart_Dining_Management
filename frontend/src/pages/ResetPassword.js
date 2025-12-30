import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api";
import "./Login.css";
import { FiMail, FiLock, FiCheckCircle, FiAlertCircle, FiKey, FiUser, FiArrowLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    const urlEmail = params.get("email");
    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
    } else {
      setMessage("Invalid or missing reset link.");
    }
  }, [location]);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post("/reset-password", {
        email,
        token,
        new_password: newPassword,
      });
      setMessage(response.data.message || "Password reset successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!token) {
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
          </motion.div>

          <div className="login-form-container">
            <motion.div 
              className="modern-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Invalid Reset Link
              </motion.h2>
              
              <div className="modern-error-message">
                <FiAlertCircle className="message-icon" />
                <span>The password reset link is invalid or has expired.</span>
              </div>
              
              <motion.div
                className="form-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <a className="modern-link back-link" onClick={() => navigate("/")}>
                  <FiArrowLeft /> Return to Login
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        <div className="decoration-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
      </div>
    );
  }

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
              <FiKey />
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
            Reset your password
          </motion.p>
        </motion.div>

        <div className="login-form-container">
          <motion.form
            className="modern-form"
            onSubmit={handleReset}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Create New Password
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                disabled={!!token}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
              />
              <div className="input-highlight"></div>
              <span className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? "Hide" : "Show"}
              </span>
            </motion.div>
            
            <motion.div 
              className="modern-input-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <span className="input-icon"><FiLock /></span>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
              <div className="input-highlight"></div>
            </motion.div>

            <AnimatePresence>
              {message && (
                <motion.div
                  className={message.includes("successfully") ? "modern-success-message" : "modern-error-message"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.includes("successfully") ? (
                    <FiCheckCircle className="message-icon" />
                  ) : (
                    <FiAlertCircle className="message-icon" />
                  )}
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              className="modern-button reset-button"
              type="submit"
              disabled={isLoading || !token}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, delay: 0.6 }}
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
              {isLoading ? "Updating..." : "Reset Password"}
            </motion.button>
            
            <motion.div
              className="form-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <a className="modern-link back-link" onClick={() => navigate("/")}>
                <FiArrowLeft /> Back to Login
              </a>
            </motion.div>
          </motion.form>
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

export default ResetPassword;