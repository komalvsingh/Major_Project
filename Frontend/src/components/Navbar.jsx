import { NavLink } from "react-router-dom"
export default function Navbar() {
  return(
    <div>

      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎓</span>
              </div>
              <span className="font-heading font-bold text-xl text-gray-900"><NavLink to="/">SAG Bureau</NavLink></span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <NavLink 
                to="/"  
                className={({ isActive }) => 
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
                }
              >
                Home
              </NavLink>
              <NavLink 
                to="/scholarships"  
                className={({ isActive }) => 
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
                }
              >
                Scholarships
              </NavLink>
              <NavLink 
                to="/apply"  
                className={({ isActive }) => 
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
                }
              >
                Apply
              </NavLink>
              <NavLink 
                to="/status"  
                className={({ isActive }) => 
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
                }
              >
                Status
              </NavLink>
              <NavLink 
                to="/contact"  
                className={({ isActive }) => 
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
                }
              >
                Contact
              </NavLink>
            </nav>
            <div className="flex items-center space-x-3">
              <button className="text-gray-700 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              <NavLink 
                to="/login"  
                className={({ isActive }) => 
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
                }
              >
                Login
              </NavLink>
              </button>
              <button className="bg-blue-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors shadow-sm">
              <NavLink 
                to="/register"  
              >
                Register
              </NavLink>
              </button>
            </div>

          </div>
        </div>
      </header>
      </div>
      
  )
}