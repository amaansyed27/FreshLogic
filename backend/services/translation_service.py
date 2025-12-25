"""
Multi-Language Translation Service
Supports Hindi and 8 Indian regional languages for farmers
Uses Google Cloud Translation API
"""

import os
import httpx
from typing import Optional
from functools import lru_cache

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

# Supported Indian languages for farmers
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "हिंदी (Hindi)",
    "ta": "தமிழ் (Tamil)",
    "te": "తెలుగు (Telugu)",
    "kn": "ಕನ್ನಡ (Kannada)",
    "ml": "മലയാളം (Malayalam)",
    "mr": "मराठी (Marathi)",
    "gu": "ગુજરાતી (Gujarati)",
    "pa": "ਪੰਜਾਬੀ (Punjabi)",
    "bn": "বাংলা (Bengali)"
}

# Cache translations
translation_cache = {}


async def translate_text(text: str, target_language: str = "hi") -> str:
    """
    Translate text to target language using Google Cloud Translation API
    Falls back to original text if translation fails
    """
    if target_language == "en":
        return text
    
    cache_key = f"{hash(text)}:{target_language}"
    if cache_key in translation_cache:
        return translation_cache[cache_key]
    
    if not GOOGLE_API_KEY:
        # Return original if no API key
        return text
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://translation.googleapis.com/language/translate/v2",
                params={"key": GOOGLE_API_KEY},
                json={
                    "q": text,
                    "target": target_language,
                    "source": "en",
                    "format": "text"
                }
            )
            
            data = response.json()
            
            if "data" in data and "translations" in data["data"]:
                translated = data["data"]["translations"][0]["translatedText"]
                translation_cache[cache_key] = translated
                return translated
            
            return text
            
    except Exception as e:
        print(f"Translation error: {e}")
        return text


async def translate_report(report: dict, target_language: str = "hi") -> dict:
    """
    Translate an entire analysis report to target language
    """
    if target_language == "en":
        return report
    
    translated = report.copy()
    
    # Translate agent insight (main content)
    if "agent_insight" in translated:
        translated["agent_insight"] = await translate_text(
            translated["agent_insight"], 
            target_language
        )
    
    # Translate status
    if "risk_analysis" in translated and "status" in translated["risk_analysis"]:
        status_translations = {
            "hi": {"Safe": "सुरक्षित", "Caution": "सावधानी", "High Risk": "उच्च जोखिम"},
            "ta": {"Safe": "பாதுகாப்பானது", "Caution": "எச்சரிக்கை", "High Risk": "அதிக ஆபத்து"},
            "te": {"Safe": "సురక్షితం", "Caution": "జాగ్రత్త", "High Risk": "అధిక ప్రమాదం"},
            "kn": {"Safe": "ಸುರಕ್ಷಿತ", "Caution": "ಎಚ್ಚರಿಕೆ", "High Risk": "ಹೆಚ್ಚಿನ ಅಪಾಯ"},
            "ml": {"Safe": "സുരക്ഷിതം", "Caution": "മുന്നറിയിപ്പ്", "High Risk": "ഉയർന്ന അപകടം"},
            "mr": {"Safe": "सुरक्षित", "Caution": "सावधगिरी", "High Risk": "उच्च धोका"},
            "gu": {"Safe": "સુરક્ષિત", "Caution": "સાવધાની", "High Risk": "ઉચ્ચ જોખમ"},
            "pa": {"Safe": "ਸੁਰੱਖਿਅਤ", "Caution": "ਸਾਵਧਾਨੀ", "High Risk": "ਉੱਚ ਜੋਖਮ"},
            "bn": {"Safe": "নিরাপদ", "Caution": "সতর্কতা", "High Risk": "উচ্চ ঝুঁকি"}
        }
        
        status = translated["risk_analysis"]["status"]
        if target_language in status_translations and status in status_translations[target_language]:
            translated["risk_analysis"]["status"] = status_translations[target_language][status]
    
    translated["language"] = target_language
    translated["language_name"] = SUPPORTED_LANGUAGES.get(target_language, target_language)
    
    return translated


def get_supported_languages() -> dict:
    """Get list of supported languages"""
    return SUPPORTED_LANGUAGES


# Common agricultural terms pre-translated for faster response
AGRICULTURAL_TERMS = {
    "hi": {
        "Spoilage Risk": "खराब होने का खतरा",
        "Temperature": "तापमान",
        "Humidity": "आर्द्रता",
        "Shelf Life": "शेल्फ लाइफ",
        "Days Remaining": "शेष दिन",
        "Transit Time": "पारगमन समय",
        "Distance": "दूरी",
        "Route": "मार्ग",
        "Crop": "फसल",
        "Origin": "उत्पत्ति स्थान",
        "Destination": "गंतव्य",
        "Cold Storage": "शीत भंडारण",
        "Refrigerated Transport": "प्रशीतित परिवहन",
        "Harvest": "फसल कटाई",
        "Market Price": "बाजार मूल्य"
    },
    "ta": {
        "Spoilage Risk": "கெட்டுப்போகும் ஆபத்து",
        "Temperature": "வெப்பநிலை",
        "Humidity": "ஈரப்பதம்",
        "Shelf Life": "ஆயுள்",
        "Days Remaining": "மீதமுள்ள நாட்கள்",
        "Transit Time": "போக்குவரத்து நேரம்",
        "Distance": "தூரம்",
        "Route": "வழி",
        "Crop": "பயிர்",
        "Origin": "தோற்றம்",
        "Destination": "இலக்கு",
        "Cold Storage": "குளிர் சேமிப்பு",
        "Refrigerated Transport": "குளிர்சாதன போக்குவரத்து"
    }
}
