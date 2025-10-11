import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
const OWNER_ADDRESS = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";

const AdminApprovePage = () => {
  const { account, provider, connectWallet, isConnected } = useWallet();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAdminMember, setIsAdminMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [downloadingHash, setDownloadingHash] = useState(null);

  const getStatusText = (status) => {
    const statuses = ['Applied', 'SAG Verified', 'Admin Approved', 'Disbursed'];
    return statuses[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = [
      'bg-yellow-100 text-yellow-800 border-yellow-200', 
      'bg-blue-100 text-blue-800 border-blue-200',     
      'bg-green-100 text-green-800 border-green-200',   
      'bg-purple-100 text-purple-800 border-purple-200'  
    ];
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  useEffect(() => {
    if (account && provider) {
      checkAdminRole();
    }
  }, [account, provider]);

  useEffect(() => {
    if (isAdminMember && provider) {
      loadApplications();
    }
  }, [isAdminMember, provider]);

  const checkAdminRole = async () => {
    setIsCheckingRole(true);
    setMessage('');
    
    try {
      if (!account || !provider) {
        setIsCheckingRole(false);
        return;
      }

      const checkIsOwner = account?.toLowerCase() === OWNER_ADDRESS.toLowerCase();
      setIsOwner(checkIsOwner);

      if (checkIsOwner) {
        setIsAdminMember(true);
        setIsCheckingRole(false);
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
      const [role, isActive] = await contract.getUserRole(account);
      const roleNumber = Number(role);
      const isAdmin = roleNumber === 2 && isActive;
      
      if (isAdmin) {
        setIsAdminMember(true);
      } else {
        setIsAdminMember(false);
        setMessage('Access denied. Only Admin members or Contract Owner can access this page.');
      }
      
    } catch (error) {
      console.error('Error checking Admin role:', error);
      setIsAdminMember(false);
      setMessage('Error checking user role. Please try again.');
    }
    
    setIsCheckingRole(false);
  };

  const loadApplications = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
      const counter = await contract.applicationCounter();
      
      if (Number(counter) === 0) {
        setApplications([]);
        setIsLoading(false);
        return;
      }

      const allApps = [];
      
      for (let i = 1; i <= Number(counter); i++) {
        try {
          const app = await contract.getApplication(i);
          const status = Number(app.status);
          
          if (status === 1) {
            allApps.push({
              id: Number(app.id),
              student: app.student,
              name: app.name,
              email: app.email,
              phone: app.phone,
              aadharNumber: app.aadharNumber,
              income: app.income,
              documentsIPFSHash: app.documentsIPFSHash,
              status: status,
              sagVerifiedCount: Number(app.sagVerifiedCount),
              adminApprovedCount: Number(app.adminApprovedCount),
              appliedAt: Number(app.appliedAt),
              disbursementAmount: ethers.formatEther(app.disbursementAmount)
            });
          }
        } catch (err) {
          console.error(`Error loading application ${i}:`, err);
        }
      }

      setApplications(allApps);
      
    } catch (error) {
      console.error('Error loading applications:', error);
      setMessage('Error loading applications. Please try again.');
      setApplications([]);
    }
    
    setIsLoading(false);
  };

  const handleApprove = async (applicationId) => {
    setApprovingId(applicationId);
    setMessage('');

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
      
      const tx = await contract.adminApprove(applicationId);
      setMessage('Approval transaction submitted...');
      
      await tx.wait();
      setMessage(`Application #${applicationId} approved successfully!`);
      
      await loadApplications();
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }
      
    } catch (error) {
      console.error('Approval error:', error);
      let errorMessage = 'Approval failed';
      
      if (error.message.includes('Already voted')) {
        errorMessage = 'You have already approved this application';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('Not SAG verified')) {
        errorMessage = 'Application is not SAG verified yet';
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      setMessage(errorMessage);
    }
    
    setApprovingId(null);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseDocumentHashes = (ipfsHash) => {
    if (!ipfsHash) return [];
    return ipfsHash.split(',').map(hash => hash.trim()).filter(hash => hash.length > 0);
  };

  const openDocument = (hash) => {
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    window.open(url, '_blank');
  };

  const downloadDocument = async (hash, fileName = null) => {
    setDownloadingHash(hash);
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      let fileExtension = 'bin';
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('pdf')) fileExtension = 'pdf';
        else if (contentType.includes('image/jpeg')) fileExtension = 'jpg';
        else if (contentType.includes('image/png')) fileExtension = 'png';
        else if (contentType.includes('image/gif')) fileExtension = 'gif';
        else if (contentType.includes('text/plain')) fileExtension = 'txt';
        else if (contentType.includes('application/msword')) fileExtension = 'doc';
        else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) fileExtension = 'docx';
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || `document_${hash.substring(0, 8)}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setMessage(`Document downloaded successfully!`);
      
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Failed to download document. Please try again.');
    }
    setDownloadingHash(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-[#E5D5FD] text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent mb-4">
            Admin Approval
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

  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-[#E5D5FD] text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Verifying Access...</h2>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5D5FD] border-t-[#9360E3]"></div>
          </div>
          <p className="text-gray-600 text-sm">Checking admin permissions</p>
        </div>
      </div>
    );
  }

  if (!isAdminMember) {
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
            Only Admin members or Contract Owner can approve applications.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-xs text-gray-600 mb-1">Connected Account:</p>
              <p className="text-sm font-mono font-semibold text-gray-800 break-all">{account}</p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Contract Owner:</p>
              <p className="text-sm font-mono font-semibold text-gray-800 break-all">{OWNER_ADDRESS}</p>
            </div>
          </div>
          <button
            onClick={checkAdminRole}
            className="w-full mt-6 bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  if (selectedApplication) {
    const documentHashes = parseDocumentHashes(selectedApplication.documentsIPFSHash);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#E5D5FD] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent">
                Application Details
              </h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="w-10 h-10 rounded-full hover:bg-[#E5D5FD]/50 flex items-center justify-center text-gray-600 hover:text-[#9360E3] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#E5D5FD]/30 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Application ID</label>
                  <p className="text-2xl font-bold text-[#9360E3]">#{selectedApplication.id}</p>
                </div>
                <div className="bg-[#E5D5FD]/30 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedApplication.status)}`}>
                    {getStatusText(selectedApplication.status)}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm font-bold text-[#9360E3]">Approval Progress</p>
                    <p className="text-xs text-gray-600">Requires 2 admin approvals</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#9360E3]">
                      {selectedApplication.adminApprovedCount}/2
                    </p>
                    <p className="text-xs text-gray-600">Approvals</p>
                  </div>
                </div>
                <div className="bg-[#E5D5FD] rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(selectedApplication.adminApprovedCount / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Student Name</label>
                  <p className="text-gray-900 font-medium">{selectedApplication.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <p className="text-gray-900 font-medium break-all">{selectedApplication.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <p className="text-gray-900 font-medium">{selectedApplication.phone}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Aadhar Number</label>
                  <p className="text-gray-900 font-medium">{selectedApplication.aadharNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Annual Income</label>
                  <p className="text-gray-900 font-medium">{selectedApplication.income}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Applied Date</label>
                  <p className="text-gray-900 font-medium">{formatDate(selectedApplication.appliedAt)}</p>
                </div>
                <div className="bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Scholarship Amount</label>
                  <p className="text-xl font-bold text-[#9360E3]">Ξ {selectedApplication.disbursementAmount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">SAG Verifications</label>
                  <p className="text-gray-900 font-medium">✓ {selectedApplication.sagVerifiedCount} verification(s)</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <label className="block text-sm font-bold text-gray-800 mb-3">Documents ({documentHashes.length})</label>
                {documentHashes.length > 0 ? (
                  <div className="space-y-3">
                    {documentHashes.map((hash, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#E5D5FD] rounded-lg flex items-center justify-center">
                            <span className="text-lg">📄</span>
                          </div>
                          <span className="font-medium text-gray-700">Document {index + 1}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDocument(hash)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`)}
                            disabled={downloadingHash === hash}
                            className="bg-[#9360E3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7a4dc4] disabled:bg-gray-400 transition-colors"
                          >
                            {downloadingHash === hash ? 'Downloading...' : 'Download'}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        documentHashes.forEach((hash, index) => {
                          setTimeout(() => {
                            downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`);
                          }, index * 1000);
                        });
                      }}
                      disabled={downloadingHash !== null}
                      className="w-full bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      📥 Download All Documents
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                )}
              </div>

              <button
                onClick={() => handleApprove(selectedApplication.id)}
                disabled={approvingId === selectedApplication.id}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {approvingId === selectedApplication.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Approving...
                  </span>
                ) : (
                  '✓ Approve Application'
                )}
              </button>
            </div>

            {message && (
              <div className={`mt-6 p-4 rounded-xl border-l-4 ${
                message.includes('Error') || message.includes('failed') || message.includes('Failed') || message.includes('denied')
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : message.includes('successfully') || message.includes('downloaded')
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-blue-50 border-blue-500 text-blue-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold mb-2">Admin Approval Dashboard</h2>
              {isOwner && (
                <p className="text-purple-100 text-sm font-medium mb-1">👑 Contract Owner (Default Admin)</p>
              )}
              <p className="text-purple-100 text-lg">Applications pending your approval</p>
            </div>
            <button
              onClick={loadApplications}
              disabled={isLoading}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
            <p className="text-sm font-mono">{account}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#E5D5FD] p-8">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E5D5FD] border-t-[#9360E3] mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-[#E5D5FD]/30 to-white rounded-xl border border-[#E5D5FD]">
              <div className="w-20 h-20 bg-gradient-to-br from-[#9360E3]/20 to-[#7a4dc4]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-2">No applications pending admin approval</p>
              <p className="text-gray-600 text-sm">Applications will appear here once verified by SAG Bureau</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border-2 border-[#E5D5FD] rounded-xl p-6 hover:shadow-lg hover:border-[#9360E3] transition-all bg-white">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-800">#{app.id} - {app.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full font-bold">
                          {app.adminApprovedCount}/2 Approvals
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full font-semibold">
                          ✓ SAG Verified ({app.sagVerifiedCount})
                        </span>
                        {parseDocumentHashes(app.documentsIPFSHash).length > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full font-semibold">
                            📎 {parseDocumentHashes(app.documentsIPFSHash).length} Docs
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Email</p>
                          <p className="text-sm text-gray-900 font-medium break-all">{app.email}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Phone</p>
                          <p className="text-sm text-gray-900 font-medium">{app.phone}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Income</p>
                          <p className="text-sm text-gray-900 font-medium">{app.income}</p>
                        </div>
                        <div className="bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Amount</p>
                          <p className="text-sm text-[#9360E3] font-bold">Ξ {app.disbursementAmount}</p>
                        </div>
                      </div>

                      <div className="bg-[#E5D5FD]/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(app.adminApprovedCount / 2) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                      >
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={approvingId === app.id}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {approvingId === app.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </span>
                        ) : (
                          'Approve'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <div className={`mt-6 p-5 rounded-xl border-l-4 ${
              message.includes('Error') || message.includes('failed') || message.includes('denied')
                ? 'bg-red-50 border-red-500 text-red-700'
                : message.includes('successfully')
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-blue-50 border-blue-500 text-blue-700'
            }`}>
              <p className="font-semibold">{message}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#E5D5FD]">
            <div className="bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium mb-1">Connected Account</p>
                  <p className="text-gray-900 font-mono text-xs break-all">{account}</p>
                </div>
                {isOwner && (
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Role</p>
                    <p className="text-green-700 font-bold">👑 Contract Owner</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600 font-medium mb-1">Pending Applications</p>
                  <p className="text-[#9360E3] font-bold text-lg">{applications.length}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#9360E3]/20">
                <p className="text-[#9360E3] font-semibold flex items-start">
                  <span className="mr-2">ℹ️</span>
                  <span className="text-sm">Each application requires 2 admin approvals (DAO voting process)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApprovePage;