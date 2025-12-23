import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ChatTopics() {
    const { currentUser } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Fetch rooms where current user is a participant
        const q = query(
            collection(db, "rooms"),
            where("participants", "array-contains", currentUser.uid),
            orderBy("updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const roomsData = await Promise.all(snapshot.docs.map(async (roomDoc) => {
                const data = roomDoc.data();
                const otherParticipantId = data.participants.find(id => id !== currentUser.uid);

                // Fetch other participant's details
                let otherParticipantData = { displayName: 'İsimsiz Kullanıcı', photoURL: '' };
                if (otherParticipantId) {
                    const userDoc = await getDoc(doc(db, "users", otherParticipantId));
                    if (userDoc.exists()) {
                        otherParticipantData = userDoc.data();
                    }
                }

                return {
                    id: roomDoc.id,
                    ...data,
                    otherParticipant: {
                        uid: otherParticipantId,
                        ...otherParticipantData
                    }
                };
            }));

            setRooms(roomsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching rooms:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Sohbetler yükleniyor...</div>;
    }

    return (
        <div className="pb-20 pt-4 px-4 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-black text-gray-900 mb-6">Sohbetlerim</h1>

            {rooms.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 px-6">
                    <div className="text-5xl mb-4">💬</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz mesaj yok</h3>
                    <p className="text-gray-500 mb-8">İlgilendiğiniz oyuncaklar için sahipleriyle sohbet başlatabilirsiniz.</p>
                    <Link to="/" className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all inline-block shadow-lg shadow-blue-100">
                        Oyuncakları Keşfet
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3">
                    {rooms.map((room) => (
                        <Link
                            key={room.id}
                            to={`/sohbet/${room.id}`}
                            state={{
                                friendName: room.otherParticipant.displayName,
                                friendPhoto: room.otherParticipant.photoURL
                            }}
                            className="block bg-white p-4 rounded-3xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600 overflow-hidden border-2 border-white shadow-sm">
                                        {room.otherParticipant.photoURL ? (
                                            <img src={room.otherParticipant.photoURL} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span>{room.otherParticipant.displayName?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-4 border-white rounded-full"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                                            {room.otherParticipant.displayName}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 bg-gray-50 rounded-lg px-2 py-1 w-fit">
                                        <span className="mr-1.5 text-xs">🧸</span>
                                        <span className="truncate max-w-[150px] font-medium">{room.toyName || 'İlan'}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2 truncate italic">
                                        {room.lastMessage || 'Mesaj gönderilmedi'}
                                    </p>
                                </div>

                                <div className="text-gray-300 group-hover:text-blue-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
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
