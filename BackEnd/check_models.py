from google import genai
import os

# Your actual key
API_KEY = "AIzaSyBXu9GikPQ1X46N3ZNgie88WAoyX4TBlm8" 

client = genai.Client(api_key=API_KEY)

print("--- FETCHING YOUR AVAILABLE MODELS ---")
try:
    # List models (v1beta is the default for this library)
    for model in client.models.list():
        name = model.name.split("/")[-1]
        print(f" Found: {name}")
except Exception as e:
    print(f" Error: {e}")