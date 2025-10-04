import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
const OWNER_ADDRESS = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";

const AdminApprovePage = () => {
  const { account, provider, connectWallet } = useWallet();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAdminMember, setIsAdminMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
      'bg-yellow-100 text-yellow-800', 
      'bg-blue-100 text-blue-800',     
      'bg-green-100 text-green-800',   
      'bg-purple-100 text-purple-800'  
    ];
    return colors[status] || 'bg-gray-100 text-gray-800';
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

      console.log('=== Admin Role Check ===');
      console.log('Account:', account);
      console.log('Owner Address:', OWNER_ADDRESS);
      console.log('Is Owner Check:', checkIsOwner);

      if (checkIsOwner) {
        setIsAdminMember(true);
        console.log('✅ Access granted: Contract Owner');
        setIsCheckingRole(false);
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
      const [role, isActive] = await contract.getUserRole(account);
      const roleNumber = Number(role);
      const isAdmin = roleNumber === 2 && isActive;
      
      console.log('Contract Role Check:', {
        role: roleNumber,
        isActive,
        isAdmin
      });
      
      if (isAdmin) {
        setIsAdminMember(true);
        console.log('✅ Access granted: Admin Member');
      } else {
        setIsAdminMember(false);
        setMessage('Access denied. Only Admin members or Contract Owner can access this page.');
        console.log('❌ Access denied');
      }
      
    } catch (error) {
      console.error('❌ Error checking Admin role:', error);
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
      
      console.log('Loading applications...');
      
      const counter = await contract.applicationCounter();
      console.log('Total applications:', Number(counter));
      
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
          
          // Only include SAG Verified applications (status === 1)
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

      console.log('SAG Verified applications:', allApps);
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
      
      console.log('Approving application:', applicationId);
      
      const tx = await contract.adminApprove(applicationId);
      setMessage('Approval transaction submitted...');
      
      await tx.wait();
      setMessage(`Application #${applicationId} approved successfully!`);
      
      // Reload applications after approval
      await loadApplications();
      
      // Close detail view if open
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

  if (!account) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Connect Wallet</h2>
        <p className="text-gray-600 mb-6 text-center">Connect your wallet to approve applications</p>
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

  if (!isAdminMember) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
        <p className="text-gray-600 mb-4">Only Admin members or Contract Owner can approve applications.</p>
        <div className="bg-gray-50 p-4 rounded-lg text-xs">
          <p><strong>Connected Account:</strong></p>
          <p className="font-mono break-all">{account}</p>
          <p className="mt-2"><strong>Contract Owner:</strong></p>
          <p className="font-mono break-all">{OWNER_ADDRESS}</p>
        </div>
        <button
          onClick={checkAdminRole}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Retry Verification
        </button>
      </div>
    );
  }

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

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-900">Approval Progress</p>
                <p className="text-xs text-blue-700">Requires 2 admin approvals</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedApplication.adminApprovedCount}/2
                </p>
                <p className="text-xs text-blue-700">Approvals</p>
              </div>
            </div>
            <div className="mt-2 bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(selectedApplication.adminApprovedCount / 2) * 100}%` }}
              ></div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">SAG Verifications</label>
            <p className="text-gray-900">{selectedApplication.sagVerifiedCount} verification(s)</p>
          </div>

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
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`)}
                        disabled={downloadingHash === hash}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {downloadingHash === hash ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={() => {
                      documentHashes.forEach((hash, index) => {
                        setTimeout(() => {
                          downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`);
                        }, index * 1000);
                      });
                    }}
                    disabled={downloadingHash !== null}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    Download All Documents
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No documents uploaded</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => handleApprove(selectedApplication.id)}
              disabled={approvingId === selectedApplication.id}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {approvingId === selectedApplication.id ? 'Approving...' : 'Approve Application'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('Error') || message.includes('failed') || message.includes('Failed') || message.includes('denied')
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

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Approval Dashboard</h2>
          {isOwner && (
            <p className="text-sm text-green-600 font-medium mt-1">✓ Contract Owner (Default Admin)</p>
          )}
          <p className="text-sm text-gray-600 mt-1">Applications pending your approval</p>
        </div>
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
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No applications pending admin approval.</p>
          <p className="text-sm text-gray-500 mt-2">Applications will appear here once verified by SAG Bureau</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold">#{app.id} - {app.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {app.adminApprovedCount}/2 Approvals
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ SAG Verified ({app.sagVerifiedCount})
                    </span>
                    {parseDocumentHashes(app.documentsIPFSHash).length > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        📎 {parseDocumentHashes(app.documentsIPFSHash).length} Documents
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <p><strong>Email:</strong> {app.email}</p>
                    <p><strong>Phone:</strong> {app.phone}</p>
                    <p><strong>Income:</strong> {app.income}</p>
                    <p><strong>Amount:</strong> {app.disbursementAmount} ETH</p>
                  </div>

                  <div className="mt-2 bg-blue-100 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${(app.adminApprovedCount / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedApplication(app)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                  >
                    View Details
                  </button>
                  
                  <button
                    onClick={() => handleApprove(app.id)}
                    disabled={approvingId === app.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                  >
                    {approvingId === app.id ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-sm ${
          message.includes('Error') || message.includes('failed') || message.includes('denied')
            ? 'bg-red-50 text-red-700'
            : message.includes('successfully')
            ? 'bg-green-50 text-green-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Connected:</strong> {account}</p>
          {isOwner && <p className="text-green-600 font-medium">✓ Role: Contract Owner (Default Admin)</p>}
          <p><strong>SAG Verified Applications:</strong> {applications.length}</p>
          <p className="text-blue-600 font-medium mt-2">ℹ️ Each application requires 2 admin approvals (DAO voting)</p>
        </div>
      </div>
    </div>
  );
};

export default AdminApprovePage;