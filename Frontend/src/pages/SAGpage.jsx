// import React, { useState, useEffect } from 'react';
// import { useWallet } from '../context/WalletContext';
// import contractArtifact from '../abis/ScholarshipContract.json';
// import { ethers } from 'ethers';

// const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";

// const SAGVerifyPage = () => {
//   const { account, provider, connectWallet } = useWallet();
//   const [applications, setApplications] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [isSAGMember, setIsSAGMember] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [isCheckingRole, setIsCheckingRole] = useState(false);
//   const [verifyingId, setVerifyingId] = useState(null);
//   const [selectedApplication, setSelectedApplication] = useState(null);
//   const [downloadingHash, setDownloadingHash] = useState(null);

//   const getStatusText = (status) => {
//     const statuses = ['Applied', 'SAG Verified', 'Admin Approved', 'Disbursed'];
//     return statuses[status] || 'Unknown';
//   };

//   const getStatusColor = (status) => {
//     const colors = [
//       'bg-yellow-100 text-yellow-800', 
//       'bg-blue-100 text-blue-800',     
//       'bg-green-100 text-green-800',   
//       'bg-purple-100 text-purple-800'  
//     ];
//     return colors[status] || 'bg-gray-100 text-gray-800';
//   };

//   useEffect(() => {
//     if (account && provider) {
//       checkSAGRole();
//     }
//   }, [account, provider]);

//   useEffect(() => {
//     if (isSAGMember && provider) {
//       loadApplications();
//     }
//   }, [isSAGMember, provider]);

//   const checkSAGRole = async () => {
//     setIsCheckingRole(true);
//     try {
//       if (provider) {
//         const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
//         const [role, isActive] = await contract.getUserRole(account);
//         const isSAG = parseInt(role) === 1 && isActive;
//         setIsSAGMember(isSAG);
//         if (!isSAG) {
//           setMessage('Access denied. Only SAG Bureau members can access this page.');
//         }
//       }
//     } catch (error) {
//       console.error('Error checking SAG role:', error);
//       setMessage('Error checking user role. Please try again.');
//     }
//     setIsCheckingRole(false);
//   };

//   const loadApplications = async () => {
//     setIsLoading(true);
//     try {
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
//       const appliedApplications = await contract.getApplicationsByStatus(0);
      
//       const formattedApplications = appliedApplications.map(app => ({
//         id: Number(app.id),
//         student: app.student,
//         name: app.name,
//         email: app.email,
//         phone: app.phone,
//         aadharNumber: app.aadharNumber,
//         income: app.income,
//         documentsIPFSHash: app.documentsIPFSHash,
//         status: Number(app.status),
//         appliedAt: Number(app.appliedAt),
//         disbursementAmount: ethers.formatEther(app.disbursementAmount)
//       }));

//       setApplications(formattedApplications);
//     } catch (error) {
//       console.error('Error loading applications:', error);
//       setMessage('Error loading applications. Please try again.');
//     }
//     setIsLoading(false);
//   };

//   const handleVerify = async (applicationId) => {
//     setVerifyingId(applicationId);
//     setMessage('');

//     try {
//       const signer = await provider.getSigner();
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
      
//       const tx = await contract.verifySAG(applicationId);
//       setMessage('Verification transaction submitted...');
      
//       await tx.wait();
//       setMessage(`Application #${applicationId} verified successfully!`);
//       await loadApplications();
      
//     } catch (error) {
//       console.error('Verification error:', error);
//       let errorMessage = 'Verification failed';
//       if (error.message.includes('Already voted')) {
//         errorMessage = 'You have already verified this application';
//       } else if (error.message.includes('user rejected')) {
//         errorMessage = 'Transaction rejected by user';
//       }
//       setMessage(errorMessage);
//     }
//     setVerifyingId(null);
//   };

//   const handleConnectWallet = async () => {
//     setIsConnecting(true);
//     try {
//       await connectWallet();
//     } catch (error) {
//       setMessage('Failed to connect wallet');
//     }
//     setIsConnecting(false);
//   };

//   const formatDate = (timestamp) => {
//     return new Date(timestamp * 1000).toLocaleDateString();
//   };

//   // Parse multiple IPFS hashes separated by commas
//   const parseDocumentHashes = (ipfsHash) => {
//     if (!ipfsHash) return [];
//     return ipfsHash.split(',').map(hash => hash.trim()).filter(hash => hash.length > 0);
//   };

//   const openDocument = (hash) => {
//     const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
//     window.open(url, '_blank');
//   };

//   // New download function
//   const downloadDocument = async (hash, fileName = null) => {
//     setDownloadingHash(hash);
//     try {
//       const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      
//       // Fetch the file
//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error('Failed to fetch document');
//       }

