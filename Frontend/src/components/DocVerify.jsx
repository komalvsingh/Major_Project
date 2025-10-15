import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader, Shield } from 'lucide-react';

export default function SimpleDocVerification() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    
    if (result.verification_result.includes('VERIFIED')) {
      return <CheckCircle className="w-12 h-12 text-green-500" />;
    } else if (result.verification_result.includes('MANUAL REVIEW')) {
      return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
    } else {
      return <XCircle className="w-12 h-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!result) return 'gray';
    if (result.verification_result.includes('VERIFIED')) return 'green';
    if (result.verification_result.includes('MANUAL REVIEW')) return 'yellow';
    return 'red';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Shield className="w-10 h-10 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Document Verification</h1>
          </div>
          <p className="text-gray-600">Upload and verify documents instantly</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Document
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                {file ? (
                  <div className="space-y-1">
                    <p className="text-gray-800 font-medium">📄 {file.name}</p>
                    <p className="text-sm text-gray-500">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">JPG, PNG, or PDF (Max 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || !file}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Verify Document</span>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Status */}
            <div className="text-center mb-6 pb-6 border-b">
              {getStatusIcon()}
              <h2 className={`text-2xl font-bold mt-3 text-${getStatusColor()}-600`}>
                {result.verification_result}
              </h2>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Confidence</p>
                <p className="text-xl font-bold text-blue-700">{result.confidence_score.toFixed(0)}%</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Authenticity</p>
                <p className="text-xl font-bold text-purple-700">{result.authenticity_score.toFixed(0)}%</p>
              </div>
              <div className={`rounded-lg p-4 text-center ${result.tampering_detected ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-600 mb-1">Tampering</p>
                <p className={`text-xl font-bold ${result.tampering_detected ? 'text-red-700' : 'text-green-700'}`}>
                  {result.tampering_detected ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Document Type */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Document Type</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {result.document_type}
                </span>
              </div>
            </div>

            {/* Extracted Data */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Extracted Data</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {Object.keys(result.extracted_data).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(result.extracted_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium text-gray-800">{value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center">No data extracted</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
                <div className={`rounded-lg p-4 ${
                  result.verification_result.includes('VERIFIED') ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span className={result.verification_result.includes('VERIFIED') ? 'text-green-800' : 'text-yellow-800'}>
                          {rec}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Text Preview */}
            {result.extracted_text_preview && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Text Preview</h3>
                <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {result.extracted_text_preview}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}