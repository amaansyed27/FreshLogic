# Google Agent Development Kit (ADK) - Comprehensive Developer Documentation

## 1. Overview and Core Concepts

### 1.1 What is Google ADK?

Google Agent Development Kit (ADK) is a flexible, modular, open-source framework for building, evaluating, and deploying sophisticated AI agents. It is optimized for Gemini and the Google ecosystem but is designed to be **model-agnostic** and **deployment-agnostic**, making it compatible with multiple large language models and cloud platforms.

**Core Philosophy:**
- **Code-First Development**: Define agent logic, tools, and orchestration directly in code for maximum flexibility, testability, and version control
- **Modular Architecture**: Build complex multi-agent systems by composing specialized agents in hierarchies
- **Developer-Friendly**: Make agent development feel like traditional software development with proper testing, versioning, and deployment patterns

### 1.2 Key Features

1. **Flexible Orchestration**
   - Sequential workflows for predictable pipelines
   - Parallel execution for concurrent tasks
   - Loop patterns for iterative refinement
   - LLM-driven dynamic routing for adaptive behavior

2. **Multi-Agent Architecture**
   - Compose multiple specialized agents in hierarchies
   - Enable complex coordination and delegation
   - Share state and context across agents

3. **Rich Tool Ecosystem**
   - Pre-built tools (Google Search, Code Execution)
   - Custom function tools with type safety
   - OpenAPI specification integration
   - MCP (Model Context Protocol) tools
   - Third-party library integration
   - Other agents as tools

4. **Deployment Ready**
   - Containerize with Docker
   - Deploy to Google Cloud Run
   - Run on Vertex AI Agent Engine
   - Support for custom infrastructure

5. **Built-in Evaluation Framework**
   - Systematically assess agent performance
   - Evaluate response quality and execution trajectory
   - Test against predefined test cases
   - Generate synthetic test cases from user stories

6. **Security and Safety**
   - Identity and authorization controls
   - Input/output guardrails
   - Sandboxed code execution
   - VPC-SC perimeter support
   - Built-in Gemini safety features

### 1.3 Supported Languages

- **Python** (3.10+) - Mature, feature-complete
- **TypeScript/JavaScript** (Node.js 20.12.7+) - Recently released v0.2.0
- **Go** (supported)
- **Java** (supported)

---

## 2. Installation and Project Setup

### 2.1 Python Installation

#### Prerequisites
- Python 3.10 or later
- pip package manager
- Virtual environment (recommended)

#### Installation Steps

```bash
# Create and activate virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Google ADK
pip install google-adk
```

#### Create a New Agent Project

```bash
# Create project directory
adk create my_agent
cd my_agent

# Project structure created:
# my_agent/
# ├── agent.py          # Main agent code
# ├── .env              # API keys and environment variables
# └── __init__.py
```

### 2.2 TypeScript Installation

#### Prerequisites
- Node.js 20.12.7 or later
- npm 9.2.0 or later

#### Installation Steps

```bash
# Create project directory
mkdir my-agent
cd my-agent

# Initialize npm project
npm init --yes

# Install TypeScript
npm install -D typescript
npx tsc --init

# Install ADK libraries
npm install @google/adk
npm install @google/adk-devtools

# Configure TypeScript (update tsconfig.json)
# Set "verbatimModuleSyntax": false for CommonJS compatibility
```

#### Project Structure

```
my-agent/
├── agent.ts           # Main agent code
├── package.json       # Project configuration
├── tsconfig.json      # TypeScript configuration
└── .env               # API keys
```

#### Compile and Run

```bash
# Compile TypeScript
npx tsc

# Run agent with devtools CLI
npx @google/adk-devtools run agent.ts

# Run with web interface
npx @google/adk-devtools web
```

---

## 3. API Keys and Authentication

### 3.1 Gemini API Authentication (Google AI Studio)

**Method: API Key (Recommended for Development)**

```bash
# Get API key from Google AI Studio: https://aistudio.google.com/

# Set environment variable in .env file:
# Python
echo 'GOOGLE_API_KEY="YOUR_API_KEY"' > .env

# TypeScript
echo 'GEMINI_API_KEY="YOUR_API_KEY"' > .env
```

### 3.2 Vertex AI Authentication (Google Cloud)

**Method A: User Credentials (Local Development)**

```bash
# Install gcloud CLI
# Then authenticate with Application Default Credentials (ADC)
gcloud auth application-default login

# Set environment variables
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"  # or your region
```

**Method B: Service Account (Production/Cloud Deployment)**

```bash
# Create service account key
gcloud iam service-accounts keys create key.json \
  --iam-account=your-service-account@project.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# For Java, set in properties file
google.application.credentials=/path/to/key.json
```

**Vertex AI Endpoint Authentication:**

```bash
# For custom Vertex AI endpoints, use the endpoint resource string
model = "projects/PROJECT_ID/locations/LOCATION/endpoints/ENDPOINT_ID"

# For identity token-based auth:
gcloud_token = subprocess.check_output(
    ["gcloud", "auth", "print-identity-token", "-q"]
).decode().strip()

auth_headers = {"Authorization": f"Bearer {gcloud_token}"}
```

### 3.3 Multi-Model Authentication

ADK supports various model providers through wrapper classes:
- **Anthropic Claude** via Vertex AI
- **AWS Bedrock models**
- **Custom endpoints**
- **OpenAI models**

Each requires provider-specific authentication configuration.

---

## 4. Core Agent Types

### 4.1 LlmAgent (Language Model Agent)

The fundamental agent type that uses an LLM to reason, decide which tools to use, and generate responses.

#### Python Implementation

```python
from google.adk.agents.llm_agent import Agent

def get_current_time(city: str) -> dict:
    """Returns the current time in a specified city."""
    return {"status": "success", "city": city, "time": "10:30 AM"}

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description="Tells the current time in a specified city.",
    instruction="You are a helpful assistant that tells the current time in cities. Use the 'get_current_time' tool for this purpose.",
    tools=[get_current_time],
)
```

#### TypeScript Implementation

```typescript
import {FunctionTool, LlmAgent} from '@google/adk';
import {z} from 'zod';

const getCurrentTime = new FunctionTool({
    name: 'get_current_time',
    description: 'Returns the current time in a specified city.',
    parameters: z.object({
        city: z.string().describe("The name of the city for which to retrieve the current time."),
    }),
    execute: ({city}) => {
        return {status: 'success', report: `The current time in ${city} is 10:30 AM`};
    },
});

export const rootAgent = new LlmAgent({
    name: 'hello_time_agent',
    model: 'gemini-2.5-flash',
    description: 'Tells the current time in a specified city.',
    instruction: `You are a helpful assistant that tells the current time in a city.
Use the 'getCurrentTime' tool for this purpose.`,
    tools: [getCurrentTime],
});
```

**Key Configuration Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `model` | string | LLM identifier (e.g., "gemini-2.5-flash") | Yes |
| `name` | string | Unique agent identifier | Yes |
| `description` | string | Human-readable agent purpose | No |
| `instruction` | string | System prompt guiding agent behavior | Yes |
| `tools` | List[Tool] | Tools available to agent | No |
| `code_executor` | CodeExecutor | Code execution capability | No |
| `output_key` | string | State key for storing output | No |

### 4.2 Workflow Agents

Specialized agents for orchestrating other agents in predefined patterns.

#### SequentialAgent

Executes sub-agents in order, with each agent receiving output from previous agents via shared state.

**Python:**
```python
from google.adk.agents import SequentialAgent

financial_analyst = Agent(
    model='gemini-2.5-flash',
    name='financial_analyst',
    description='Analyzes financial metrics',
    instruction='Analyze the company financial data from state.',
    output_key='financial_analysis'
)

market_analyst = Agent(
    model='gemini-2.5-flash',
    name='market_analyst',
    description='Analyzes market conditions',
    instruction='Based on financial analysis in state, analyze market conditions.',
    output_key='market_analysis'
)

sequential_pipeline = SequentialAgent(
    name='CompanyAnalysisPipeline',
    sub_agents=[financial_analyst, market_analyst],
    description='Sequentially analyzes company from financial and market perspectives'
)

root_agent = sequential_pipeline
```

**TypeScript:**
```typescript
import {SequentialAgent, LlmAgent} from '@google/adk';

const sequentialPipeline = new SequentialAgent({
    name: 'CompanyAnalysisPipeline',
    subAgents: [financialAnalyst, marketAnalyst],
    description: 'Sequentially analyzes company from financial and market perspectives'
});
```

**Use Cases:**
- Multi-step research and analysis pipelines
- Data processing chains
- Report generation workflows

#### ParallelAgent

Launches all sub-agents simultaneously with the same input. Each agent works independently.

**Python:**
```python
from google.adk.agents import ParallelAgent

risk_assessment = ParallelAgent(
    name='ParallelRiskAssessment',
    sub_agents=[
        market_risk_analyst,
        credit_risk_analyst,
        operational_risk_analyst
    ],
    description='Runs multiple risk assessment agents in parallel'
)

root_agent = risk_assessment
```