//       // Get the blob
//       const blob = await response.blob();
      
//       // Determine file extension from content type
//       let fileExtension = 'bin'; // default
//       const contentType = response.headers.get('content-type');
//       if (contentType) {
//         if (contentType.includes('pdf')) fileExtension = 'pdf';
//         else if (contentType.includes('image/jpeg')) fileExtension = 'jpg';
//         else if (contentType.includes('image/png')) fileExtension = 'png';
//         else if (contentType.includes('image/gif')) fileExtension = 'gif';
//         else if (contentType.includes('text/plain')) fileExtension = 'txt';
//         else if (contentType.includes('application/msword')) fileExtension = 'doc';
//         else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) fileExtension = 'docx';
//         else if (contentType.includes('application/vnd.ms-excel')) fileExtension = 'xls';
//         else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) fileExtension = 'xlsx';
//       }

//       // Create download link
//       const downloadUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = downloadUrl;
//       link.download = fileName || `document_${hash.substring(0, 8)}.${fileExtension}`;
      
//       // Trigger download
//       document.body.appendChild(link);
//       link.click();
      
//       // Cleanup
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(downloadUrl);
      
//       setMessage(`Document downloaded successfully!`);
      
//     } catch (error) {
//       console.error('Download error:', error);
//       setMessage('Failed to download document. Please try again.');
//     }
//     setDownloadingHash(null);
//   };

//   // Connect wallet screen
//   if (!account) {
//     return (
//       <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
//         <h2 className="text-2xl font-bold mb-4 text-center">Connect Wallet</h2>
//         <p className="text-gray-600 mb-6 text-center">Connect your wallet to verify applications</p>
//         <button
//           onClick={handleConnectWallet}
//           disabled={isConnecting}
//           className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//         >
//           {isConnecting ? 'Connecting...' : 'Connect Wallet'}
//         </button>
//         {message && (
//           <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
//             {message}
//           </div>
//         )}
//       </div>
//     );
//   }

//   // Loading role check
//   if (isCheckingRole) {
//     return (
//       <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
//         <h2 className="text-xl font-bold mb-4 text-center">Verifying Access...</h2>
//         <div className="flex justify-center items-center py-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//         </div>
//       </div>
//     );
//   }

//   // Access denied screen
//   if (!isSAGMember) {
//     return (
//       <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
//         <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
//         <p className="text-gray-600 mb-4">Only SAG Bureau members can verify applications.</p>
//         <div className="bg-gray-50 p-4 rounded-lg text-xs">
//           <p><strong>Connected Account:</strong></p>
//           <p className="font-mono break-all">{account}</p>
//         </div>
//         <button
//           onClick={checkSAGRole}
//           className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
//         >
//           Retry Verification
//         </button>
//       </div>
//     );
//   }

//   // Application details modal
//   if (selectedApplication) {
//     const documentHashes = parseDocumentHashes(selectedApplication.documentsIPFSHash);
    
//     return (
//       <div className="max-w-2xl mx-auto mt-10 p-6 bg-white border rounded-lg shadow-lg">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">Application Details</h2>
//           <button
//             onClick={() => setSelectedApplication(null)}
//             className="text-gray-500 hover:text-gray-700 text-2xl"
//           >
//             ✕
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Application ID</label>
//               <p className="text-lg font-semibold">#{selectedApplication.id}</p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Status</label>
//               <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
//                 {getStatusText(selectedApplication.status)}
//               </span>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Student Name</label>
//               <p className="text-gray-900">{selectedApplication.name}</p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Email</label>
//               <p className="text-gray-900">{selectedApplication.email}</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Phone</label>
//               <p className="text-gray-900">{selectedApplication.phone}</p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
//               <p className="text-gray-900">{selectedApplication.aadharNumber}</p>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Annual Income</label>
//             <p className="text-gray-900">{selectedApplication.income}</p>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Applied Date</label>
//             <p className="text-gray-900">{formatDate(selectedApplication.appliedAt)}</p>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Scholarship Amount</label>
//             <p className="text-gray-900 font-semibold">{selectedApplication.disbursementAmount} ETH</p>
//           </div>

