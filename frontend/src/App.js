import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import FoodOrdering from "./pages/FoodOrdering";
import TableReservation from "./pages/TableReservation";
import OwnerDashboard from "./pages/OwnerDashboard";
import Payment from "./pages/Payment";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import AboutUs from "./pages/AboutUs";
import Feedback from "./pages/Feedback";
import { jwtDecode } from "jwt-decode";  

const getUserDetails = () => {
  const token = localStorage.getItem("token");
  if (!token) return { isAuthenticated: false, isAdmin: false };

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    return {
      isAuthenticated: !isExpired,
      isAdmin: decoded.isAdmin || false
    };
  } catch (error) {
    return { isAuthenticated: false, isAdmin: false };
  }
};

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = getUserDetails();
  if (!isAuthenticated) return <Navigate to="/" />;
  if (adminOnly && !isAdmin) return <Navigate to="/home" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/food-ordering"
          element={
            <PrivateRoute>
              <FoodOrdering />
            </PrivateRoute>
          }
        />
        <Route
          path="/table-reservation"
          element={
            <PrivateRoute>
              <TableReservation />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <PrivateRoute>
              <Payment />
            </PrivateRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <PrivateRoute>
              <Feedback />
            </PrivateRoute>
          }
        />
        <Route
          path="/about-us"
          element={
            <PrivateRoute>
              <AboutUs />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner-dashboard"
          element={
            <PrivateRoute adminOnly={true}>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
