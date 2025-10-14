import os
import uuid
import tempfile
import requests
import json
from pathlib import Path
from datetime import datetime
import uvicorn
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import speech_recognition as sr
from gtts import gTTS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_api_key_here")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

app = FastAPI(title="Scholarship Platform Help Desk Chatbot")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio files directory
UPLOAD_DIR = Path("audio_files")
UPLOAD_DIR.mkdir(exist_ok=True)

# Pydantic Models
class QueryModel(BaseModel):
    message: str
    user_id: Optional[str] = None
    user_role: Optional[str] = "student"  # student, sag_officer, finance_bureau

class ScholarshipQueryModel(BaseModel):
    query_type: str  # registration, document_upload, verification, disbursement, technical
    question: str
    user_role: Optional[str] = "student"

def text_to_speech(text, lang='en'):
    """Convert text to speech and save as an audio file."""
    try:
        audio_filename = f"scholarship_help_{uuid.uuid4()}.mp3"
        filepath = UPLOAD_DIR / audio_filename
        
        tts_text = text[:800] if len(text) > 800 else text
        tts = gTTS(text=tts_text, lang=lang, slow=False)
        tts.save(str(filepath))
        
        return audio_filename
    except Exception as e:
        print(f"Text-to-speech error: {e}")
        return None

def generate_scholarship_response(message, user_role="student"):
    """Generate scholarship help desk response using Groq API."""
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        system_prompt = f"""You are ScholarBot, an intelligent help desk assistant for a blockchain-based scholarship platform.

PLATFORM OVERVIEW:
- AI-powered document verification system
- Blockchain-based transparency (Ethereum testnet - Polygon Mumbai/Sepolia)
- Multi-stage workflow: Registration → Document Upload → AI Verification → SAG Bureau Verification → Finance Bureau Approval → Disbursement
- Secure document storage using IPFS/Filecoin
- Real-time tracking with blockchain transaction hashes

YOUR ROLE:
- Answer queries about registration, document upload, verification process, and disbursement
- Guide users through the platform workflow
- Explain technical features (AI verification, blockchain, IPFS)
- Provide troubleshooting help
- Be clear, helpful, and professional

CURRENT USER ROLE: {user_role}

KEY WORKFLOWS TO EXPLAIN:

1. STUDENT REGISTRATION & DOCUMENT UPLOAD:
   - Register/login with JWT authentication
   - Upload required documents: Aadhar, marksheets, income certificate, caste certificate (if applicable)
   - Documents stored on IPFS/Filecoin with metadata in MongoDB
   - Support for multiple file formats (PDF, JPG, PNG)

2. AI DOCUMENT VERIFICATION:
   - Automated document classification using CNN/BERT models
   - OCR extraction (Tesseract/AWS Textract)
   - Fake document detection (signature verification, tampering check)
   - Results sent to SAG officer for review

3. SAG BUREAU VERIFICATION:
   - SAG officers review AI verification results
   - Accept/Reject documents with remarks
   - Verified documents are hashed and recorded on Ethereum testnet
   - Status updated in real-time

4. FINANCE BUREAU APPROVAL:
   - Automatically routed after SAG verification
   - Finance officers approve disbursement
   - Smart contract triggers scholarship transaction

5. DISBURSEMENT & TRACKING:
   - Mock payment on testnet (ERC20 transfer simulation)
   - Students receive blockchain transaction hash
   - Timeline view shows all stages with timestamps
   - Email and in-app notifications

TECHNICAL FEATURES:
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express with MongoDB
- AI Engine: Python microservice with document classification
- Blockchain: Ethereum testnet (Polygon Mumbai/Sepolia)
- Smart Contracts: Web3.js/Ethers.js integration
- Storage: IPFS for documents, MongoDB for metadata

COMMON QUERIES TO HANDLE:
- How to register and upload documents
- What documents are required
- How long verification takes
- What happens if documents are rejected
- How to track application status
- Understanding blockchain transaction hashes
- Troubleshooting upload issues
- Explaining AI verification results
- Disbursement timeline and process

GUIDELINES:
- Be concise and clear
- Provide step-by-step instructions when needed
- Explain technical terms in simple language
- Include relevant links or next steps
- If the query is beyond your scope, direct to appropriate support channel"""

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            "temperature": 0.3,
            "max_tokens": 1200
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Groq API error: {e}")
        return "I'm experiencing technical difficulties. Please contact our support team at support@scholarshipplatform.com or try again later."

@app.post("/chat")
async def scholarship_chat(query: QueryModel):
    """Process scholarship help desk chat messages."""
    try:
        response_text = generate_scholarship_response(query.message, query.user_role)
        audio_filename = text_to_speech(response_text, 'en')
        
        return {
            "text_response": response_text,
            "audio_file_path": audio_filename,
            "timestamp": datetime.now().isoformat(),
            "user_role": query.user_role
        }
    except Exception as e:
        return {
            "error": str(e),
            "text_response": "I'm here to help! Please try rephrasing your question or contact support@scholarshipplatform.com",
            "audio_file_path": None
        }