//           {/* Enhanced Documents section with download functionality */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Documents ({documentHashes.length})</label>
//             {documentHashes.length > 0 ? (
//               <div className="space-y-2">
//                 {documentHashes.map((hash, index) => (
//                   <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
//                     <span className="text-sm">Document {index + 1}</span>
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => openDocument(hash)}
//                         className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
//                       >
//                         📄 View
//                       </button>
//                       <button
//                         onClick={() => downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`)}
//                         disabled={downloadingHash === hash}
//                         className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
//                       >
//                         {downloadingHash === hash ? (
//                           <span className="flex items-center gap-1">
//                             <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
//                             Downloading...
//                           </span>
//                         ) : (
//                           <>⬇️ Download</>
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//                 {/* Download All button */}
//                 <div className="mt-3 pt-3 border-t">
//                   <button
//                     onClick={() => {
//                       documentHashes.forEach((hash, index) => {
//                         setTimeout(() => {
//                           downloadDocument(hash, `application_${selectedApplication.id}_doc_${index + 1}`);
//                         }, index * 1000); // Stagger downloads by 1 second each
//                       });
//                     }}
//                     disabled={downloadingHash !== null}
//                     className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400"
//                   >
//                     📦 Download All Documents
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <p className="text-gray-500">No documents uploaded</p>
//             )}
//           </div>

//           <div className="pt-4 border-t">
//             <button
//               onClick={() => handleVerify(selectedApplication.id)}
//               disabled={verifyingId === selectedApplication.id}
//               className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//             >
//               {verifyingId === selectedApplication.id ? 'Verifying...' : 'Verify Application'}
//             </button>
//           </div>
//         </div>

//         {message && (
//           <div className={`mt-4 p-3 rounded-lg text-sm ${
//             message.includes('Error') || message.includes('failed') || message.includes('Failed')
//               ? 'bg-red-50 text-red-700'
//               : message.includes('successfully') || message.includes('downloaded')
//               ? 'bg-green-50 text-green-700'
//               : 'bg-blue-50 text-blue-700'
//           }`}>
//             {message}
//           </div>
//         )}
//       </div>
//     );
//   }

//   // Main applications list
//   return (
//     <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border rounded-lg shadow-lg">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold">SAG Verification Dashboard</h2>
//         <button
//           onClick={loadApplications}
//           disabled={isLoading}
//           className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
//         >
//           {isLoading ? 'Loading...' : 'Refresh'}
//         </button>
//       </div>

//       {isLoading ? (
//         <div className="text-center py-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="text-gray-600 mt-2">Loading applications...</p>
//         </div>
//       ) : applications.length === 0 ? (
//         <div className="text-center py-8">
//           <p className="text-gray-600">No applications pending SAG verification.</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {applications.map((app) => (
//             <div key={app.id} className="border rounded-lg p-4 hover:shadow-md">
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <h3 className="text-lg font-semibold">#{app.id} - {app.name}</h3>
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
//                       {getStatusText(app.status)}
//                     </span>
//                     {parseDocumentHashes(app.documentsIPFSHash).length > 0 && (
//                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                         📄 {parseDocumentHashes(app.documentsIPFSHash).length} Documents
//                       </span>
//                     )}
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
//                     <p><strong>Email:</strong> {app.email}</p>
//                     <p><strong>Phone:</strong> {app.phone}</p>
//                     <p><strong>Income:</strong> {app.income}</p>
//                     <p><strong>Applied:</strong> {formatDate(app.appliedAt)}</p>
//                   </div>
//                 </div>
                
//                 <div className="flex flex-col gap-2 ml-4">
//                   <button
//                     onClick={() => setSelectedApplication(app)}
//                     className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
//                   >
//                     View Details
//                   </button>
                  
//                   <button
//                     onClick={() => handleVerify(app.id)}
//                     disabled={verifyingId === app.id}
//                     className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
//                   >
//                     {verifyingId === app.id ? 'Verifying...' : 'Verify'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {message && (
//         <div className={`mt-6 p-4 rounded-lg text-sm ${
//           message.includes('Error') || message.includes('failed')
//             ? 'bg-red-50 text-red-700'
//             : message.includes('successfully')
//             ? 'bg-green-50 text-green-700'
//             : 'bg-blue-50 text-blue-700'
//         }`}>
//           {message}
//         </div>
//       )}

