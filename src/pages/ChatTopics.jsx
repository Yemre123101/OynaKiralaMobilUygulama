import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ChatTopics() {
    const { currentUser } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    // Friend Adding State
    const [friendInput, setFriendInput] = useState('');
    const [addFriendLoading, setAddFriendLoading] = useState(false);
    const [message, setMessage] = useState(''); // Simple string for message here

    useEffect(() => {
        if (!currentUser) return;

        // Fetch friends list
        const q = query(collection(db, `users/${currentUser.uid}/friends`), orderBy('addedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const friendsData = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            setFriends(friendsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAddFriend = async () => {
        if (!friendInput.trim()) return;

        setAddFriendLoading(true);
        setMessage('');

        try {
            // Check if adding self
            // Note: Ideally we should get the current user's friendlyID to compare properly, 
            // but the query will just not find "my id" if I search for someone else's id.
            // If I search my own ID, the query WILL find me.

            // 1. Find the user with this ID
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("userFriendlyId", "==", friendInput.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setMessage('❌ Kullanıcı bulunamadı.');
                setAddFriendLoading(false);
                return;
            }

            const friendDoc = querySnapshot.docs[0];
            const friendData = friendDoc.data();
            const friendUid = friendDoc.id;

            if (friendUid === currentUser.uid) {
                setMessage('⚠️ Kendinizi ekleyemezsiniz.');
                setAddFriendLoading(false);
                return;
            }

            // 2. Check if already added
            const alreadyFriend = friends.some(f => f.uid === friendUid);
            if (alreadyFriend) {
                setMessage('⚠️ Bu kişi zaten arkadaşınız.');
                setAddFriendLoading(false);
                return;
            }

            // 3. Add to my friends subcollection
            await setDoc(doc(db, `users/${currentUser.uid}/friends`, friendUid), {
                displayName: friendData.displayName || 'İsimsiz',
                photoURL: friendData.photoURL || '',
                userFriendlyId: friendData.userFriendlyId,
                addedAt: serverTimestamp()
            });

            setMessage('✅ Arkadaş eklendi!');
            setFriendInput('');
        } catch (error) {
            console.error("Error adding friend:", error);
            setMessage('❌ Hata oluştu.');
        } finally {
            setAddFriendLoading(false);
        }
    };

    const getChatRoomId = (friendUid) => {
        // Create a unique determinisic ID for the pair
        return [currentUser.uid, friendUid].sort().join('_');
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
    }

    return (
        <div className="pb-20 pt-4 px-4 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Sohbetler</h1>

            {/* Add Friend Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Yeni Arkadaş Ekle</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Arkadaş ID (örn: 123456)"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={friendInput}
                        onChange={(e) => setFriendInput(e.target.value)}
                    />
                    <button
                        onClick={handleAddFriend}
                        disabled={addFriendLoading || !friendInput.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {addFriendLoading ? '...' : 'Ekle'}
                    </button>
                </div>
                {message && <p className="text-xs mt-2 font-medium text-gray-600">{message}</p>}
            </div>

            {friends.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100 px-6">
                    <div className="text-4xl mb-3">👋</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Henüz arkadaşınız yok</h3>
                    <p className="text-gray-500 mb-6">Sohbet etmek için önce Profil sekmesinden arkadaş eklemelisiniz.</p>
                    <Link to="/profil" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors inline-block">
                        Arkadaş Ekle
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3">
                    {friends.map((friend) => (
                        <Link
                            key={friend.uid}
                            to={`/sohbet/${getChatRoomId(friend.uid)}`}
                            state={{ friendName: friend.displayName, friendPhoto: friend.photoURL }} // Pass data to avoid re-fetching
                            className="block bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden border border-gray-200">
                                        {friend.photoURL ? (
                                            <img src={friend.photoURL} alt={friend.displayName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span>{friend.displayName?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-lg">{friend.displayName}</h3>
                                    <p className="text-sm text-gray-500">Sohbet etmek için dokunun</p>
                                </div>

                                <div className="text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