**Key Characteristics:**
- All agents receive identical input
- No automatic state sharing between parallel branches during execution
- Results stored in separate state keys defined by each agent's `output_key`
- Significantly reduces total execution time for independent tasks

**Use Cases:**
- Multiple expert analysis
- Parallel data processing
- Concurrent API calls
- Comprehensive risk assessment

#### LoopAgent

Repeatedly executes sub-agents in sequence until a stopping condition is met.

**Python:**
```python
from google.adk.agents import LoopAgent

quality_checker = Agent(
    model='gemini-2.5-flash',
    name='quality_checker',
    description='Evaluates report quality',
    instruction='Evaluate the report and provide feedback.',
    output_key='quality_feedback'
)

report_refiner = Agent(
    model='gemini-2.5-flash',
    name='report_refiner',
    description='Refines reports based on feedback',
    instruction='Refine the report based on quality feedback.',
    output_key='refined_report'
)

quality_loop = LoopAgent(
    name='QualityAssuranceLoop',
    sub_agents=[quality_checker, report_refiner],
    max_iterations=5,
    description='Iteratively refines reports until quality approval'
)

root_agent = quality_loop
```

**Stopping Mechanisms:**
- Reach `max_iterations` limit
- Implement custom termination signal (e.g., "QUALITY_APPROVED")
- Break condition in agent logic

**Use Cases:**
- Iterative refinement and improvement
- Quality assurance loops
- Self-correction and validation
- Content generation with feedback

---

## 5. Tools: Extending Agent Capabilities

### 5.1 Function Tools (Custom Python Functions)

Tools created from custom Python functions with automatic type conversion.

#### Python Implementation

```python
from google.adk.agents.llm_agent import Agent

# Simple tool with required parameter
def get_weather(location: str) -> dict:
    """Get weather for a location."""
    return {"location": location, "temp": "25°C", "condition": "Sunny"}

# Tool with optional parameters
def calculate_metric(value: float, multiplier: float = 2.0) -> float:
    """Calculate metric with optional multiplier."""
    # Parameters without default values are required
    # Parameters with default values are optional
    return value * multiplier

agent = Agent(
    model='gemini-2.5-flash',
    name='weather_agent',
    tools=[get_weather, calculate_metric],
)
```

**Key Points:**
- Parameters without defaults = required
- Parameters with defaults = optional
- Return type annotations required
- Docstring used as tool description

### 5.2 FunctionTool (TypeScript)

TypeScript tools with explicit schema validation using Zod.

#### TypeScript Implementation

```typescript
import {FunctionTool, LlmAgent} from '@google/adk';
import {z} from 'zod';

const getWeather = new FunctionTool({
    name: 'get_weather',
    description: 'Get weather information for a location.',
    parameters: z.object({
        location: z.string().describe("The city or location name."),
        units: z.enum(['celsius', 'fahrenheit'])
            .describe("Temperature units.")
            .optional()
            .default('celsius'),
    }),
    execute: ({location, units}) => {
        return {
            location,
            temperature: units === 'celsius' ? 25 : 77,
            condition: 'Sunny'
        };
    },
});

const agent = new LlmAgent({
    name: 'weather_agent',
    model: 'gemini-2.5-flash',
    tools: [getWeather],
});
```

**Zod Schema Features:**
- `.describe()` - Add parameter descriptions
- `.optional()` - Make parameter optional
- `.default()` - Provide default values
- `.enum()` - Restrict to specific values
- Nested objects with `.object()`
- Array types with `.array()`

### 5.3 Built-in Tools

Pre-configured tools ready for immediate use.

#### Google Search Tool

```python
from google.adk.agents import Agent
from google.adk.tools import google_search

agent = Agent(
    model='gemini-2.5-flash',
    name='search_agent',
    instruction='You are a helpful assistant that can search the web.',
    tools=[google_search],
)
```

**Use Cases:**
- Current events and news
- Real-time stock prices
- Fact checking
- Finding specific data points

#### Code Execution Tool

```python
from google.adk.agents import Agent
from google.adk.code_executors import BuiltInCodeExecutor

agent = Agent(
    model='gemini-2.5-flash',
    name='math_agent',
    instruction='You are a mathematician. Write and execute Python code to solve problems.',
    code_executor=BuiltInCodeExecutor()
)
```

**Sandboxed Execution:**
- Safe Python code execution
- Mathematical computations
- Data analysis
- No external network access by default

### 5.4 Advanced Tool Types

#### OpenAPI Integration

```python
# Import OpenAPI specifications as tools
from google.adk.tools import import_openapi_tool

tools = import_openapi_tool('path/to/openapi.yaml')
```

