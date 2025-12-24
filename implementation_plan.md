# FreshLogic Implementation Plan

## Goal Description
Build **FreshLogic**, an active problem-solving agent for agricultural supply chains. Feature set now includes **ChromaDB** for RAG and **Gemini Grounding** for web-enhanced answers.

## User Review Required
> [!IMPORTANT]
> **API Selection**: Please confirm the API choices below for the "Live Analysis Data Model" before we purchase/integrate them.
> 1. **Weather**: OpenWeatherMap (Free Tier available) or Google Earth Engine?
> 2. **Maps**: Google Maps Routes API (Pay-as-you-go).
> 3. **Market Data**: Do we need live pricing (e.g., eNAM/Mandi prices for India) to suggest "alternative buyers"?

## Proposed Architecture

### Tech Stack
- **Frontend**: React (Vite, TypeScript), Tailwind CSS, Recharts.
- **Backend**: FastAPI (Python), ChromaDB (Vector Store), Gemini 2.5 Flash (Agent).
- **AI Features**:
    - **Grounding**: Use Google Search for real-time market/weather validation.
    - **RAG**: ChromaDB stores historical reports, user manuals, and processed analysis logs.

### MVP Features (4-Stage Pipeline)
1. **Baseline Intelligence**: External ML Model (Mocked for now).
2. **Real-Time Analysis**: Mock telemetry data stream.
3. **Agentic Reasoning**: Gemini Agent with **Grounding** + **RAG**.
4. **Conversational Interface**: Chatbot with context.

## Proposed Changes

### [Backend](file:///c:/Users/Amaan/Downloads/FreshLogic/backend)
#### [NEW] `main.py`
Entry point for FastAPI server.
#### [NEW] `services/model_inference.py`
Mock implementation of the ML model contract.
#### [NEW] `services/rag_service.py`
ChromaDB setup: Insert documents, Query relevant context.
#### [NEW] `agents/gemini_agent.py`
Gemini client configured with:
- `tools=[{google_search_retrieval: ...}]` (Grounding)
- Context from `rag_service`.

### [Frontend](file:///c:/Users/Amaan/Downloads/FreshLogic/frontend)
#### [NEW] `src/App.tsx`
Main layout switching between "Graphs" and "Report/Chat".
#### [NEW] `src/components/Dashboard.tsx`
Visualizes telemetry and spoilage risk.
#### [NEW] `src/components/ChatInterface.tsx`
Interface for communicating with the Gemini Agent.

## Verification Plan
### Automated Tests
- Backend: Pytest for model inference and agent response format.
- Frontend: Vitest for component rendering.
### Manual Verification
- **Scenario Method**: "Why is the price high?"
    - Verify: Agent searches web (Grounding) and checks past reports (RAG) to answer.
