import React, { useEffect, useState, useRef } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastClearedTimestamp, setLastClearedTimestamp] = useState(null);
  const [foodItem, setFoodItem] = useState({ name: "", price: "", image_url: "", description: "" });
  const navigate = useNavigate();

  const addFoodRef = useRef(null);
  const manageFoodRef = useRef(null);
  const reservationsRef = useRef(null);
  const ordersRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("No token found. Redirecting to login...");
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        console.log("Token expired. Redirecting to login...");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!decoded.isAdmin) {
        console.log("Not an admin. Redirecting to home...");
        navigate("/home");
        return;
      }
    } catch (error) {
      console.log("Invalid token. Redirecting to login...");
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const reservationsResponse = await axios.get("/all-reservations");
        setReservations(reservationsResponse.data);
        
        const ordersResponse = await axios.get("/all-orders");
        const foodItemsResponse = await axios.get("/food-items");
        setFoodItems(foodItemsResponse.data);

        const today = new Date().toLocaleDateString();
        const lastClearedDate = localStorage.getItem("lastClearedDate");
        const storedTimestamp = localStorage.getItem("lastClearedTimestamp");

        if (!storedTimestamp) {
          const initialTimestamp = new Date().toISOString();
          localStorage.setItem("lastClearedTimestamp", initialTimestamp);
          setLastClearedTimestamp(initialTimestamp);
        } else {
          setLastClearedTimestamp(storedTimestamp);
        }

        if (lastClearedDate !== today) {
          const newTimestamp = new Date().toISOString();
          setOrders([]);
          setLastClearedTimestamp(newTimestamp);
          localStorage.setItem("lastClearedDate", today);
          localStorage.setItem("lastClearedTimestamp", newTimestamp);
        } else {
          const filteredOrders = ordersResponse.data.filter(order => {
            const orderTime = new Date(order.created_at).toISOString();
            return storedTimestamp ? orderTime > storedTimestamp : true;
          });
          setOrders(filteredOrders);
        }
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const unreserveTable = async (tableNumber) => {
    try {
      const response = await axios.post("/unreserve", { table_number: tableNumber });
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      
      Toast.fire({
        icon: 'success',
        title: response.data.message
      });
      
      setReservations(reservations.filter((res) => res.table_number !== tableNumber));
    } catch (error) {
      console.error("Error unreserving table:", error.response?.data || error.message);
      
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response?.data.message || "Failed to unreserve table",
      });
    }
  };

  const clearOrders = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will clear all current orders from the dashboard (data remains in the database).",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clear it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const newTimestamp = new Date().toISOString();
        setOrders([]);
        setLastClearedTimestamp(newTimestamp);
        localStorage.setItem("lastClearedTimestamp", newTimestamp);
        Swal.fire(
          'Cleared!',
          'All orders have been cleared from the dashboard.',
          'success'
        );
      }
    });
  };

  const resetOrders = async () => {
    Swal.fire({
      title: 'Restore Orders?',
      text: "This will reload all orders from the database, including old ones.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore them!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const ordersResponse = await axios.get("/all-orders");
          setOrders(ordersResponse.data);
          const initialTimestamp = new Date(0).toISOString();
          setLastClearedTimestamp(initialTimestamp);
          localStorage.setItem("lastClearedTimestamp", initialTimestamp);
          Swal.fire(
            'Restored!',
            'All orders have been reloaded from the database.',
            'success'
          );
        } catch (error) {
          console.error("Error restoring orders:", error);
          Swal.fire(
            'Error!',
            'Failed to restore orders.',
            'error'
          );
        }
      }
    });
  };

  const handleFoodItemChange = (e) => {
    const { name, value } = e.target;
    setFoodItem((prev) => ({ ...prev, [name]: value }));
  };

  const addFoodItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...foodItem,
        price: parseFloat(foodItem.price)
      };
      const response = await axios.post("/add-food-item", payload);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message,
      });
      setFoodItem({ name: "", price: "", image_url: "", description: "" });
      const foodItemsResponse = await axios.get("/food-items");
      setFoodItems(foodItemsResponse.data);
    } catch (error) {
      console.error("Error adding food item:", error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data.message || "Failed to add food item",
      });
    }
  };

  const removeFoodItem = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the food item permanently!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post("/remove-food-item", { id });
          Swal.fire({
            icon: "success",
            title: "Success",
            text: response.data.message,
          });
          setFoodItems(foodItems.filter(item => item.id !== id));
        } catch (error) {
          console.error("Error removing food item:", error.response?.data || error.message);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data.message || "Failed to remove food item",
          });
        }
      }
    });
  };

  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  const StatusBadge = ({ status }) => {
    let badgeClass = "badge ";
    switch (status.toLowerCase()) {
      case "pending":
        badgeClass += "badge-pending";
        break;
      case "success":
        badgeClass += "badge-completed";
        break;
      default:
        badgeClass += "badge-processing";
    }
    return <span className={badgeClass}>{status}</span>;
  };

  const EmptyState = ({ type }) => (
    <motion.div 
      className="empty-state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-icon">
        {type === "reservations" ? "📅" : type === "orders" ? "🍽️" : "🍔"}
      </div>
      <p className="empty-text">
        {type === "reservations" ? "No reservations found. Tables are available!" : 
         type === "orders" ? "No orders have been placed yet today." : 
         "No food items added yet."}
      </p>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", color: "#ffcc00", marginBottom: "16px" }}>
              Loading...
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #ffcc00",
                margin: "0 auto",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="dashboard-header">
        <motion.button
          className="owner-back-button"
          onClick={() => navigate("/home")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <h1 className="dashboard-title">Restaurant Dashboard</h1>
      </div>

      <div className="navbar">
        <button className="navbar-button" onClick={() => scrollToSection(addFoodRef)}>Add Food Item</button>
        <button className="navbar-button" onClick={() => scrollToSection(manageFoodRef)}>Manage Food Items</button>
        <button className="navbar-button" onClick={() => scrollToSection(reservationsRef)}>Table Reservations</button>
        <button className="navbar-button" onClick={() => scrollToSection(ordersRef)}>Food Orders</button>
      </div>

      {/* add food section */}
      <motion.div 
        className="dashboard-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={addFoodRef}
      >
        <div className="section-header">
          <h2 className="section-title">Add Food Item</h2>
        </div>
        <motion.div className="data-card" variants={itemVariants}>
          <form onSubmit={addFoodItem} className="add-food-form">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={foodItem.name}
                onChange={handleFoodItemChange}
                required
                placeholder="Enter food item name"
              />
            </div>
            <div className="form-group">
              <label>Price (₹):</label>
              <input
                type="number"
                name="price"
                value={foodItem.price}
                onChange={handleFoodItemChange}
                min="1"
                step="0.01"
                required
                placeholder="Enter price"
              />
            </div>
            <div className="form-group">
              <label>Image URL:</label>
              <input
                type="text"
                name="image_url"
                value={foodItem.image_url}
                onChange={handleFoodItemChange}
                required
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="form-group">
              <label>Description (Optional):</label>
              <input
                type="text"
                name="description"
                value={foodItem.description}
                onChange={handleFoodItemChange}
                placeholder="Enter description"
              />
            </div>
            <motion.button
              type="submit"
              className="add-food-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Food Item
            </motion.button>
          </form>
        </motion.div>
      </motion.div>

      {/* manage food section */}
      <motion.div 
        className="dashboard-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={manageFoodRef}
      >
        <div className="section-header">
          <h2 className="section-title">Manage Food Items</h2>
        </div>
        <AnimatePresence>
          {foodItems.length === 0 ? (
            <EmptyState type="foodItems" />
          ) : (
            <motion.div className="data-card" variants={itemVariants}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Price (₹)</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {foodItems.map((item, index) => (
                        <motion.tr key={index} variants={itemVariants} exit={{ opacity: 0, height: 0 }}>
                          <td><strong>#{item.id}</strong></td>
                          <td>{item.name}</td>
                          <td>{item.price}</td>
                          <td>{item.description || "N/A"}</td>
                          <td>
                            <motion.button
                              className="remove-button"
                              onClick={() => removeFoodItem(item.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Remove
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* table reservations section */}
      <motion.div 
        className="dashboard-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={reservationsRef}
      >
        <div className="section-header">
          <h2 className="section-title">Table Reservations</h2>
        </div>
        <AnimatePresence>
          {reservations.length === 0 ? (
            <EmptyState type="reservations" />
          ) : (
            <motion.div className="data-card" variants={itemVariants}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Table Number</th>
                      <th>Guest Name</th>
                      <th>Phone Number</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {reservations.map((res, index) => (
                        <motion.tr key={index} variants={itemVariants} exit={{ opacity: 0, height: 0 }}>
                          <td><strong>#{res.table_number}</strong></td>
                          <td>{res.user_name}</td>
                          <td>{res.phone_number}</td>
                          <td>
                            <motion.button
                              className="unreserve-button"
                              onClick={() => unreserveTable(res.table_number)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Unreserve Table
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* food orders section */}
      <motion.div 
        className="dashboard-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={ordersRef}
      >
        <div className="section-header">
          <h2 className="section-title">Food Orders</h2>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <motion.button
            className="clear-orders-button"
            onClick={clearOrders}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear Orders
          </motion.button>
          <motion.button
            className="reset-orders-button"
            onClick={resetOrders}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Restore Orders
          </motion.button>
        </div>
        <AnimatePresence>
          {orders.length === 0 ? (
            <EmptyState type="orders" />
          ) : (
            <motion.div className="data-card" variants={itemVariants}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Items</th>
                      <th>Amount</th>
                      {/*<th>Phone Number</th>*/}
                      <th>Time of Order</th>
                      <th>Login ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {orders.map((order, index) => (
                        <motion.tr key={index} variants={itemVariants}>
                          <td><strong>{order.order_id}</strong></td>
                          <td>
                            <ul className="items-list">
                              {order.items.map((item, i) => (
                                <li key={i} className="item-entry">
                                  <span>{item.name}</span>
                                  <span>×{item.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>₹{order.amount}</td>
                          {/*<td>{order.phone_number}</td>*/}
                          <td>{new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                          <td>{order.email}</td>
                          <td>
                            <StatusBadge status={order.status} />
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default OwnerDashboard;