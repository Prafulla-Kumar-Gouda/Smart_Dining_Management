import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { FaUtensils, FaChair, FaLock, FaInfoCircle } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

const Home = () => {
  const navigate = useNavigate();

  const getUserDetails = () => {
    const token = localStorage.getItem("token");
    if (!token) return { isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      return { isAdmin: decoded.isAdmin || false };
    } catch (error) {
      return { isAdmin: false };
    }
  };

  const { isAdmin } = getUserDetails();

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="nav-logo">
          <img src="/images/cu-logo.jpg" alt="Logo" className="logo" />
          <h2 className="nav-title">
            <br></br>Chanakya University
          </h2>
        </div>
      </nav>

      <div className="home-container">
        <div className="welcome-text">
          <h1>Smart Dining Management</h1>
          <p>Order food or reserve a table with just a few clicks</p>
        </div>

        <div className="action-cards">
          <div className="card" onClick={() => navigate("/food-ordering")}>
            <div className="card-icon">
              <FaUtensils />
            </div>
            <h3>Food Ordering</h3>
            <p>Browse menu and order food</p>
          </div>

          <div className="card" onClick={() => navigate("/table-reservation")}>
            <div className="card-icon">
              <FaChair />
            </div>
            <h3>Table Reservation</h3>
            <p>Reserve your table in advance</p>
          </div>

          <div className="card" onClick={() => navigate("/about-us")}>
            <div className="card-icon">
              <FaInfoCircle />
            </div>
            <h3>About Us</h3>
            <p>Know about our cafeteria and services</p>
          </div>

          {isAdmin && (
            <div className="card owner-card" onClick={() => navigate("/owner-dashboard")}>
              <div className="card-icon">
                <FaLock />
              </div>
              <h3>Dashboard Details</h3>
              <p>Admin dashboard access</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
