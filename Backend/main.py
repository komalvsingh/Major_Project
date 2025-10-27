from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
import os
from typing import Dict, List
from pdf2image import convert_from_bytes
from groq import Groq
import json
import re
from datetime import datetime
from dotenv import load_dotenv

# Configure Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:\Program Files\Tesseract-OCR\tessdata'

load_dotenv()
app = FastAPI(title="Scholarship Document Verification")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Document validation patterns
DOC_PATTERNS = {
    "aadhaar": {
        "number": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
        "keywords": ["aadhaar", "government of india", "uidai", "uid"],
        "fields": ["name", "dob", "aadhaar_number"]
    },
    "pan": {
        "number": r"\b[A-Z]{5}\d{4}[A-Z]\b",
        "keywords": ["income tax", "pan", "permanent account"],
        "fields": ["name", "pan_number", "dob"]
    },
    "marksheet": {
        "number": r"\b\d{6,12}\b",
        "keywords": ["marksheet", "marks", "grade", "examination", "university", "board", "result"],
        "fields": ["name", "roll_number", "marks", "institution"]
    },
    "income": {
        "number": r"\b[A-Z0-9]{8,15}\b",
        "keywords": ["income certificate", "annual income", "tehsildar", "revenue"],
        "fields": ["name", "income", "certificate_number"]
    },
    "caste": {
        "number": r"\b[A-Z0-9]{8,15}\b",
        "keywords": ["caste certificate", "scheduled caste", "scheduled tribe", "obc"],
        "fields": ["name", "caste", "certificate_number"]
    }
}

def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Optimize image for OCR"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply denoising with moderate strength
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    
    # Use adaptive thresholding for better text extraction
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)
    return thresh

def detect_tampering(image: np.ndarray) -> Dict:
    """Improved tampering detection - more realistic for scanned documents"""
    score = 100.0
    issues = []
    warnings = []
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    
    # 1. Compression artifacts analysis (ELA) - Adjusted thresholds
    _, jpg = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 90])
    recompressed = cv2.imdecode(jpg, cv2.IMREAD_COLOR)
    diff = cv2.absdiff(image, recompressed)
    ela_score = np.mean(diff)
    
    # More lenient thresholds - scanned docs have compression
    if ela_score > 35:  # Raised from 25
        issues.append("Significant compression inconsistency")
        score -= 25
    elif ela_score > 28:  # Raised from 18
        warnings.append("Moderate compression artifacts")
        score -= 10
    
    # 2. Edge consistency analysis - More realistic
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    
    # Adjusted thresholds for real documents
    if edge_density > 0.5:  # Raised from 0.4
        warnings.append("High edge density - detailed document")
        score -= 5
    elif edge_density < 0.02:  # Lowered from 0.05
        issues.append("Suspiciously smooth - possible digital creation")
        score -= 15
    
    # 3. Noise variance - Scanned documents have natural noise
    noise = cv2.Laplacian(gray, cv2.CV_64F).var()
    if noise < 15:  # Lowered from 30
        warnings.append("Low noise - high quality scan or digital")
        score -= 5
    elif noise > 800:  # Raised from 500
        warnings.append("High noise - poor scan quality")
        score -= 5
    
    # 4. Color channel consistency - More lenient
    if len(image.shape) == 3:
        b, g, r = cv2.split(image)
        b_std = np.std(b)
        g_std = np.std(g)
        r_std = np.std(r)
        
        if b_std < 3 or g_std < 3 or r_std < 3:  # Lowered from 5
            warnings.append("Limited color variation")
            score -= 10
    
    # 5. Duplicate region detection - Less aggressive
    block_size = 32
    blocks_seen = {}
    duplicates = 0
    
    for i in range(0, height - block_size, block_size * 2):  # Skip more blocks
        for j in range(0, width - block_size, block_size * 2):
            block = gray[i:i+block_size, j:j+block_size]
            block_hash = hash(block.tobytes())
            if block_hash in blocks_seen:
                duplicates += 1
            blocks_seen[block_hash] = True
    
    if duplicates > 10:  # Raised from 5
        issues.append("Repeated patterns found")
        score -= 10
    
    return {
        "authenticity_score": max(0, round(score, 1)),
        "tampering_detected": len(issues) > 0,  # Only critical issues
        "issues": issues,
        "warnings": warnings,  # Non-critical observations
        "metrics": {
            "ela_score": round(float(ela_score), 2),
            "edge_density": round(float(edge_density), 3),
            "noise_variance": round(float(noise), 2)
        }
    }

