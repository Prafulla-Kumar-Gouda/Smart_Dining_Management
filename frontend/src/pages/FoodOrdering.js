import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api";  
import "./FoodOrdering.css";
import { ShoppingCart, ChevronLeft, Plus, Minus, X } from "lucide-react";

const FoodOrdering = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [foodItems, setFoodItems] = useState([]);  

  const getCartFromStorage = () => {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : [];
  };

  useEffect(() => {
    
    const fetchFoodItems = async () => {
      try {
        const response = await axios.get("/food-items");
        setFoodItems(response.data);
      } catch (error) {
        console.error("Error fetching food items:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };
    fetchFoodItems();

    
    const initialCart = getCartFromStorage();
    setCart(initialCart);

    const orderId = searchParams.get("order_id");
    if (orderId) {
      console.log("Payment successful for order:", orderId);
      localStorage.removeItem("cart");
      setCart([]);
      setIsCartOpen(false);
      setSearchParams({}, { replace: true });
    }
  }, [navigate, searchParams, setSearchParams]);

  useEffect(() => {
    
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const decreaseQuantity = (item) => {
    const updatedCart = cart.map((cartItem) =>
      cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
    ).filter((cartItem) => cartItem.quantity > 0);
    setCart(updatedCart);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="food-ordering-container">
      <div className="food-header">
        <button className="food-back-button" onClick={() => navigate("/home")}>
          <span>Back</span>
        </button>
        <h1 className="food-title">Food Menu</h1>
        <button 
          className="cart-toggle-button" 
          onClick={() => setIsCartOpen(!isCartOpen)}
        >
          <ShoppingCart size={20} />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>

      <div className="food-grid">
        {foodItems.length === 0 ? (
          <p>No food items available yet.</p>
        ) : (
          foodItems.map((item) => (
            <div key={item.id} className="food-item">
              <div className="food-item-image-container">
                <img src={item.image} alt={item.name} className="food-image" />
                <div className="food-quick-add" onClick={() => addToCart(item)}>
                  <Plus size={20} />
                </div>
              </div>
              <div className="food-item-details">
                <h3>{item.name}</h3>
                <p className="food-description">{item.description}</p>
                <div className="food-item-footer">
                  <div className="price-container">
                    <span className="food-price">₹{item.price}</span>
                  </div>
                  <button className="add-to-cart" onClick={() => addToCart(item)}>
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart <ShoppingCart size={20} /></h2>
          <button className="close-cart" onClick={() => setIsCartOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-image" />
                  <div className="cart-details">
                    <div className="cart-item-header">
                      <h3>{item.name}</h3>
                      <button className="remove-item" onClick={() => removeFromCart(item.id)}>
                        <X size={14} />
                      </button>
                    </div>
                    <p className="item-price">₹{item.price}</p>
                    <div className="quantity-controls">
                      <button className="quantity-btn decrease" onClick={() => decreaseQuantity(item)}>
                        <Minus size={14} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button className="quantity-btn increase" onClick={() => addToCart(item)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="item-total">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="subtotal">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="total-amount">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
              <button className="checkout-button" onClick={() => navigate("/payment")}>
                Proceed to Checkout
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingCart size={64} />
            </div>
            <h3>Your cart is empty</h3>
            <p>Add some delicious items from the menu</p>
            <button className="browse-menu-btn" onClick={() => setIsCartOpen(false)}>
              Browse Menu
            </button>
          </div>
        )}
      </div>

      <div 
        className={`cart-overlay ${isCartOpen ? 'show' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>
    </div>
  );
};

export default FoodOrdering;