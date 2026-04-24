import requests
import json
import time

url = "http://localhost:8000/api/simulator/portfolio/test_user_v1"

try:
    response = requests.get(url)
    data = response.json()
    print(json.dumps(data, indent=2))
except Exception as e:
    print(e)
