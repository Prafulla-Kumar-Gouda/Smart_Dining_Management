from flask import Blueprint, request, jsonify, redirect
from config import Config
from pymongo import MongoClient
from twilio.rest import Client
import bcrypt
import requests
import jwt
import random
from datetime import datetime, timedelta
from functools import wraps
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(Config.MONGO_URI)
db = client["smart_dining"]
users_collection = db["users"]
reservations_collection = db["reservations"]
orders_collection = db["orders"]
food_items_collection = db["food_items"]
password_reset_tokens_collection = db["password_reset_tokens"]
feedback_collection = db["feedback"]

twilio_client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
SECRET_KEY = Config.SECRET_KEY
CASHFREE_APP_ID = Config.CASHFREE_APP_ID
CASHFREE_SECRET_KEY = Config.CASHFREE_SECRET_KEY
CASHFREE_URL = "https://sandbox.cashfree.com/pg/orders"

payment_bp = Blueprint("payment", __name__)
routes_bp = Blueprint("routes", __name__)
CORS(routes_bp, resources={r"/*": {"origins": ["https://cusmartdining.netlify.app"]}})
CORS(payment_bp, resources={r"/*": {"origins": ["https://cusmartdining.netlify.app"]}})
otp_storage = {}

ADMIN_EMAIL = ["yogesh123@gmail.com", "nikhil123@gmail.com", "yogeshkumar20369@gmail.com", "yogeshk.bca22@chanakyauniversity.edu.in","ygowdru4549@gmail.com"]

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        print(f"DEBUG: Received Authorization header: {token}")
        if not token:
            return jsonify({"success": False, "message": "Token is missing"}), 401
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        print(f"DEBUG: Extracted token: {token}")
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            print(f"DEBUG: Decoded token: {decoded}")
            request.user = decoded
        except jwt.ExpiredSignatureError:
            print("DEBUG: Token expired")
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            print("DEBUG: Invalid token")
            return jsonify({"success": False, "message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not request.user.get("isAdmin", False):
            return jsonify({"success": False, "message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

@routes_bp.route("/submit-feedback", methods=["POST"])
@token_required
def submit_feedback():
    try:
        data = request.json
        order_id = data.get("order_id")
        rating = data.get("rating")
        feedback = data.get("feedback", "")

        print(f"DEBUG: Feedback submission data: {data}")

        if not order_id or not rating:
            return jsonify({"success": False, "message": "Order ID and rating are required"}), 400

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return jsonify({"success": False, "message": "Rating must be between 1 and 5"}), 400
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "Rating must be a valid number"}), 400

        order = orders_collection.find_one({"order_id": order_id, "email": request.user["email"]})
        if not order:
            return jsonify({"success": False, "message": "Order not found or unauthorized"}), 404

        if order.get("status") != "PAID":
            return jsonify({"success": False, "message": "Order payment not confirmed"}), 400

        existing_feedback = feedback_collection.find_one({"order_id": order_id})
        if existing_feedback:
            return jsonify({"success": False, "message": "Feedback already submitted for this order"}), 400

        feedback_doc = {
            "order_id": order_id,
            "rating": rating,
            "feedback": feedback,
            "user_email": request.user["email"],
            "created_at": datetime.utcnow().isoformat(),
        }
        result = feedback_collection.insert_one(feedback_doc)
        print(f"DEBUG: Feedback submitted: {feedback_doc}, Inserted ID: {result.inserted_id}")

        return jsonify({
            "success": True,
            "message": "Feedback submitted successfully",
            "redirect_url": "https://cusmartdining.netlify.app/food-ordering"
        }), 201
    except Exception as e:
        print(f"DEBUG: Error in submit-feedback API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/verify-payment/<order_id>", methods=["GET"])
@token_required
def verify_payment(order_id):
    try:
        order = orders_collection.find_one({"order_id": order_id, "email": request.user["email"]})
        if not order:
            return jsonify({"success": False, "message": "Order not found or unauthorized"}), 404

        print(f"DEBUG: Order status for {order_id}: {order.get('status')}")
        return jsonify({
            "success": True,
            "order_id": order_id,
            "status": order.get("status"),
            "is_paid": order.get("status") == "PAID"
        }), 200
    except Exception as e:
        print(f"DEBUG: Error in verify-payment API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/payment-redirect/<order_id>", methods=["GET"])
def payment_redirect(order_id):
    try:
        order = orders_collection.find_one({"order_id": order_id})
        if not order:
            print(f"DEBUG: Order {order_id} not found for redirect")
            return redirect("https://cusmartdining.netlify.app/food-ordering")

        # If order status is not PAID, check Cashfree directly
        if order.get("status") != "PAID":
            headers = {
                "Content-Type": "application/json",
                "x-api-version": "2023-08-01",
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY
            }
            response = requests.get(f"{CASHFREE_URL}/{order_id}", headers=headers)
            print(f"DEBUG: Cashfree status check for {order_id}: {response.status_code}, {response.text}")
            
            if response.status_code == 200:
                payment_info = response.json()
                payment_status = payment_info.get("order_status", "PENDING").upper()
                orders_collection.update_one(
                    {"order_id": order_id},
                    {"$set": {"status": payment_status}}
                )
                print(f"DEBUG: Updated order {order_id} status to {payment_status} after Cashfree check")

        # Recheck order status after potential update
        order = orders_collection.find_one({"order_id": order_id})
        if order.get("status") == "PAID":
            print(f"DEBUG: Redirecting to feedback for order {order_id}")
            return redirect(f"https://cusmartdining.netlify.app/feedback?order_id={order_id}")
        else:
            print(f"DEBUG: Order {order_id} not paid (status: {order.get('status')}), redirecting to food-ordering")
            return redirect("https://cusmartdining.netlify.app/food-ordering")
    except Exception as e:
        print(f"DEBUG: Error in payment-redirect API: {str(e)}")
        return redirect("https://cusmartdining.netlify.app/food-ordering")

@routes_bp.route("/request-password-reset", methods=["POST"])
def request_password_reset():
    try:
        data = request.json
        email = data.get("email")

        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        print(f"DEBUG: SENDER_EMAIL={sender_email}, SENDER_PASSWORD={sender_password}")

        if not email:
            return jsonify({"success": False, "message": "Email is required"}), 400

        if not sender_email or not sender_password:
            return jsonify({"success": False, "message": "Email service not configured"}), 500

        token = jwt.encode(
            {
                "email": email,
                "exp": datetime.utcnow() + timedelta(minutes=15)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        password_reset_tokens_collection.insert_one({
            "email": email,
            "token": token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=15)
        })

        reset_url = f"https://cusmartdining.netlify.app/reset-password?token={token}&email={email}"

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = email
        msg["Subject"] = "Password Reset Verification"
        body = f"""
        Hello,

        You requested a password reset for your Chanakya Cafetaria account.
        Please click the link below to verify your email and reset your password:
        {reset_url}

        This link will expire in 15 minutes.

        If you didn’t request this, please ignore this email.

        Best,
        Chanakya Cafetaria Team
        """
        msg.attach(MIMEText(body, "plain"))

        try:
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, msg.as_string())
            server.quit()
            print(f"DEBUG: Password reset email sent to {email}")
        except Exception as e:
            print(f"DEBUG: Error sending email: {str(e)}")
            return jsonify({"success": False, "message": "Failed to send verification email"}), 500

        return jsonify({"success": True, "message": "Verification email sent. Please check your inbox."}), 200
    except Exception as e:
        print(f"DEBUG: Error in request-password-reset API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.json
        email = data.get("email")
        token = data.get("token")
        new_password = data.get("new_password")

        if not all([email, token, new_password]):
            return jsonify({"success": False, "message": "Email, token, and new password are required"}), 400

        stored_token = password_reset_tokens_collection.find_one({"email": email, "token": token})
        if not stored_token:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 400

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if decoded["email"] != email:
                return jsonify({"success": False, "message": "Invalid token"}), 400
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token has expired"}), 400
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
        users_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})

        password_reset_tokens_collection.delete_one({"email": email, "token": token})

        return jsonify({"success": True, "message": "Password reset successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error in reset-password API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/add-food-item", methods=["POST"])
@admin_required
def add_food_item():
    try:
        data = request.json
        name = data.get("name")
        price = data.get("price")
        image_url = data.get("image_url")
        description = data.get("description", "")

        print(f"DEBUG: Received data: {data}")

        try:
            price = float(price)
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "Price must be a valid number"}), 400

        if not name or price <= 0 or not image_url:
            return jsonify({"success": False, "message": "Name, valid price, and image URL are required"}), 400

        existing_ids = [item.get("id") for item in food_items_collection.find({}, {"id": 1})]
        new_id = max(existing_ids or [0]) + 1

        food_item = {
            "id": new_id,
            "name": name,
            "price": price,
            "image": image_url,
            "description": description,
            "created_at": datetime.utcnow().isoformat()
        }
        food_items_collection.insert_one(food_item)
        print(f"DEBUG: Food item added: {food_item}")

        return jsonify({"success": True, "message": f"Food item '{name}' added successfully"}), 201
    except Exception as e:
        print(f"DEBUG: Error in add-food-item API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/remove-food-item", methods=["POST"])
@admin_required
def remove_food_item():
    try:
        data = request.json
        food_id = data.get("id")

        print(f"DEBUG: Received data for removal: {data}")

        if not food_id or not isinstance(food_id, int):
            return jsonify({"success": False, "message": "Valid food item ID is required"}), 400

        result = food_items_collection.delete_one({"id": food_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Food item not found"}), 404

        print(f"DEBUG: Food item with ID {food_id} removed")
        return jsonify({"success": True, "message": f"Food item with ID {food_id} removed successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error in remove-food-item API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/food-items", methods=["GET"])
@token_required
def get_food_items():
    try:
        food_items = list(food_items_collection.find({}, {"_id": 0}))
        return jsonify(food_items)
    except Exception as e:
        print(f"DEBUG: Error in get-food-items API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"success": False, "message": "Email not authorized for signup"}), 403
        if user.get("password"):
            return jsonify({"success": False, "message": "User already registered"}), 409

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        users_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})
        
        return jsonify({"success": True, "message": "User signed up successfully"}), 201
    except Exception as e:
        print(f"DEBUG: Error in signup API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        if "password" not in user or not user["password"]:
            return jsonify({"success": False, "message": "User has not set a password"}), 403

        if bcrypt.checkpw(password.encode("utf-8"), user["password"]):
            token = jwt.encode(
                {
                    "email": email,
                    "isAdmin": email in ADMIN_EMAIL,
                    "exp": datetime.utcnow() + timedelta(hours=1)
                },
                SECRET_KEY,
                algorithm="HS256"
            )
            return jsonify({"success": True, "token": token})
        else:
            return jsonify({"success": False, "message": "Incorrect password"}), 401
    except Exception as e:
        print(f"DEBUG: Error in login API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/tables", methods=["GET"])
@token_required
def get_tables():
    try:
        tables = {str(i): "Available" for i in range(1, 7)}
        reserved_tables = reservations_collection.find({}, {"_id": 0, "table_number": 1})
        
        for entry in reserved_tables:
            tables[str(entry["table_number"])] = "Reserved"

        return jsonify(tables)
    except Exception as e:
        print(f"DEBUG: Error in get-tables API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/reserve", methods=["POST"])
@token_required
def reserve_table():
    try:
        data = request.json
        table_number = str(data.get("table_number"))
        user_name = data.get("user_name")
        phone_number = data.get("phone_number")

        if not (phone_number and phone_number.isdigit() and len(phone_number) == 10):
            return jsonify({"message": "Phone number must be 10 digits long"}), 400

        existing_reservation = reservations_collection.find_one({"table_number": int(table_number)})
        if existing_reservation:
            return jsonify({"message": "Table already reserved"}), 400

        reservations_collection.insert_one({
            "table_number": int(table_number),
            "user_name": user_name,
            "phone_number": phone_number
        })
        return jsonify({"message": f"Table {table_number} reserved successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error in reserve-table API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/all-reservations", methods=["GET"])
@token_required
def get_all_reservations():
    try:
        reservations = list(reservations_collection.find({}, {"_id": 0}))
        return jsonify(reservations)
    except Exception as e:
        print(f"DEBUG: Error in get-all-reservations API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/all-orders", methods=["GET"])
@token_required
def get_all_orders():
    try:
        orders = list(orders_collection.find({}, {"_id": 0}))
        return jsonify(orders)
    except Exception as e:
        print(f"DEBUG: Error in get-all-orders API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/unreserve", methods=["POST"])
@token_required
def unreserve_table():
    try:
        data = request.json
        table_number = str(data.get("table_number"))

        existing_reservation = reservations_collection.find_one({"table_number": int(table_number)})
        if not existing_reservation:
            return jsonify({"message": "Table is not reserved"}), 400

        reservations_collection.delete_one({"table_number": int(table_number)})
        return jsonify({"message": f"Table {table_number} is now available"}), 200
    except Exception as e:
        print(f"DEBUG: Error in unreserve-table API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/send-otp", methods=["POST"])
def send_otp():
    try:
        data = request.json
        phone_number = data.get("phone_number")

        if not (phone_number and phone_number.isdigit() and len(phone_number) == 10):
            return jsonify({"success": False, "message": "Phone number must be 10 digits long"}), 400

        formatted_phone_number = f"+91{phone_number}"
        otp = str(random.randint(1000, 9999))
        otp_expiry = datetime.now() + timedelta(minutes=5)
        otp_storage[formatted_phone_number] = {"otp": otp, "expiry": otp_expiry}

        print(f"DEBUG: OTP generated for {formatted_phone_number}: {otp}")

        try:
            twilio_client.messages.create(
                body=f"Your OTP is: {otp}",
                from_=Config.TWILIO_PHONE_NUMBER,
                to=formatted_phone_number
            )
            return jsonify({"success": True, "message": "OTP sent successfully!"})
        except Exception as e:
            print(f"DEBUG: Error sending OTP: {str(e)}")
            return jsonify({"success": False, "message": str(e)}), 500
    except Exception as e:
        print(f"DEBUG: Error in send-otp API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@routes_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.json
        phone_number = data.get("phone_number")
        otp = data.get("otp")

        formatted_phone_number = f"+91{phone_number}"
        if formatted_phone_number not in otp_storage:
            return jsonify({"success": False, "message": "OTP not found or expired"}), 400

        stored_otp = otp_storage[formatted_phone_number]["otp"]
        expiry_time = otp_storage[formatted_phone_number]["expiry"]

        if datetime.now() > expiry_time:
            return jsonify({"success": False, "message": "OTP expired"}), 400

        if otp == stored_otp:
            del otp_storage[formatted_phone_number]
            return jsonify({"success": True, "message": "OTP verified!"})
        else:
            return jsonify({"success": False, "message": "Invalid OTP!"}), 400
    except Exception as e:
        print(f"DEBUG: Error in verify-otp API: {str(e)}")
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@payment_bp.route("/create-payment", methods=["POST"])
@token_required
def create_payment():
    try:
        data = request.json
        print("DEBUG: Received Payment Request:", data)

        amount = data.get("amount")
        phone_number = data.get("phone_number")
        items = data.get("items", [])
        if not amount or not isinstance(amount, (int, float)) or amount <= 0:
            return jsonify({"success": False, "message": "Amount must be a positive number"}), 400
        if not phone_number or not phone_number.isdigit() or len(phone_number) != 10:
            return jsonify({"success": False, "message": "Phone number must be 10 digits"}), 400
        if not items:
            return jsonify({"success": False, "message": "No items provided"}), 400

        order_id = f"ORDER_{random.randint(1000, 9999)}_{int(datetime.now().timestamp())}"

        order_data = {
            "order_id": order_id,
            "order_amount": float(amount),
            "order_currency": "INR",
            "order_note": "Payment for order",
            "customer_details": {
                "customer_id": "CUST_" + phone_number[-4:],
                "customer_name": "Customer",
                "customer_email": request.user["email"],
                "customer_phone": phone_number
            },
            "order_meta": {
                "return_url": f"https://smart-dining-management.onrender.com/api/payment-redirect/{order_id}",
                "notify_url": "https://smart-dining-management.onrender.com/api/payment-webhook"
            }
        }

        headers = {
            "Content-Type": "application/json",
            "x-api-version": "2023-08-01",
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY
        }

        print("DEBUG: Sending Request to Cashfree:", order_data)
        print("DEBUG: Headers:", {k: v if k != "x-client-secret" else "****" for k, v in headers.items()})

        response = requests.post(CASHFREE_URL, json=order_data, headers=headers)
        print("DEBUG: Cashfree Response Status:", response.status_code)
        print("DEBUG: Raw Cashfree Response:", response.text)

        payment_info = response.json()

        if response.status_code == 200 and "payment_session_id" in payment_info:
            order_doc = {
                "order_id": order_id,
                "items": items,
                "amount": float(amount),
                "phone_number": phone_number,
                "status": "PENDING",
                "created_at": datetime.utcnow().isoformat(),
                "email": request.user["email"]
            }
            result = orders_collection.insert_one(order_doc)
            print(f"DEBUG: Order saved to MongoDB: {order_doc}, Inserted ID: {result.inserted_id}")

            return jsonify({
                "success": True,
                "payment_session_id": payment_info["payment_session_id"],
                "order_id": order_id
            })
        else:
            print("DEBUG: Cashfree Rejected Request:", payment_info)
            return jsonify({
                "success": False,
                "message": "Failed to generate payment session",
                "details": payment_info.get("message", payment_info)
            }), 400

    except Exception as e:
        print("DEBUG: Error in create-payment API:", str(e))
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500

@payment_bp.route("/payment-webhook", methods=["POST"])
def payment_webhook():
    try:
        data = request.json
        print("DEBUG: Webhook Received:", data)
        order_id = data.get("order_id")
        payment_status = data.get("payment_status")

        if order_id and payment_status:
            result = orders_collection.update_one(
                {"order_id": order_id},
                {"$set": {"status": payment_status.upper()}}
            )
            print(f"DEBUG: Updated order {order_id} status to {payment_status}, Matched: {result.matched_count}, Modified: {result.modified_count}")
            return jsonify({"success": True}), 200
        else:
            print("DEBUG: Invalid webhook data:", data)
            return jsonify({"success": False, "message": "Invalid webhook data"}), 400
    except Exception as e:
        print("DEBUG: Webhook Error:", str(e))
        return jsonify({"success": False, "message": "Webhook error"}), 500
