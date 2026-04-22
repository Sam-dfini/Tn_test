import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def check_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in .env")
        return

    print(f"Testing Gemini API Key: {api_key[:5]}...{api_key[-4:]}")
    
    try:
        genai.configure(api_key=api_key)
        print("Successfully configured genai.")
        
        print("\nAvailable Models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
        
        # Try a simple test generation
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello, write a short sentence about Tunisia.")
        print(f"\nTest Generation Successful: {response.text}")
        
    except Exception as e:
        print(f"\nFAILURE: {e}")

if __name__ == "__main__":
    check_gemini()
