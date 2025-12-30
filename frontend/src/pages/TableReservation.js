import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./TableReservation.css";
import { jwtDecode } from "jwt-decode";

const TableReservation = () => {
  const [tables, setTables] = useState({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      fetchTables(token);
    } catch (error) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  const fetchTables = (token) => {
    setLoading(true);
    api.get("/tables", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        setTables(response.data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setMessage("Failed to fetch tables. Please try again.");
        }
      });
  };

  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const sendOtp = (tableNumber) => {
    if (!name.trim()) {
      setMessage("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      setMessage("Please enter your phone number");
      return;
    }
    if (!validatePhone(phone)) {
      setMessage("Please enter a valid 10-digit phone number");
      return;
    }
    
    setLoading(true);
    setSelectedTable(tableNumber);
    
    api.post("/send-otp", { phone_number: phone })
      .then(() => {
        setMessage("OTP sent successfully to your mobile number!");
        setIsOtpSent(true);
        setLoading(false);
      })
      .catch(() => {
        setMessage("Failed to send OTP. Please try again.");
        setLoading(false);
      });
  };

  const verifyOtpAndReserve = () => {
    if (!otp.trim()) {
      setMessage("Please enter the OTP");
      return;
    }
    
    setLoading(true);
    
    api.post("/verify-otp", { phone_number: phone, otp })
      .then(response => {
        if (response.data.success) {
          setIsOtpVerified(true);
          setMessage("OTP verified successfully!");
          reserveTable(selectedTable);
        } else {
          setMessage("Invalid OTP. Please try again.");
          setLoading(false);
        }
      })
      .catch(() => {
        setMessage("Failed to verify OTP. Please try again.");
        setLoading(false);
      });
  };

  const reserveTable = (tableNumber) => {
    api.post("/reserve", { table_number: tableNumber, user_name: name, phone_number: phone })
      .then(response => {
        setMessage(response.data.message || "Table reserved successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch(() => {
        setMessage("Failed to reserve table. Please try again.");
        setLoading(false);
      });
  };

  // Render loading state
  if (loading && Object.keys(tables).length === 0) {
    return (
      <div className="reservation-container">
        <button className="back-button" onClick={() => navigate("/home")}>
          <span>←</span> Back
        </button>
        <h2>Table Reservation</h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          Loading tables...
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-container">
      <button className="table-back-button" onClick={() => navigate("/home")}>
        Back
      </button>
      <h2>Table Reservation</h2>

      <div className="user-info">
        <div className="input-card">
          <div className="input-inner">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={isOtpSent}
            />
            <label>Full Name</label>
          </div>
        </div>
        <div className="input-card">
          <div className="input-inner">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              disabled={isOtpSent}
            />
            <label>Phone Number</label>
          </div>
        </div>
      </div>

      {isOtpSent && !isOtpVerified && (
        <div className="otp-container">
          <div className="otp-title">Enter the verification code sent to your phone</div>
          <div className="otp-card">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          <div className="otp-btn-container">
            <button className="otp-btn verify-btn" onClick={verifyOtpAndReserve} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button className="otp-btn resend-btn" onClick={() => sendOtp(selectedTable)} disabled={loading}>
              Resend OTP
            </button>
          </div>
        </div>
      )}

      <div className="tables-section">
        <h3 className="section-title">Select a Table</h3>
        <div className="table-grid">
          {[1, 2, 3, 4, 5, 6].map((table) => (
            <button
              key={table}
              className={`table-button ${tables[table] === "Reserved" ? "reserved" : "available"}`}
              onClick={() => tables[table] !== "Reserved" && !isOtpSent && sendOtp(table)}
              disabled={tables[table] === "Reserved" || isOtpSent || loading}
            >
              <div className="table-icon">🍽️</div>
              <div className="table-number">{table}</div>
              <div className="table-status">
                {tables[table] === "Reserved" ? "Reserved" : "Available"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default TableReservation;