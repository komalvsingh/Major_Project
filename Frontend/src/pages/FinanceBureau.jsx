import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractArtifact from '../abis/ScholarshipContract.json';

const FinanceDisbursement = () => {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [applications, setApplications] = useState([]);
  const [treasuryBalance, setTreasuryBalance] = useState('0');
  const [disbursing, setDisbursing] = useState(null);
  const [depositing, setDepositing] = useState(false);

  const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
  const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";
  const HOLESKY_CHAIN_ID = 11155111;
  const contractABI = contractArtifact.abi;

  const isOwner = account?.toLowerCase() === CONTRACT_OWNER.toLowerCase();

  useEffect(() => {
    if (isConnected && account) {
      initializeContract();
    }
  }, [isConnected, account]);

  useEffect(() => {
    if (contract && account) {
      checkUserRole();
      fetchApprovedApplications();
      fetchTreasuryBalance();
    }
  }, [contract, account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await checkAndSwitchNetwork();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to connect wallet:', err);
        alert('Failed to connect wallet');
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== HOLESKY_CHAIN_ID) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${HOLESKY_CHAIN_ID.toString(16)}` }],
        });
      }
      return true;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  const initializeContract = async () => {
    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      setProvider(providerInstance);
      
      const signer = await providerInstance.getSigner();
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer
      );
      
      setContract(contractInstance);
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  const checkUserRole = async () => {
    try {
      const [role, isActive] = await contract.getUserRole(account);
      const roleNumber = Number(role);
      setUserRole(roleNumber);
      
      if (roleNumber !== 3 && !isOwner) {
        alert('Access Denied: Only Finance Bureau members can access this page');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchTreasuryBalance = async () => {
    try {
      const balance = await contract.getTreasuryBalance();
      setTreasuryBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching treasury balance:', error);
    }
  };

  const depositToTreasury = async () => {
    if (!contract || !isOwner) {
      alert('Only contract owner can deposit funds');
      return;
    }

    const amountInEth = prompt("Enter amount to deposit (in ETH):", "0.1");
    if (!amountInEth || parseFloat(amountInEth) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setDepositing(true);

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.depositFunds({
        value: ethers.parseEther(amountInEth)
      });
      
      console.log('Deposit transaction:', tx.hash);
      alert(`Transaction submitted! Hash: ${tx.hash}`);
      
      await tx.wait();
      
      alert(`Successfully deposited ${amountInEth} ETH to treasury!`);
      await fetchTreasuryBalance();
      
    } catch (error) {
      console.error('Deposit error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected');
      } else if (error.reason) {
        alert(`Deposit failed: ${error.reason}`);
      } else {
        alert(`Deposit failed: ${error.message}`);
      }
    } finally {
      setDepositing(false);
    }
  };

  const fetchApprovedApplications = async () => {
    setLoading(true);
    try {
      const allApps = await contract.getAllApplications();
      
      const approvedApps = allApps.filter(app => 
        Number(app.status) === 2 && !app.isDisbursed
      );
      
      const formattedApps = approvedApps.map(app => ({
        id: Number(app.id),
        student: app.student,
        name: app.name,
        email: app.email,
        aadharNumber: app.aadharNumber,
        income: app.income,
        disbursementAmount: ethers.formatEther(app.disbursementAmount),
        appliedAt: new Date(Number(app.appliedAt) * 1000).toLocaleDateString(),
        status: Number(app.status),
        isDisbursed: app.isDisbursed
      }));
      
      setApplications(formattedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburseFunds = async (application) => {
    if (!contract) {
      alert('Contract not initialized');
      return;
    }

    // Check treasury balance
    const treasuryBalanceWei = ethers.parseEther(treasuryBalance);
    const disbursementAmountWei = ethers.parseEther(application.disbursementAmount);
    
    if (treasuryBalanceWei < disbursementAmountWei) {
      alert(`Insufficient treasury funds!\n\nRequired: ${application.disbursementAmount} ETH\nAvailable: ${treasuryBalance} ETH\n\nPlease deposit more funds first.`);
      return;
    }

    const confirm = window.confirm(
      `Disburse ${application.disbursementAmount} ETH to ${application.name}?\n\nStudent: ${application.student}\nApplication ID: ${application.id}`
    );

    if (!confirm) return;

    setDisbursing(application.id);

    try {
      console.log('Disbursing funds for application:', application.id);
      
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.disburseFunds(
        application.id,
        0
      );
      
      console.log('Transaction sent:', tx.hash);
      alert(`Transaction submitted! Hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      alert('Funds disbursed successfully! The student will receive the amount in their wallet.');
      
      await fetchApprovedApplications();
      await fetchTreasuryBalance();
      
    } catch (error) {
      console.error('Disbursement error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected');
      } else if (error.reason) {
        alert(`Disbursement failed: ${error.reason}`);
      } else {
        alert(`Disbursement failed: ${error.message}`);
      }
    } finally {
      setDisbursing(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Finance Bureau - Fund Disbursement
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to continue
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (userRole !== null && userRole !== 3 && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Only Finance Bureau members can access this page
          </p>
          <p className="text-sm text-gray-500">
            Your Role: {['Student', 'SAG Bureau', 'Admin', 'Finance Bureau'][userRole] || 'Unknown'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Connected: {account?.substring(0, 6)}...{account?.substring(38)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Finance Bureau - Fund Disbursement
          </h1>
          <p className="text-gray-600 mb-4">
            Connected: {account?.substring(0, 6)}...{account?.substring(38)}
            {isOwner && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Contract Owner</span>}
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Treasury Balance</p>
                <p className="text-2xl font-bold text-green-600">{treasuryBalance} ETH</p>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <button
                    onClick={depositToTreasury}
                    disabled={depositing}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {depositing ? 'Depositing...' : 'Deposit Funds'}
                  </button>
                )}
                <button
                  onClick={fetchTreasuryBalance}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {parseFloat(treasuryBalance) === 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-semibold mb-1">Warning: Empty Treasury</p>
              <p className="text-yellow-700 text-sm">
                The treasury has no funds. Please deposit ETH before attempting to disburse funds.
                {isOwner && ' Use the "Deposit Funds" button above.'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Approved Applications Ready for Disbursement
            </h2>
            <button
              onClick={fetchApprovedApplications}
              disabled={loading}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh List'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No applications ready for disbursement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          ID: {app.id}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                          Admin Approved
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {app.name}
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Email:</p>
                          <p className="text-gray-800">{app.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Aadhar:</p>
                          <p className="text-gray-800">{app.aadharNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Income:</p>
                          <p className="text-gray-800">{app.income}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Applied:</p>
                          <p className="text-gray-800">{app.appliedAt}</p>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 mb-1">Student Wallet Address:</p>
                        <p className="text-xs font-mono text-gray-800 break-all">
                          {app.student}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="bg-green-50 border border-green-200 px-4 py-2 rounded">
                          <p className="text-xs text-gray-600">Disbursement Amount</p>
                          <p className="text-xl font-bold text-green-600">
                            {app.disbursementAmount} ETH
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisburseFunds(app)}
                      disabled={disbursing === app.id || parseFloat(treasuryBalance) < parseFloat(app.disbursementAmount)}
                      className={`ml-4 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        disbursing === app.id
                          ? 'bg-gray-400 text-white cursor-wait'
                          : parseFloat(treasuryBalance) < parseFloat(app.disbursementAmount)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {disbursing === app.id ? 'Disbursing...' : 
                       parseFloat(treasuryBalance) < parseFloat(app.disbursementAmount) ? 'Insufficient Funds' :
                       'Disburse Funds'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Only admin-approved applications are shown here</li>
            <li>• Funds will be sent directly to the student's wallet address</li>
            <li>• Make sure you have enough ETH for gas fees</li>
            <li>• Treasury balance must be sufficient for disbursement</li>
            <li>• Each application can only be disbursed once</li>
            {isOwner && <li>• As contract owner, you can deposit funds to the treasury</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FinanceDisbursement;