#### MCP (Model Context Protocol) Tools

```python
# Integrate MCP tools for specialized capabilities
from google.adk.tools import MCPTool

mcp_tool = MCPTool(
    name='external_service',
    # MCP configuration details
)
```

#### Agents as Tools

```python
# Use specialized agents as tools in parent agents
from google.adk.agents import Agent

specialist_agent = Agent(
    model='gemini-2.5-flash',
    name='data_specialist',
    # Agent configuration...
)

parent_agent = Agent(
    model='gemini-2.5-flash',
    name='coordinator',
    tools=[specialist_agent],  # Use agent as a tool
)
```

---

## 6. Models and AI Backends

### 6.1 Supported Gemini Models

**Latest Recommended:**
- `gemini-2.5-flash` - Fast, efficient, good for most use cases
- `gemini-2.5-pro` - More capable, slower
- `gemini-3-flash-preview` - Preview of next generation
- `gemini-3-pro-preview` - Preview pro model

**Via Google AI Studio:**
```python
root_agent = Agent(
    model='gemini-2.5-flash',  # String identifier for direct models
    # ...
)
```

**Via Vertex AI:**
```python
root_agent = Agent(
    model='projects/YOUR_PROJECT/locations/YOUR_LOCATION/endpoints/ENDPOINT_ID',
    # ...
)
```

### 6.2 Third-Party Models via Vertex AI

#### Anthropic Claude

```python
from google.adk.models import AnthropicVertex

model = AnthropicVertex(
    model_id='claude-3-5-sonnet@20241022',
    project_id='your-project-id',
    region='us-central1'
)

agent = Agent(
    model=model,
    # ...
)
```

#### Other Models

- Llama models (Meta)
- Mistral models
- Custom fine-tuned models
- External API endpoints

### 6.3 Model Configuration

```python
Agent(
    model='gemini-2.5-flash',
    temperature=0.7,          # Creativity (0-1)
    max_output_tokens=1024,   # Response length limit
    top_p=0.95,              # Diversity parameter
    top_k=40,                # Token selection
)
```

---

## 7. State Management and Data Flow

### 7.1 Shared State Across Agents

Workflow agents share state via a dictionary accessible to all sub-agents.

```python
# Sub-agents define output_key for state storage
analyst_1 = Agent(
    model='gemini-2.5-flash',
    name='analyst_1',
    instruction='Analyze data and store in state.',
    output_key='analysis_1'  # Store output in state['analysis_1']
)

analyst_2 = Agent(
    model='gemini-2.5-flash',
    name='analyst_2',
    instruction='Use analysis_1 from state for next analysis.',
    output_key='analysis_2'  # Store output in state['analysis_2']
)

# Both agents access shared state automatically
# analyst_2's instruction can reference analyst_1's output
```

### 7.2 Agent-to-Agent Communication

```python
# Sequential execution: state flows forward
sequential = SequentialAgent(
    sub_agents=[analyst_1, analyst_2],
    # analyst_2 receives state containing analyst_1's output
)

# Parallel execution: no automatic state sharing
parallel = ParallelAgent(
    sub_agents=[analyst_a, analyst_b, analyst_c],
    # Each agent receives same input
    # Results stored in separate state keys
)

# Loop execution: state persists through iterations
loop = LoopAgent(
    sub_agents=[checker, refiner],
    # Checker and refiner work with same evolving state
)
```

---

## 8. Running Agents

### 8.1 Python - Command Line Interface

```bash
# Run agent with interactive CLI
adk run my_agent

# With custom port for web interface
adk web --port 8080

# Note: Run from parent directory containing agent folder
```

### 8.2 TypeScript - With DevTools

```bash
# Run with CLI interface
npx @google/adk-devtools run agent.ts

# Run with web interface
npx @google/adk-devtools web
```

### 8.3 Programmatic Execution (Python)

```python
from google.adk.agents import Agent

agent = Agent(
    model='gemini-2.5-flash',
    # ... agent configuration
)

# Execute directly in code
result = agent.run(
    input="What's the weather today?",
    session_id="unique_session"
)

print(result.output)
```

### 8.4 Web Interface

**Access**: http://localhost:8000 (default) or http://localhost:8080 (custom)

**Features:**
- Interactive chat interface
- Select agent from dropdown
- Test multiple agents
- View execution logs
- Debug tool calls

⚠️ **Warning**: Web interface is for development only, not production-ready.

---

## 9. Evaluation Framework

### 9.1 Evaluation Workflow

