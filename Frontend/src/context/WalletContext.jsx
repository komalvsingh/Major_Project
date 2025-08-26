import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        // Create ethers provider
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get network information
        const network = await web3Provider.getNetwork();
        
        console.log('Connected to network:', network);
        console.log('Connected account:', accounts[0]);
        
        setAccount(accounts[0]);
        setProvider(web3Provider);
        setChainId(network.chainId.toString());
        setIsConnected(true);
        
        return accounts[0];
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      if (error.code === 4001) {
        alert('Please connect to MetaMask.');
      } else if (error.code === -32002) {
        alert('MetaMask is already processing a connection request. Please check MetaMask.');
      } else {
        alert('Error connecting to wallet: ' + error.message);
      }
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setChainId(null);
    setIsConnected(false);
  };

  const switchNetwork = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toBeHex(targetChainId) }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  };

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      // Wait a bit for MetaMask to load
      setTimeout(async () => {
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({
              method: 'eth_accounts',
            });
            
            if (accounts.length > 0) {
              // Create ethers provider
              const web3Provider = new ethers.BrowserProvider(window.ethereum);
              
              // Get network information
              const network = await web3Provider.getNetwork();
              
              console.log('Auto-connected to network:', network);
              console.log('Auto-connected account:', accounts[0]);
              
              setAccount(accounts[0]);
              setProvider(web3Provider);
              setChainId(network.chainId.toString());
              setIsConnected(true);
            }
          } catch (error) {
            console.error('Error checking connection:', error);
          }
        }
      }, 100);
    };
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log('Accounts changed:', accounts);
        
        if (accounts.length > 0) {
          try {
            // Update provider when account changes
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const network = await web3Provider.getNetwork();
            
            setAccount(accounts[0]);
            setProvider(web3Provider);
            setChainId(network.chainId.toString());
            setIsConnected(true);
          } catch (error) {
            console.error('Error handling account change:', error);
            disconnectWallet();
          }
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = async (chainId) => {
        console.log('Chain changed:', chainId);
        
        try {
          // Update provider when chain changes
          if (account) {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
            setChainId(parseInt(chainId, 16).toString());
          }
        } catch (error) {
          console.error('Error handling chain change:', error);
        }
      };

      const handleDisconnect = () => {
        console.log('MetaMask disconnected');
        disconnectWallet();
      };

      // Add event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      // Cleanup listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [account]);

  // Helper function to get current network name
  const getNetworkName = () => {
    if (!chainId) return 'Unknown';
    
    const networks = {
      '1': 'Ethereum Mainnet',
      '3': 'Ropsten Testnet',
      '4': 'Rinkeby Testnet',
      '5': 'Goerli Testnet',
      '11155111': 'Sepolia Testnet',
      '17000': 'Holesky Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
    };
    
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  const value = {
    account,
    isConnected,
    provider,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getNetworkName,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};