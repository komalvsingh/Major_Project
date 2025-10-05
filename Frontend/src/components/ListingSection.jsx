import React, { useState } from 'react';

export default function ListingSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');

  return (
    <div>
      {/* Scholarships Listing Section */}
      <section className="py-20 bg-gradient-to-b from-white to-[#FEFEFE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-[#E5D5FD] text-[#9360E3] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Explore Opportunities
            </span>
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent">
              Available Scholarships
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover funding opportunities tailored to your academic journey
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative bg-white p-8 rounded-2xl shadow-[0_10px_40px_rgba(147,96,227,0.15)] border border-[#E5D5FD]/30 mb-12 backdrop-blur-sm">
            {/* Decorative gradient corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#9360E3]/10 to-transparent rounded-2xl"></div>
            
            <div className="relative flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  placeholder="Search scholarships by name, field, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9360E3] focus:border-[#9360E3] transition-all duration-200 group-hover:border-[#E5D5FD]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
              
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9360E3] focus:border-[#9360E3] transition-all duration-200 hover:border-[#E5D5FD] bg-white"
              >
                <option>All Categories</option>
                <option>Academic Excellence</option>
                <option>Need-Based</option>
                <option>Sports & Athletics</option>
                <option>Arts & Culture</option>
                <option>STEM Fields</option>
              </select>
              
              <button className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-[0_10px_30px_rgba(147,96,227,0.4)] hover:scale-105 transition-all duration-200">
                Search
              </button>
            </div>

            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="text-sm text-gray-600 font-medium">Quick Filters:</span>
              {['High Amount', 'Closing Soon', 'New', 'Popular'].map((filter) => (
                <button 
                  key={filter}
                  className="px-4 py-2 bg-[#E5D5FD]/40 text-[#9360E3] rounded-full text-sm font-medium hover:bg-[#E5D5FD] transition-colors border border-[#E2D3FA]"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-[#9360E3]">6 scholarships</span>
            </p>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9360E3]">
              <option>Sort by: Relevance</option>
              <option>Amount: High to Low</option>
              <option>Amount: Low to High</option>
              <option>Deadline: Nearest First</option>
            </select>
          </div>

          {/* Scholarship Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Merit Excellence Scholarship", org: "Education Foundation", amount: "$5,000", deadline: "Dec 31, 2024", category: "Academic", featured: true },
              { name: "STEM Innovation Award", org: "Tech Institute", amount: "$7,500", deadline: "Jan 15, 2025", category: "STEM", featured: false },
              { name: "Community Service Grant", org: "Social Welfare Board", amount: "$3,000", deadline: "Feb 28, 2025", category: "Service", featured: false },
              { name: "Athletic Excellence Fund", org: "Sports Council", amount: "$4,500", deadline: "Mar 10, 2025", category: "Sports", featured: false },
              { name: "Arts & Culture Scholarship", org: "Cultural Foundation", amount: "$6,000", deadline: "Jan 20, 2025", category: "Arts", featured: true },
              { name: "Need-Based Support", org: "Welfare Trust", amount: "$8,000", deadline: "Dec 20, 2024", category: "Need-Based", featured: false }
            ].map((item, index) => (
              <div 
                key={index} 
                className="group relative bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(147,96,227,0.12)] hover:shadow-[0_15px_50px_rgba(147,96,227,0.25)] transition-all duration-300 hover:-translate-y-2 border border-[#E5D5FD]/20"
              >
                {/* Featured Badge */}
                {item.featured && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                    <span>⭐</span>
                    <span>Featured</span>
                  </div>
                )}

                {/* Category Tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-[#E5D5FD] text-[#9360E3] px-3 py-1 rounded-lg text-xs font-semibold">
                    {item.category}
                  </span>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2 group-hover:text-[#9360E3] transition-colors">
                  {item.name}
                </h3>
                <p className="font-body text-gray-600 text-sm mb-4 flex items-center space-x-2">
                  <span>🏛️</span>
                  <span>{item.org}</span>
                </p>

                {/* Amount and Deadline */}
                <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-100">
                  <div className="bg-gradient-to-br from-[#9360E3] to-[#7a4dc4] text-white px-4 py-2 rounded-xl font-bold text-lg shadow-md">
                    {item.amount}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="text-sm font-semibold text-gray-700">{item.deadline}</p>
                  </div>
                </div>

                {/* Apply Button */}
                <button className="w-full bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white py-3 rounded-xl font-semibold hover:shadow-[0_10px_30px_rgba(147,96,227,0.4)] transition-all duration-200 flex items-center justify-center space-x-2 group-hover:scale-105">
                  <span>Apply Now</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="px-8 py-4 border-2 border-[#9360E3] text-[#9360E3] rounded-xl font-semibold hover:bg-[#9360E3] hover:text-white transition-all duration-200">
              Load More Scholarships
            </button>
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-20 bg-gradient-to-br from-[#FEFEFE] via-[#E5D5FD]/10 to-[#FEFEFE] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #9360E3 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block bg-[#E5D5FD] text-[#9360E3] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Simple & Straightforward
            </span>
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] bg-clip-text text-transparent">
              Application Process
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Follow these easy steps to apply for your dream scholarship
            </p>
          </div>

          {/* Process Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-[#9360E3] via-[#7a4dc4] to-[#9360E3] opacity-20"></div>

            <div className="grid md:grid-cols-5 gap-8 md:gap-4">
              {[
                { step: "1", title: "Search", desc: "Browse and find scholarships that match your profile", icon: "🔍", color: "from-[#9360E3] to-[#7a4dc4]" },
                { step: "2", title: "Apply", desc: "Fill out the application form with your details", icon: "📝", color: "from-[#7a4dc4] to-[#9360E3]" },
                { step: "3", title: "Upload", desc: "Submit required documents and certificates", icon: "📎", color: "from-[#9360E3] to-[#7a4dc4]" },
                { step: "4", title: "Review", desc: "Committee evaluates your application", icon: "👥", color: "from-[#7a4dc4] to-[#9360E3]" },
                { step: "5", title: "Result", desc: "Receive notification about your application status", icon: "🎉", color: "from-[#9360E3] to-[#7a4dc4]" },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center group">
                  {/* Step Circle */}
                  <div className={`relative w-32 h-32 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(147,96,227,0.3)] group-hover:shadow-[0_15px_50px_rgba(147,96,227,0.5)] transition-all duration-300 group-hover:scale-110`}>
                    <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-3xl mb-1">{item.icon}</span>
                      <span className={`font-bold text-sm bg-gradient-to-br ${item.color} bg-clip-text text-transparent`}>
                        Step {item.step}
                      </span>
                    </div>
                  </div>

                  {/* Step Info */}
                  <h3 className="font-heading font-bold text-xl mb-2 text-gray-900 group-hover:text-[#9360E3] transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-body text-gray-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA at bottom */}
          <div className="text-center mt-16">
            <button className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_15px_50px_rgba(147,96,227,0.4)] hover:scale-105 transition-all duration-200">
              Start Your Application Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}