1. **Define Stories** - Describe what you want agents to achieve
2. **Generate Test Cases** - Create synthetic test cases from stories
3. **Run Evaluations** - Execute tests against agents
4. **Analyze Results** - Examine outputs and tool invocations

### 9.2 Story Definition (CSV Format)

```csv
goal,goal_details
"What can the agent do for me?","List agent capabilities"
"How to get available flights?","Find flight options"
"Book a flight to Paris","Complete booking with confirmation"
```

### 9.3 Test Case Structure

Synthetic test cases contain:
- **Agent**: Which agent to test
- **Story**: Related goal from CSV
- **Starting Sentence**: User's initial request
- **Goals**: Expected outcomes
- **Goal Details**: Specific requirements

### 9.4 Running Evaluations

```bash
# Generate test cases from stories
adk evaluate/generate \
    --agent agent.py \
    --stories stories.csv \
    --output test_cases.json

# Run evaluation
adk evaluate \
    --test-cases test_cases.json \
    --output results.json
```

### 9.5 Interpreting Results

**Review:**
- Tool invocations and parameters
- Response summaries
- Goal matching vs actual output
- Execution trajectory

**Metrics:**
- Response quality
- Tool correctness
- Task completion
- Reasoning transparency

---

## 10. Security and Safety

### 10.1 Risk Assessment

Identify risks specific to your agent:
- **Vague instructions** - Model hallucination and incorrect actions
- **Prompt injection** - Adversarial user inputs
- **Indirect injection** - Via tool outputs
- **Unauthorized access** - Tool using wrong identity

### 10.2 Identity and Authorization

#### Agent-Based Authorization

Agent performs actions with its own identity (service account).

```python
# Set agent's service account permissions
# Grant specific IAM roles to service account
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member=serviceAccount:AGENT_SA@PROJECT_ID.iam.gserviceaccount.com \
    --role=roles/bigquery.dataEditor
```

**Advantages:**
- Simple to implement
- Deterministic permission enforcement
- Good for same-access-level users

**Limitations:**
- All users see agent as single identity
- No per-user access control
- Requires alternative techniques for multi-tenant

#### User-Based Authorization

User credentials flow through tool execution.

```python
# Use caller's credentials instead of agent's identity
# Implement per-user authorization in tools

def secure_database_query(query: str, user_context: dict) -> dict:
    """Query database with user's permissions."""
    # Verify user has permission for requested operation
    if not user_authorized(user_context, query):
        raise PermissionError(f"User not authorized for {query}")
    return execute_query(query)
```

### 10.3 In-Tool Guardrails

Design tools defensively with restricted actions.

```python
def transfer_funds(
    amount: float,
    recipient: str,
    max_per_transfer: float = 10000  # Hard limit in tool
) -> dict:
    """Transfer funds with built-in safety limits."""
    if amount > max_per_transfer:
        raise ValueError(f"Amount exceeds maximum {max_per_transfer}")
    
    # Validate recipient is in approved list
    if recipient not in APPROVED_RECIPIENTS:
        raise ValueError(f"{recipient} not approved for transfers")
    
    return perform_transfer(amount, recipient)
```

**Strategy:**
- Expose only required actions
- Implement parameter validation
- Hard-code safety limits
- Maintain audit logs

### 10.4 Guardrails via System Instructions

```python
agent = Agent(
    model='gemini-2.5-flash',
    instruction="""You are a helpful assistant with strict guidelines:

FORBIDDEN ACTIONS:
- Never modify user accounts or permissions
- Never access files outside specified directories
- Never execute commands containing 'rm', 'drop', or 'delete'

SAFETY REQUIREMENTS:
- Always confirm high-impact operations
- Provide reasoning for any tool usage
- Flag suspicious patterns

CONTENT POLICY:
- Refuse requests for harmful content
- Report security concerns immediately""",
)
```

### 10.5 Sandboxed Code Execution

```python
from google.adk.code_executors import BuiltInCodeExecutor

# Built-in executor: sandboxed, no external access
executor = BuiltInCodeExecutor()

agent = Agent(
    model='gemini-2.5-flash',
    code_executor=executor
)
```

**Security Features:**
- Hermetic environment - no network access
- No external API calls allowed
- Full cleanup between executions
- No cross-user data leakage
- Prevents code injection attacks

### 10.6 VPC-SC and Network Controls

```bash
# Restrict agent operations to VPC-SC perimeter
gcloud compute security-policies create adk-policy
gcloud compute security-policies rules create 1 \
    --security-policy adk-policy \
    --action "allow" \
    --condition-expr "path == '/agent/*'"
```

**Benefits:**
- Data exfiltration prevention
- Resource isolation
- Reduced attack surface

