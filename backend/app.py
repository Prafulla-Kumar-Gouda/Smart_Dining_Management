from flask import Flask
from flask_cors import CORS
from routes import routes_bp, payment_bp  

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://cusmartdining.netlify.app"]}})

app.register_blueprint(routes_bp, url_prefix="/api")
app.register_blueprint(payment_bp, url_prefix="/api")  

if __name__ == "__main__":
    app.run(debug=True)