//       <div className="mt-6 pt-4 border-t border-gray-200">
//         <div className="text-xs text-gray-500">
//           <p><strong>Connected:</strong> {account}</p>
//           <p><strong>Applications:</strong> {applications.length}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SAGVerifyPage;

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";

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

  // AI Verification State
  const [aiVerifying, setAiVerifying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiMessage, setAiMessage] = useState('');

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
        else if (contentType.includes('application/vnd.ms-excel')) fileExtension = 'xls';
        else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) fileExtension = 'xlsx';
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

  // AI VERIFICATION FUNCTIONS
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setAiMessage('Please upload a valid document (JPG, PNG, or PDF)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setAiMessage('File size should be less than 10MB');
        return;
      }
      
      setUploadedFile(file);
      setAiResult(null);
      setAiMessage('');
    }
  };

  const handleAIVerification = async () => {
    if (!uploadedFile) {
      setAiMessage('Please upload a document first');
      return;
    }

    setAiVerifying(true);
    setUploadProgress(0);
    setAiResult(null);
    setAiMessage('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      if (selectedApplication) {
        formData.append('student_name', selectedApplication.name);
        formData.append('application_id', selectedApplication.id.toString());
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:8001/verify', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Verification failed');
      }

      const result = await response.json();
      setAiResult(result);
      setAiMessage('Document verified successfully!');

    } catch (error) {
      console.error('AI Verification Error:', error);
      setAiMessage(`Verification failed: ${error.message}`);
      setAiResult({
        error: true,
        message: error.message
      });
    } finally {
      setAiVerifying(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getResultColor = (result) => {
    if (!result) return 'bg-gray-100 text-gray-800';
    if (result.includes('VERIFIED')) return 'bg-green-100 text-green-800';
    if (result.includes('REJECTED')) return 'bg-red-100 text-red-800';
    if (result.includes('REVIEW')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const ScoreGauge = ({ score, label }) => {
    const getColor = (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg className="transform -rotate-90 w-20 h-20">
            <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
            <circle
              cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="none"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
              className={getColor(score)}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${getColor(score)}`}>{score}%</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">{label}</p>
      </div>
    );
  };

  // AI VERIFICATION PANEL COMPONENT
  const AIVerificationPanel = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
        <h2 className="text-xl font-bold">AI Document Verification</h2>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
        <input
          type="file"
          id="file-upload"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm text-gray-600 mb-1">
            {uploadedFile ? uploadedFile.name : 'Click to upload document'}
          </p>
          <p className="text-xs text-gray-500">Supports: JPG, PNG, PDF (Max 10MB)</p>
        </label>
      </div>

      {uploadedFile && !aiVerifying && !aiResult && (
        <button
          onClick={handleAIVerification}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold mb-4"
        >
          🤖 Verify with AI
        </button>
      )}

      {aiVerifying && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Analyzing document...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {aiResult && !aiResult.error && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${getResultColor(aiResult.verification_result)}`}>
            <p className="font-bold text-center text-lg">{aiResult.verification_result}</p>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Document Type</p>
            <p className="font-semibold">{aiResult.document_type}</p>
          </div>

          <div className="flex justify-around py-4 border-y">
            <ScoreGauge score={aiResult.confidence_score} label="Confidence" />
            <ScoreGauge score={aiResult.authenticity_score} label="Authenticity" />
          </div>

          {aiResult.tampering_detected && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="font-semibold text-red-800 mb-1">⚠️ Tampering Detected</p>
              <ul className="text-xs text-red-700 list-disc list-inside">
                {aiResult.validation_checks?.tampering_analysis?.tampering_indicators?.map((indicator, idx) => (
                  <li key={idx}>{indicator}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border rounded p-3">
            <p className="font-semibold mb-2">Extracted Information</p>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {Object.entries(aiResult.extracted_data || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">{value || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <p className="font-semibold text-blue-800 mb-2">📋 Recommendations</p>
            <ul className="text-xs text-blue-700 space-y-1">
              {aiResult.recommendations?.map((rec, idx) => (
                <li key={idx}>• {rec}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setUploadedFile(null);
                setAiResult(null);
                setAiMessage('');
              }}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              Verify Another
            </button>
          </div>
        </div>
      )}

      {aiResult && aiResult.error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="font-semibold text-red-800">❌ Verification Failed</p>
          <p className="text-sm text-red-600 mt-1">{aiResult.message}</p>
          <button
            onClick={() => {
              setUploadedFile(null);
              setAiResult(null);
              setAiMessage('');
            }}
            className="w-full mt-3 bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!uploadedFile && !aiResult && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded">
          <p className="font-semibold text-purple-800 mb-2">🔍 How it works</p>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• Upload manually downloaded documents</li>
            <li>• AI performs OCR text extraction</li>
            <li>• Detects tampering & validates format</li>
            <li>• Cross-verifies with student data</li>
            <li>• Provides confidence & authenticity scores</li>
          </ul>
        </div>
      )}

      {aiMessage && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          aiMessage.includes('failed') || aiMessage.includes('Failed')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {aiMessage}
        </div>
      )}
    </div>
  );

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

  // MAIN LAYOUT WITH SPLIT SCREEN
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">SAG Verification Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL - Applications List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Pending Applications</h2>
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

          {/* RIGHT PANEL - AI Verification */}
          <AIVerificationPanel />
        </div>
      </div>
    </div>
  );
};

export default SAGVerifyPage;