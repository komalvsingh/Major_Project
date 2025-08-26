import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import contractArtifact from '../abis/ScholarshipContract.json';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0xCa9C04EA23B34Ec3c1B7Dc77A0323744211918F9"; // Replace with your contract address
const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d"; // Your owner address

const RoleAssignPage = () => {
  const { account, provider, connectWallet } = useWallet();
  const [userAddress, setUserAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingOwner, setIsCheckingOwner] = useState(false);

  const roles = [
    { value: '0', label: 'Student' },
    { value: '1', label: 'SAG Bureau' },
    { value: '2', label: 'Admin' },
    { value: '3', label: 'Finance Bureau' }
  ];

  useEffect(() => {
    if (account && provider) {
      checkOwnership();
    }
  }, [account, provider]);

  const checkOwnership = async () => {
    setIsCheckingOwner(true);
    try {
      // First check if the connected account matches the known owner address
      if (account && CONTRACT_OWNER && account.toLowerCase() === CONTRACT_OWNER.toLowerCase()) {
        setIsOwner(true);
        setMessage('');
        setIsCheckingOwner(false);
        return;
      }

      // If we have a provider, try to get the owner from the contract
      if (provider) {
        try {
          // Create a contract instance with the provider
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
          
          // Try to call the owner function
          const owner = await contract.owner();
          console.log('Contract owner:', owner);
          console.log('Connected account:', account);
          
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
          setMessage('Owner verification successful');
        } catch (contractError) {
          console.error('Contract call failed:', contractError);
          
          // Fallback: check against the hardcoded owner address
          const isOwnerByAddress = account && CONTRACT_OWNER && account.toLowerCase() === CONTRACT_OWNER.toLowerCase();
          setIsOwner(isOwnerByAddress);
          
          if (isOwnerByAddress) {
            setMessage('Connected as owner (verified by address - contract call failed)');
          } else {
            setMessage('Contract call failed and address does not match known owner');
          }
        }
      } else {
        // Fallback: just check against the known owner address
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
      
      // Final fallback: check against the hardcoded owner address
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

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setMessage('');
    try {
      await connectWallet();
    } catch (error) {
      console.error('Wallet connection error:', error);
      setMessage('Failed to connect wallet. Please try again.');
    }
    setIsConnecting(false);
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
      // Get the signer from the provider
      const signer = await provider.getSigner();
      console.log('Signer:', await signer.getAddress());
      
      // Create contract instance with signer
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
      
      // Call the assignRole function
      const tx = await contract.assignRole(userAddress, parseInt(selectedRole));
      setMessage('Transaction submitted. Waiting for confirmation...');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
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
  if (!account) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Connect Wallet</h2>
        <p className="text-gray-600 mb-6 text-center">Connect your wallet to manage roles</p>
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
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

  // Loading ownership check
  if (isCheckingOwner) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Verifying Access...</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-gray-600 text-center text-sm">Checking contract ownership</p>
      </div>
    );
  }

  // Access denied screen
  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
        <p className="text-gray-600 mb-4">Only the contract owner can assign roles.</p>
        
        <div className="bg-gray-50 p-4 rounded-lg text-xs space-y-2">
          <p><strong>Connected Account:</strong></p>
          <p className="font-mono break-all">{account}</p>
          <p><strong>Contract Owner:</strong></p>
          <p className="font-mono break-all">{CONTRACT_OWNER}</p>
        </div>
        
        {message && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        
        <button
          onClick={checkOwnership}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Verification
        </button>
      </div>
    );
  }

  // Main role assignment form
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Assign Roles</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">User Address</label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b8D4Eb85C88Cd4..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Enter the Ethereum address of the user</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAssignRole}
          disabled={isLoading || !userAddress.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {isLoading ? 'Assigning Role...' : 'Assign Role'}
        </button>
      </div>

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-sm ${
          message.includes('Error') || message.includes('failed') || message.includes('rejected')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : message.includes('successfully')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Connected:</strong> {account}</p>
          <p><strong>Role:</strong> Contract Owner</p>
          <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignPage;