import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageUtils';

export default function ChatRoom() {
    const { topicId: roomId } = useParams(); // Rename topicId to roomId for clarity
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Get friend details passed from navigation state
    const friendName = location.state?.friendName || 'Sohbet';

    useEffect(() => {
        if (!currentUser) return;

        // Query messages for this room
        // Note: This requires a composite index in Firestore (roomId + createdAt)
        const q = query(
            collection(db, 'messages'),
            where('roomId', '==', roomId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);

            // Allow strict mode ref to update before scrolling
            setTimeout(() => scrollToBottom(), 100);
        }, (error) => {
            console.error("Chat Error:", error);
        });

        return () => unsubscribe();
    }, [roomId, currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'messages'), {
                text: newMessage,
                createdAt: serverTimestamp(),
                uid: currentUser.uid,
                displayName: currentUser.displayName || currentUser.email.split('@')[0],
                photoURL: currentUser.photoURL,
                roomId: roomId
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Compress image
            let uploadFile = file;
            try {
                uploadFile = await compressImage(file, 600, 0.5);
            } catch (err) {
                console.warn("Compression failed, sending original", err);
            }

            // Upload
            const storageRef = ref(storage, `chat_images/${roomId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, uploadFile);
            const downloadURL = await getDownloadURL(storageRef);

            // Send message with image
            await addDoc(collection(db, 'messages'), {
                text: '', // Image message
                imageUrl: downloadURL,
                createdAt: serverTimestamp(),
                uid: currentUser.uid,
                displayName: currentUser.displayName || currentUser.email.split('@')[0],
                photoURL: currentUser.photoURL,
                roomId: roomId
            });
        } catch (error) {
            console.error("Error sending image:", error);
            alert("Resim gönderilemedi.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button
                    onClick={() => navigate('/sohbet')}
                    className="mr-3 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="font-semibold text-gray-800">{friendName}</h1>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {messages.map((msg) => {
                    const isMyMessage = msg.uid === currentUser.uid;

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            {!isMyMessage && (
                                <div className="flex-shrink-0 mr-2 self-end">
                                    {msg.photoURL ? (
                                        <img className="h-8 w-8 rounded-full object-cover" src={msg.photoURL} alt="avatar" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                                            {msg.displayName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMyMessage
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                }`}>
                                {!isMyMessage && (
                                    <p className="text-xs text-gray-500 mb-1 font-medium">{msg.displayName}</p>
                                )}

                                {msg.imageUrl && (
                                    <div className="mb-2">
                                        <img
                                            src={msg.imageUrl}
                                            alt="Shared"
                                            loading="lazy"
                                            className="rounded-lg max-h-48 object-cover"
                                        />
                                    </div>
                                )}

                                {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0 max-w-md mx-auto pb-safe">
                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                    {/* Image Upload Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-gray-400 hover:text-blue-600 p-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !isUploading}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        {isUploading ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409 1 1 0 001.169-1.409l7-14zM2 2a1 1 0 011 1v10a1 1 0 01-1 1H1a1 1 0 01-1-1V3a1 1 0 011-1h1z" />
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725 1.157l5 1.429a1 1 0 001.169-1.409l-7-14z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