### 10.7 Security Checklist

- ✓ Perform risk assessment for your agent's capabilities
- ✓ Implement authentication (Google AI Studio or Vertex AI)
- ✓ Use identity-based authorization (agent or user)
- ✓ Design tools with guardrails
- ✓ Set clear system instructions
- ✓ Sandbox code execution
- ✓ Implement input/output validation
- ✓ Use VPC-SC for network isolation
- ✓ Enable audit logging
- ✓ Regular security testing

---

## 11. Deployment

### 11.1 Docker Containerization

#### Dockerfile for Python Agent

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy project files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variables
ENV GOOGLE_API_KEY=${GOOGLE_API_KEY}
ENV GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}

# Expose port for web interface
EXPOSE 8000

# Start server
CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile for TypeScript Agent

```dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Compile TypeScript
RUN npm run build

# Expose port
EXPOSE 8000

# Start service
CMD ["node", "server.js"]
```

#### Requirements.txt (Python)

```
google-adk>=0.2.0
google-cloud-vertex-ai>=1.0.0
fastapi>=0.100.0
uvicorn>=0.23.0
python-dotenv>=1.0.0
```

### 11.2 Google Cloud Run Deployment

#### Direct Source Deployment (Python)

```bash
gcloud run deploy website-builder-agent \
    --source . \
    --runtime python311 \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_API_KEY="YOUR_KEY" \
    --set-env-vars GOOGLE_CLOUD_PROJECT="your-project"
```

#### Docker Image Deployment

```bash
# Build container
docker build -t gcr.io/PROJECT_ID/my-agent:latest .

# Push to Container Registry
docker push gcr.io/PROJECT_ID/my-agent:latest

# Deploy to Cloud Run
gcloud run deploy my-agent \
    --image gcr.io/PROJECT_ID/my-agent:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

### 11.3 Vertex AI Agent Engine

```bash
# Create agent in Vertex AI Agent Engine
gcloud ai agents create my-agent \
    --region=us-central1 \
    --container-image-uri=gcr.io/PROJECT_ID/my-agent:latest \
    --service-account=agent-sa@PROJECT_ID.iam.gserviceaccount.com
```

### 11.4 Environment Configuration for Deployment

```bash
# .env.production
GOOGLE_API_KEY=your_api_key
GOOGLE_CLOUD_PROJECT=production_project
GOOGLE_CLOUD_LOCATION=us-central1
AGENT_PORT=8000
LOG_LEVEL=INFO
MAX_CONCURRENT_REQUESTS=10
TIMEOUT_SECONDS=30
```

### 11.5 Health Checks and Monitoring

```python
from fastapi import FastAPI, HTTPException
import logging

app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0"}

@app.get("/ready")
async def readiness_check():
    try:
        # Test agent initialization
        test_result = root_agent.run("test")
        return {"ready": True}
    except Exception as e:
        logging.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Not ready")

@app.post("/agent/chat")
async def chat(message: str):
    try:
        result = root_agent.run(message)
        return {"response": result.output}
    except Exception as e:
        logging.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 12. Advanced Patterns and Best Practices

### 12.1 Multi-Agent Workflows

#### Research and Report Generation Pipeline

```python
questions_generator = Agent(
    model='gemini-2.5-flash',
    name='questions_generator',
    instruction='Generate research questions about the topic.',
    output_key='questions'
)

research_agents = [
    Agent(
        model='gemini-2.5-flash',
        name=f'researcher_{i}',
        instruction=f'Research question {i} from state.',
        output_key=f'research_{i}'
    )
    for i in range(5)
]

parallel_research = ParallelAgent(
    name='parallel_research',
    sub_agents=research_agents
)

query_generator = Agent(
    model='gemini-2.5-flash',
    name='query_generator',
    instruction='Synthesize research into requirements.',
    output_key='requirements'
)

requirements_writer = Agent(
    model='gemini-2.5-flash',
    name='requirements_writer',
    instruction='Write detailed specifications.',
    output_key='specifications'
)

pipeline = SequentialAgent(
    name='research_pipeline',
    sub_agents=[
        questions_generator,
        parallel_research,
        query_generator,
        requirements_writer
    ]
)

root_agent = pipeline
```

### 12.2 Error Handling and Retry Logic

```python
from google.adk.agents import LoopAgent
import time

error_checker = Agent(
    model='gemini-2.5-flash',
    name='error_checker',
    instruction='Check previous result for errors.',
    output_key='error_analysis'
)

retry_executor = Agent(
    model='gemini-2.5-flash',
    name='retry_executor',
    instruction='Execute task, addressing previous errors.',
    output_key='result'
)

retry_pipeline = LoopAgent(
    name='retry_loop',
    sub_agents=[error_checker, retry_executor],
    max_iterations=3
)
```