def extract_text_from_file(file_bytes: bytes, filename: str) -> tuple:
    """Extract text from image/PDF with quality assessment"""
    try:
        if filename.lower().endswith('.pdf'):
            images = convert_from_bytes(file_bytes, dpi=300)
            all_text = []
            tampering_results = []
            
            for img in images:
                img_array = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                tampering_results.append(detect_tampering(img_array))
                processed = preprocess_image(img_array)
                text = pytesseract.image_to_string(processed, lang='eng', config='--psm 6')
                all_text.append(text)
            
            combined_text = "\n".join(all_text).strip()
            avg_score = np.mean([r["authenticity_score"] for r in tampering_results])
            all_issues = [issue for r in tampering_results for issue in r["issues"]]
            all_warnings = [w for r in tampering_results for w in r.get("warnings", [])]
            
            return combined_text, {
                "authenticity_score": round(avg_score, 1),
                "tampering_detected": len(all_issues) > 0,
                "issues": list(set(all_issues)),
                "warnings": list(set(all_warnings))
            }
        else:
            image = Image.open(io.BytesIO(file_bytes))
            img_array = np.array(image)
            
            if len(img_array.shape) == 2:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
            elif img_array.shape[2] == 4:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
            else:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            tampering_result = detect_tampering(img_bgr)
            processed = preprocess_image(img_bgr)
            text = pytesseract.image_to_string(processed, lang='eng', config='--psm 6')
            
            return text.strip(), tampering_result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

def validate_document_pattern(text: str, doc_type: str) -> Dict:
    """Check document format and patterns"""
    validation = {
        "pattern_found": False,
        "keywords_found": False,
        "document_numbers": [],
        "keyword_count": 0
    }
    
    text_lower = text.lower()
    
    for key, pattern_data in DOC_PATTERNS.items():
        if key in doc_type.lower():
            # Check keywords
            keywords_match = sum(1 for kw in pattern_data["keywords"] if kw in text_lower)
            validation["keyword_count"] = keywords_match
            validation["keywords_found"] = keywords_match >= 1
            
            # Extract document numbers
            numbers = re.findall(pattern_data["number"], text, re.IGNORECASE)
            validation["document_numbers"] = numbers[:3]
            validation["pattern_found"] = len(numbers) > 0
            break
    
    return validation

def ai_validate_document(text: str) -> Dict:
    """AI-powered document validation with balanced criteria"""
    try:
        prompt = f"""Analyze this document and extract information. Return ONLY valid JSON.

Document Text:
{text}

Return JSON with this exact structure:
{{
  "document_type": "Exact type (Aadhaar Card/PAN Card/Marksheet/Income Certificate/Caste Certificate/Unknown)",
  "extracted_data": {{
    "name": "full name if found, else null",
    "document_number": "ID/number if found, else null",
    "dob": "date of birth if found, else null",
    "father_name": "father's name if found, else null",
    "address": "address if found, else null",
    "marks": "marks/grades if marksheet, else null",
    "roll_number": "roll/enrollment number if found, else null",
    "institution": "school/college name if found, else null",
    "income_amount": "annual income if income certificate, else null",
    "caste_category": "caste category if caste certificate, else null",
    "issue_date": "certificate issue date if found, else null",
    "validity": "validity period if found, else null"
  }},
  "confidence": 0-100,
  "is_valid_format": true/false,
  "quality_issues": ["list of any problems"],
  "text_clarity": "excellent/good/fair/poor",
  "completeness": 0-100
}}

Scoring Guidelines:
- confidence 80-100: Clear, readable, all key fields extracted
- confidence 60-79: Readable, most fields present, minor OCR issues
- confidence 40-59: Partially readable, some fields missing
- confidence 0-39: Poorly scanned, mostly unreadable

Be realistic - real scanned documents may have minor imperfections but are still valid."""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a document validator. Extract data accurately and give realistic confidence scores. Real scanned documents with minor imperfections should score 70-85."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean markdown formatting
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        return json.loads(result_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")

@app.get("/")
def root():
    return {
        "service": "Scholarship Document Verification",
        "version": "3.0 - Improved Accuracy",
        "supported_documents": ["Aadhaar", "PAN", "Marksheet", "Income Certificate", "Caste Certificate"],
        "features": ["OCR", "Smart Tampering Detection", "AI Validation", "Data Extraction"]
    }

@app.post("/verify")
async def verify_single_document(file: UploadFile = File(...)):
    """Verify a single document with improved accuracy and extracted data"""
    try:
        file_bytes = await file.read()
        
        # Extract text
        text, tampering = extract_text_from_file(file_bytes, file.filename)
        
        if not text or len(text) < 20:
            return JSONResponse({
                "status": "REJECTED",
                "decision": "REJECT",
                "reason": ["Cannot extract text - image quality too poor or document unreadable"],
                "confidence_score": 0,
                "authenticity_score": 0,
                "document_type": "Unknown",
                "extracted_data": {},
                "raw_text": text[:500] if text else ""
            })
        
        # AI validation
        ai_result = ai_validate_document(text)
        
        # Pattern validation
        pattern_check = validate_document_pattern(text, ai_result["document_type"])
        
        # Calculate scores
        confidence = ai_result["confidence"]
        authenticity = tampering["authenticity_score"]
        
        # IMPROVED Decision logic - More realistic thresholds
        status = "VERIFIED"
        decision = "ACCEPT"
        reason = []
        
        # Critical failures - immediate rejection
        if tampering["tampering_detected"] and authenticity < 60:  # Lowered from 70
            status = "REJECTED"
            decision = "REJECT"
            reason.append("Document shows significant signs of tampering")
        
        if confidence < 45:  # Lowered from 60 - realistic scans may score 50-70
            status = "REJECTED"
            decision = "REJECT"
            reason.append("Poor image quality - text not clearly readable")
        
        if ai_result["document_type"] == "Unknown":
            status = "REJECTED"
            decision = "REJECT"
            reason.append("Cannot identify document type")
        
        # Relaxed validation - real documents may not match all patterns
        if not pattern_check["pattern_found"] and not pattern_check["keywords_found"]:
            # Only reject if BOTH are missing
            status = "REJECTED"
            decision = "REJECT"
            reason.append("Document cannot be verified - missing key identifiers")
        
        # Combined score check - more lenient
        if status != "REJECTED":
            avg_score = (confidence + authenticity) / 2
            if avg_score < 55:  # Lowered from 70
                status = "REJECTED"
                decision = "REJECT"
                reason.append(f"Overall quality score too low ({round(avg_score, 1)}%)")
            else:
                reason.append("Document verified successfully")
                if tampering.get("warnings"):
                    reason.append(f"Note: {', '.join(tampering['warnings'][:2])}")
        
        return JSONResponse({
            "status": status,
            "decision": decision,
            "reason": reason,
            "document_type": ai_result["document_type"],
            "extracted_data": ai_result["extracted_data"],  # Now included!
            "confidence_score": round(confidence, 1),
            "authenticity_score": round(authenticity, 1),
            "text_clarity": ai_result.get("text_clarity", "unknown"),
            "completeness": ai_result.get("completeness", 0),
            "tampering_issues": tampering["issues"],
            "warnings": tampering.get("warnings", []),
            "validation": {
                "format_valid": ai_result["is_valid_format"],
                "pattern_match": pattern_check["pattern_found"],
                "keywords_found": pattern_check["keywords_found"],
                "keyword_count": pattern_check["keyword_count"],
                "numbers_found": pattern_check["document_numbers"]
            },
            "quality_metrics": tampering["metrics"],
            "raw_text_preview": text[:300] + "..." if len(text) > 300 else text,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-batch")
async def verify_multiple_documents(files: List[UploadFile] = File(...)):
    """Verify multiple documents with improved accuracy"""
    results = []
    
    for file in files:
        try:
            await file.seek(0)
            file_bytes = await file.read()
            
            text, tampering = extract_text_from_file(file_bytes, file.filename)
            
            if not text or len(text) < 20:
                results.append({
                    "filename": file.filename,
                    "status": "REJECTED",
                    "decision": "REJECT",
                    "reason": "Cannot extract text",
                    "confidence": 0,
                    "authenticity": 0,
                    "extracted_data": {}
                })
                continue
            
            ai_result = ai_validate_document(text)
            pattern_check = validate_document_pattern(text, ai_result["document_type"])
            
            confidence = ai_result["confidence"]
            authenticity = tampering["authenticity_score"]
            
            status = "VERIFIED"
            decision = "ACCEPT"
            
            # Apply improved criteria
            if (tampering["tampering_detected"] and authenticity < 60) or \
               confidence < 45 or \
               ai_result["document_type"] == "Unknown":
                status = "REJECTED"
                decision = "REJECT"
            elif not pattern_check["pattern_found"] and not pattern_check["keywords_found"]:
                status = "REJECTED"
                decision = "REJECT"
            elif (confidence + authenticity) / 2 < 55:
                status = "REJECTED"
                decision = "REJECT"
            
            results.append({
                "filename": file.filename,
                "status": status,
                "decision": decision,
                "document_type": ai_result["document_type"],
                "confidence": round(confidence, 1),
                "authenticity": round(authenticity, 1),
                "extracted_data": ai_result["extracted_data"],  # Now included!
                "tampering_detected": tampering["tampering_detected"],
                "warnings": tampering.get("warnings", [])
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "ERROR",
                "decision": "REJECT",
                "error": str(e),
                "extracted_data": {}
            })
    
    summary = {
        "accepted": sum(1 for r in results if r.get("decision") == "ACCEPT"),
        "rejected": sum(1 for r in results if r.get("decision") == "REJECT"),
        "error": sum(1 for r in results if r.get("status") == "ERROR")
    }
    
    return JSONResponse({
        "total_documents": len(files),
        "summary": summary,
        "results": results,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    import uvicorn
    
    if not os.getenv("GROQ_API_KEY"):
        print("⚠️ WARNING: GROQ_API_KEY not found in .env file")
    
    print("🚀 Starting Improved Document Verification System v3.0")
    print("📄 Supported: Aadhaar, PAN, Marksheet, Income & Caste Certificates")
    print("🔍 Features: Smart OCR + Balanced Tampering Detection + AI Extraction")
    print("✅ Realistic Scoring: Handles real scanned documents accurately")
    print("📊 Extracted Data: Now displays all extracted information")
    print("📚 API Docs: http://localhost:8001/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)