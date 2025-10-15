import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';

export default function DocumentVerificationUI() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [enableDigilocker, setEnableDigilocker] = useState(false);
  const [digilockerCreds, setDigilockerCreds] = useState({
    username: '',
    password: ''
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enable_digilocker', enableDigilocker);
      
      if (enableDigilocker) {
        formData.append('digilocker_username', digilockerCreds.username);
        formData.append('digilocker_password', digilockerCreds.password);
      }

      const response = await fetch('http://localhost:8001/verify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Verification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    
    if (result.verification_result === 'VERIFIED') {
      return <CheckCircle className="w-16 h-16 text-green-500" />;
    } else {
      return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!result) return 'gray';
    return result.verification_result === 'VERIFIED' ? 'green' : 'red';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Document Verification System</h1>
          <p className="text-gray-600">Upload your document for AI-powered verification</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document (Image or PDF)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-400">
                  Supports: Aadhaar, PAN, Marksheet, Income Certificate, etc.
                </p>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableDigilocker}
                onChange={(e) => setEnableDigilocker(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable DigiLocker Verification
              </span>
            </label>
          </div>

          {enableDigilocker && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">DigiLocker Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="DigiLocker Username"
                  value={digilockerCreds.username}
                  onChange={(e) => setDigilockerCreds({...digilockerCreds, username: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="DigiLocker Password"
                  value={digilockerCreds.password}
                  onChange={(e) => setDigilockerCreds({...digilockerCreds, password: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || !file}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Verify Document</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              {getStatusIcon()}
              <h2 className={`text-2xl font-bold mt-4 text-${getStatusColor()}-600`}>
                {result.verification_result}
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Document Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document Type:</span>
                    <span className="font-medium text-gray-800">{result.document_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence Score:</span>
                    <span className="font-medium text-gray-800">{result.confidence_score.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tampering Detected:</span>
                    <span className={`font-medium ${result.tampering_detected ? 'text-red-600' : 'text-green-600'}`}>
                      {result.tampering_detected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {enableDigilocker && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">DigiLocker Status:</span>
                      <span className="font-medium text-gray-800">{result.digilocker_status}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Extracted Data</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(result.extracted_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {result.tampering_indicators && result.tampering_indicators.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Tampering Indicators</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {result.tampering_indicators.map((indicator, idx) => (
                        <li key={idx} className="text-red-700">{indicator}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {result.extracted_text_preview && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Extracted Text Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                      {result.extracted_text_preview}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}