import requests
import json

def test_search(query):
    try:
        url = f"http://127.0.0.1:8000/api/stock/search-stocks?q={query}"
        response = requests.get(url)
        data = response.json()
        print(f"Query: {query}")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(e)

if __name__ == "__main__":
    print("Testing 'Zomato' (Should find ZOMATO.NS)...")
    test_search("Zomato")
    
    print("\nTesting 'Tata' (Should find varied Tata stocks)...")
    test_search("Tata")
