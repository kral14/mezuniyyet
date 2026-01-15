import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSound } from './SoundContext';
import { useNotification } from './NotificationContext';
import { api } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const { playMessageReceived, playSuccess } = useSound();
    const { showNotification } = useNotification();

    // Listen for storage events (e.g., login from another tab) or just mount
    // In a SPA with React Router, if we login, we usually force a reload or state change.
    // Here we rely on mounting.

    useEffect(() => {
        const connect = async () => {
            // Avoid duplicate connections
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

            let ticket = "";

            // 1. Try LocalStorage (Best for Tauri/Mobile)
            const localToken = localStorage.getItem('token');
            if (localToken) {
                ticket = localToken;
                console.log("🎫 Using LocalStorage Token for WS");
            }
            // 2. Fallback to Ticket Fetch (For Web using Cookies)
            else {
                try {
                    // Use dynamic API_URL
                    const ticketUrl = `${api.API_URL}/auth/ws-token`;
                    const response = await fetch(ticketUrl, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            ticket = data.token;
                            console.log("🎫 WS Ticket acquired from Server");
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch WS ticket", e);
                }
            }

            if (!ticket) {
                console.log("🚫 No token found, skipping WS connection (Guest Mode)");
                return;
            }

            console.log("🔌 Connecting to WebSocket...");

            // Dynamic WS URL derivation from API_URL
            // http -> ws, https -> wss
            const baseWs = api.API_URL.replace(/^http/, 'ws');
            let wsUrl = `${baseWs}/ws?token=${ticket}`;

            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log("✅ WS Connected");
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleSignal(data);
                } catch (e) {
                    console.error("WS Parse Error", e);
                }
            };

            ws.onclose = () => {
                console.log("❌ WS Disconnected");
                // Optional: Reconnect logic could be added here
            };

            ws.onerror = (error) => {
                console.error("WS Error:", error);
                ws.close();
            };
        };

        const disconnect = () => {
            if (socketRef.current) {
                console.log("🔌 Disconnecting WebSocket...");
                socketRef.current.close();
                socketRef.current = null;
            }
        };

        // Initial connect attempt (if token exists on mount)
        connect();

        // Listen for Auth Events
        const handleLogin = () => {
            console.log("SocketContext: Auth Login Detected");
            connect();
        };

        const handleLogout = () => {
            console.log("SocketContext: Auth Logout Detected");
            disconnect();
        };

        window.addEventListener('auth-login', handleLogin);
        window.addEventListener('auth-logout', handleLogout);

        return () => {
            window.removeEventListener('auth-login', handleLogin);
            window.removeEventListener('auth-logout', handleLogout);
            disconnect();
        };
    }, []);

    const handleSignal = (signal) => {
        // Deep Logging for Security & Debugging
        console.log("🔔 Signal Received:", signal);

        const { type, payload } = signal;

        switch (type) {
            case 'NEW_MESSAGE':
                // ... (Existing logic kept same, triggering chat-message)
                try {
                    const userStr = localStorage.getItem('user');
                    const currentUser = userStr ? JSON.parse(userStr) : {};
                    const senderId = Number(payload.sender_id);
                    const myId = Number(currentUser.id);
                    if (senderId !== myId) playMessageReceived();
                } catch (e) { console.error("Sound error", e); }
                window.dispatchEvent(new CustomEvent('chat-message', { detail: payload }));
                break;

            case 'NEW_NOTIFICATION':
                playSuccess();
                if (payload.message) showNotification(payload.message, "info");
                window.dispatchEvent(new CustomEvent('notification-update', { detail: payload }));

                // UNIFIED LOGIC: If notification implies a read status change
                if (payload.change_type === 'read' || payload.type === 'read') {
                    window.dispatchEvent(new CustomEvent('chat-read', { detail: payload }));
                }
                break;

            case 'FRIEND_REQUEST':
                playSuccess();
                showNotification("Yeni dostluq sorğusu", "info");
                window.dispatchEvent(new CustomEvent('friend-request-update', { detail: payload }));
                break;

            case 'FRIEND_ACCEPTED':
                playSuccess();
                showNotification("Dostluq sorğusu qəbul edildi", "success");
                window.dispatchEvent(new CustomEvent('friend-update', { detail: payload }));
                break;

            case 'VACATION_UPDATE':
                playSuccess();
                window.dispatchEvent(new CustomEvent('vacation-update', { detail: payload }));
                break;

            // --- Unified Status Handlers ---
            case 'MESSAGE_DELIVERED':
                console.log("✅ Message Delivered Signal:", payload);
                window.dispatchEvent(new CustomEvent('chat-delivered', { detail: payload }));
                break;

            case 'STATUS_CHANGE':
                console.log("👤 Status Change Signal:", payload);
                window.dispatchEvent(new CustomEvent('chat-status-change', { detail: payload }));
                break;

            case 'MESSAGE_READ':
            case 'MESSAGE_UPDATE':
                // All these likely mean a message status changed. 
                // We normalize this to a single 'chat-read' event for the UI.
                console.log("✅ Unified Read Signal Processed");
                window.dispatchEvent(new CustomEvent('chat-read', { detail: payload }));
                break;

            default:
                console.warn("⚠️ Unknown Signal Type:", type, payload);
                break;
        }
    };

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};
