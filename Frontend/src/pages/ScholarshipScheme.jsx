import React, { useState } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreateScholarshipScheme = () => {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
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

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to connect wallet:', err);
      }
    }
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Create Scholarship Scheme
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to continue
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isOwnerOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Only admin/owner can create scholarship schemes
          </p>
          <p className="text-sm text-gray-500">
            Connected: {account?.substring(0, 6)}...{account?.substring(38)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Scholarship Scheme
          </h1>
          <p className="text-gray-600 mb-6">
            Connected: {account?.substring(0, 6)}...{account?.substring(38)}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheme Name *
              </label>
              <input
                type="text"
                name="schemeName"
                value={schemeData.schemeName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Merit-based Scholarship 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={schemeData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the scholarship scheme"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eligibility Criteria
              </label>
              <textarea
                name="eligibilityCriteria"
                value={schemeData.eligibilityCriteria}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Family income below 2 lakhs, 80%+ marks"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scholarship Amount (ETH) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="scholarshipAmount"
                  value={schemeData.scholarshipAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Slots *
                </label>
                <input
                  type="number"
                  name="totalSlots"
                  value={schemeData.totalSlots}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={schemeData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={schemeData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Documents
              </label>
              <input
                type="text"
                name="requiredDocuments"
                value={schemeData.requiredDocuments}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Aadhar, Income Certificate, Marksheet"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Scheme...' : 'Create Scholarship Scheme'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateScholarshipScheme;