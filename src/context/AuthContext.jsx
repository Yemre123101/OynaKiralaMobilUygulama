import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) setIsGuest(false);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const loginAsGuest = () => {
        setIsGuest(true);
        setCurrentUser(null);
    };

    const logout = async () => {
        await signOut(auth);
        setIsGuest(false);
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        isGuest,
        loading,
        loginAsGuest,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
