
export default function Features(){
  return(
    <div>
    <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-[0_8px_20px_rgba(59,130,246,0.50)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.75)] transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-emerald-600 text-2xl">✓</span>
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3 text-gray-900">Verified Scholarships</h3>
              <p className="font-body text-gray-600">
                All scholarships are thoroughly verified and legitimate opportunities from trusted organizations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-[0_8px_20px_rgba(59,130,246,0.50)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.75)] transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">📄</span>
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3 text-gray-900">Easy Online Application</h3>
              <p className="font-body text-gray-600">
                Simple, streamlined application process that saves you time and effort.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-[0_8px_20px_rgba(59,130,246,0.50)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.75)] transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-yellow-600 text-2xl">📊</span>
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3 text-gray-900">Track Application Status</h3>
              <p className="font-body text-gray-600">
                Monitor your applications in real-time and never miss important updates.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
  )
}