import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";

const RoleAssignPage = () => {
  const { account, provider, isConnected } = useWallet();
  const [userAddress, setUserAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwner, setIsCheckingOwner] = useState(false);

  const roles = [
    { value: '0', label: 'Student', icon: '🎓', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: '1', label: 'SAG Bureau', icon: '✓', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: '2', label: 'Admin', icon: '👤', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: '3', label: 'Finance Bureau', icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  ];

  useEffect(() => {
    if (account && provider) {
      checkOwnership();
    }
  }, [account, provider]);

  const checkOwnership = async () => {
    setIsCheckingOwner(true);
    try {
      if (account && CONTRACT_OWNER && account.toLowerCase() === CONTRACT_OWNER.toLowerCase()) {
        setIsOwner(true);
        setMessage('');
        setIsCheckingOwner(false);
        return;
      }

      if (provider) {
        try {
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
          const owner = await contract.owner();
          
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
          setMessage('Owner verification successful');
        } catch (contractError) {
          console.error('Contract call failed:', contractError);
          
          const isOwnerByAddress = account && CONTRACT_OWNER && account.toLowerCase() === CONTRACT_OWNER.toLowerCase();
          setIsOwner(isOwnerByAddress);
          
          if (isOwnerByAddress) {
            setMessage('Connected as owner (verified by address - contract call failed)');
          } else {
            setMessage('Contract call failed and address does not match known owner');
          }
        }
      } else {
        const isOwnerByAddress = account && CONTRACT_OWNER && account.toLowerCase() === CONTRACT_OWNER.toLowerCase();
        setIsOwner(isOwnerByAddress);
        
        if (isOwnerByAddress) {
          setMessage('Connected as owner (verified by address - no provider)');
        } else {
          setMessage('No provider available and address does not match known owner');
        }
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
      
      const isOwnerByAddress = account && CONTRACT_OWNER && account.toLowerCase() === CONTRACT_OWNER.toLowerCase();
      setIsOwner(isOwnerByAddress);
      
      if (isOwnerByAddress) {
        setMessage('Connected as owner (verified by address - error occurred)');
      } else {
        setMessage('Error occurred and address does not match known owner');
      }
    }
    setIsCheckingOwner(false);
  };

  const handleAssignRole = async () => {
    if (!ethers.isAddress(userAddress)) {
      setMessage('Please enter a valid Ethereum address');
      return;
    }

    if (!provider) {
      setMessage('Wallet not properly connected. Please reconnect.');
      return;
    }

    setIsLoading(true);
    setMessage('Preparing transaction...');

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
      
      const tx = await contract.assignRole(userAddress, parseInt(selectedRole));
      setMessage('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      setMessage(`Role "${roles[selectedRole].label}" assigned successfully to ${userAddress}!`);
      setUserAddress('');
      setSelectedRole('0');
      
    } catch (error) {
      console.error('Transaction error:', error);
      
      let errorMessage = 'Transaction failed';
      
      if (error.reason) {
        errorMessage = `Error: ${error.reason}`;
      } else if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setMessage(errorMessage);
    }
    setIsLoading(false);
  };

  // Connect wallet screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-[#E5D5FD] text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">👥</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent mb-4">
            Role Management
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

  // Loading ownership check
  if (isCheckingOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-[#E5D5FD] text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Verifying Access...</h2>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5D5FD] border-t-[#9360E3]"></div>
          </div>
          <p className="text-gray-600 text-sm">Checking contract ownership</p>
        </div>
      </div>
    );
  }

  // Access denied screen
  if (!isOwner) {
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
            Only the contract owner can assign roles.
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Connected Account</p>
              <p className="text-sm font-mono text-gray-800 break-all">{account}</p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Contract Owner</p>
              <p className="text-sm font-mono text-gray-800 break-all">{CONTRACT_OWNER}</p>
            </div>
          </div>
          
          {message && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              {message}
            </div>
          )}
          
          <button
            onClick={checkOwnership}
            className="w-full bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  // Main role assignment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Role Management
              </h1>
              <p className="text-purple-100 text-lg">
                Assign roles to users in the system
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-5xl">👥</span>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
            <p className="text-sm text-purple-100">Contract Owner</p>
            <p className="text-sm font-mono font-semibold">
              {account?.substring(0, 10)}...{account?.substring(34)}
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#E5D5FD] p-8">
          <div className="space-y-6">
            {/* User Address Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                User Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x742d35Cc6634C0532925a3b8D4Eb85C88Cd4..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#9360E3] transition-colors bg-white font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-2">Enter the Ethereum address of the user</p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Select Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedRole === role.value
                        ? 'border-[#9360E3] bg-[#E5D5FD]/30 shadow-md'
                        : 'border-gray-200 bg-white hover:border-[#9360E3]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${role.color}`}>
                        <span className="text-2xl">{role.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{role.label}</p>
                        {selectedRole === role.value && (
                          <p className="text-xs text-[#9360E3] font-medium">Selected</p>
                        )}
                      </div>
                    </div>
                    {selectedRole === role.value && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-[#9360E3] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleAssignRole}
                disabled={isLoading || !userAddress.trim()}
                className="w-full bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning Role...
                  </span>
                ) : (
                  '✓ Assign Role'
                )}
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-5 rounded-xl border-l-4 ${
              message.includes('Error') || message.includes('failed') || message.includes('rejected')
                ? 'bg-red-50 border-red-500 text-red-700'
                : message.includes('successfully')
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-blue-50 border-blue-500 text-blue-700'
            }`}>
              <p className="font-semibold text-sm">{message}</p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-[#E5D5FD]">
            <div className="bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600 font-medium mb-1">Connected Account</p>
                  <p className="text-gray-900 font-mono text-xs break-all">{account}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-1">Your Role</p>
                  <p className="text-[#9360E3] font-bold">👑 Contract Owner</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#9360E3]/20">
                <p className="text-xs text-gray-700 font-mono break-all">
                  <span className="font-semibold">Contract:</span> {CONTRACT_ADDRESS}
                </p>
              </div>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="mt-6 bg-[#E5D5FD]/30 border border-[#9360E3]/20 rounded-xl p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">📋 Role Descriptions</p>
            <div className="space-y-2 text-xs text-gray-700">
              <p><span className="font-semibold">🎓 Student:</span> Can submit scholarship applications</p>
              <p><span className="font-semibold">✓ SAG Bureau:</span> Can verify submitted applications</p>
              <p><span className="font-semibold">👤 Admin:</span> Can approve verified applications (DAO voting)</p>
              <p><span className="font-semibold">💰 Finance Bureau:</span> Can disburse funds to approved applications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignPage;