import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const RoleManagerUI = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form states
  const [assignAddress, setAssignAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('1');
  const [revokeAddress, setRevokeAddress] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // Contract ABI (minimal for our functions)
  const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function assignRole(address user, uint8 role)",
    "function revokeRole(address user)",
    "function transferOwnership(address newOwner)",
    "function getUserRole(address user) view returns (uint8)",
    "function getRoleString(address user) view returns (string)",
    "function isAdmin(address user) view returns (bool)",
    "function getAllRoleUsers() view returns (address[], uint8[])",
    "event RoleAssigned(address indexed user, uint8 role, address indexed assignedBy)",
    "event RoleRevoked(address indexed user, uint8 previousRole, address indexed revokedBy)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
  ];

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update this!

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const web3Signer = web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        const roleContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer);
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setContract(roleContract);
        setUserAddress(address);
        
        // Check user's role and permissions
        await checkUserRole(roleContract, address);
        await loadAllUsers(roleContract);
        
        setMessage('Wallet connected successfully!');
      } else {
        setMessage('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMessage('Error connecting wallet: ' + error.message);
    }
  };

  const checkUserRole = async (contractInstance, address) => {
    try {
      const roleString = await contractInstance.getRoleString(address);
      const ownerAddress = await contractInstance.owner();
      const adminStatus = await contractInstance.isAdmin(address);
      
      setUserRole(roleString);
      setIsOwner(address.toLowerCase() === ownerAddress.toLowerCase());
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadAllUsers = async (contractInstance) => {
    try {
      const [addresses, roles] = await contractInstance.getAllRoleUsers();
      const usersList = [];
      
      for (let i = 0; i < addresses.length; i++) {
        const roleString = await contractInstance.getRoleString(addresses[i]);
        usersList.push({
          address: addresses[i],
          role: roleString
        });
      }
      
      setAllUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!contract || !assignAddress || !selectedRole) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const tx = await contract.assignRole(assignAddress, selectedRole);
      setMessage('Transaction sent. Waiting for confirmation...');
      
      await tx.wait();
      setMessage('Role assigned successfully!');
      setAssignAddress('');
      
      // Refresh data
      await checkUserRole(contract, userAddress);
      await loadAllUsers(contract);
    } catch (error) {
      console.error('Error assigning role:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!contract || !revokeAddress) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const tx = await contract.revokeRole(revokeAddress);
      setMessage('Transaction sent. Waiting for confirmation...');
      
      await tx.wait();
      setMessage('Role revoked successfully!');
      setRevokeAddress('');
      
      // Refresh data
      await loadAllUsers(contract);
    } catch (error) {
      console.error('Error revoking role:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!contract || !transferAddress) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const tx = await contract.transferOwnership(transferAddress);
      setMessage('Transaction sent. Waiting for confirmation...');
      
      await tx.wait();
      setMessage('Ownership transferred successfully!');
      setTransferAddress('');
      
      // Refresh data
      await checkUserRole(contract, userAddress);
      await loadAllUsers(contract);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Role Manager Dashboard</h1>
      
      {!contract ? (
        <div>
          <button onClick={connectWallet} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h3>Your Info</h3>
            <p><strong>Address:</strong> {userAddress}</p>
            <p><strong>Role:</strong> {userRole}</p>
            <p><strong>Is Owner:</strong> {isOwner ? 'Yes' : 'No'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          </div>

          {message && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '20px', 
              backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
              border: `1px solid ${message.includes('Error') ? '#f44336' : '#4caf50'}`,
              borderRadius: '5px'
            }}>
              {message}
            </div>
          )}

          {isAdmin && (
            <div>
              <h3>Admin Actions</h3>
              
              {/* Assign Role */}
              <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>Assign Role</h4>
                <input
                  type="text"
                  placeholder="User Address"
                  value={assignAddress}
                  onChange={(e) => setAssignAddress(e.target.value)}
                  style={{ padding: '5px', marginRight: '10px', width: '300px' }}
                />
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{ padding: '5px', marginRight: '10px' }}
                >
                  <option value="1">Admin</option>
                  <option value="2">SAG Officer</option>
                  <option value="3">Finance Officer</option>
                </select>
                <button 
                  onClick={handleAssignRole}
                  disabled={loading}
                  style={{ padding: '5px 15px' }}
                >
                  {loading ? 'Assigning...' : 'Assign Role'}
                </button>
              </div>

              {/* Revoke Role */}
              <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>Revoke Role</h4>
                <input
                  type="text"
                  placeholder="User Address"
                  value={revokeAddress}
                  onChange={(e) => setRevokeAddress(e.target.value)}
                  style={{ padding: '5px', marginRight: '10px', width: '300px' }}
                />
                <button 
                  onClick={handleRevokeRole}
                  disabled={loading}
                  style={{ padding: '5px 15px', backgroundColor: '#f44336', color: 'white' }}
                >
                  {loading ? 'Revoking...' : 'Revoke Role'}
                </button>
              </div>
            </div>
          )}

          {isOwner && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ff9800', borderRadius: '5px' }}>
              <h4>Owner Only: Transfer Ownership</h4>
              <input
                type="text"
                placeholder="New Owner Address"
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                style={{ padding: '5px', marginRight: '10px', width: '300px' }}
              />
              <button 
                onClick={handleTransferOwnership}
                disabled={loading}
                style={{ padding: '5px 15px', backgroundColor: '#ff9800', color: 'white' }}
              >
                {loading ? 'Transferring...' : 'Transfer Ownership'}
              </button>
            </div>
          )}

          {/* All Users */}
          <div>
            <h3>All Users with Roles</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
              {allUsers.length === 0 ? (
                <p style={{ padding: '10px' }}>No users found</p>
              ) : (
                allUsers.map((user, index) => (
                  <div key={index} style={{ 
                    padding: '10px', 
                    borderBottom: index < allUsers.length - 1 ? '1px solid #eee' : 'none' 
                  }}>
                    <strong>{user.address}</strong> - {user.role}
                    {user.address.toLowerCase() === userAddress.toLowerCase() && <em> (You)</em>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p>Make sure to:</p>
        <ul>
          <li>Update CONTRACT_ADDRESS with your deployed contract address</li>
          <li>Connect to the correct network (localhost:8545 for Hardhat)</li>
          <li>Have some test ETH in your wallet</li>
        </ul>
      </div>
    </div>
  );
};

export default RoleManagerUI;