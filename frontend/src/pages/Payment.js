import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../api";
import "./Payment.css";

const Payment = () => {
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      const cartItems = JSON.parse(storedCart);
      setCart(cartItems);
      setTotalAmount(cartItems.reduce((total, item) => total + item.price * item.quantity, 0));
    }

    // Check for order_id in URL and verify payment status
    const orderId = new URLSearchParams(location.search).get("order_id");
    if (orderId) {
      verifyPaymentStatus(orderId);
    }
  }, [location]);

  const verifyPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(`/verify-payment/${orderId}`);
      console.log("DEBUG: Verify payment response:", response.data);
      if (response.data.success && response.data.is_paid) {
        // Clear cart after successful payment
        localStorage.removeItem("cart");
        navigate(`/feedback?order_id=${orderId}`);
      } else if (!response.data.success) {
        setError(response.data.message || "Unable to verify payment status.");
      } else {
        setError("Payment not yet confirmed. Please wait a moment.");
      }
    } catch (err) {
      console.error("DEBUG: Error verifying payment status:", err);
      setError("Error verifying payment. Please try again.");
    }
  };

  const handlePayment = async () => {
    setError("");
    setIsProcessing(true);

    if (totalAmount <= 0) {
      setError("Cart is empty or total amount is invalid");
      setIsProcessing(false);
      return;
    }

    const paymentData = {
      amount: totalAmount,
      phone_number: "9876543210",
      items: cart,
    };

    console.log("DEBUG: Sending payment data:", paymentData);

    try {
      const response = await axios.post("/create-payment", paymentData);
      console.log("DEBUG: Payment response:", response.data);

      if (response.data.success && response.data.payment_session_id) {
        const cashfree = new window.Cashfree({
          mode: "sandbox",
        });

        const paymentOptions = {
          paymentSessionId: response.data.payment_session_id,
          returnUrl: `https://smart-dining-management.onrender.com/api/payment-redirect/${response.data.order_id}`,
          redirectTarget: "_self",
        };

        cashfree
          .checkout(paymentOptions)
          .then(() => {
            console.log("DEBUG: Payment initiated successfully");
            // Poll payment status as a fallback
            const orderId = response.data.order_id;
            const pollStatus = setInterval(async () => {
              try {
                const verifyResponse = await axios.get(`/verify-payment/${orderId}`);
                console.log("DEBUG: Polling verify payment:", verifyResponse.data);
                if (verifyResponse.data.success && verifyResponse.data.is_paid) {
                  clearInterval(pollStatus);
                  localStorage.removeItem("cart");
                  navigate(`/feedback?order_id=${orderId}`);
                }
              } catch (err) {
                console.error("DEBUG: Poll error:", err);
              }
            }, 3000); // Poll every 3 seconds
            setTimeout(() => clearInterval(pollStatus), 60000); // Stop polling after 60 seconds

            // Immediate check as a fallback
            setTimeout(() => verifyPaymentStatus(orderId), 5000);
          })
          .catch((err) => {
            console.error("DEBUG: Payment initiation failed:", err);
            setError("Failed to initiate payment. Please try again.");
            setIsProcessing(false);
          });
      } else {
        setError(response.data.message || "Payment failed! Try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("DEBUG: Payment error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Payment error. Please try again later.");
      setIsProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="payment-container">
      <Link to="/food-ordering" className="back-button">
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
        Back to Menu
      </Link>

      <div className="payment-header">
        <h2 className="payment-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <path d="M5 10h14" />
          </svg>
          Order Summary
        </h2>
        <p className="payment-subtitle">Review your items before payment</p>
      </div>

      <div className="bill-card">
        <div className="bill-header">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3h18v18H3z" />
            <path d="m16 10-4 4-4-4" />
          </svg>
          Order Details
        </div>
        <div className="bill-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <ul className="items-list">
                {cart.map((item, index) => (
                  <li key={item.id} className="item" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="item-details">
                      <span className="item-name">
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                    <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="divider"></div>
              <div className="total-section">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
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
            style={{ marginRight: "8px", verticalAlign: "middle" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {cart.length > 0 && (
        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="loading">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              Processing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              Proceed to Pay
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default Payment;
