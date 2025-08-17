import React, { useState, useEffect } from 'react';

const Test = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Contract addresses
  const contracts = {
    roleManagement: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    scholarshipRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    ipfsEncryption: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    documentVerificationDAO: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    financeDisbursement: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
  };

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          setResult(`✅ Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          setResult(`✅ Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      } catch (error) {
        if (error.code === 4001) {
          setResult('❌ User rejected connection');
        } else {
          setResult('❌ Failed to connect wallet');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setResult('❌ MetaMask not installed');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsWalletConnected(false);
    setResult('👋 Wallet disconnected');
  };

  const simulateUpload = (files) => {
    setLoading(true);
    const newFiles = Array.from(files).map(file => ({
      fileName: file.name,
      success: Math.random() > 0.2, // 80% success rate
      ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
      size: file.size
    }));
    
    setTimeout(() => {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      const successCount = newFiles.filter(f => f.success).length;
      setResult(`✅ ${successCount}/${newFiles.length} files uploaded`);
      setLoading(false);
    }, 1000);
  };

  const tabs = [
    { id: 'upload', label: 'Upload' },
    { id: 'role', label: 'Roles' },
    { id: 'scholarship', label: 'Apply' },
    { id: 'voting', label: 'Vote' },
    { id: 'funds', label: 'Funds' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">
            Scholarship DAO
          </h1>

          {/* Wallet Connection */}
          <div className="mb-6 flex justify-center">
            {!isWalletConnected ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
              >
                {loading ? 'Connecting...' : '🦊 Connect MetaMask'}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Upload Documents</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      if (!isWalletConnected) {
                        setResult('❌ Connect wallet first');
                        return;
                      }
                      simulateUpload(e.target.files);
                    }}
                    className="mb-4"
                  />
                  <p className="text-sm text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className={`p-2 rounded flex justify-between ${
                        file.success ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <span className="text-sm">{file.fileName}</span>
                        <span className="text-sm">
                          {file.success ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'role' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Assign Role</h3>
                <input placeholder="User Address" className="w-full p-3 border rounded-lg" />
                <select className="w-full p-3 border rounded-lg">
                  <option>Select Role</option>
                  <option value="0">Student</option>
                  <option value="1">Reviewer</option>
                  <option value="2">Finance</option>
                  <option value="3">Admin</option>
                </select>
                <button 
                  onClick={() => setResult('📋 Role assignment simulated')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Assign Role
                </button>
              </div>
            )}

            {activeTab === 'scholarship' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Apply for Scholarship</h3>
                <input placeholder="IPFS Hash" className="w-full p-3 border rounded-lg" />
                <input placeholder="Amount (Wei)" type="number" className="w-full p-3 border rounded-lg" />
                <button 
                  onClick={() => setResult('📋 Application submitted')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Submit Application
                </button>
              </div>
            )}

            {activeTab === 'voting' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Vote on Application</h3>
                <input placeholder="Application ID" type="number" className="w-full p-3 border rounded-lg" />
                <select className="w-full p-3 border rounded-lg">
                  <option>Select Vote</option>
                  <option value="true">Approve</option>
                  <option value="false">Reject</option>
                </select>
                <button 
                  onClick={() => setResult('📋 Vote cast')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Cast Vote
                </button>
              </div>
            )}

            {activeTab === 'funds' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Release Funds</h3>
                <input placeholder="Application ID" type="number" className="w-full p-3 border rounded-lg" />
                <button 
                  onClick={() => setResult('📋 Funds released')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Release Funds
                </button>
              </div>
            )}
          </div>

          {/* Result Display */}
          {result && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Result:</h4>
              <div className="text-sm text-gray-600">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Test;