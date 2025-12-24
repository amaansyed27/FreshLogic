# Gemini API SDK - Comprehensive Developer Guide

**Last Updated:** December 2024  
**API Version:** v1beta (GenAI SDK)  
**Supported Models:** Gemini 3 Pro/Flash, Gemini 2.5 Pro/Flash-Lite, Veo 3.1

---

## TABLE OF CONTENTS

1. [Overview & SDK Architecture](#overview--sdk-architecture)
2. [Installation & Setup](#installation--setup)
3. [API Keys & Authentication](#api-keys--authentication)
4. [Core Concepts](#core-concepts)
5. [Basic API Calls](#basic-api-calls)
6. [Function Calling (Tools)](#function-calling-tools)
7. [Multimodal Inputs](#multimodal-inputs)
8. [Advanced Features](#advanced-features)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## OVERVIEW & SDK ARCHITECTURE

### What is the Gemini API?

The Gemini API provides unified access to Google's latest AI models through a simple, unified interface. Instead of learning different APIs for different capabilities, you get:

- **Text Generation** - Natural language processing
- **Multimodal Understanding** - Images, video, documents, audio
- **Function Calling** - Connect to external tools and APIs
- **Structured Outputs** - JSON/schema constrained responses
- **Real-time Voice** - Live API for voice agents
- **Video Generation** - Veo 3.1 video synthesis
- **Image Generation** - Nano Banana native image generation

### SDK Ecosystem

```
┌─────────────────────────────────────────────────┐
│         Gemini API (REST Endpoint)              │
│  https://generativelanguage.googleapis.com/...  │
└─────────────────────────┬───────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌─────────┐      ┌──────────┐     ┌─────────┐
    │ Python  │      │JavaScript│     │   Go    │
    │SDK(genai)      │SDK(@google/   │SDK(genai)
    │         │      │genai)    │     │         │
    └─────────┘      └──────────┘     └─────────┘
        │                 │                 │
        ├─ REST API ──────┼─ REST API ──────┤
        │                 │                 │
        └─────────────────┴─────────────────┘
```

### Model Capabilities Matrix

| Model | Intelligence | Speed | Cost | Context | Images | Video | Voice |
|-------|--------------|-------|------|---------|--------|-------|-------|
| Gemini 3 Pro | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $$$ | 1M tokens | ✅ | ✅ | ✅ |
| Gemini 3 Flash | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$ | 1M tokens | ✅ | ✅ | ✅ |
| Gemini 2.5 Pro | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $$$ | 100K tokens | ✅ | ✅ | ✅ |
| Gemini 2.5 Flash | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $ | 1M tokens | ✅ | ⚠️ | ✅ |
| Flash-Lite | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $ | 100K tokens | ✅ | ⚠️ | ✅ |
| Veo 3.1 | Video Gen | ⭐⭐ | $$ | N/A | ✅ | ✅ | ⚠️ |
| Nano Banana | Image Gen | ⭐⭐⭐ | $ | N/A | ✅ | ✅ | ✅ |

---

## INSTALLATION & SETUP

### Python SDK Installation

**Recommended:** Python 3.9+

```bash
# Install the latest version
pip install -q -U google-genai

# Verify installation
python -c "import google.genai as genai; print(genai.__version__)"
```

### JavaScript/Node.js Installation

**Recommended:** Node.js v18+

```bash
npm install @google/genai
# or
yarn add @google/genai
```

### Go Installation

```bash
go get google.golang.org/genai
```

### Java Installation (Maven)

```xml
<dependency>
    <groupId>com.google.genai</groupId>
    <artifactId>google-genai</artifactId>
    <version>1.0.0</version>
</dependency>
```

### C# Installation (.NET)

```bash
dotnet add package Google.GenAI
```

---

## API KEYS & AUTHENTICATION

### Getting an API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Choose or create a Google Cloud project
4. Copy the generated key

### Using API Keys Securely

#### Method 1: Environment Variable (Recommended)

**Linux/macOS:**
```bash
export GEMINI_API_KEY="your-api-key-here"
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

**Windows (CMD):**
```cmd
set GEMINI_API_KEY=your-api-key-here
```

#### Method 2: Load from .env File

**Create `.env` file:**
```
GEMINI_API_KEY=your-api-key-here
```

**Python - Load with python-dotenv:**
```python
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
```

#### Method 3: Pass Explicitly (Less Secure)

```python
from google import genai

client = genai.Client(api_key="your-api-key-here")
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "your-api-key-here"
});
```

### Security Best Practices

⚠️ **NEVER commit API keys to version control**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
```

✅ Use `.env.example` with placeholder keys:
```
GEMINI_API_KEY=your-api-key-here
```

---

## CORE CONCEPTS

### 1. Client Initialization

All SDK interactions start with creating a client:

```python
from google import genai

# Auto-loads GEMINI_API_KEY from environment
client = genai.Client()
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});  // Uses GEMINI_API_KEY env var
```

### 2. Model Selection

Models are specified by string ID:

```python
response = client.models.generate_content(
    model="gemini-3-flash",  # Model ID
    contents="Your prompt here"
)
```

**Available Model IDs:**
- `gemini-3-pro` - Most intelligent
- `gemini-3-flash` - Balanced & fast
- `gemini-2.5-pro` - Powerful reasoning
- `gemini-2.5-flash` - Fast & reliable
- `gemini-2.5-flash-lite` - Fastest & cheapest
- `veo-3.1` - Video generation
- `nano-banana` - Image generation

### 3. Content Structure

The API works with `Content` objects containing `parts`:

```python
from google.genai import types

content = types.Content(
    role="user",  # or "model"
    parts=[
        types.Part(text="Hello"),
        # types.Part(file_data=...),  # Multimodal
        # types.Part(inline_data=...),  # Raw bytes
    ]
)
```

### 4. Generation Config

Controls model behavior:

```python
config = types.GenerateContentConfig(
    temperature=0.7,              # 0.0 (deterministic) to 2.0 (creative)
    top_p=0.9,                    # Nucleus sampling
    top_k=40,                     # Top-K sampling
    max_output_tokens=1024,       # Response length limit
    stop_sequences=["Stop"],      # When to stop generating
)

response = client.models.generate_content(
    model="gemini-3-flash",
    contents="Your prompt",
    config=config
)
```

---

## BASIC API CALLS

### Simple Text Generation

```python
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-flash",
    contents="Explain quantum computing in 100 words"
)

print(response.text)
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash",
        contents: "Explain quantum computing in 100 words"
    });
    console.log(response.text);
}

main();
```

### Multi-turn Conversation

```python
from google import genai
from google.genai import types

client = genai.Client()

# Create conversation
chat = client.chats.create(model="gemini-3-flash")

# Turn 1
response1 = chat.send_message("What's the capital of France?")
print(response1.text)  # Output: "Paris"

# Turn 2 - Context is automatically maintained
response2 = chat.send_message("What's its population?")
print(response2.text)  # Output: References Paris automatically

# Access full conversation history
for msg in chat.history:
    print(f"{msg.role}: {msg.parts[0].text}")
```

### Streaming Responses

```python
from google import genai

client = genai.Client()

# Stream text as it's generated
for chunk in client.models.generate_content_stream(
    model="gemini-3-flash",
    contents="Write a poem about AI"
):
    print(chunk.text, end="", flush=True)
```

---

## FUNCTION CALLING (TOOLS)

### Why Function Calling?

Function calling bridges the gap between LLM knowledge and real-world actions:

```
User Input → Model Analyzes → "Call this function with these args"
                                           ↓
                              Your Code Executes Function
                                           ↓
                                      Function Result
                                           ↓
                                   Model Uses Result
                                           ↓
                                    Final Answer
```

### Function Declaration Structure

All functions follow OpenAPI schema format:

```python
schedule_meeting = {
    "name": "schedule_meeting",                          # Required: unique name
    "description": "Schedules a meeting with attendees", # Required: what it does
    "parameters": {                                       # Required: input schema
        "type": "object",
        "properties": {
            "attendees": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of attendees"
            },
            "date": {
                "type": "string",
                "description": "Meeting date (YYYY-MM-DD)"
            },
            "time": {
                "type": "string",
                "description": "Meeting time (HH:MM)"
            },
            "topic": {
                "type": "string",
                "description": "Meeting topic/title"
            }
        },
        "required": ["attendees", "date", "time", "topic"]  # Mandatory fields
    }
}
```

### Single Function Call Example

**Step 1: Define the function**
```python
def schedule_meeting(attendees: list, date: str, time: str, topic: str) -> dict:
    """Mock implementation - your code would integrate with calendar API"""
    return {
        "meeting_id": "MTG-001",
        "status": "scheduled",
        "attendees": attendees,
        "date": date,
        "time": time,
        "topic": topic
    }
```

**Step 2: Define schema**
```python
from google import genai
from google.genai import types

schedule_meeting_schema = {
    "name": "schedule_meeting",
    "description": "Schedules a meeting with specified attendees",
    "parameters": {
        "type": "object",
        "properties": {
            "attendees": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of attendee names"
            },
            "date": {
                "type": "string",
                "description": "Date in YYYY-MM-DD format"
            },
            "time": {
                "type": "string",
                "description": "Time in HH:MM format"
            },
            "topic": {
                "type": "string",
                "description": "Meeting topic"
            }
        },
        "required": ["attendees", "date", "time", "topic"]
    }
}
```

**Step 3: Call API with function declaration**
```python
client = genai.Client()
tools = types.Tool(function_declarations=[schedule_meeting_schema])
config = types.GenerateContentConfig(tools=[tools])

response = client.models.generate_content(
    model="gemini-3-flash",
    contents="Schedule a meeting with Alice and Bob for 2025-03-15 at 10:00 to discuss Q2 planning",
    config=config
)

# Check if model wants to call a function
if response.candidates[0].content.parts[0].function_call:
    fn_call = response.candidates[0].content.parts[0].function_call
    print(f"Function: {fn_call.name}")
    print(f"Args: {fn_call.args}")
    
    # Execute your function
    result = schedule_meeting(**fn_call.args)
    print(f"Result: {result}")
```

**Step 4: Send result back for final response**
```python
# Create function response part
function_response = types.Part.from_function_response(
    name=fn_call.name,
    response={"result": result}
)

# Append to conversation
contents = [
    types.Content(role="user", parts=[types.Part(text="Schedule a meeting...")]),
    response.candidates[0].content,  # Model's function call suggestion
    types.Content(role="user", parts=[function_response])  # Function result
]

# Get final text response
final_response = client.models.generate_content(
    model="gemini-3-flash",
    contents=contents,
    config=config
)

print(final_response.text)
# Output: "I've scheduled the meeting with Alice and Bob for March 15 at 10:00 AM to discuss Q2 planning."
```

### Automatic Function Calling (Python Only)

The Python SDK can automatically handle the full loop:

```python
from google import genai
from google.genai import types

def get_weather(location: str) -> dict:
    """Gets the current weather for a location.
    
    Args:
        location: City name, e.g. 'San Francisco, CA'
    
    Returns:
        Weather data with temperature and conditions.
    """
    # Your implementation - could call weather API
    return {"temperature": 72, "condition": "sunny", "location": location}

client = genai.Client()

# SDK auto-generates schema from function signature + docstring
config = types.GenerateContentConfig(tools=[get_weather])

response = client.models.generate_content(
    model="gemini-3-flash",
    contents="What's the weather in New York right now?",
    config=config
)

# SDK automatically executed get_weather() and used result!
print(response.text)
# Output: "In New York, it's currently 72°F and sunny."
```

### Parallel Function Calling

Execute multiple independent functions in one turn:

```python
def power_disco_ball(power: bool) -> dict:
    return {"status": f"Disco ball {'ON' if power else 'OFF'}"}

def start_music(genre: str, volume: int) -> dict:
    return {"playing": genre, "volume": volume}

def dim_lights(brightness: float) -> dict:
    return {"brightness": brightness}

client = genai.Client()

config = types.GenerateContentConfig(
    tools=[power_disco_ball, start_music, dim_lights],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(mode='ANY')
    )
)

response = client.models.generate_content(
    model="gemini-3-flash",
    contents="Turn this room into a party!",
    config=config
)

# Model calls ALL THREE functions simultaneously
for fn_call in response.function_calls:
    print(f"→ {fn_call.name}({fn_call.args})")
```

### Compositional (Sequential) Function Calling

Chain function calls where one depends on another:

```python
def get_weather(location: str) -> dict:
    """Get weather for a location"""
    return {"temperature": 25, "unit": "celsius"}

def set_thermostat(temperature: int) -> dict:
    """Set thermostat to target temperature"""
    return {"status": "set", "temperature": temperature}

client = genai.Client()

config = types.GenerateContentConfig(
    tools=[get_weather, set_thermostat]
)

# Model will:
# 1. Call get_weather("London")
# 2. Analyze result
# 3. Call set_thermostat(20) based on temperature
response = client.models.generate_content(
    model="gemini-3-flash",
    contents="If London is warmer than 20°C, set thermostat to 20°C, else set to 18°C",
    config=config
)

print(response.text)
# Output: "I checked London's weather (25°C) and set the thermostat to 20°C."
```

### Function Calling Modes

Control how aggressively the model uses functions:

```python
from google.genai import types

# AUTO (Default) - Model decides whether to call or respond naturally
tool_config = types.ToolConfig(
    function_calling_config=types.FunctionCallingConfig(mode='AUTO')
)

# ANY - Force model to always call a function (if applicable)
tool_config = types.ToolConfig(
    function_calling_config=types.FunctionCallingConfig(
        mode='ANY',
        allowed_function_names=['get_weather']  # Optional: restrict to these
    )
)

# NONE - Disable function calling completely
tool_config = types.ToolConfig(
    function_calling_config=types.FunctionCallingConfig(mode='NONE')
)

# VALIDATED - Strict schema validation before calling
tool_config = types.ToolConfig(
    function_calling_config=types.FunctionCallingConfig(mode='VALIDATED')
)
```

---

## MULTIMODAL INPUTS

### Image Input

```python
import base64
from google import genai

client = genai.Client()

# From URL
response = client.models.generate_content(
    model="gemini-3-flash",
    contents=[
        "What's in this image?",
        types.Part.from_uri(
            mime_type="image/jpeg",
            uri="https://example.com/image.jpg"
        )
    ]
)

# From local file
with open("photo.jpg", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.models.generate_content(
    model="gemini-3-flash",
    contents=[
        "Analyze this photo",
        types.Part(
            inline_data=types.Blob(
                mime_type="image/jpeg",
                data=image_data
            )
        )
    ]
)

print(response.text)
```

### PDF Document Processing

```python
import base64

# Process up to 1000 pages
with open("document.pdf", "rb") as f:
    pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.models.generate_content(
    model="gemini-3-flash",
    contents=[
        "Summarize this PDF and extract key findings",
        types.Part(
            inline_data=types.Blob(
                mime_type="application/pdf",
                data=pdf_data
            )
        )
    ]
)

print(response.text)
```

### Video Processing

```python
# Upload video file
import google.genai.files

response = client.models.generate_content(
    model="gemini-3-flash",
    contents=[
        "What happens in this video?",
        types.Part.from_uri(
            mime_type="video/mp4",
            uri="gs://bucket/video.mp4"  # Google Cloud Storage
        )
    ]
)

print(response.text)
```

---

## ADVANCED FEATURES

### 1. Structured Outputs (Schema Validation)

Force model to return valid JSON matching a schema:

```python
from google.genai import types

schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
        "email": {"type": "string", "format": "email"},
        "skills": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["name", "email", "skills"]
}

response = client.models.generate_content(
    model="gemini-3-flash",
    contents="Extract person info: John Doe, 30, john@example.com, Python/JavaScript",
    config=types.GenerateContentConfig(
        response_schema=schema
    )
)

import json
data = json.loads(response.text)
print(data['name'])  # "John Doe" - guaranteed valid JSON
```

### 2. Vision Capabilities (Nano Banana)

Native image generation within text responses:

```python
response = client.models.generate_content(
    model="nano-banana",
    contents="Generate a serene landscape with mountains and a lake"
)

# Response includes both text and generated image
```

### 3. Video Generation (Veo 3.1)

Create videos from text prompts:

```python
response = client.models.generate_content(
    model="veo-3.1",
    contents="Create a 5-second video of a cat playing with yarn"
)

# Save generated video
with open("video.mp4", "wb") as f:
    f.write(response.video_data)
```

### 4. Thinking Models

Access extended reasoning capabilities:

```python
# Gemini 3 includes internal "thinking" - improves complex reasoning
response = client.models.generate_content(
    model="gemini-3-pro",
    contents="Solve this complex math problem: ...",
    config=types.GenerateContentConfig(
        # Model uses internal reasoning before answering
    )
)

print(response.text)
```

---

## ERROR HANDLING

### Common Errors

```python
from google import genai
from google.genai import exceptions

client = genai.Client()

try:
    response = client.models.generate_content(
        model="gemini-3-flash",
        contents="Your prompt"
    )
except exceptions.APIError as e:
    # API returned error (401 Unauthorized, 429 Rate Limited, etc)
    print(f"API Error: {e.status_code} - {e.message}")
    
except exceptions.NotFoundError as e:
    # Model or resource doesn't exist
    print(f"Not found: {e}")
    
except exceptions.InvalidArgumentError as e:
    # Invalid parameters provided
    print(f"Invalid argument: {e}")
    
except exceptions.AuthenticationError as e:
    # Invalid/missing API key
    print(f"Auth failed: {e}")
    
except exceptions.RateLimitError as e:
    # Rate limit exceeded - implement exponential backoff
    import time
    time.sleep(60)  # Wait before retry
```

### Rate Limiting & Retry Logic

```python
import time
from typing import Optional

def call_with_retry(
    client,
    prompt: str,
    max_retries: int = 3,
    backoff_factor: float = 2.0
) -> Optional[str]:
    """Call API with exponential backoff retry"""
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-3-flash",
                contents=prompt
            )
            return response.text
            
        except exceptions.RateLimitError:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt * backoff_factor
                print(f"Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
    
    return None

# Usage
result = call_with_retry(client, "Your prompt here")
```

---

## BEST PRACTICES

### 1. Prompt Engineering

```python
# ❌ Vague
response = client.models.generate_content(
    model="gemini-3-flash",
    contents="Write something about Python"
)

# ✅ Clear & Specific
response = client.models.generate_content(
    model="gemini-3-flash",
    contents="""Write a 500-word technical article about Python async/await patterns.
    
    Target audience: Intermediate Python developers
    Include: Code examples, use cases, common pitfalls
    Format: Markdown with code blocks"""
)
```

### 2. Temperature Tuning

```python
from google.genai import types

# For deterministic/factual responses (summarization, Q&A)
config = types.GenerateContentConfig(temperature=0.0)

# For balanced responses (most cases)
config = types.GenerateContentConfig(temperature=0.7)

# For creative responses (brainstorming, creative writing)
config = types.GenerateContentConfig(temperature=1.5)
```

### 3. Token Management

```python
# Check token count before sending (save costs)
response = client.models.count_tokens(
    model="gemini-3-flash",
    contents="Your prompt here"
)
print(f"Input tokens: {response.total_tokens}")

# Limit output to save costs
config = types.GenerateContentConfig(
    max_output_tokens=500  # Shorter responses = cheaper
)
```

### 4. Caching for Repeated Requests

```python
# If you're calling with the same context/prompt repeatedly, use caching
system_prompt = """You are a Python expert assistant..."""

for user_query in ["How to use decorators?", "Explain generators"]:
    response = client.models.generate_content(
        model="gemini-3-flash",
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text=system_prompt)],
            ),
            types.Content(
                role="user",
                parts=[types.Part(text=user_query)],
            ),
        ]
    )
```

### 5. Production Agent Pattern

```python
class GeminiAgent:
    def __init__(self, api_key: str = None):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3-flash"
        self.max_turns = 10
    
    def run(self, initial_prompt: str, tools: list = None) -> str:
        """Run agent loop with function calling"""
        contents = [
            types.Content(role="user", parts=[types.Part(text=initial_prompt)])
        ]
        
        config = types.GenerateContentConfig(
            tools=[types.Tool(function_declarations=tools)] if tools else None
        )
        
        for turn in range(self.max_turns):
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config
            )
            
            # Check for function calls
            if response.function_calls:
                for fn_call in response.function_calls:
                    # Execute function
                    result = self._execute_function(fn_call.name, fn_call.args)
                    
                    # Append to conversation
                    contents.append(response.candidates[0].content)
                    contents.append(types.Content(
                        role="user",
                        parts=[types.Part.from_function_response(
                            name=fn_call.name,
                            response={"result": result}
                        )]
                    ))
            else:
                # Final response
                return response.text
        
        return "Agent max turns reached"
    
    def _execute_function(self, name: str, args: dict):
        """Override this to implement your functions"""
        raise NotImplementedError()

# Usage
agent = GeminiAgent()
result = agent.run(
    "Schedule a meeting and send an email",
    tools=[schedule_meeting_schema, send_email_schema]
)
```

---

## REFERENCE

### SDK Initialization Patterns

```python
# Default (uses GEMINI_API_KEY env var)
client = genai.Client()

# Explicit API key
client = genai.Client(api_key="sk-...")

# Custom endpoint (enterprise)
client = genai.Client(api_key="...", api_endpoint="...")
```

### Common Model IDs

```python
client.models.generate_content(model="gemini-3-pro", ...)
client.models.generate_content(model="gemini-3-flash", ...)
client.models.generate_content(model="gemini-2.5-pro", ...)
client.models.generate_content(model="gemini-2.5-flash", ...)
client.models.generate_content(model="gemini-2.5-flash-lite", ...)
```

### Response Structure

```python
response = client.models.generate_content(...)

# Access generated text
print(response.text)

# Check finish reason
print(response.candidates[0].finish_reason)
# Options: STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER

# Check safety ratings
for rating in response.candidates[0].safety_ratings:
    print(f"{rating.category}: {rating.probability}")

# Access usage statistics
print(f"Prompt tokens: {response.usage_metadata.prompt_token_count}")
print(f"Output tokens: {response.usage_metadata.candidates_token_count}")
```

---

## RESOURCES

- **Official Docs:** https://ai.google.dev/gemini-api/docs
- **API Reference:** https://ai.google.dev/api/rest/v1beta/models/generateContent
- **Pricing:** https://ai.google.dev/pricing
- **Cookbook:** https://github.com/google-gemini/cookbook
- **Community:** https://github.com/google-gemini/ai-python-samples
