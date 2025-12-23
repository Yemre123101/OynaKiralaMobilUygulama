import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Yükleniyor...</p>;

  return userId ? <Home userId={userId} /> : <Login setUserId={setUserId} />;
}

export default App;
