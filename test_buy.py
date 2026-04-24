import requests
import json

url = "http://localhost:8000/api/simulator/buy"
payload = {
    "user_id": "test_user_v1",
    "symbol": "INFY.NS",
    "quantity": 10,
    "price": 1600.0
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
