import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";
import { FiMail, FiLock, FiCheckCircle, FiAlertCircle, FiLogIn, FiUser } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const Signup = () => {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/signup", userData);
      setMessage("Signup successful. Please login.");
      setIsLoading(false);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setIsLoading(false);
      console.error("Signup error:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Signup failed. Please try again.");
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
          <motion.form
            className="modern-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Create Your Account
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
                name="email"
                value={userData.email}
                onChange={handleChange}
                placeholder="Email"
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
                name="password"
                value={userData.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <div className="input-highlight"></div>
              <span className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? "Hide" : "Show"}
              </span>
            </motion.div>

            <AnimatePresence>
              {message && (
                <motion.div
                  className={message.includes("successful") ? "modern-success-message" : "modern-error-message"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.includes("successful") ? (
                    <FiCheckCircle className="message-icon" />
                  ) : (
                    <FiAlertCircle className="message-icon" />
                  )}
                  <span>{message}</span>
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
              {isLoading ? "Creating Account..." : "Sign Up"}
            </motion.button>
            
            <motion.div
              className="form-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <a className="modern-link back-link" onClick={() => navigate("/")}>
                <FiLogIn /> Already have an account? Login
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

export default Signup;