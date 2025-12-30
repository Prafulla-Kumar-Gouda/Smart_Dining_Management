import pandas as pd
from pymongo import MongoClient


client = MongoClient("MONGO_URI")
db = client["smart_dining"]
users_collection = db["users"]  


df = pd.read_excel("users.xlsx")


for _, row in df.iterrows():
    email = row["email"].strip().lower()  
    users_collection.update_one(
        {"email": email},
        {"$setOnInsert": {"email": email, "password": None}},  
        upsert=True  
    )

print("Emails imported successfully!")
