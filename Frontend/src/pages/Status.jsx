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

  // Contract configuration
  const CONTRACT_ADDRESS = "0xCa9C04EA23B34Ec3c1B7Dc77A0323744211918F9";
  const HOLESKY_CHAIN_ID = 17000;

  // Status mappings
  const statusLabels = {
    0: "Applied",
    1: "SAG Verified", 
    2: "Admin Approved",
    3: "Disbursed"
  };

  const statusColors = {
    0: "bg-yellow-100 text-yellow-800 border-yellow-200",
    1: "bg-blue-100 text-blue-800 border-blue-200", 
    2: "bg-green-100 text-green-800 border-green-200",
    3: "bg-purple-100 text-purple-800 border-purple-200"
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
  const fetchApplications = async () => {
    if (!contract || !account) return;

    try {
      setRefreshing(true);
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
      setError(null);
      
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Fetch applications when contract is ready
  useEffect(() => {
    if (contract) {
      fetchApplications();
    }
  }, [contract]);

  // Manual refresh function
  const handleRefresh = () => {
    fetchApplications();
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

  // Render loading state
  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Application Status</h1>
                <p className="text-gray-600 mt-1">
                  Track your scholarship applications
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Connected: {account?.substring(0, 6)}...{account?.substring(38)}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <span>🔄</span>
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Applications Found</h2>
              <p className="text-gray-600">You haven't submitted any scholarship applications yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow-md p-6">
                  
                  {/* Application Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Application #{app.id}
                      </h3>
                      <p className="text-gray-600">{app.name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[app.status]}`}>
                        {statusLabels[app.status]}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {formatDate(app.appliedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-600">{app.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-sm text-gray-600">{app.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Aadhar Number</p>
                      <p className="text-sm text-gray-600">{app.aadharNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Family Income</p>
                      <p className="text-sm text-gray-600">{app.income || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Scholarship Amount</p>
                      <p className="text-sm text-gray-600">{app.disbursementAmount} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Documents</p>
                      {app.documentsIPFSHash && app.documentsIPFSHash !== 'QmDefault' ? (
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${app.documentsIPFSHash.split(',')[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View Documents
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600">No documents</p>
                      )}
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Application Progress</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      {/* Applied */}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Applied</span>
                      </div>
                      
                      {/* SAG Verification */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${app.status >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-600">
                          SAG Verified ({app.sagVerifiedCount}/1)
                        </span>
                      </div>
                      
                      {/* Admin Approval */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${app.status >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-600">
                          Admin Approved ({app.adminApprovedCount}/2)
                        </span>
                      </div>
                      
                      {/* Disbursed */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${app.status >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-600">
                          {app.isDisbursed ? 'Disbursed ✅' : 'Pending Disbursement'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status-specific Information */}
                  {app.status === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        ⏳ Your application is under review by SAG Bureau members.
                      </p>
                    </div>
                  )}
                  
                  {app.status === 1 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        ✅ SAG verification complete. Waiting for admin approval (needs {2 - app.adminApprovedCount} more approval{2 - app.adminApprovedCount !== 1 ? 's' : ''}).
                      </p>
                    </div>
                  )}
                  
                  {app.status === 2 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        🎉 Admin approval complete! Waiting for finance bureau to disburse funds.
                      </p>
                    </div>
                  )}
                  
                  {app.status === 3 && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                      <p className="text-sm text-purple-800">
                        💰 Congratulations! Your scholarship of {app.disbursementAmount} ETH has been disbursed.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Understanding Application Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Status Meanings:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Applied:</strong> Initial application submitted</li>
                  <li>• <strong>SAG Verified:</strong> Verified by SAG Bureau (1 verification needed)</li>
                  <li>• <strong>Admin Approved:</strong> Approved by admins (2 approvals needed)</li>
                  <li>• <strong>Disbursed:</strong> Scholarship amount sent to your wallet</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">What happens next?</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Applications are reviewed in order of submission</li>
                  <li>• Each stage requires different approvals</li>
                  <li>• You will be notified of any status changes</li>
                  <li>• Funds are automatically sent when approved</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}