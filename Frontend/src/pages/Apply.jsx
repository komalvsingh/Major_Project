import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
const contractABI = contractArtifact.abi;
import { ethers } from 'ethers';

const ScholarshipApplication = () => {
  const { account, isConnected, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    aadharNumber: '',
    income: '',
    documentsIPFSHash: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
  const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";
  const HOLESKY_CHAIN_ID = 11155111;
  
  const isOwner = account?.toLowerCase() === CONTRACT_OWNER.toLowerCase();

  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== HOLESKY_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${HOLESKY_CHAIN_ID.toString(16)}` }],
          });
          setNetworkError(null);
          return true;
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${HOLESKY_CHAIN_ID.toString(16)}`,
                  chainName: 'Holesky Testnet',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://ethereum-holesky.publicnode.com'],
                  blockExplorerUrls: ['https://holesky.etherscan.io/'],
                }],
              });
              setNetworkError(null);
              return true;
            } catch (addError) {
              setNetworkError('Failed to add Holesky network. Please add it manually.');
              return false;
            }
          } else {
            setNetworkError('Please switch to Holesky testnet manually.');
            return false;
          }
        }
      }
      setNetworkError(null);
      return true;
    } catch (error) {
      setNetworkError('Network check failed. Please ensure you are on Holesky testnet.');
      return false;
    }
  };

  useEffect(() => {
    const initializeContract = async () => {
      if (!window.ethereum || !isConnected || !account) return;

      try {
        setContractError(null);
        const networkOk = await checkAndSwitchNetwork();
        if (!networkOk) return;

        const providerInstance = new ethers.BrowserProvider(window.ethereum);
        setProvider(providerInstance);
        
        const signer = await providerInstance.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
        
        try {
          await contractInstance.owner();
          setContract(contractInstance);
          setContractError(null);
        } catch (testError) {
          setContractError(`Contract connection failed: ${testError.message}`);
        }
      } catch (error) {
        setContractError(`Initialization failed: ${error.message}`);
      }
    };

    initializeContract();
  }, [isConnected, account]);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!contract || !account) return;

      try {
        try {
          await contract.owner();
        } catch (ownerError) {
          setContractError('Contract connection failed - cannot verify owner');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const [role, isActive] = await contract.getUserRole(account);
            const roleNumber = Number(role);
            setUserRole(roleNumber);
            setIsRegistered(isActive && roleNumber === 0);
            setContractError(null);
            return;
          } catch (roleError) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } else {
              try {
                const userInfo = await contract.users(account);
                if (userInfo && userInfo.length >= 2) {
                  const roleNumber = Number(userInfo[0]);
                  const isActive = userInfo[1];
                  setUserRole(roleNumber);
                  setIsRegistered(isActive && roleNumber === 0);
                  setContractError(null);
                  return;
                }
              } catch (usersError) {
                console.error('users mapping failed:', usersError.message);
              }
              
              setUserRole(null);
              setIsRegistered(false);
              setContractError(null);
            }
          }
        }
      } catch (error) {
        setUserRole(null);
        setIsRegistered(false);
        setContractError('Failed to check user status. Please try refreshing the page.');
      }
    };
    
    if (contract && account) {
      const timer = setTimeout(checkUserStatus, 500);
      return () => clearTimeout(timer);
    }
  }, [contract, account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT_ACCESS_TOKEN}` },
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      throw error;
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

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
      const allHashes = [...uploadedFiles, ...uploadedHashes].map(f => f.ipfsHash).join(',');
      setFormData(prev => ({ ...prev, documentsIPFSHash: allHashes }));

      alert(`Successfully uploaded ${files.length} file(s) to IPFS!`);
    } catch (error) {
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(newFiles);
    const allHashes = newFiles.map(f => f.ipfsHash).join(',');
    setFormData(prev => ({ ...prev, documentsIPFSHash: allHashes }));
  };

  const registerAsStudent = async () => {
    if (!contract) {
      alert('Contract not initialized');
      return;
    }

    const networkOk = await checkAndSwitchNetwork();
    if (!networkOk) {
      alert('Please switch to Holesky network first');
      return;
    }
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.registerAsStudent();
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      setIsRegistered(true);
      setUserRole(0);
      alert('Successfully registered as student!');
    } catch (error) {
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if (error.reason) {
        alert(`Registration failed: ${error.reason}`);
      } else {
        alert(`Registration failed: ${error.message}`);
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

    const networkOk = await checkAndSwitchNetwork();
    if (!networkOk) {
      alert('Please switch to Holesky network first');
      return;
    }

    if (!formData.name || !formData.email || !formData.aadharNumber) {
      alert('Please fill in all required fields');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.submitApplication(
        formData.name,
        formData.email,
        formData.phone,
        formData.aadharNumber,
        formData.income,
        formData.documentsIPFSHash || "QmDefault"
      );
      
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      
      alert('Application submitted successfully!');
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
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if (error.reason) {
        alert(`Application submission failed: ${error.reason}`);
      } else {
        alert(`Application submission failed: ${error.message}`);
      }
    }
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FFFFFF 100%)' }}>
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#9360E3' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Scholarship Portal</h1>
            <p className="text-gray-600 text-sm">Connect your wallet to access the application system</p>
          </div>
          <button
            onClick={connectWallet}
            className="w-full text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' }}
          >
            Connect Wallet
          </button>
          <p className="text-xs text-gray-500 text-center mt-4">Holesky Testnet Required</p>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FFFFFF 100%)' }}>
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-red-200">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Network Error</h2>
            <p className="text-gray-700 text-sm">{networkError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FFFFFF 100%)' }}>
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Owner Dashboard</h1>
            <p className="text-gray-600 text-sm mb-4">Administrative access detected</p>
            <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-mono" style={{ backgroundColor: '#E5D5FD', color: '#9360E3' }}>
              {account?.substring(0, 8)}...{account?.substring(34)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" style={{ color: '#9360E3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Administrative Functions
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Manage user roles and permissions</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Review and process scholarship applications</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Treasury and fund management</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>System configuration and settings</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #E5D5FD 0%, #FEFEFE 50%, #FFFFFF 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Scholarship Application Portal</h1>
              <p className="text-sm text-gray-600">Government of India | Digital Scholarship Program</p>
            </div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700 font-mono">{account?.substring(0, 6)}...{account?.substring(38)}</span>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#E5D5FD', color: '#9360E3' }}>Holesky Testnet</span>
          </div>
        </div>

        {contractError && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-sm mb-1">Contract Connection Error</h3>
                <p className="text-red-700 text-sm">{contractError}</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-sm text-red-800 underline hover:text-red-900">
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        {!contractError && !isRegistered && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4" style={{ borderColor: '#9360E3' }}>
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#E5D5FD' }}>
                <svg className="w-6 h-6" style={{ color: '#9360E3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Registration Required</h3>
                <p className="text-gray-700 text-sm mb-4">Complete your student registration to access the scholarship application system.</p>
                <button
                  onClick={registerAsStudent}
                  disabled={loading || !contract}
                  className="text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: loading ? '#9360E3' : 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' }}
                >
                  {loading ? 'Processing...' : 'Register as Student'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!contractError && isRegistered && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-800 text-sm">Registration Verified</h3>
                  <p className="text-green-700 text-sm">You can now submit your scholarship application</p>
                </div>
              </div>
            </div>

            <form onSubmit={submitApplication} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ focusRing: '2px solid #9360E3' }}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Aadhar Number *</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Enter Aadhar number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Annual Family Income</label>
                  <input
                    type="text"
                    name="income"
                    value={formData.income}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Enter annual family income"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Supporting Documents *</label>
                <p className="text-xs text-gray-600 mb-3">Upload Aadhar card, income certificate, and other required documents (Max 5MB, JPG/PNG/PDF)</p>
                
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white disabled:opacity-50 cursor-pointer hover:border-purple-300"
                  style={{ file: { background: 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' } }}
                />
                
                {isUploading && (
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#E5D5FD' }}>
                    <div className="flex items-center justify-between text-sm mb-2" style={{ color: '#9360E3' }}>
                      <span className="font-medium">Uploading to IPFS...</span>
                      <span className="font-semibold">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #9360E3 0%, #7845c4 100%)' }}
                      ></div>
                    </div>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: '#E5D5FD' }}>
                            <svg className="w-5 h-5" style={{ color: '#9360E3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                            <p className="text-xs text-gray-600">{(file.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <a 
                            href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 rounded-lg font-medium hover:shadow-md transition-all"
                            style={{ backgroundColor: '#E5D5FD', color: '#9360E3' }}
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !isRegistered || isUploading || uploadedFiles.length === 0 || contractError}
                  className="w-full text-white py-3.5 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                  style={{ background: loading ? '#9360E3' : 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Application...
                    </span>
                  ) : isUploading ? 'Uploading Documents...' : 
                     uploadedFiles.length === 0 ? 'Please Upload Documents First' :
                     contractError ? 'Contract Error' :
                     'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {txHash && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 border-l-4 border-green-500">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-green-800 mb-2">Transaction Submitted Successfully</h3>
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-green-700 mb-1 font-medium">Transaction Hash:</p>
                  <p className="text-xs text-green-800 font-mono break-all">{txHash}</p>
                </div>
                <a
                  href={`https://holesky.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-white px-4 py-2 rounded-lg hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #9360E3 0%, #7845c4 100%)' }}
                >
                  View on Block Explorer
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 border border-gray-100">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0" style={{ backgroundColor: '#E5D5FD' }}>
              <svg className="w-5 h-5" style={{ color: '#9360E3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Important Information</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: '#9360E3' }}>•</span>
                  <span>Ensure you have Holesky testnet ETH for transaction fees</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: '#9360E3' }}>•</span>
                  <span>Get testnet ETH from <a href="https://faucet.quicknode.com/ethereum/holesky" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#9360E3' }}>Holesky Faucet</a></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: '#9360E3' }}>•</span>
                  <span>All documents are securely stored on IPFS</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: '#9360E3' }}>•</span>
                  <span>Your application will be reviewed by authorized officials</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p className="mb-1">Blockchain-Based Scholarship Management System</p>
          <p className="font-mono">{CONTRACT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipApplication;