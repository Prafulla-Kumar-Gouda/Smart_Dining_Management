import os
from dotenv import load_dotenv
from decouple import config

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    DEBUG = True
    SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
    CORS_ORIGINS = "*"

    # Twilio
    TWILIO_ACCOUNT_SID = config("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = config("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = config("TWILIO_PHONE_NUMBER")

    # Cashfree
    CASHFREE_APP_ID = config("CASHFREE_APP_ID")
    CASHFREE_SECRET_KEY = config("CASHFREE_SECRET_KEY")
