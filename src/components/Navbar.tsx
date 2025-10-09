import  { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

// interface NavbarProps {
//   username: string;
//   onLogout: () => void;
// }

// : React.FC<NavbarProps> = ({ username, onLogout }) 
const Navbar=()=> {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { client, isAuthenticated, logout } = useUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  const navigationItems = [
    { path: '/', label: 'Camera Config', icon: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { path: '/moniter', label: 'PTZ Config', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  ];

  // Check if a tab is active
  const isActiveTab = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    return location.pathname === path;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isAuthenticated, location.pathname, navigate]);



  

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-lg shadow-gray-200/20 transition-all duration-300">
      <div className="mx-4 px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/35 transition-all duration-300 group-hover:scale-105">
              CMM
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800 leading-tight">
                  Camera Management Module
                </h1>
               
              </div>
              
            </div>
          </div>

          {/* Desktop Navigation - Show only the alternative button */}
          <nav className="hidden md:flex items-center">
           
          </nav>

          {/* Profile Section */}
          <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
            {/* Navigation Buttons */}
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent ${
                  isActiveTab(item.path)
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-md shadow-blue-100/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50'
                } group`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActiveTab(item.path) ? '#1d4ed8' : 'currentColor'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon}></path>
                </svg>
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
              title="Toggle mobile menu"
              aria-label="Toggle mobile menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {/* Profile Dropdown Trigger */}
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md shadow-blue-500/25">
                  {client?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm text-gray-700 font-medium">
                  {client?.name || 'User'}
                </span>
                <span className="text-xs text-gray-500">
                  {client?.role || 'USER'}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${
                  showProfileDropdown ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-xl shadow-2xl shadow-gray-200/20 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200/50 bg-gray-50/50">
                  <div className="text-base font-semibold text-gray-800 mb-1">
                    {client?.name || 'User'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {client?.email || 'No email'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Role: {client?.role || 'USER'}
                  </div>
                </div>
                
                <div className="py-1">
              
                  
                  <div className="border-t border-gray-200/50 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16,17 21,12 16,7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200/50 py-4 bg-gray-50/50 backdrop-blur-sm">
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-left text-base font-medium rounded-lg transition-all duration-200 ${
                    isActiveTab(item.path)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-md shadow-blue-100/50'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isActiveTab(item.path) ? '#1d4ed8' : 'currentColor'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon}></path>
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
