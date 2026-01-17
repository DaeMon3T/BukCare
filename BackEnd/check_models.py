import os
import requests
from dotenv import load_dotenv

# Load your API Key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env")
    exit()

print(f"🔑 Checking models for API Key ending in: ...{api_key[-5:]}")

# Standard URL for Google's Generative AI
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ AVAILABLE MODELS:")
        print("="*30)
        found_flash = False
        for model in data.get('models', []):
            # We only care about models that can 'generateContent'
            if "generateContent" in model.get("supportedGenerationMethods", []):
                print(f"• {model['name'].replace('models/', '')}")
                if "flash" in model['name']:
                    found_flash = True
        print("="*30)
        
        if not found_flash:
            print("⚠️ No 'Flash' models found. You might need to use 'gemini-pro'.")
            
    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Connection Error: {e}")