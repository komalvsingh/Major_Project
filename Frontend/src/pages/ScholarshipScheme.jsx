import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useWallet } from '../context/WalletContext';

const CreateScholarshipScheme = () => {
  const { account, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";
  const isOwnerOrAdmin = account?.toLowerCase() === CONTRACT_OWNER.toLowerCase();

  const [schemeData, setSchemeData] = useState({
    schemeName: '',
    description: '',
    eligibilityCriteria: '',
    scholarshipAmount: '',
    totalSlots: '',
    startDate: '',
    endDate: '',
    requiredDocuments: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSchemeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isOwnerOrAdmin) {
      setError('Only admin/owner can create scholarship schemes');
      return;
    }

    if (!schemeData.schemeName || !schemeData.scholarshipAmount || !schemeData.totalSlots) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const db = getFirestore();
      
      const schemeDoc = {
        schemeName: schemeData.schemeName,
        description: schemeData.description,
        eligibilityCriteria: schemeData.eligibilityCriteria,
        scholarshipAmount: parseFloat(schemeData.scholarshipAmount),
        totalSlots: parseInt(schemeData.totalSlots),
        availableSlots: parseInt(schemeData.totalSlots),
        registeredStudents: 0,
        startDate: schemeData.startDate,
        endDate: schemeData.endDate,
        requiredDocuments: schemeData.requiredDocuments,
        createdBy: account,
        createdAt: serverTimestamp(),
        isActive: true
      };

      await addDoc(collection(db, 'scholarshipSchemes'), schemeDoc);
      
      setSuccess('Scholarship scheme created successfully!');
      
      setSchemeData({
        schemeName: '',
        description: '',
        eligibilityCriteria: '',
        scholarshipAmount: '',
        totalSlots: '',
        startDate: '',
        endDate: '',
        requiredDocuments: ''
      });
      
    } catch (err) {
      console.error('Error creating scheme:', err);
      setError('Failed to create scholarship scheme. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-[#E5D5FD] text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent mb-4">
            Create Scholarship Scheme
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Please connect your wallet from the navbar to continue
          </p>
          <div className="bg-[#E5D5FD]/30 border border-[#9360E3]/30 rounded-lg p-4">
            <p className="text-sm text-gray-700">💡 Use the "Connect Wallet" button in the navigation bar above</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwnerOrAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-red-200 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-700 mb-6 text-lg">
            Only admin/owner can create scholarship schemes
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Connected Wallet:</p>
            <p className="text-sm font-mono font-semibold text-gray-800">
              {account?.substring(0, 10)}...{account?.substring(34)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Create Scholarship Scheme
              </h1>
              <p className="text-purple-100 text-lg">
                Set up a new scholarship program for students
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-5xl">📚</span>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
            <p className="text-sm text-purple-100">Connected as Admin</p>
            <p className="text-sm font-mono font-semibold">
              {account?.substring(0, 10)}...{account?.substring(34)}
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#E5D5FD] p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 mb-6 flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-red-800 mb-1">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-5 mb-6 flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-semibold text-green-800 mb-1">Success</p>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scheme Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Scheme Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="schemeName"
                value={schemeData.schemeName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white"
                placeholder="e.g., Merit-based Scholarship 2025"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={schemeData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white resize-none"
                placeholder="Describe the scholarship scheme and its objectives..."
              />
            </div>

            {/* Eligibility Criteria */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Eligibility Criteria
              </label>
              <textarea
                name="eligibilityCriteria"
                value={schemeData.eligibilityCriteria}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white resize-none"
                placeholder="e.g., Family income below 2 lakhs, 80%+ marks in previous exam"
              />
            </div>

            {/* Amount and Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Scholarship Amount (ETH) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">Ξ</span>
                  <input
                    type="number"
                    step="0.001"
                    name="scholarshipAmount"
                    value={schemeData.scholarshipAmount}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white"
                    placeholder="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Total Slots <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalSlots"
                  value={schemeData.totalSlots}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={schemeData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={schemeData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white"
                />
              </div>
            </div>

            {/* Required Documents */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Required Documents
              </label>
              <input
                type="text"
                name="requiredDocuments"
                value={schemeData.requiredDocuments}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white"
                placeholder="e.g., Aadhar Card, Income Certificate, Previous Marksheet"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Scheme...
                  </span>
                ) : (
                  '✨ Create Scholarship Scheme'
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-[#E5D5FD]/30 border border-[#9360E3]/20 rounded-xl p-4">
            <p className="text-sm text-gray-700 flex items-start">
              <span className="mr-2 text-lg">💡</span>
              <span><strong>Note:</strong> Fields marked with <span className="text-red-500">*</span> are required. The scholarship scheme will be published immediately after creation.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateScholarshipScheme;