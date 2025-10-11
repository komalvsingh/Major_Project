import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';
import Navbar from "../components/Navbar";

const contractABI = contractArtifact.abi;

export default function Status() {
  const { account, isConnected } = useWallet();
  const [contract, setContract] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Contract configuration
  const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
  const HOLESKY_CHAIN_ID = 11155111;

  // Status mappings
  const statusLabels = {
    0: "Applied",
    1: "SAG Verified", 
    2: "Admin Approved",
    3: "Disbursed"
  };

  const statusColors = {
    0: "bg-yellow-50 text-yellow-700 border-yellow-300",
    1: "bg-blue-50 text-blue-700 border-blue-300", 
    2: "bg-green-50 text-green-700 border-green-300",
    3: "bg-purple-50 text-[#9360E3] border-purple-300"
  };

  // Check and switch to Holesky network
  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== HOLESKY_CHAIN_ID) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${HOLESKY_CHAIN_ID.toString(16)}` }],
        });
      }
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  };

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      if (!window.ethereum || !isConnected || !account) {
        setError('Please connect your wallet');
        setLoading(false);
        return;
      }

      try {
        const networkOk = await checkNetwork();
        if (!networkOk) {
          setError('Please switch to Holesky testnet');
          setLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        // Test contract connection
        await contractInstance.owner();
        setContract(contractInstance);
        setError(null);
        
      } catch (err) {
        console.error('Contract initialization failed:', err);
        setError('Failed to connect to contract');
        setLoading(false);
      }
    };

    initContract();
  }, [isConnected, account]);

  // Fetch user applications
  const fetchApplications = async (showRefreshingIndicator = false) => {
    if (!contract || !account) return;

    try {
      if (showRefreshingIndicator) {
        setRefreshing(true);
      }
      
      console.log('Fetching applications for:', account);
      
      const userApps = await contract.getMyApplications();
      console.log('Raw applications:', userApps);
      
      // Convert applications to readable format
      const formattedApps = userApps.map(app => ({
        id: Number(app.id),
        student: app.student,
        name: app.name,
        email: app.email,
        phone: app.phone,
        aadharNumber: app.aadharNumber,
        income: app.income,
        documentsIPFSHash: app.documentsIPFSHash,
        status: Number(app.status),
        sagVerifiedCount: Number(app.sagVerifiedCount),
        adminApprovedCount: Number(app.adminApprovedCount),
        appliedAt: Number(app.appliedAt),
        disbursementAmount: ethers.formatEther(app.disbursementAmount),
        isDisbursed: app.isDisbursed
      }));

      setApplications(formattedApps);
      setLastUpdated(new Date());
      setError(null);
      
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications');
    } finally {
      if (showRefreshingIndicator) {
        setRefreshing(false);
      }
      setLoading(false);
    }
  };

  // Fetch applications when contract is ready and set up listeners
  useEffect(() => {
    if (contract && account) {
      // Initial fetch
      fetchApplications();
      
      // Set up event listeners for real-time updates
      const setupListeners = async () => {
        try {
          console.log('Setting up event listeners...');
          
          // Listen for SAG verifications
          contract.on("ApplicationSAGVerified", (applicationId, sagMember) => {
            console.log('SAG verification event detected:', applicationId.toString());
            fetchApplications();
          });
          
          // Listen for admin approvals
          contract.on("ApplicationAdminApproved", (applicationId, admin) => {
            console.log('Admin approval event detected:', applicationId.toString());
            fetchApplications();
          });
          
          // Listen for disbursements
          contract.on("FundsDisbursed", (applicationId, student, amount) => {
            console.log('Funds disbursed event detected:', applicationId.toString());
            fetchApplications();
          });
          
          console.log('Event listeners set up successfully');
        } catch (err) {
          console.error('Error setting up listeners:', err);
        }
      };
      
      setupListeners();
      
      // Set up polling as backup (every 30 seconds)
      let pollInterval = null;
      if (autoRefreshEnabled) {
        pollInterval = setInterval(() => {
          console.log('Auto-refreshing applications...');
          fetchApplications();
        }, 30000); // 30 seconds
      }
      
      // Cleanup listeners on unmount
      return () => {
        console.log('Cleaning up listeners...');
        contract.removeAllListeners("ApplicationSAGVerified");
        contract.removeAllListeners("ApplicationAdminApproved");
        contract.removeAllListeners("FundsDisbursed");
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    }
  }, [contract, account, autoRefreshEnabled]);

  // Manual refresh function
  const handleRefresh = () => {
    fetchApplications(true);
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return lastUpdated.toLocaleTimeString();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FEFEFE 100%)' }}>
        <Navbar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center bg-white rounded-2xl shadow-xl p-12">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#E5D5FD]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#9360E3] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 font-medium text-lg">Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FEFEFE 100%)' }}>
        <Navbar />
        <div className="flex items-center justify-center pt-20">
          <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Connection Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7B4BC7 100%)', color: '#FFFFFF' }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FEFEFE 100%)' }}>
      <Navbar />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8" style={{ borderTop: '4px solid #9360E3' }}>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7B4BC7 100%)' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800">Application Status</h1>
                </div>
                <p className="text-gray-600 text-lg mb-3">Track and monitor your scholarship applications in real-time</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E2D3FA' }}>
                    <svg className="w-4 h-4" style={{ color: '#9360E3' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-gray-700">{account?.substring(0, 6)}...{account?.substring(38)}</span>
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Updated {formatLastUpdated()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: refreshing ? '#E2D3FA' : 'linear-gradient(135deg, #9360E3 0%, #7B4BC7 100%)', color: refreshing ? '#9360E3' : '#FFFFFF' }}
                >
                  {refreshing ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-3 border-[#9360E3] border-t-transparent animate-spin"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh Status</span>
                    </>
                  )}
                </button>
                
                <label className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                    className="w-5 h-5 rounded accent-[#9360E3]"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-refresh every 30s</span>
                </label>
              </div>
            </div>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5D5FD' }}>
                <svg className="w-12 h-12" style={{ color: '#9360E3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">No Applications Yet</h2>
              <p className="text-gray-600 text-lg mb-6">You haven't submitted any scholarship applications.</p>
              <p className="text-gray-500">Submit your first application to start tracking your progress here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                  
                  {/* Application Header */}
                  <div className="p-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #FEFEFE 0%, #E5D5FD 100%)' }}>
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl text-white" style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7B4BC7 100%)' }}>
                          #{app.id}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{app.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">Application ID: {app.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-start lg:items-end gap-2">
                        <span className={`px-5 py-2 rounded-full text-sm font-bold border-2 ${statusColors[app.status]}`}>
                          {statusLabels[app.status]}
                        </span>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FCFCFC', border: '1px solid #E5D5FD' }}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{app.email || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FCFCFC', border: '1px solid #E5D5FD' }}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone Number</p>
                        <p className="text-sm font-medium text-gray-800">{app.phone || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FCFCFC', border: '1px solid #E5D5FD' }}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Aadhar Number</p>
                        <p className="text-sm font-medium text-gray-800">{app.aadharNumber || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FCFCFC', border: '1px solid #E5D5FD' }}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Family Income</p>
                        <p className="text-sm font-medium text-gray-800">{app.income || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#E5D5FD', border: '1px solid #9360E3' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9360E3' }}>Scholarship Amount</p>
                        <p className="text-lg font-bold" style={{ color: '#9360E3' }}>{app.disbursementAmount} ETH</p>
                      </div>
                      
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FCFCFC', border: '1px solid #E5D5FD' }}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</p>
                        {app.documentsIPFSHash && app.documentsIPFSHash !== 'QmDefault' ? (
                          <a 
                            href={`https://gateway.pinata.cloud/ipfs/${app.documentsIPFSHash.split(',')[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold hover:underline transition-colors"
                            style={{ color: '#9360E3' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Documents
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">No documents uploaded</p>
                        )}
                      </div>
                    </div>

                    {/* Progress Timeline */}
                    <div className="p-6 rounded-xl mb-6" style={{ backgroundColor: '#FEFEFE', border: '2px solid #E5D5FD' }}>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: '#9360E3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Application Progress
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Applied */}
                        <div className="flex items-center gap-3 p-4 rounded-xl transition-all" style={{ backgroundColor: app.status >= 0 ? '#E5D5FD' : '#F5F5F5' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: app.status >= 0 ? '#9360E3' : '#D1D5DB' }}>
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">Applied</p>
                            <p className="text-xs text-gray-600">Initial submission</p>
                          </div>
                        </div>
                        
                        {/* SAG Verification */}
                        <div className="flex items-center gap-3 p-4 rounded-xl transition-all" style={{ backgroundColor: app.status >= 1 ? '#E5D5FD' : '#F5F5F5' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: app.status >= 1 ? '#9360E3' : '#D1D5DB' }}>
                            {app.status >= 1 ? (
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-white text-xs font-bold">{app.sagVerifiedCount}/1</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">SAG Verified</p>
                            <p className="text-xs text-gray-600">{app.sagVerifiedCount}/1 verified</p>
                          </div>
                        </div>
                        
                        {/* Admin Approval */}
                        <div className="flex items-center gap-3 p-4 rounded-xl transition-all" style={{ backgroundColor: app.status >= 2 ? '#E5D5FD' : '#F5F5F5' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: app.status >= 2 ? '#9360E3' : '#D1D5DB' }}>
                            {app.status >= 2 ? (
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-white text-xs font-bold">{app.adminApprovedCount}/2</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">Admin Approved</p>
                            <p className="text-xs text-gray-600">{app.adminApprovedCount}/2 approved</p>
                          </div>
                        </div>
                        
                        {/* Disbursed */}
                        <div className="flex items-center gap-3 p-4 rounded-xl transition-all" style={{ backgroundColor: app.status >= 3 ? '#E5D5FD' : '#F5F5F5' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: app.status >= 3 ? '#9360E3' : '#D1D5DB' }}>
                            {app.isDisbursed ? (
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{app.isDisbursed ? 'Disbursed' : 'Pending'}</p>
                            <p className="text-xs text-gray-600">{app.isDisbursed ? 'Funds sent' : 'Awaiting payment'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status-specific Information */}
                    {app.status === 0 && (
                      <div className="p-5 rounded-xl border-2 border-yellow-200" style={{ backgroundColor: '#FEF9E7' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-yellow-800 mb-1">Under Review</p>
                            <p className="text-sm text-yellow-700">Your application is currently being reviewed by SAG Bureau members. This process typically takes 2-3 business days.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {app.status === 1 && (
                      <div className="p-5 rounded-xl border-2 border-blue-200" style={{ backgroundColor: '#EBF5FF' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-800 mb-1">SAG Verification Complete</p>
                            <p className="text-sm text-blue-700">Great news! Your application has been verified. Now waiting for admin approval (needs {2 - app.adminApprovedCount} more approval{2 - app.adminApprovedCount !== 1 ? 's' : ''}).</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {app.status === 2 && (
                      <div className="p-5 rounded-xl border-2 border-green-200" style={{ backgroundColor: '#F0FDF4' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-green-800 mb-1">Admin Approval Complete!</p>
                            <p className="text-sm text-green-700">Congratulations! Your application has been fully approved. The finance bureau will disburse the funds shortly.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {app.status === 3 && (
                      <div className="p-5 rounded-xl border-2" style={{ backgroundColor: '#F5EFFF', borderColor: '#9360E3' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E5D5FD' }}>
                            <svg className="w-5 h-5" style={{ color: '#9360E3' }} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold mb-1" style={{ color: '#9360E3' }}>Funds Disbursed Successfully!</p>
                            <p className="text-sm text-gray-700">Congratulations! Your scholarship amount of <span className="font-bold" style={{ color: '#9360E3' }}>{app.disbursementAmount} ETH</span> has been successfully transferred to your wallet.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}



        </div>
      </div>
    </div>
  );
}