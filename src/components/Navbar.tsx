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
    { path: '/', label: 'Zone', icon: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { path: '/ptz', label: 'PTZ', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  ];

  // Check if a tab is active
  const isActiveTab = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/zone')) return true;
    return location.pathname === path;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('Navbar: Starting logout process...');
      await logout();
      console.log('Navbar: Logout completed, isAuthenticated should be false');
      setShowProfileDropdown(false);
      
      // Clear any remaining localStorage data manually
      localStorage.removeItem('access_token');
      localStorage.removeItem('client_data');
      localStorage.removeItem('login_timestamp');
      
      // Force redirect to login and clear any cached state
      setTimeout(() => {
        console.log('Navbar: Redirecting to login after logout');
        // Force a hard navigation to ensure clean state
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect to login even if logout fails
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  // Redirect to login if not authenticated (except for /login, /ptz, and /zone routes)
  // This allows direct access to /ptz and /zone in new tabs
  useEffect(() => {
    console.log('Navbar: Authentication check - isAuthenticated:', isAuthenticated, 'pathname:', location.pathname);
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/ptz' && location.pathname !== '/zone') {
      console.log('Navbar: Redirecting to login from:', location.pathname);
      navigate('/login');
    }
  }, [isAuthenticated, location.pathname, navigate]);



  

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-lg shadow-gray-200/20 transition-all duration-300">
      <div className="sm:mx-4 px-1 sm:px-4 lg:px-6">
        <div className=" w-full flex items-center justify-between h-14 sm:h-16 ">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-[10px] sm:text-sm shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/35 transition-all duration-300 group-hover:scale-105">
              CMM
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                  Camera Management Module
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop Navigation - Show navigation items */}
          <nav className="hidden md:flex items-center space-x-2 ">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent ${
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
                <span className="hidden lg:inline">{item.label}</span>
                <span className="lg:hidden">{item.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>

          {/* Profile Section */}
          <div className="flex items-center  relative" ref={dropdownRef}>
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
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
                className={`transition-transform duration-200 ${showMobileMenu ? 'rotate-90' : ''}`}
              >
                {showMobileMenu ? (
                  <path d="M18 6L6 18M6 6l12 12"></path>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>

            {/* Profile Icon - Only show if authenticated and on medium screens and up */}
            {isAuthenticated && (
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="hidden md:block p-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 rounded-lg"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md shadow-blue-500/25">
                    {client?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
              </button>
            )}

            {/* Login Button - Show if not authenticated and on medium screens and up */}
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10,17 15,12 10,7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Login
              </button>
            )}

            {/* Profile Dropdown - Only show if authenticated and on medium screens and up */}
            {isAuthenticated && showProfileDropdown && (
              <div className="hidden md:block absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-xl shadow-2xl shadow-gray-200/20 z-50 overflow-hidden">
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
          <div className="md:hidden border-t border-gray-200/50 py-4 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/20">
            <div className="flex flex-col space-y-2">
              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 border ${
                    isActiveTab(item.path)
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-md shadow-blue-100/50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent hover:border-gray-200'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isActiveTab(item.path) ? '#1d4ed8' : 'currentColor'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon}></path>
                  </svg>
                  <span className="flex-1">{item.label}</span>
                  {isActiveTab(item.path) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-200/50 my-2"></div>

              {/* Profile/Login Section */}
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md shadow-blue-500/25">
                        {client?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {client?.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {client?.email || 'No email'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Role: {client?.role || 'USER'}
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16,17 21,12 16,7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span className="flex-1">Sign Out</span>
                  </button>
                </>
              ) : (
                /* Login Button */
                <button
                  onClick={() => {
                    navigate('/login');
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-left text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-xl transition-all duration-200 border border-blue-200 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10,17 15,12 10,7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span className="flex-1">Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
