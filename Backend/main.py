"""
Enhanced Document Verification System for Scholarship Platform
No user credentials required - Admin verifies student-uploaded documents
Uses OCR, AI validation, and document authenticity checks
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
import os
from typing import Dict, Optional, List
import tempfile
from pdf2image import convert_from_bytes
from groq import Groq
import time
import json
import re
from datetime import datetime
from pydantic import BaseModel
from dotenv import load_dotenv
import hashlib

# Configure Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:\Program Files\Tesseract-OCR\tessdata'

load_dotenv()

app = FastAPI(title="Scholarship Document Verification System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Models
class VerificationResponse(BaseModel):
    document_type: str
    extracted_data: Dict
    confidence_score: float
    authenticity_score: float
    tampering_detected: bool
    validation_checks: Dict
    verification_result: str
    recommendations: List[str]

# Document validation patterns
DOCUMENT_PATTERNS = {
    "aadhaar": {
        "number_pattern": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
        "required_fields": ["name", "dob", "aadhaar_number"],
        "keywords": ["government of india", "aadhaar", "uidai", "unique identification"]
    },
    "pan": {
        "number_pattern": r"\b[A-Z]{5}\d{4}[A-Z]\b",
        "required_fields": ["name", "pan_number", "dob"],
        "keywords": ["income tax", "pan", "permanent account number"]
    },
    "marksheet": {
        "number_pattern": r"\b\d{6,12}\b",
        "required_fields": ["name", "roll_number", "marks", "institution"],
        "keywords": ["marksheet", "marks", "grade", "examination", "university", "board"]
    },
    "income_certificate": {
        "number_pattern": r"\b[A-Z0-9]{8,15}\b",
        "required_fields": ["name", "income", "certificate_number"],
        "keywords": ["income certificate", "annual income", "tehsildar", "revenue"]
    },
    "caste_certificate": {
        "number_pattern": r"\b[A-Z0-9]{8,15}\b",
        "required_fields": ["name", "caste", "certificate_number"],
        "keywords": ["caste certificate", "scheduled caste", "scheduled tribe", "obc"]
    }
}

# OCR Preprocessing
def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Advanced preprocessing for better OCR"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(thresh)
    return enhanced

def detect_tampering(image: np.ndarray) -> Dict:
    """Detect potential tampering in document image"""
    tampering_indicators = []
    authenticity_score = 100.0
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Error Level Analysis (ELA) - simplified version
    # Check for inconsistent compression artifacts
    _, encoded = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 90])
    recompressed = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    diff = cv2.absdiff(image, recompressed)
    ela_score = np.mean(diff)
    
    if ela_score > 15:
        tampering_indicators.append("Inconsistent compression artifacts detected")
        authenticity_score -= 20
    
    # 2. Edge Detection Analysis
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    
    if edge_density > 0.3:
        tampering_indicators.append("Unusual edge density - possible digital manipulation")
        authenticity_score -= 15
    
    # 3. Noise Analysis
    noise = cv2.Laplacian(gray, cv2.CV_64F).var()
    if noise < 50:
        tampering_indicators.append("Suspiciously low noise level")
        authenticity_score -= 10
    
    # 4. Color Consistency
    if len(image.shape) == 3:
        b, g, r = cv2.split(image)
        if np.std(b) < 5 or np.std(g) < 5 or np.std(r) < 5:
            tampering_indicators.append("Unnatural color distribution")
            authenticity_score -= 15
    
    return {
        "tampering_indicators": tampering_indicators,
        "authenticity_score": max(0, authenticity_score),
        "ela_score": float(ela_score),
        "edge_density": float(edge_density),
        "noise_variance": float(noise)
    }

def extract_text_from_image(file_bytes: bytes, filename: str) -> tuple:
    """Extract text and perform image analysis"""
    try:
        if filename.lower().endswith('.pdf'):
            images = convert_from_bytes(file_bytes)
            extracted_text = ""
            tampering_results = []
            
            for img in images:
                img_array = np.array(img)
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                
                # Tampering detection
                tampering_results.append(detect_tampering(img_bgr))
                
                # OCR
                processed = preprocess_image(img_bgr)
                text = pytesseract.image_to_string(processed, lang='eng')
                extracted_text += text + "\n"
            
            # Average tampering results
            avg_tampering = {
                "tampering_indicators": [],
                "authenticity_score": np.mean([r["authenticity_score"] for r in tampering_results])
            }
            for result in tampering_results:
                avg_tampering["tampering_indicators"].extend(result["tampering_indicators"])
            
            return extracted_text.strip(), avg_tampering
        
        else:
            image = Image.open(io.BytesIO(file_bytes))
            img_array = np.array(image)
            
            if len(img_array.shape) == 2:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
            elif img_array.shape[2] == 4:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
            else:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Tampering detection
            tampering_result = detect_tampering(img_bgr)
            
            # OCR
            processed = preprocess_image(img_bgr)
            text = pytesseract.image_to_string(processed, lang='eng')
            
            return text.strip(), tampering_result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

def validate_document_format(extracted_text: str, document_type: str) -> Dict:
    """Validate document against known patterns"""
    validation_results = {
        "format_valid": False,
        "required_fields_found": [],
        "missing_fields": [],
        "pattern_matches": []
    }
    
    text_lower = extracted_text.lower()
    doc_type = document_type.lower()
    
    if doc_type in DOCUMENT_PATTERNS:
        pattern_config = DOCUMENT_PATTERNS[doc_type]
        
        # Check for keywords
        keyword_found = any(kw in text_lower for kw in pattern_config["keywords"])
        if keyword_found:
            validation_results["format_valid"] = True
        
        # Check for document number pattern
        number_pattern = pattern_config["number_pattern"]
        matches = re.findall(number_pattern, extracted_text, re.IGNORECASE)
        if matches:
            validation_results["pattern_matches"] = matches[:3]  # Store up to 3 matches
    
    return validation_results

def validate_with_ai(extracted_text: str, student_data: Optional[Dict] = None) -> Dict:
    """Enhanced AI validation with cross-verification"""
    try:
        student_context = ""
        if student_data:
            student_context = f"""
            
