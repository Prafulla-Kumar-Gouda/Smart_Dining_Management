import React from "react";
import { Link } from "react-router-dom";
import "./AboutUs.css";

const AboutUs = () => {
  return (
    <div className="about-us-wrapper">
      <nav className="navbar">
        <div className="nav-logo">
          <img src="/images/cu-logo.jpg" alt="Logo" className="logo" />
          <h2 className="nav-title">
            <br />
            Chanakya University
          </h2>
        </div>
      </nav>

      <div className="about-us-container">
        <Link to="/home" className="back-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Home
        </Link>

        <div className="about-us-content">
          <h1>About Us</h1>
          <p className="intro-text">
            Welcome to the Chanakya University Cafeteria, where we strive to provide a delightful dining experience for our students, faculty, and staff.
          </p>

          <section className="section">
            <h2>Cafeteria Facilities</h2>
            <p>
              Our cafeteria is designed to cater to a diverse community with a seating capacity of over 200 people. We maintain high standards of hygiene and offer a wide variety of cuisines, including vegetarian, non-vegetarian, and vegan options. Key features include:
            </p>
            <ul>
              <li>Spacious and comfortable seating arrangements</li>
              <li>Daily menu updates with fresh and seasonal ingredients</li>
              <li>Self-service counters for quick and efficient service</li>
              <li>Dedicated cleaning staff to ensure a spotless environment</li>
              <li>Special dietary accommodations upon request</li>
            </ul>
          </section>

          <section className="section">
            <h2>About the Website</h2>
            <p>
              The Smart Dining Management system is a user-friendly platform developed to enhance your dining experience at Chanakya University. It allows you to:
            </p>
            <ul>
              <li>Browse and order food from our digital menu</li>
              <li>Reserve tables in advance to avoid waiting</li>
              <li>Make secure payments online with real-time order tracking</li>
              <li>Provide feedback to help us improve our services</li>
            </ul>
            <p>
              Our goal is to make dining convenient, efficient, and enjoyable for everyone in the Chanakya community.
            </p>
          </section>

          <section className="section">
            <h2>Contact & Address</h2>
            <p>
              Location:
            </p>
            <p className="address">
              UG(Under Ground)floor,Admission Block,"A" wing
            </p>
            <p>
              For inquiries, contact us at: <a href="mailto:cafeteria@chanakyauniversity.edu.in">cafeteria@chanakyauniversity.edu.in</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