### 12.3 Context Window Optimization

```python
def summarize_conversation(messages):
    """Summarize old messages to preserve token space."""
    return f"Summary: {len(messages)} previous messages processed"

agent = Agent(
    model='gemini-2.5-flash',
    name='context_aware',
    instruction='Maintain conversation context efficiently.',
    max_output_tokens=2048,
)

# Implement message summarization for long conversations
```

### 12.4 Streaming Responses

```python
# For long-running operations, implement streaming
async def stream_agent_response(message: str):
    """Stream agent response tokens."""
    async for token in agent.stream(message):
        yield f"data: {token}\n\n"
```

### 12.5 Custom Tool Integration

```python
# Integrate custom APIs and services
class DatabaseTool:
    def __init__(self, connection_string):
        self.conn = establish_connection(connection_string)
    
    def query(self, sql: str) -> list:
        """Execute SQL query and return results."""
        return self.conn.execute(sql).fetchall()

db_tool = DatabaseTool("postgresql://...")

agent = Agent(
    model='gemini-2.5-flash',
    tools=[db_tool.query]
)
```

---

## 13. Troubleshooting and Common Issues

### 13.1 API Key Issues

```
Error: "API key not found"
Solution:
1. Verify .env file exists in project root
2. Check GOOGLE_API_KEY is set correctly
3. For TypeScript, use GEMINI_API_KEY
4. Test key at https://aistudio.google.com/
```

### 13.2 Model Not Found

```
Error: "Model 'gemini-2.5-flash' not found"
Solution:
1. Verify model name spelling
2. Check if model is available in your region
3. Ensure authentication is working
4. For Vertex AI, use full resource string
```

### 13.3 Tool Execution Failures

```python
# Debug tool issues
from google.adk.agents import Agent
import logging

logging.basicConfig(level=logging.DEBUG)

agent = Agent(
    model='gemini-2.5-flash',
    tools=[my_tool],
)

# Run with verbose output
result = agent.run("test", debug=True)
```

### 13.4 TypeScript Compilation Issues

```
Error: "Cannot find module '@google/adk'"
Solution:
1. npm install @google/adk
2. Verify package.json has correct version
3. Check tsconfig.json verbatimModuleSyntax is false
4. Delete node_modules and package-lock.json, reinstall
```

### 13.5 Web Interface Not Loading

```bash
# Ensure port is available
lsof -i :8000  # Check port usage

# Run on different port
adk web --port 8080

# Firewall issues
# Check if port is blocked by firewall
sudo ufw allow 8000
```

---

## 14. Code Examples

### 14.1 Complete Python Agent

```python
from google.adk.agents import Agent, SequentialAgent
import json

# Define tools
def search_documentation(query: str) -> dict:
    """Search product documentation."""
    # Simulate documentation search
    results = {
        "query": query,
        "results": ["Doc 1", "Doc 2"],
        "count": 2
    }
    return results

def generate_response(docs: str) -> str:
    """Generate response based on documentation."""
    return f"Based on documentation: {docs}"

# Create specialized agents
doc_searcher = Agent(
    model='gemini-2.5-flash',
    name='doc_searcher',
    instruction='Search for relevant documentation about the user query.',
    tools=[search_documentation],
    output_key='search_results'
)

response_generator = Agent(
    model='gemini-2.5-flash',
    name='response_gen',
    instruction='Generate a helpful response using the search results from state.',
    tools=[generate_response],
    output_key='final_response'
)

# Create workflow
help_agent = SequentialAgent(
    name='help_workflow',
    sub_agents=[doc_searcher, response_generator],
    description='Helps users by searching documentation and generating responses'
)

root_agent = help_agent
```

### 14.2 Complete TypeScript Agent

```typescript
import {FunctionTool, LlmAgent, SequentialAgent} from '@google/adk';
import {z} from 'zod';

// Define tool with Zod schema
const searchDocumentation = new FunctionTool({
    name: 'search_documentation',
    description: 'Search product documentation.',
    parameters: z.object({
        query: z.string().describe("Search query"),
        limit: z.number()
            .describe("Maximum results")
            .default(5)
    }),
    execute: ({query, limit}) => {
        return {
            query,
            results: ["Doc 1", "Doc 2"],
            count: 2
        };
    }
});

// Create agents
const docSearcher = new LlmAgent({
    name: 'doc_searcher',
    model: 'gemini-2.5-flash',
    description: 'Searches documentation.',
    instruction: 'Search for relevant documentation.',
    tools: [searchDocumentation],
});

const responseGenerator = new LlmAgent({
    name: 'response_gen',
    model: 'gemini-2.5-flash',
    description: 'Generates responses.',
    instruction: 'Generate helpful response using search results.',
    tools: []
});

// Create workflow
export const helpWorkflow = new SequentialAgent({
    name: 'help_workflow',
    subAgents: [docSearcher, responseGenerator],
    description: 'Help users with documentation'
});

export const rootAgent = helpWorkflow;
```

---

## 15. Performance Optimization

### 15.1 Parallel Processing

Use `ParallelAgent` for independent tasks to reduce latency.

```python
# Good: Tasks are independent
parallel = ParallelAgent(
    sub_agents=[
        data_fetcher,      # Fetch from API
        report_preparer,   # Prepare report
        email_sender       # Send notification
    ]
)

# Bad: Tasks are dependent
sequential = SequentialAgent(
    sub_agents=[
        fetch_data,        # Must complete first
        process_data,      # Uses fetched data
        generate_report    # Uses processed data
    ]
)
```

### 15.2 Token Optimization

```python
# Summarize long contexts to save tokens
def optimize_context(messages):
    if len(messages) > 50:
        old_messages = messages[:-10]
        summary = agent.summarize(old_messages)
        return [summary] + messages[-10:]
    return messages

# Limit output tokens for simple tasks
simple_agent = Agent(
    model='gemini-2.5-flash',
    max_output_tokens=256,  # Shorter responses
)

# Larger token limit for complex tasks
complex_agent = Agent(
    model='gemini-2.5-flash',
    max_output_tokens=4096,  # Longer responses
)
```

### 15.3 Caching Strategies

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_cached_data(query: str) -> dict:
    """Cache expensive operations."""
    return fetch_from_api(query)

# Tool that uses caching
def search_with_cache(query: str) -> dict:
    return get_cached_data(query)

agent = Agent(
    model='gemini-2.5-flash',
    tools=[search_with_cache]
)
```

---

## 16. Version Compatibility Matrix

| Language | Latest Version | Min Runtime | Status |
|----------|---|---|---|
| Python | 0.2.0+ | 3.10 | Stable |
| TypeScript | 0.2.0 | Node 20.12.7 | Stable |
| Go | 0.3.0 | Go 1.21 | Stable |
| Java | 0.5.0 | Java 11+ | Stable |

---

## 17. Resources and Documentation Links

### Official Documentation
- Main Documentation: https://google.github.io/adk-docs/
- GitHub Repositories:
  - Python: https://github.com/google/adk-python
  - TypeScript: https://github.com/google/adk-typescript
  - Docs: https://github.com/google/adk-docs

### Community and Support
- GitHub Issues: Report bugs and request features
- Community Forums: Ask questions and share patterns
- YouTube: Video tutorials and walkthroughs

### Learning Resources
- Official Tutorials: Step-by-step guides
- Code Samples: GitHub examples
- Blog Posts: Advanced patterns and use cases
- API Reference: Complete parameter documentation

---

## 18. Glossary

**Agent** - An AI system that perceives its environment, reasons about it, and takes actions via tools.

**Tool** - A function or service that an agent can invoke to interact with external systems.

**State** - Shared dictionary of data passed between agents in a workflow.

**Workflow Agent** - Orchestrates multiple sub-agents in predefined patterns (sequential, parallel, loop).

**LlmAgent** - Uses an LLM to reason and decide which tools to use.

**Gemini** - Google's flagship large language model family.

**Vertex AI** - Google Cloud's enterprise AI platform.

**FunctionTool** - Type-safe tool definition using Zod schemas (TypeScript).

**Code Executor** - Sandboxed environment for executing agent-generated code.

**Evaluation** - Framework for testing agent behavior against test cases.

**Multi-Agent System** - Architecture composed of multiple specialized agents working together.

---

## Final Notes

This comprehensive guide covers all major aspects of the Google Agent Development Kit. For the most up-to-date information, always refer to the official documentation at https://google.github.io/adk-docs/.

**Key Takeaways:**
1. ADK is a flexible, production-ready framework for building AI agents
2. Supports multiple languages (Python, TypeScript, Go, Java)
3. Rich tool ecosystem enables powerful agent capabilities
4. Security and safety are built-in considerations
5. Deployment to cloud platforms is straightforward
6. Evaluation framework ensures agent reliability
7. Multi-agent architectures enable complex workflows

Start small with a simple agent, gradually add tools and complexity, and always test thoroughly before production deployment.