import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AddToy from './pages/AddToy';
import Profile from './pages/Profile';
import Login from './pages/Login';
import MyRentals from './pages/MyRentals';
import ChatTopics from './pages/ChatTopics';
import ToyDetails from './pages/ToyDetails';
import ChatRoom from './pages/ChatRoom';
import EditToy from './pages/EditToy';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGuide from './components/OnboardingGuide';

function App() {
  const { currentUser, isGuest } = useAuth();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');

    if (!hasSeenGuide && (currentUser || isGuest)) {
      setShowGuide(true);
    }
  }, [currentUser, isGuest]);

  const handleGuideComplete = () => {
    localStorage.setItem('hasSeenGuide', 'true');
    setShowGuide(false);
  };

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
            path="/oyuncak/:id"
            element={
              <ProtectedRoute>
                <ToyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sohbet"
            element={
              <ProtectedRoute>
                <ChatTopics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sohbet/:topicId"
            element={
              <ProtectedRoute>
                <ChatRoom />
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
          <Route
            path="/oyuncak/:id/duzenle"
            element={
              <ProtectedRoute>
                <EditToy />
              </ProtectedRoute>
            }
          />
        </Routes>
        {showGuide && <OnboardingGuide onComplete={handleGuideComplete} />}
        {(currentUser || isGuest) && <Navbar />}
      </div>
    </div>
  );
}

export default App;
