import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader, Shield, FileCheck, AlertTriangle, Info } from 'lucide-react';

export default function DocumentVerificationUI() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setResult(null);
      setBatchResults(null);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setBatchResults(null);

    try {
      const formData = new FormData();
      
      if (files.length === 1) {
        formData.append('file', files[0]);

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
      } else {
        files.forEach(file => formData.append('files', file));

        const response = await fetch('http://localhost:8001/verify-batch', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Batch verification failed');
        }

        const data = await response.json();
        setBatchResults(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionIcon = (decision) => {
    if (decision === 'ACCEPT') {
      return <CheckCircle className="w-16 h-16 text-green-500" />;
    } else {
      return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-50 to-green-100';
    if (score >= 60) return 'from-yellow-50 to-yellow-100';
    return 'from-red-50 to-red-100';
  };

  const getClarityBadge = (clarity) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    return styles[clarity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Shield className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Document Verification System</h1>
          </div>
          <p className="text-gray-600">AI-powered verification with advanced tampering detection & data extraction</p>
          <p className="text-sm text-indigo-600 mt-2">✨ Now with improved accuracy for real scanned documents</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Document(s)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50">
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                {files.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-gray-800 font-medium">📄 {files.length} file(s) selected</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {files.map((file, idx) => (
                        <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                          {file.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Click to change files</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">JPG, PNG, or PDF • Single or multiple files • Max 10MB each</p>
                    <p className="text-xs text-indigo-600 mt-2">✓ Aadhaar • PAN • Marksheet • Income Certificate • Caste Certificate</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || files.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Verifying {files.length} document(s)...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Verify Document{files.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Single Document Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-6 pb-6 border-b">
              {getDecisionIcon(result.decision)}
              <h2 className={`text-3xl font-bold mt-4 ${result.decision === 'ACCEPT' ? 'text-green-600' : 'text-red-600'}`}>
                {result.decision}
              </h2>
              <p className={`text-lg mt-2 ${result.decision === 'ACCEPT' ? 'text-green-700' : 'text-red-700'}`}>
                {result.status}
              </p>
              {result.reason && result.reason.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.reason.map((r, idx) => (
                    <p key={idx} className={`text-sm ${result.decision === 'ACCEPT' ? 'text-green-600' : 'text-red-600'}`}>
                      • {r}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Indicators */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className={`bg-gradient-to-br ${getScoreBg(result.confidence_score)} rounded-xl p-4 text-center shadow-sm`}>
                <p className="text-xs text-gray-600 mb-1 font-medium">OCR Confidence</p>
                <p className={`text-3xl font-bold ${getScoreColor(result.confidence_score)}`}>
                  {Math.round(result.confidence_score)}%
                </p>
              </div>
              <div className={`bg-gradient-to-br ${getScoreBg(result.authenticity_score)} rounded-xl p-4 text-center shadow-sm`}>
                <p className="text-xs text-gray-600 mb-1 font-medium">Authenticity</p>
                <p className={`text-3xl font-bold ${getScoreColor(result.authenticity_score)}`}>
                  {Math.round(result.authenticity_score)}%
                </p>
              </div>
              {result.completeness !== undefined && (
                <div className={`bg-gradient-to-br ${getScoreBg(result.completeness)} rounded-xl p-4 text-center shadow-sm`}>
                  <p className="text-xs text-gray-600 mb-1 font-medium">Completeness</p>
                  <p className={`text-3xl font-bold ${getScoreColor(result.completeness)}`}>
                    {Math.round(result.completeness)}%
                  </p>
                </div>
              )}
              {result.text_clarity && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-600 mb-1 font-medium">Text Clarity</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getClarityBadge(result.text_clarity)}`}>
                    {result.text_clarity.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Tampering Issues */}
            {result.tampering_issues && result.tampering_issues.length > 0 && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Security Issues Detected
                </h3>
                <ul className="space-y-1">
                  {result.tampering_issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings (Non-critical) */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Quality Observations
                </h3>
                <ul className="space-y-1">
                  {result.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-700">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Document Type */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Document Type</h3>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3">
                <span className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                  {result.document_type}
                </span>
              </div>
            </div>

            {/* Extracted Data - Enhanced Display */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FileCheck className="w-4 h-4 mr-2" />
                Extracted Information
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border-2 border-gray-200">
                {result.extracted_data && Object.keys(result.extracted_data).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result.extracted_data).map(([key, value]) => {
                      if (value && value !== 'null' && value !== null) {
                        return (
                          <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="font-semibold text-gray-900 text-sm break-words">
                              {value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No data could be extracted from this document</p>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Details */}
            {result.validation && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Validation Checks</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`rounded-lg p-3 text-center shadow-sm ${result.validation.format_valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-xs text-gray-600 mb-1">Format</p>
                    <p className={`font-bold ${result.validation.format_valid ? 'text-green-700' : 'text-red-700'}`}>
                      {result.validation.format_valid ? '✓ Valid' : '✗ Invalid'}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 text-center shadow-sm ${result.validation.pattern_match ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-xs text-gray-600 mb-1">Pattern</p>
                    <p className={`font-bold ${result.validation.pattern_match ? 'text-green-700' : 'text-red-700'}`}>
                      {result.validation.pattern_match ? '✓ Found' : '✗ Missing'}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 text-center shadow-sm ${result.validation.keywords_found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-xs text-gray-600 mb-1">Keywords</p>
                    <p className={`font-bold ${result.validation.keywords_found ? 'text-green-700' : 'text-red-700'}`}>
                      {result.validation.keywords_found ? `✓ ${result.validation.keyword_count || 1}` : '✗ Missing'}
                    </p>
                  </div>
                  {result.validation.numbers_found && result.validation.numbers_found.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">ID Found</p>
                      <p className="font-bold text-blue-700">✓ Yes</p>
                    </div>
                  )}
                </div>
                {result.validation.numbers_found && result.validation.numbers_found.length > 0 && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Document Numbers Detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.validation.numbers_found.map((num, idx) => (
                        <span key={idx} className="text-sm font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded border border-blue-300">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quality Metrics */}
            {result.quality_metrics && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Technical Metrics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">ELA Score</p>
                    <p className="font-mono text-sm font-bold text-gray-800">{result.quality_metrics.ela_score}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Edge Density</p>
                    <p className="font-mono text-sm font-bold text-gray-800">{result.quality_metrics.edge_density}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Noise Variance</p>
                    <p className="font-mono text-sm font-bold text-gray-800">{result.quality_metrics.noise_variance}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Text Preview */}
            {result.raw_text_preview && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">OCR Text Preview</h3>
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 max-h-32 overflow-y-auto">
                  <p className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{result.raw_text_preview}</p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t">
              Verified at: {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Batch Results */}
        {batchResults && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Batch Verification Results</h2>
            
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 text-center shadow-sm">
                <p className="text-xs text-gray-600 mb-1 font-medium">Total Documents</p>
                <p className="text-4xl font-bold text-blue-700">{batchResults.total_documents}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 text-center shadow-sm">
                <p className="text-xs text-gray-600 mb-1 font-medium">Accepted</p>
                <p className="text-4xl font-bold text-green-700">{batchResults.summary.accepted}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-5 text-center shadow-sm">
                <p className="text-xs text-gray-600 mb-1 font-medium">Rejected</p>
                <p className="text-4xl font-bold text-red-700">{batchResults.summary.rejected}</p>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-4">
              {batchResults.results.map((doc, idx) => (
                <div key={idx} className={`border-l-4 rounded-lg p-5 shadow-sm ${
                  doc.decision === 'ACCEPT' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {doc.decision === 'ACCEPT' ? (
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-600" />
                      )}
                      <div>
                        <span className="font-semibold text-gray-800 block">{doc.filename}</span>
                        {doc.document_type && (
                          <span className="text-sm text-gray-600 mt-1 inline-block">{doc.document_type}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                      doc.decision === 'ACCEPT' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {doc.decision}
                    </span>
                  </div>
                  
                  {/* Scores Grid */}
                  {doc.confidence !== undefined && doc.authenticity !== undefined && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center shadow-sm border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Confidence</p>
                        <p className={`text-xl font-bold ${getScoreColor(doc.confidence)}`}>
                          {Math.round(doc.confidence)}%
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center shadow-sm border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Authenticity</p>
                        <p className={`text-xl font-bold ${getScoreColor(doc.authenticity)}`}>
                          {Math.round(doc.authenticity)}%
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center shadow-sm border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Tampering</p>
                        <p className={`text-xl font-bold ${doc.tampering_detected ? 'text-red-600' : 'text-green-600'}`}>
                          {doc.tampering_detected ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data for Batch */}
                  {doc.extracted_data && Object.keys(doc.extracted_data).length > 0 && (
                    <div className="bg-white bg-opacity-70 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Extracted Data:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(doc.extracted_data).map(([key, value]) => {
                          if (value && value !== 'null' && value !== null) {
                            return (
                              <div key={key} className="text-xs">
                                <span className="text-gray-600">{key.replace(/_/g, ' ')}: </span>
                                <span className="font-semibold text-gray-900">{value}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {doc.warnings && doc.warnings.length > 0 && (
                    <div className="mt-3 bg-yellow-100 bg-opacity-50 p-3 rounded border border-yellow-300">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">Observations:</p>
                      {doc.warnings.slice(0, 2).map((warning, i) => (
                        <p key={i} className="text-xs text-yellow-700">• {warning}</p>
                      ))}
                    </div>
                  )}
                  
                  {doc.error && (
                    <p className="text-sm text-red-600 mt-3 bg-red-100 p-2 rounded border border-red-300">
                      Error: {doc.error}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Batch Timestamp */}
            <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
              Batch verified at: {new Date(batchResults.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}