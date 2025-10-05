import React from 'react';

export default function Features() {
  return (
    <div>
      <section className="py-20 bg-gradient-to-b from-white via-[#FEFEFE] to-[#E5D5FD]/10 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#9360E3] rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#E2D3FA] rounded-full filter blur-3xl"></div>
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute top-40 right-20 w-20 h-20 border-4 border-[#E5D5FD] rounded-lg rotate-45 opacity-30"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-[#E2D3FA] rounded-full opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block bg-[#E5D5FD] text-[#9360E3] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Why Choose Us
            </span>
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent">
              Platform Features
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experience a seamless scholarship application journey with our powerful features
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Verified Scholarships */}
            <div className="group relative bg-white p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.15)] hover:shadow-[0_20px_60px_rgba(147,96,227,0.3)] transition-all duration-300 hover:-translate-y-2 border border-[#E5D5FD]/30">
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#9360E3]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                {/* Icon Container */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="text-white text-3xl">✓</span>
                  {/* Ping animation */}
                  <span className="absolute inset-0 rounded-2xl bg-emerald-400 animate-ping opacity-20"></span>
                </div>

                <h3 className="font-heading font-bold text-2xl mb-4 text-gray-900 group-hover:text-[#9360E3] transition-colors">
                  Verified Scholarships
                </h3>
                <p className="font-body text-gray-600 leading-relaxed mb-4">
                  All scholarships are thoroughly verified and legitimate opportunities from trusted organizations.
                </p>

                {/* Additional info on hover */}
                <div className="flex items-center space-x-2 text-sm text-[#9360E3] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-2xl opacity-50"></div>
            </div>

            {/* Feature 2 - Easy Application */}
            <div className="group relative bg-white p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.15)] hover:shadow-[0_20px_60px_rgba(147,96,227,0.3)] transition-all duration-300 hover:-translate-y-2 border border-[#E5D5FD]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9360E3]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="text-white text-3xl">📄</span>
                  <span className="absolute inset-0 rounded-2xl bg-[#9360E3] animate-ping opacity-20"></span>
                </div>

                <h3 className="font-heading font-bold text-2xl mb-4 text-gray-900 group-hover:text-[#9360E3] transition-colors">
                  Easy Online Application
                </h3>
                <p className="font-body text-gray-600 leading-relaxed mb-4">
                  Simple, streamlined application process that saves you time and effort with smart forms.
                </p>

                <div className="flex items-center space-x-2 text-sm text-[#9360E3] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E5D5FD] to-transparent rounded-2xl opacity-50"></div>
            </div>

            {/* Feature 3 - Track Status */}
            <div className="group relative bg-white p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.15)] hover:shadow-[0_20px_60px_rgba(147,96,227,0.3)] transition-all duration-300 hover:-translate-y-2 border border-[#E5D5FD]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9360E3]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="text-white text-3xl">📊</span>
                  <span className="absolute inset-0 rounded-2xl bg-amber-400 animate-ping opacity-20"></span>
                </div>

                <h3 className="font-heading font-bold text-2xl mb-4 text-gray-900 group-hover:text-[#9360E3] transition-colors">
                  Track Application Status
                </h3>
                <p className="font-body text-gray-600 leading-relaxed mb-4">
                  Monitor your applications in real-time and never miss important updates with notifications.
                </p>

                <div className="flex items-center space-x-2 text-sm text-[#9360E3] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-2xl opacity-50"></div>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {/* Feature 4 - Blockchain Security */}
            <div className="group relative bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.3)] hover:shadow-[0_20px_60px_rgba(147,96,227,0.5)] transition-all duration-300 hover:-translate-y-2 text-white overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>

              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🔐</span>
                </div>

                <h3 className="font-heading font-bold text-xl mb-3">
                  Blockchain Security
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  Your applications are secured with blockchain technology for transparency and immutability.
                </p>
              </div>
            </div>

            {/* Feature 5 - Smart Matching */}
            <div className="group relative bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.3)] hover:shadow-[0_20px_60px_rgba(147,96,227,0.5)] transition-all duration-300 hover:-translate-y-2 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>

              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎯</span>
                </div>

                <h3 className="font-heading font-bold text-xl mb-3">
                  Smart Matching
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  AI-powered recommendations match you with scholarships based on your profile and goals.
                </p>
              </div>
            </div>

            {/* Feature 6 - 24/7 Support */}
            <div className="group relative bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.3)] hover:shadow-[0_20px_60px_rgba(147,96,227,0.5)] transition-all duration-300 hover:-translate-y-2 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>

              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💬</span>
                </div>

                <h3 className="font-heading font-bold text-xl mb-3">
                  24/7 Support
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  Our dedicated support team is always here to help you with any questions or concerns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}