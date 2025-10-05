import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-gray-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#9360E3] rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#E5D5FD] rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(147,96,227,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(147,96,227,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-[#E5D5FD] to-white bg-clip-text text-transparent">
                FundSure
              </span>
            </div>
            <p className="font-body text-gray-400 text-sm leading-relaxed mb-4">
              Empowering students through accessible scholarship opportunities.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-3">
              {[
                { icon: '📘', label: 'Facebook', color: 'from-blue-500 to-blue-600' },
                { icon: '🐦', label: 'Twitter', color: 'from-sky-400 to-sky-500' },
                { icon: '💼', label: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
                { icon: '📷', label: 'Instagram', color: 'from-pink-500 to-purple-600' }
              ].map((social, index) => (
                <a
                  key={index}
                  href="#"
                  className={`w-9 h-9 bg-gradient-to-br ${social.color} rounded-lg flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300`}
                  aria-label={social.label}
                >
                  <span className="text-base">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4 flex items-center space-x-2">
              <span className="w-1 h-5 bg-gradient-to-b from-[#9360E3] to-[#7a4dc4] rounded-full"></span>
              <span>Quick Links</span>
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/about', text: 'About Us' },
                { to: '/how-it-works', text: 'How It Works' },
                { to: '/scholarships', text: 'Browse Scholarships' }
              ].map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.to}
                    className="group font-body text-gray-400 hover:text-[#E5D5FD] transition-colors flex items-center space-x-2 text-sm"
                  >
                    <span className="w-0 group-hover:w-2 h-2 bg-[#9360E3] rounded-full transition-all duration-300"></span>
                    <span>{link.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4 flex items-center space-x-2">
              <span className="w-1 h-5 bg-gradient-to-b from-[#9360E3] to-[#7a4dc4] rounded-full"></span>
              <span>Support</span>
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/contact', text: 'Contact Us' },
                { to: '/faq', text: 'FAQ' },
                { to: '/help', text: 'Help Center' }
              ].map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.to}
                    className="group font-body text-gray-400 hover:text-[#E5D5FD] transition-colors flex items-center space-x-2 text-sm"
                  >
                    <span className="w-0 group-hover:w-2 h-2 bg-[#9360E3] rounded-full transition-all duration-300"></span>
                    <span>{link.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Legal */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4 flex items-center space-x-2">
              <span className="w-1 h-5 bg-gradient-to-b from-[#9360E3] to-[#7a4dc4] rounded-full"></span>
              <span>Stay Updated</span>
            </h3>
            
            {/* Newsletter Signup */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 px-3 py-2 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#9360E3] focus:border-[#9360E3] transition-all text-xs text-white placeholder-gray-500"
                />
                <button className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 text-xs">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <ul className="space-y-2">
                {[
                  { to: '/privacy', text: 'Privacy Policy' },
                  { to: '/terms', text: 'Terms & Conditions' }
                ].map((link, index) => (
                  <li key={index}>
                    <NavLink
                      to={link.to}
                      className="font-body text-gray-400 hover:text-[#E5D5FD] transition-colors text-sm"
                    >
                      {link.text}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 pt-6 border-t border-gray-800">
          <p className="font-body text-gray-400 text-sm">
            &copy; 2025 FundSure. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-400">Made with</span>
            <span className="text-red-500 animate-pulse">❤️</span>
            <span className="text-gray-400">for Students</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Powered by</span>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#9360E3]/20 border border-[#9360E3]/30 rounded-full text-[#E5D5FD] font-semibold">
                Blockchain
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </footer>
  );
}