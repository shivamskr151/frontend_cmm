
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Zone from './pages/Zone';
import PTZ from './pages/PTZ';
import Navbar from './components/Navbar';
import { UserProvider } from './contexts/UserContext';
import { CameraProvider } from './contexts/CameraContext';

function AppContent() {
  const location = useLocation();
  
  // Show navbar only on / and /ptz routes, hide on /login
  const showNavbar = location.pathname === '/' || location.pathname === '/ptz';

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Zone />} />
        <Route path="/ptz" element={<PTZ />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <CameraProvider>
        <Router>
          <AppContent />
        </Router>
      </CameraProvider>
    </UserProvider>
  );
}

export default App;