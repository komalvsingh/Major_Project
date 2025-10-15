"""
Document Verification System with OCR, AI Validation, and DigiLocker Integration
Requirements:
pip install fastapi uvicorn python-multipart pytesseract opencv-python pillow pdf2image groq selenium python-dotenv
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
import os
from typing import Dict, Optional
import tempfile
from pdf2image import convert_from_bytes
from groq import Groq
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import json
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Document Verification System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Models
class VerificationResponse(BaseModel):
    document_type: str
    extracted_data: Dict
    confidence_score: float
    tampering_detected: bool
    digilocker_status: Optional[str]
    verification_result: str

# OCR Preprocessing
def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Preprocess image for better OCR accuracy"""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Increase contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(thresh)
    
    return enhanced

def extract_text_from_image(file_bytes: bytes, filename: str) -> str:
    """Extract text from image or PDF using Tesseract OCR"""
    try:
        # Handle PDF files
        if filename.lower().endswith('.pdf'):
            images = convert_from_bytes(file_bytes)
            extracted_text = ""
            for img in images:
                img_array = np.array(img)
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                processed = preprocess_image(img_bgr)
                text = pytesseract.image_to_string(processed, lang='eng')
                extracted_text += text + "\n"
            return extracted_text.strip()
        
        # Handle image files
        else:
            image = Image.open(io.BytesIO(file_bytes))
            img_array = np.array(image)
            
            # Convert to BGR if needed
            if len(img_array.shape) == 2:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
            elif img_array.shape[2] == 4:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
            else:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Preprocess and extract text
            processed = preprocess_image(img_bgr)
            text = pytesseract.image_to_string(processed, lang='eng')
            return text.strip()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

