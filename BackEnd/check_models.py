from google import genai
import os

API_KEY = os.getenv("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)

print("--- FETCHING YOUR AVAILABLE MODELS ---")
try:
    for model in client.models.list():
        name = model.name.split("/")[-1]
        print(f"Found: {name}")
except Exception as e:
    print(f"Error: {e}")
