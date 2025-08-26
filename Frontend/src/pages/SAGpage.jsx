import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0xCa9C04EA23B34Ec3c1B7Dc77A0323744211918F9";

const SAGVerifyPage = () => {
  const { account, provider, connectWallet } = useWallet();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSAGMember, setIsSAGMember] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [downloadingHash, setDownloadingHash] = useState(null);

  const getStatusText = (status) => {
    const statuses = ['Applied', 'SAG Verified', 'Admin Approved', 'Disbursed'];
    return statuses[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = [
      'bg-yellow-100 text-yellow-800', 
      'bg-blue-100 text-blue-800',     
      'bg-green-100 text-green-800',   
      'bg-purple-100 text-purple-800'  
    ];
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (account && provider) {
      checkSAGRole();
    }
  }, [account, provider]);

  useEffect(() => {
    if (isSAGMember && provider) {
      loadApplications();
    }
  }, [isSAGMember, provider]);

  const checkSAGRole = async () => {
    setIsCheckingRole(true);
    try {
      if (provider) {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
        const [role, isActive] = await contract.getUserRole(account);
        const isSAG = parseInt(role) === 1 && isActive;
        setIsSAGMember(isSAG);
        if (!isSAG) {
          setMessage('Access denied. Only SAG Bureau members can access this page.');
        }
      }
    } catch (error) {
      console.error('Error checking SAG role:', error);
      setMessage('Error checking user role. Please try again.');
    }
    setIsCheckingRole(false);
  };

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
      const appliedApplications = await contract.getApplicationsByStatus(0);
      
      const formattedApplications = appliedApplications.map(app => ({
        id: Number(app.id),
        student: app.student,
        name: app.name,
        email: app.email,
        phone: app.phone,
        aadharNumber: app.aadharNumber,
        income: app.income,
        documentsIPFSHash: app.documentsIPFSHash,
        status: Number(app.status),
        appliedAt: Number(app.appliedAt),
        disbursementAmount: ethers.formatEther(app.disbursementAmount)
      }));

      setApplications(formattedApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      setMessage('Error loading applications. Please try again.');
    }
    setIsLoading(false);
  };

  const handleVerify = async (applicationId) => {
    setVerifyingId(applicationId);
    setMessage('');

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
      
      const tx = await contract.verifySAG(applicationId);
      setMessage('Verification transaction submitted...');
      
      await tx.wait();
      setMessage(`Application #${applicationId} verified successfully!`);
      await loadApplications();
      
    } catch (error) {
      console.error('Verification error:', error);
      let errorMessage = 'Verification failed';
      if (error.message.includes('Already voted')) {
        errorMessage = 'You have already verified this application';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      setMessage(errorMessage);
    }
    setVerifyingId(null);
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      setMessage('Failed to connect wallet');
    }
    setIsConnecting(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Parse multiple IPFS hashes separated by commas
  const parseDocumentHashes = (ipfsHash) => {
    if (!ipfsHash) return [];
    return ipfsHash.split(',').map(hash => hash.trim()).filter(hash => hash.length > 0);
  };

  const openDocument = (hash) => {
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    window.open(url, '_blank');
  };

  // New download function
  const downloadDocument = async (hash, fileName = null) => {
    setDownloadingHash(hash);
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      
      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Determine file extension from content type
      let fileExtension = 'bin'; // default
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('pdf')) fileExtension = 'pdf';
        else if (contentType.includes('image/jpeg')) fileExtension = 'jpg';
        else if (contentType.includes('image/png')) fileExtension = 'png';
        else if (contentType.includes('image/gif')) fileExtension = 'gif';
        else if (contentType.includes('text/plain')) fileExtension = 'txt';
        else if (contentType.includes('application/msword')) fileExtension = 'doc';
        else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) fileExtension = 'docx';
        else if (contentType.includes('application/vnd.ms-excel')) fileExtension = 'xls';
        else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) fileExtension = 'xlsx';
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || `document_${hash.substring(0, 8)}.${fileExtension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setMessage(`Document downloaded successfully!`);
      
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Failed to download document. Please try again.');
    }
    setDownloadingHash(null);
  };

  // Connect wallet screen
  if (!account) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Connect Wallet</h2>
        <p className="text-gray-600 mb-6 text-center">Connect your wallet to verify applications</p>
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {message && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {message}
          </div>
        )}
      </div>
    );
  }

  // Loading role check
  if (isCheckingRole) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Verifying Access...</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Access denied screen
  if (!isSAGMember) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
        <p className="text-gray-600 mb-4">Only SAG Bureau members can verify applications.</p>
        <div className="bg-gray-50 p-4 rounded-lg text-xs">
          <p><strong>Connected Account:</strong></p>
          <p className="font-mono break-all">{account}</p>
        </div>
        <button
          onClick={checkSAGRole}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Retry Verification
        </button>
      </div>
    );
  }

  // Application details modal
  if (selectedApplication) {
    const documentHashes = parseDocumentHashes(selectedApplication.documentsIPFSHash);
    
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white border rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <button
            onClick={() => setSelectedApplication(null)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Application ID</label>
              <p className="text-lg font-semibold">#{selectedApplication.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                {getStatusText(selectedApplication.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student Name</label>
              <p className="text-gray-900">{selectedApplication.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{selectedApplication.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="text-gray-900">{selectedApplication.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
              <p className="text-gray-900">{selectedApplication.aadharNumber}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Annual Income</label>
            <p className="text-gray-900">{selectedApplication.income}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Applied Date</label>
            <p className="text-gray-900">{formatDate(selectedApplication.appliedAt)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Scholarship Amount</label>
            <p className="text-gray-900 font-semibold">{selectedApplication.disbursementAmount} ETH</p>
          </div>

          {/* Enhanced Documents section with download functionality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Documents ({documentHashes.length})</label>
            {documentHashes.length > 0 ? (
              <div className="space-y-2">
                {documentHashes.map((hash, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span className="text-sm">Document {index + 1}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDocument(hash)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        📄 View
                      </button>
                      <button
                        onClick={() => downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`)}
                        disabled={downloadingHash === hash}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                      >
                        {downloadingHash === hash ? (
                          <span className="flex items-center gap-1">
                            <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                            Downloading...
                          </span>
                        ) : (
                          <>⬇️ Download</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {/* Download All button */}
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={() => {
                      documentHashes.forEach((hash, index) => {
                        setTimeout(() => {
                          downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`);
                        }, index * 1000); // Stagger downloads by 1 second each
                      });
                    }}
                    disabled={downloadingHash !== null}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    📦 Download All Documents
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No documents uploaded</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => handleVerify(selectedApplication.id)}
              disabled={verifyingId === selectedApplication.id}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {verifyingId === selectedApplication.id ? 'Verifying...' : 'Verify Application'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('Error') || message.includes('failed') || message.includes('Failed')
              ? 'bg-red-50 text-red-700'
              : message.includes('successfully') || message.includes('downloaded')
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    );
  }

  // Main applications list
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">SAG Verification Dashboard</h2>
        <button
          onClick={loadApplications}
          disabled={isLoading}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No applications pending SAG verification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border rounded-lg p-4 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">#{app.id} - {app.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                    {parseDocumentHashes(app.documentsIPFSHash).length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        📄 {parseDocumentHashes(app.documentsIPFSHash).length} Documents
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <p><strong>Email:</strong> {app.email}</p>
                    <p><strong>Phone:</strong> {app.phone}</p>
                    <p><strong>Income:</strong> {app.income}</p>
                    <p><strong>Applied:</strong> {formatDate(app.appliedAt)}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedApplication(app)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    View Details
                  </button>
                  
                  <button
                    onClick={() => handleVerify(app.id)}
                    disabled={verifyingId === app.id}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                  >
                    {verifyingId === app.id ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-sm ${
          message.includes('Error') || message.includes('failed')
            ? 'bg-red-50 text-red-700'
            : message.includes('successfully')
            ? 'bg-green-50 text-green-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p><strong>Connected:</strong> {account}</p>
          <p><strong>Applications:</strong> {applications.length}</p>
        </div>
      </div>
    </div>
  );
};

export default SAGVerifyPage;