def validate_with_ai(extracted_text: str) -> Dict:
    """Use Groq API to validate and extract information from document"""
    try:
        prompt = f"""Analyze this document text and provide a structured JSON response with the following information:

Document Text:
{extracted_text}

Please identify:
1. document_type: The type of document (Aadhaar, PAN, Driving License, Passport, Income Certificate, Marksheet, etc.)
2. extracted_fields: Key information from the document (name, document_number, dob, address, etc. based on document type)
3. confidence_score: A score from 0-100 indicating OCR text quality and completeness
4. tampering_indicators: List any signs of tampering or inconsistencies
5. is_valid_format: Boolean indicating if the document follows standard format

Return ONLY valid JSON without any markdown formatting or explanation.
"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert document verification AI. Analyze documents and return structured JSON data only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1000
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean up response if it contains markdown
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        result = json.loads(result_text)
        return result
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")

def verify_with_digilocker(document_type: str, document_number: str, digilocker_username: str, digilocker_password: str) -> Dict:
    """Verify document using DigiLocker via Selenium automation"""
    driver = None
    try:
        # Setup Chrome options
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        
        driver = webdriver.Chrome(options=options)
        driver.get("https://www.digilocker.gov.in/")
        
        # Wait and login
        wait = WebDriverWait(driver, 15)
        
        # Click Sign In
        sign_in_btn = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Sign In")))
        sign_in_btn.click()
        
        time.sleep(2)
        
        # Enter username
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        username_field.send_keys(digilocker_username)
        
        # Enter password
        password_field = driver.find_element(By.ID, "password")
        password_field.send_keys(digilocker_password)
        
        # Click login
        login_btn = driver.find_element(By.ID, "login-btn")
        login_btn.click()
        
        time.sleep(5)
        
        # Navigate to issued documents
        issued_docs = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Issued Documents")))
        issued_docs.click()
        
        time.sleep(3)
        
        # Search for document based on type
        verification_status = "Not Found"
        
        if document_type.lower() == "aadhaar":
            # Look for Aadhaar in issued documents
            try:
                aadhaar_section = driver.find_element(By.XPATH, f"//*[contains(text(), '{document_number}')]")
                if aadhaar_section:
                    verification_status = "Verified - Document Found in DigiLocker"
            except NoSuchElementException:
                verification_status = "Not Verified - Document Not Found"
        
        elif document_type.lower() == "pan":
            # Look for PAN in issued documents
            try:
                pan_section = driver.find_element(By.XPATH, f"//*[contains(text(), '{document_number}')]")
                if pan_section:
                    verification_status = "Verified - Document Found in DigiLocker"
            except NoSuchElementException:
                verification_status = "Not Verified - Document Not Found"
        
        else:
            # Generic search for other documents
            try:
                search_box = driver.find_element(By.XPATH, "//input[@type='search' or @placeholder='Search']")
                search_box.send_keys(document_number)
                time.sleep(2)
                
                results = driver.find_elements(By.XPATH, f"//*[contains(text(), '{document_number}')]")
                if results:
                    verification_status = "Verified - Document Found in DigiLocker"
                else:
                    verification_status = "Not Verified - Document Not Found"
            except NoSuchElementException:
                verification_status = "Verification Unavailable - Search Not Possible"
        
        return {
            "status": verification_status,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except TimeoutException:
        return {
            "status": "Verification Failed - Timeout",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        return {
            "status": f"Verification Failed - {str(e)}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    finally:
        if driver:
            driver.quit()

# API Endpoints
@app.get("/")
def read_root():
    return {
        "message": "Document Verification System API",
        "version": "1.0",
        "endpoints": {
            "verify": "/verify (POST)",
            "health": "/health (GET)"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Document Verification System"}

@app.post("/verify")
async def verify_document(
    file: UploadFile = File(...),
    digilocker_username: Optional[str] = None,
    digilocker_password: Optional[str] = None,
    enable_digilocker: bool = False
):
    """
    Main endpoint to verify documents
    - Extracts text using OCR
    - Validates using AI
    - Optionally verifies via DigiLocker
    """
    try:
        # Read file
        file_bytes = await file.read()
        
        # Step 1: OCR Text Extraction
        extracted_text = extract_text_from_image(file_bytes, file.filename)
        
        if not extracted_text or len(extracted_text) < 10:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from document")
        
        # Step 2: AI Validation
        ai_result = validate_with_ai(extracted_text)
        
        # Step 3: DigiLocker Verification (Optional)
        digilocker_result = None
        if enable_digilocker and digilocker_username and digilocker_password:
            document_number = ai_result.get("extracted_fields", {}).get("document_number")
            if document_number:
                digilocker_result = verify_with_digilocker(
                    ai_result.get("document_type", ""),
                    document_number,
                    digilocker_username,
                    digilocker_password
                )
        
        # Prepare response
        tampering_detected = len(ai_result.get("tampering_indicators", [])) > 0
        
        verification_result = "VERIFIED"
        if tampering_detected:
            verification_result = "REJECTED - Tampering Detected"
        elif ai_result.get("confidence_score", 0) < 60:
            verification_result = "REJECTED - Low Confidence"
        elif not ai_result.get("is_valid_format", True):
            verification_result = "REJECTED - Invalid Format"
        elif digilocker_result and "Not Verified" in digilocker_result.get("status", ""):
            verification_result = "REJECTED - DigiLocker Verification Failed"
        
        response = {
            "document_type": ai_result.get("document_type", "Unknown"),
            "extracted_data": ai_result.get("extracted_fields", {}),
            "confidence_score": ai_result.get("confidence_score", 0),
            "tampering_detected": tampering_detected,
            "tampering_indicators": ai_result.get("tampering_indicators", []),
            "digilocker_status": digilocker_result.get("status") if digilocker_result else "Not Checked",
            "verification_result": verification_result,
            "extracted_text_preview": extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Check for required environment variables
    if not os.getenv("GROQ_API_KEY"):
        print("WARNING: GROQ_API_KEY not set in environment variables")
    
    print("Starting Document Verification System...")
    print("API Documentation available at: http://localhost:8001/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)