Student Information for Cross-Verification:
- Name: {student_data.get('name', 'N/A')}
- DOB: {student_data.get('dob', 'N/A')}
- Application ID: {student_data.get('application_id', 'N/A')}

Please verify if document details match student information.
"""
        
        prompt = f"""Analyze this document for scholarship verification and provide a structured JSON response:

Document Text:
{extracted_text}
{student_context}

Analyze and return JSON with:
1. document_type: Exact type (Aadhaar Card, PAN Card, Marksheet, Income Certificate, Caste Certificate, etc.)
2. extracted_fields: All key information found
   - For Aadhaar: name, aadhaar_number, dob, address, gender
   - For PAN: name, pan_number, dob, father_name
   - For Marksheet: name, roll_number, marks, percentage, institution, year, board
   - For Income Certificate: name, father_name, income, certificate_number, issuing_authority, issue_date
   - For Caste Certificate: name, caste, certificate_number, issuing_authority, issue_date
3. confidence_score: 0-100 based on text clarity and completeness
4. data_quality_issues: List any OCR errors, unclear text, missing information
5. cross_verification_status: If student data provided, mention match/mismatch
6. is_valid_format: Boolean for standard format compliance
7. suspicious_elements: Any unusual formatting, text, or inconsistencies
8. recommendations: Suggestions for admin (accept/reject/request re-upload/manual review)

