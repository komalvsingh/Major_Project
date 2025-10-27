import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Mock contract ABI - replace with your actual ABI
const contractABI = [
  "function getAllApplications() external view returns (tuple(uint256 id, address student, string name, string email, string phone, string aadharNumber, string income, string documentsIPFSHash, uint8 status, uint256 sagVerifiedCount, uint256 adminApprovedCount, uint256 appliedAt, uint256 disbursementAmount, bool isDisbursed)[] memory)",
  "function getApplicationsByStatus(uint8 _status) external view returns (tuple(uint256 id, address student, string name, string email, string phone, string aadharNumber, string income, string documentsIPFSHash, uint8 status, uint256 sagVerifiedCount, uint256 adminApprovedCount, uint256 appliedAt, uint256 disbursementAmount, bool isDisbursed)[] memory)",
  "function owner() external view returns (address)",
  "function getUserRole(address _user) external view returns (uint8, bool)"
];

const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";

export default function AdminDashboard() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    sagVerified: 0,
    adminApproved: 0,
    disbursed: 0,
    totalDisbursed: 0
  });

  const statusLabels = {
    0: "Applied",
    1: "SAG Verified",
    2: "Admin Approved",
    3: "Disbursed"
  };

  const statusColors = {
    0: "bg-yellow-100 text-yellow-800 border-yellow-300",
    1: "bg-blue-100 text-blue-800 border-blue-300",
    2: "bg-green-100 text-green-800 border-green-300",
    3: "bg-purple-100 text-purple-800 border-purple-300"
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer
      );

      setContract(contractInstance);
      setError(null);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError('Failed to connect wallet');
    }
  };

  // Fetch all applications
  const fetchApplications = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const allApps = await contract.getAllApplications();
      
      const formattedApps = allApps.map(app => ({
        id: Number(app.id),
        student: app.student,
        name: app.name,
        email: app.email,
        phone: app.phone,
        aadharNumber: app.aadharNumber,
        income: app.income,
        documentsIPFSHash: app.documentsIPFSHash,
        status: Number(app.status),
        sagVerifiedCount: Number(app.sagVerifiedCount),
        adminApprovedCount: Number(app.adminApprovedCount),
        appliedAt: Number(app.appliedAt),
        disbursementAmount: ethers.formatEther(app.disbursementAmount),
        isDisbursed: app.isDisbursed
      }));

      setApplications(formattedApps);
      calculateStats(formattedApps);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (apps) => {
    const newStats = {
      total: apps.length,
      applied: apps.filter(a => a.status === 0).length,
      sagVerified: apps.filter(a => a.status === 1).length,
      adminApproved: apps.filter(a => a.status === 2).length,
      disbursed: apps.filter(a => a.status === 3).length,
      totalDisbursed: apps
        .filter(a => a.isDisbursed)
        .reduce((sum, a) => sum + parseFloat(a.disbursementAmount), 0)
        .toFixed(4)
    };
    setStats(newStats);
  };

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === parseInt(statusFilter));
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toString().includes(searchTerm)
      );
    }

    setFilteredApps(filtered);
  }, [statusFilter, searchTerm, applications]);

  // Initialize
  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (contract) {
      fetchApplications();
    }
  }, [contract]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-t-4 border-purple-600">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              </div>
              <p className="text-gray-600 text-lg">Manage and monitor all scholarship applications</p>
              {account && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <div className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-medium">
                    {account.substring(0, 6)}...{account.substring(38)}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={fetchApplications}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-500 uppercase">Total</p>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-yellow-600 uppercase">Applied</p>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-700">{stats.applied}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-600 uppercase">SAG Verified</p>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-700">{stats.sagVerified}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-green-600 uppercase">Admin Approved</p>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700">{stats.adminApproved}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-purple-600 uppercase">Disbursed</p>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-700">{stats.disbursed}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold uppercase opacity-90">Total Paid</p>
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.totalDisbursed} ETH</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Applications</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, ID, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="all">All Applications ({stats.total})</option>
                <option value="0">Applied ({stats.applied})</option>
                <option value="1">SAG Verified ({stats.sagVerified})</option>
                <option value="2">Admin Approved ({stats.adminApproved})</option>
                <option value="3">Disbursed ({stats.disbursed})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Student Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Applied Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Amount (ETH)</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No applications found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold">
                          #{app.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">{app.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{app.student.substring(0, 10)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{app.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{formatDate(app.appliedAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusColors[app.status]}`}>
                          {statusLabels[app.status]}
                        </span>
                        <div className="mt-2 text-xs text-gray-500">
                          <p>SAG: {app.sagVerifiedCount}/1</p>
                          <p>Admin: {app.adminApprovedCount}/2</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-lg font-bold text-purple-700">{app.disbursementAmount}</p>
                        {app.isDisbursed && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const details = `
Name: ${app.name}
Email: ${app.email}
Phone: ${app.phone}
Aadhar: ${app.aadharNumber}
Income: ${app.income}
Student Address: ${app.student}
Status: ${statusLabels[app.status]}
Amount: ${app.disbursementAmount} ETH
Applied: ${formatDate(app.appliedAt)}
                            `.trim();
                            alert(details);
                          }}
                          className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        {filteredApps.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing <span className="font-bold text-purple-700">{filteredApps.length}</span> of <span className="font-bold text-purple-700">{applications.length}</span> applications
          </div>
        )}
      </div>
    </div>
  );
}