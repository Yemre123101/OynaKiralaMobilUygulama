import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AddToy from './pages/AddToy';
import Profile from './pages/Profile';
import Login from './pages/Login';
import MyRentals from './pages/MyRentals';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ekle"
            element={
              <ProtectedRoute>
                <AddToy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kiralamalarim"
            element={
              <ProtectedRoute>
                <MyRentals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
        {currentUser && <Navbar />}
      </div>
    </div>
  );
}

export default App;