Return ONLY valid JSON, no markdown."""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert document verification AI for scholarship applications. Be thorough and strict in validation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        result = json.loads(result_text)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")

# API Endpoints
@app.get("/")
def read_root():
    return {
        "message": "Scholarship Document Verification System",
        "version": "2.0",
        "description": "Admin-side document verification without requiring student credentials",
        "endpoints": {
            "verify": "/verify (POST)",
            "batch_verify": "/batch-verify (POST)",
            "health": "/health (GET)"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Scholarship Document Verification"}

@app.post("/verify")
async def verify_document(
    file: UploadFile = File(...),
    student_name: Optional[str] = Form(None),
    student_dob: Optional[str] = Form(None),
    application_id: Optional[str] = Form(None),
    expected_document_type: Optional[str] = Form(None)
):
    """
    Verify uploaded document without requiring DigiLocker credentials
    - Performs OCR text extraction
    - Detects tampering/manipulation
    - Validates with AI
    - Cross-verifies with student data (if provided)
    """
    try:
        file_bytes = await file.read()
        
        # Extract text and detect tampering
        extracted_text, tampering_analysis = extract_text_from_image(file_bytes, file.filename)
        
        if not extracted_text or len(extracted_text) < 10:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract sufficient text. Please upload a clearer image/PDF."
            )
        
        # Prepare student data for cross-verification
        student_data = None
        if student_name or student_dob or application_id:
            student_data = {
                "name": student_name,
                "dob": student_dob,
                "application_id": application_id
            }
        
        # AI Validation
        ai_result = validate_with_ai(extracted_text, student_data)
        
        # Format validation
        doc_type = ai_result.get("document_type", "").lower()
        format_validation = validate_document_format(extracted_text, doc_type)
        
        # Calculate final scores
        confidence_score = ai_result.get("confidence_score", 0)
        authenticity_score = tampering_analysis["authenticity_score"]
        
        # Determine verification result
        tampering_detected = len(tampering_analysis["tampering_indicators"]) > 0
        verification_result = "VERIFIED"
        recommendations = []
        
        if tampering_detected and authenticity_score < 60:
            verification_result = "REJECTED - Tampering Detected"
            recommendations.append("Document shows signs of digital manipulation. Request original document.")
        elif confidence_score < 50:
            verification_result = "REJECTED - Poor Quality"
            recommendations.append("OCR confidence too low. Request higher quality image/scan.")
        elif not ai_result.get("is_valid_format", True):
            verification_result = "REJECTED - Invalid Format"
            recommendations.append("Document does not match standard format. Verify authenticity.")
        elif confidence_score < 70:
            verification_result = "NEEDS MANUAL REVIEW"
            recommendations.append("Moderate confidence score. Recommend manual verification by admin.")
        else:
            verification_result = "VERIFIED"
            recommendations.append("Document appears authentic and readable.")
        
        # Check expected document type
        if expected_document_type and expected_document_type.lower() not in doc_type:
            verification_result = "REJECTED - Wrong Document Type"
            recommendations.append(f"Expected {expected_document_type}, but detected {ai_result.get('document_type')}")
        
        response = {
            "document_type": ai_result.get("document_type", "Unknown"),
            "extracted_data": ai_result.get("extracted_fields", {}),
            "confidence_score": confidence_score,
            "authenticity_score": authenticity_score,
            "tampering_detected": tampering_detected,
            "validation_checks": {
                "format_validation": format_validation,
                "tampering_analysis": tampering_analysis,
                "data_quality_issues": ai_result.get("data_quality_issues", []),
                "suspicious_elements": ai_result.get("suspicious_elements", []),
                "cross_verification": ai_result.get("cross_verification_status", "Not Applicable")
            },
            "verification_result": verification_result,
            "recommendations": recommendations + ai_result.get("recommendations", []),
            "extracted_text_preview": extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text,
            "timestamp": datetime.now().isoformat()
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.post("/batch-verify")
async def batch_verify_documents(
    files: List[UploadFile] = File(...),
    student_name: Optional[str] = Form(None),
    student_dob: Optional[str] = Form(None),
    application_id: Optional[str] = Form(None)
):
    """Verify multiple documents at once for a single student"""
    results = []
    
    for file in files:
        try:
            # Reset file pointer
            await file.seek(0)
            
            # Verify each document
            file_bytes = await file.read()
            extracted_text, tampering_analysis = extract_text_from_image(file_bytes, file.filename)
            
            student_data = None
            if student_name or student_dob or application_id:
                student_data = {
                    "name": student_name,
                    "dob": student_dob,
                    "application_id": application_id
                }
            
            ai_result = validate_with_ai(extracted_text, student_data)
            
            results.append({
                "filename": file.filename,
                "document_type": ai_result.get("document_type", "Unknown"),
                "confidence_score": ai_result.get("confidence_score", 0),
                "authenticity_score": tampering_analysis["authenticity_score"],
                "verification_result": "VERIFIED" if ai_result.get("confidence_score", 0) > 70 else "NEEDS REVIEW",
                "extracted_data": ai_result.get("extracted_fields", {})
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e),
                "verification_result": "FAILED"
            })
    
    return JSONResponse(content={
        "total_documents": len(files),
        "results": results,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    import uvicorn
    
    if not os.getenv("GROQ_API_KEY"):
        print("WARNING: GROQ_API_KEY not set in .env file")
        print("Add GROQ_API_KEY=your_key_here to .env file")
    
    print("Starting Scholarship Document Verification System...")
    print("Tesseract OCR Path: C:\\Program Files\\Tesseract-OCR\\tesseract.exe")
    print("API Documentation: http://localhost:8001/docs")
    print("\nThis system verifies documents WITHOUT requiring student DigiLocker credentials")
    print("Admin can verify uploaded documents directly\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)