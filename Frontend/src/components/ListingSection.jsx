export default function ListingSection(){
  return (
<div>
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-3xl text-center mb-12 text-gray-900">Available Scholarships</h2>

          {/* Search Bar */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search scholarships..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>All Categories</option>
                <option>Academic Excellence</option>
                <option>Need-Based</option>
                <option>Sports</option>
              </select>
              <button className="bg-blue-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Scholarship Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white p-6 rounded-xl shadow-[0_8px_20px_rgba(59,130,246,0.50)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.75)] transition-shadow">
                <h3 className="font-heading font-semibold text-lg text-blue-800 mb-2">Merit Excellence Scholarship</h3>
                <p className="font-body text-gray-600 text-sm mb-3">Education Foundation</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    $5,000
                  </span>
                  <span className="text-gray-500 text-sm">Due: Dec 31, 2024</span>
                </div>
                <button className="w-full bg-emerald-600 text-white py-2 rounded-full font-medium hover:bg-emerald-700 transition-colors">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
            <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-3xl text-center mb-12 text-gray-900">Application Process</h2>

          <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
            {[
              { step: "1", title: "Search", desc: "Find scholarships" },
              { step: "2", title: "Apply", desc: "Submit application" },
              { step: "3", title: "Upload", desc: "Add documents" },
              { step: "4", title: "Review", desc: "Committee review" },
              { step: "5", title: "Result", desc: "Get notification" },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-800 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-1">{item.title}</h3>
                <p className="font-body text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-3xl text-center mb-12 text-gray-900">Success Stories</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Johnson", scholarship: "Academic Excellence Award", amount: "$10,000" },
              { name: "Michael Chen", scholarship: "STEM Innovation Grant", amount: "$7,500" },
              { name: "Emily Rodriguez", scholarship: "Community Leadership Fund", amount: "$5,000" },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <p className="font-body text-gray-600 text-center mb-4 italic">
                  "This scholarship changed my life and made my dreams possible. The application process was smooth and
                  supportive."
                </p>
                <div className="text-center">
                  <h4 className="font-heading font-semibold text-lg">{testimonial.name}</h4>
                  <p className="font-body text-blue-800 font-medium">{testimonial.scholarship}</p>
                  <p className="font-body text-yellow-600 font-bold">{testimonial.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      </div>
  )
}