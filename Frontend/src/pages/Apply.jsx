import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext'; // Import your existing wallet context
import contractArtifact from '../abis/ScholarshipContract.json'; // Import your contract artifact
const contractABI = contractArtifact.abi; // Extract just the ABI array
// Import ethers properly for v6
import { ethers } from 'ethers';

const ScholarshipApplication = () => {
  const { account, isConnected, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    aadharNumber: '',
    income: '',
    documentsIPFSHash: ''
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Contract address and owner info
  const CONTRACT_ADDRESS = "0x78522f1F905Ad6f0b679F064a79D48eBf24a57d4";
  const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";
  
  // Check if current user is the contract owner
  const isOwner = account?.toLowerCase() === CONTRACT_OWNER.toLowerCase();

  // Initialize contract - UPDATED FOR ETHERS V6
  useEffect(() => {
    const initializeContract = async () => {
      if (window.ethereum && isConnected) {
        try {
          // Ethers v6 syntax
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            contractABI,
            signer
          );
          setContract(contractInstance);
          console.log('Contract initialized successfully');
        } catch (error) {
          console.error('Error initializing contract:', error);
        }
      }
    };

    initializeContract();
  }, [isConnected]);

  // Check user role and registration - UPDATED FOR ETHERS V6
  useEffect(() => {
    const checkUserStatus = async () => {
      if (contract && account) {
        try {
          const [role, isActive] = await contract.getUserRole(account);
          console.log('User role:', role, 'Is active:', isActive);
          
          // Convert BigInt to number for comparison
          const roleNumber = Number(role);
          setUserRole(roleNumber);
          setIsRegistered(isActive && roleNumber === 0); // Role.Student = 0
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    };
    checkUserStatus();
  }, [contract, account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // File upload to IPFS via Pinata
  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: `scholarship-doc-${Date.now()}-${file.name}`,
      keyvalues: {
        studentAddress: account,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT_ACCESS_TOKEN}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has invalid type. Only JPG, PNG, and PDF are allowed.`);
        return;
      }
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedHashes = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i + 1) / files.length) * 100);
        
        const ipfsHash = await uploadToIPFS(file);
        uploadedHashes.push({
          fileName: file.name,
          fileType: file.type,
          ipfsHash: ipfsHash,
          fileSize: file.size
        });
      }

      setUploadedFiles(prev => [...prev, ...uploadedHashes]);
      
      // Update the IPFS hash in form data (combine all hashes)
      const allHashes = [...uploadedFiles, ...uploadedHashes].map(f => f.ipfsHash).join(',');
      setFormData(prev => ({
        ...prev,
        documentsIPFSHash: allHashes
      }));

      alert(`Successfully uploaded ${files.length} file(s) to IPFS!`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(newFiles);
    
    // Update IPFS hash in form data
    const allHashes = newFiles.map(f => f.ipfsHash).join(',');
    setFormData(prev => ({
      ...prev,
      documentsIPFSHash: allHashes
    }));
  };

  const registerAsStudent = async () => {
    if (!contract) {
      alert('Contract not initialized');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting to register as student...');
      const tx = await contract.registerAsStudent();
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      setIsRegistered(true);
      setUserRole(0); // Student role
      alert('Successfully registered as student!');
    } catch (error) {
      console.error('Registration error:', error);
      
      // More detailed error handling
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if (error.reason) {
        alert(`Registration failed: ${error.reason}`);
      } else {
        alert('Registration failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    
    if (!contract || !isRegistered) {
      alert('Please register as a student first');
      return;
    }

    // Validate form
    if (!formData.name || !formData.email || !formData.aadharNumber) {
      alert('Please fill in all required fields');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document (Aadhar card, income certificate, etc.)');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting application...');
      const tx = await contract.submitApplication(
        formData.name,
        formData.email,
        formData.phone,
        formData.aadharNumber,
        formData.income,
        formData.documentsIPFSHash || "QmDefault" // Default IPFS hash if not provided
      );
      
      setTxHash(tx.hash);
      console.log('Application transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Application confirmed:', receipt);
      
      alert('Application submitted successfully!');
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        aadharNumber: '',
        income: '',
        documentsIPFSHash: ''
      });
      setUploadedFiles([]);
    } catch (error) {
      console.error('Submission error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if (error.reason) {
        alert(`Application submission failed: ${error.reason}`);
      } else {
        alert('Application submission failed. Please try again.');
      }
    }
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Scholarship Application Portal
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to apply for scholarships
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Don't show application form to contract owner
  if (isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Contract Owner Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            You are the contract owner. This page is for student applications only.
          </p>
          <p className="text-sm text-gray-500">
            Connected as Owner: {account?.substring(0, 6)}...{account?.substring(38)}
          </p>
          <div className="mt-4 text-left bg-gray-50 p-4 rounded">
            <h3 className="font-semibold text-gray-700 mb-2">Available Actions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Assign roles to users</li>
              <li>• Manage treasury funds</li>
              <li>• View all applications</li>
              <li>• Configure scholarship settings</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Scholarship Application
          </h1>
          <p className="text-gray-600 mb-6">
            Connected: {account?.substring(0, 6)}...{account?.substring(38)}
          </p>

          {/* Debug info - remove in production */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Debug Info:</h3>
            <p className="text-blue-700 text-sm">
              Contract: {contract ? 'Initialized' : 'Not initialized'}
            </p>
            <p className="text-blue-700 text-sm">
              User Role: {userRole !== null ? userRole : 'Unknown'}
            </p>
            <p className="text-blue-700 text-sm">
              Is Registered: {isRegistered ? 'Yes' : 'No'}
            </p>
          </div>

          {!isRegistered && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Registration Required
              </h3>
              <p className="text-yellow-700 mb-3">
                You need to register as a student before applying for scholarships.
              </p>
              <button
                onClick={registerAsStudent}
                disabled={loading || !contract}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register as Student'}
              </button>
            </div>
          )}

          {isRegistered && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">
                  ✅ Registration Complete
                </h3>
                <p className="text-green-700">
                  You are registered as a student and can now apply for scholarships.
                </p>
              </div>

              <form onSubmit={submitApplication}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhar Number *
                    </label>
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your Aadhar number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family Income
                    </label>
                    <input
                      type="text"
                      name="income"
                      value={formData.income}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your family income"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Documents *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload required documents (Aadhar card, income certificate, etc.). Max 5MB per file. JPG, PNG, PDF only.
                    </p>
                    
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    
                    {isUploading && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Uploading to IPFS...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {uploadedFiles.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</h4>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">{file.fileName}</p>
                                <p className="text-xs text-green-600">
                                  IPFS: {file.ipfsHash} | Size: {(file.fileSize / 1024).toFixed(1)} KB
                                </p>
                                <a 
                                  href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  View on IPFS
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isRegistered || isUploading || uploadedFiles.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    {loading ? 'Submitting Application...' : 
                     isUploading ? 'Uploading Documents...' : 
                     uploadedFiles.length === 0 ? 'Please Upload Documents First' :
                     'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {txHash && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                Transaction Submitted!
              </h3>
              <p className="text-green-700 text-sm break-all">
                Transaction Hash: {txHash}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScholarshipApplication;