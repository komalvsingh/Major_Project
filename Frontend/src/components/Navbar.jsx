import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from './AuthContext.jsx';
import { useWallet } from '../context/WalletContext';
import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import contractArtifact from '../abis/ScholarshipContract.json';

const CONTRACT_ADDRESS = "0x8Cc43D0c82Df65B6FF81A95F857917073f447BA5";
const CONTRACT_OWNER = "0x937dCeeAdBFD02D5453C7937E2217957D74E912d";

export default function Navbar() {
  const { currentUser, role, logout } = useAuth();
  const { account, isConnected, connectWallet, disconnectWallet, provider } = useWallet();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  useEffect(() => {
    if (account && provider && isConnected) {
      fetchUserRole();
      checkIfOwner();
    } else {
      setUserRole(null);
      setIsOwner(false);
    }
  }, [account, provider, isConnected]);

  const checkIfOwner = () => {
    if (account && CONTRACT_OWNER) {
      setIsOwner(account.toLowerCase() === CONTRACT_OWNER.toLowerCase());
    }
  };

  const fetchUserRole = async () => {
    setIsLoadingRole(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
      const [roleValue, isActive] = await contract.getUserRole(account);
      
      if (isActive) {
        setUserRole(Number(roleValue));
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    }
    setIsLoadingRole(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const getRoleLabel = (roleNum) => {
    const roleLabels = {
      0: 'Student',
      1: 'SAG Bureau',
      2: 'Admin',
      3: 'Finance Bureau'
    };
    return roleLabels[roleNum] || 'Unknown';
  };

  // Role-based navigation links
  const getNavigationLinks = () => {
    // Common links for everyone
    const commonLinks = [
      { to: "/", label: "Home" }
    ];

    // If wallet is not connected, show basic links
    if (!isConnected || userRole === null) {
      return [
        ...commonLinks,
        { to: "/list", label: "Scholarships" },
        { to: "/apply", label: "Apply" },
        { to: "/status", label: "Status" },
        { to: "/contact", label: "Contact" }
      ];
    }

    // Role-specific links
    let roleLinks = [];

    switch (userRole) {
      case 0: // Student
        roleLinks = [
          { to: "/list", label: "Scholarships" },
          { to: "/apply", label: "Apply" },
          { to: "/status", label: "Status" },
          { to: "/contact", label: "Contact" }
        ];
        break;

      case 1: // SAG Bureau
        roleLinks = [
          { to: "/list", label: "Scholarships" },
          { to: "/sag", label: "SAG Verify" },
          { to: "/contact", label: "Contact" }
        ];
        break;

      case 2: // Admin
        roleLinks = [
          { to: "/list", label: "Scholarships" },
          { to: "/scheme", label: "Create Scheme" },
          { to: "/admin", label: "Admin Approve" },
          { to: "/contact", label: "Contact" }
        ];
        break;

      case 3: // Finance Bureau
        roleLinks = [
          { to: "/list", label: "Scholarships" },
          { to: "/finance", label: "Disburse Funds" },
          { to: "/contact", label: "Contact" }
        ];
        break;

      default:
        roleLinks = [
          { to: "/list", label: "Scholarships" },
          { to: "/contact", label: "Contact" }
        ];
    }

    // Add Role Management link only for owner
    if (isOwner) {
      roleLinks.push({ to: "/role", label: "Manage Roles" });
    }

    return [...commonLinks, ...roleLinks];
  };

  const navigationLinks = getNavigationLinks();
  
  return(
    <div>
      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5D5FD]/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">🎓</span>
              </div>
              <span className="font-heading font-bold text-2xl bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent">
                <NavLink to="/">FundSure</NavLink>
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationLinks.map((link) => (
                <NavLink 
                  key={link.to}
                  to={link.to}  
                  className={({ isActive }) => 
                    isActive 
                      ? "text-[#9360E3] font-semibold border-b-2 border-[#9360E3] pb-1" 
                      : "text-gray-700 hover:text-[#9360E3] transition-colors font-medium"
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  {/* User Info Display - Only show when wallet is NOT connected */}
                  {!isConnected && (
                    <div className="hidden lg:flex items-center space-x-3 bg-[#E5D5FD]/30 px-4 py-2.5 rounded-lg border border-[#E2D3FA]">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {(currentUser.displayName || currentUser.email)?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">
                          {currentUser.displayName || currentUser.email?.split('@')[0]}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Wallet Connection */}
                  {!isConnected ? (
                    <button 
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <div className="flex items-center space-x-3 bg-[#E2D3FA]/40 px-4 py-2.5 rounded-lg border border-[#E5D5FD] shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-mono font-medium text-gray-800">
                          {account?.substring(0, 6)}...{account?.substring(38)}
                        </span>
                        {userRole !== null && !isLoadingRole && (
                          <span className="text-xs text-[#9360E3] font-bold">
                            {getRoleLabel(userRole)} {isOwner && '👑'}
                          </span>
                        )}
                        {isLoadingRole && (
                          <span className="text-xs text-gray-500">Loading role...</span>
                        )}
                      </div>
                      <button 
                        onClick={disconnectWallet}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Disconnect Wallet"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-600 hover:shadow-md transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/login"  
                    className={({ isActive }) => 
                      `text-gray-700 hover:text-[#9360E3] hover:bg-[#E5D5FD]/30 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "text-[#9360E3] bg-[#E5D5FD]/30" : ""}`
                    }
                  >
                    Login
                  </NavLink>
                  <NavLink 
                    to="/register"  
                    className={({ isActive }) => 
                      `bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 ${isActive ? "shadow-lg scale-105" : ""}`
                    }
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>

          </div>
        </div>
      </header>
    </div>
  )
}