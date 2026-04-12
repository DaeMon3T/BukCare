import httpx
import base64
import json
from core.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async def extract_license_info(image_bytes: bytes) -> dict:
    """
    Uses Groq's Llama-3.2 Vision model to extract License Number and Expiry Date from a PRC image.
    """
    if not settings.GROQ_API_KEY:
        return {"error": "GROQ_API_KEY not configured"}

    # Encode image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    payload = {
        "model": "llama-3.2-11b-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this PRC (Professional Regulation Commission) license. Extract the License Number and the Expiry Date. Return strictly a JSON object with keys 'license_number' and 'expiry_date'. If not found, use null."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            print(f"Groq OCR Failed: {e}")
            return {"error": str(e)}
