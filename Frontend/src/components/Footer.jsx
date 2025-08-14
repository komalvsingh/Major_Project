export default function Footer(){
  return (
    <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🎓</span>
                </div>
                <span className="font-heading font-bold text-xl">Scholarship Portal</span>
              </div>
              <p className="font-body text-gray-400">
                Empowering students to achieve their educational dreams through accessible scholarship opportunities.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-gray-400 hover:text-white">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="font-body text-gray-400">&copy; 2025 Scholarship Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
  )
}