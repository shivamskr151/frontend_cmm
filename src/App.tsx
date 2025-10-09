
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import MoniterPage from './pages/MoniterPage';
import Navbar from './components/Navbar';
import { UserProvider } from './contexts/UserContext';

function AppContent() {
  const location = useLocation();
  
  // Show navbar only on / and /moniter routes, hide on /login
  const showNavbar = location.pathname === '/' || location.pathname === '/moniter';

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/moniter" element={<MoniterPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;