@app.post("/scholarship-query")
async def handle_scholarship_query(query: ScholarshipQueryModel):
    """Handle categorized scholarship queries."""
    try:
        # Format question based on query type
        formatted_query = f"[{query.query_type.upper()}] {query.question}"
        
        response_text = generate_scholarship_response(formatted_query, query.user_role)
        
        return {
            "query_type": query.query_type,
            "answer": response_text,
            "timestamp": datetime.now().isoformat(),
            "user_role": query.user_role
        }
    except Exception as e:
        return {
            "error": str(e),
            "answer": "Please contact our support team for assistance with your query."
        }

@app.post("/voice-input")
async def process_voice(file: UploadFile = File(...)):
    """Process voice input and generate response."""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    try:
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_file.name) as source:
            audio = recognizer.record(source)
        
        transcribed_text = recognizer.recognize_google(audio, language='en-US')
        response_text = generate_scholarship_response(transcribed_text)
        audio_filename = text_to_speech(response_text, 'en')

        return {
            "transcribed_text": transcribed_text,
            "text_response": response_text,
            "audio_file_path": audio_filename,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "text_response": "I couldn't process your voice input. Please try again or type your question."
        }
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Retrieve audio files."""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(str(file_path))

@app.get("/faq")
async def get_faqs():
    """Get frequently asked questions."""
    return {
        "faqs": [
            {
                "category": "registration",
                "questions": [
                    {
                        "q": "How do I register on the platform?",
                        "a": "Click on 'Register' button, fill in your details, and verify your email. You'll need a valid email ID and phone number."
                    },
                    {
                        "q": "What documents do I need to upload?",
                        "a": "Required documents: Aadhar card, latest marksheet, income certificate. Optional: caste certificate (if applicable)."
                    }
                ]
            },
            {
                "category": "verification",
                "questions": [
                    {
                        "q": "How long does verification take?",
                        "a": "AI verification is instant. SAG Bureau review takes 2-3 business days. Finance approval takes 1-2 business days after SAG verification."
                    },
                    {
                        "q": "What if my documents are rejected?",
                        "a": "You'll receive a notification with rejection reasons. You can re-upload corrected documents through your dashboard."
                    }
                ]
            },
            {
                "category": "disbursement",
                "questions": [
                    {
                        "q": "How will I receive the scholarship?",
                        "a": "After Finance Bureau approval, funds are disbursed via blockchain transaction. You'll receive the transaction hash for tracking."
                    },
                    {
                        "q": "How do I track my application?",
                        "a": "Login to your dashboard to see real-time status with timeline view showing all stages and blockchain transaction details."
                    }
                ]
            }
        ]
    }

@app.get("/platform-info")
async def get_platform_info():
    """Get platform information and features."""
    return {
        "platform_name": "Blockchain Scholarship Platform",
        "features": [
            "AI-powered document verification",
            "Blockchain-based transparency",
            "IPFS secure document storage",
            "Real-time application tracking",
            "Multi-stage verification workflow",
            "Automated disbursement"
        ],
        "workflow_stages": [
            "Student Registration",
            "Document Upload",
            "AI Verification",
            "SAG Bureau Verification",
            "Finance Bureau Approval",
            "Disbursement"
        ],
        "tech_stack": {
            "frontend": "React + Tailwind CSS",
            "backend": "Node.js + Express + MongoDB",
            "ai_engine": "Python microservice with OCR",
            "blockchain": "Ethereum testnet (Polygon Mumbai/Sepolia)",
            "storage": "IPFS/Filecoin"
        },
        "support_email": "support@scholarshipplatform.com"
    }

@app.get("/health-check")
async def health_check():
    return {
        "status": "healthy",
        "service": "Scholarship Platform Help Desk Chatbot",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Scholarship Platform Help Desk",
        "description": "AI-powered chatbot to assist with scholarship queries",
        "endpoints": {
            "chat": "/chat - General chat interface",
            "scholarship_query": "/scholarship-query - Categorized queries",
            "voice": "/voice-input - Voice-based queries",
            "faq": "/faq - Frequently asked questions",
            "platform_info": "/platform-info - Platform details",
            "health": "/health-check - Service health status"
        },
        "supported_query_types": [
            "registration",
            "document_upload",
            "verification",
            "disbursement",
            "technical"
        ]
    }

if __name__ == "__main__":
    
    print("Starting Scholarship Platform Help Desk Chatbot...")
    uvicorn.run(app, host="0.0.0.0", port=8000)