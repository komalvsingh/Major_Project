import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from './AuthContext.jsx';
import { useWallet } from '../context/WalletContext';
import React from "react";

export default function Navbar() {
  const { currentUser, role, logout } = useAuth();
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };
  
  return(
    <div>
      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5D5FD]/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent">
                <NavLink to="/">FundSure</NavLink>
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-6">
              <NavLink 
                to="/"  
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#9360E3] font-semibold border-b-2 border-[#9360E3] pb-1" 
                    : "text-gray-700 hover:text-[#9360E3] transition-colors"
                }
              >
                Home
              </NavLink>
              <NavLink 
                to="/list"  
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#9360E3] font-semibold border-b-2 border-[#9360E3] pb-1" 
                    : "text-gray-700 hover:text-[#9360E3] transition-colors"
                }
              >
                Scholarships
              </NavLink>
              <NavLink 
                to="/apply"  
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#9360E3] font-semibold border-b-2 border-[#9360E3] pb-1" 
                    : "text-gray-700 hover:text-[#9360E3] transition-colors"
                }
              >
                Apply
              </NavLink>
              <NavLink 
                to="/status"  
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#9360E3] font-semibold border-b-2 border-[#9360E3] pb-1" 
                    : "text-gray-700 hover:text-[#9360E3] transition-colors"
                }
              >
                Status
              </NavLink>
              <NavLink 
                to="/contact"  
                className={({ isActive }) => 
                  isActive 
                    ? "text-[#9360E3] font-semibold border-b-2 border-[#9360E3] pb-1" 
                    : "text-gray-700 hover:text-[#9360E3] transition-colors"
                }
              >
                Contact
              </NavLink>
            </nav>

            <div className="flex items-center space-x-3">
              {currentUser ? (
                <>
                  {/* User Info Display */}
                  <div className="hidden lg:flex items-center space-x-3 bg-[#E5D5FD]/30 px-4 py-2 rounded-lg border border-[#E2D3FA]">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-800">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </span>
                      <span className="text-xs text-[#9360E3] font-semibold capitalize">
                        {role || 'student'}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {(currentUser.displayName || currentUser.email)?.[0]?.toUpperCase()}
                    </div>
                  </div>

                  {/* Wallet Connection */}
                  {!isConnected ? (
                    <button 
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-5 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 bg-[#E2D3FA]/40 px-4 py-2 rounded-lg border border-[#E5D5FD]">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {account?.substring(0, 6)}...{account?.substring(38)}
                      </span>
                      <button 
                        onClick={disconnectWallet}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-600 hover:shadow-md transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/login"  
                    className={({ isActive }) => 
                      `text-gray-700 hover:text-[#9360E3] hover:bg-[#E5D5FD]/30 font-medium px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "text-[#9360E3] bg-[#E5D5FD]/30" : ""}`
                    }
                  >
                    Login
                  </NavLink>
                  <NavLink 
                    to="/register"  
                    className={({ isActive }) => 
                      `bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 ${isActive ? "shadow-lg scale-105" : ""}`
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