import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import {
    Box, Paper, Typography, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
    Avatar, TextField, IconButton, Divider, Badge, Tabs, Tab, CircularProgress,
    Menu, MenuItem, ListItemIcon, Button, InputAdornment, Fab
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Send as SendIcon,
    PersonAdd as PersonAddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    Chat as ChatIcon,
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    AttachFile as AttachFileIcon,
    Image as ImageIcon,
    InsertDriveFile as FileIcon,
    Download as DownloadIcon,
    KeyboardArrowDown,
    PersonRemove as PersonRemoveIcon,
    DeleteForever as DeleteForeverIcon,
    Archive as ArchiveIcon,
    DoneAll as DoneAllIcon, // Added for Read Status
    DeleteOutline as DeleteOutlineIcon // For simple delete icon
} from '@mui/icons-material';
import api from '../services/api';
import { useSound } from '../context/SoundContext';
import { open } from '@tauri-apps/plugin-dialog'; // Native File Picker
import { convertFileSrc } from '@tauri-apps/api/core';

// --- Helper for Image Compression (Client-Side) ---
const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                }, 'image/jpeg', 0.7); // 70% Quality
            };
        };
    });
};

const ChatPage = () => {
    const theme = useTheme();
    const { playMessageSent, playMessageReceived } = useSound();

    // UI States
    const [tabValue, setTabValue] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    // Data States
    const [activeFriends, setActiveFriends] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [currentFriend, setCurrentFriend] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Chat Logic States
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessagesBelow, setNewMessagesBelow] = useState(0);

    // Refs
    const messagesEndRef = useRef(null);
    const messagesTopRef = useRef(null); // For infinite scroll
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const prevMessagesLen = useRef(0);
    const observer = useRef();

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);
    const [friendContextMenu, setFriendContextMenu] = useState(null);

    // --- Polling & Init ---
    // --- Real-time Listener & Init ---
    useEffect(() => {
        loadSidebarData();

        const handleMsgEvent = (e) => {
            const newMsg = e.detail;
            console.log("ChatPage: Signal Received", newMsg);

            // Refresh sidebar to update badges/order
            loadSidebarData();

            if (currentFriend) {
                // Determine the correct ID for the current friend
                // It might be 'id' or 'friend_id' depending on where the object came from
                const currentFriendId = Number(currentFriend.friend_id || currentFriend.id);

                const msgSender = Number(newMsg.sender_id);
                const msgRecipient = Number(newMsg.recipient_id);
                const myId = Number(currentUser?.id);

                // Check if the message belongs to this conversation
                // 1. If I am the sender, and I sent it TO currentFriend
                // 2. If I am the recipient, and it came FROM currentFriend
                // 3. (Simplified) Does the message involve currentFriend?
                const isRelated = (msgSender === currentFriendId) || (msgRecipient === currentFriendId);

                console.log(`Related Check: Friend=${currentFriendId}, Sender=${msgSender}, Recipient=${msgRecipient}, MATCH=${isRelated}`);

                if (isRelated) {
                    setMessages(prev => {
                        // Check if message already exists
                        const existingIndex = prev.findIndex(m => Number(m.id) === Number(newMsg.id));

                        if (existingIndex !== -1) {
                            // UPDATE existing message (e.g. status change came as NEW_MESSAGE)
                            const existingMsg = prev[existingIndex];

                            // Only update if something changed (avoid infinite render loops if strict check)
                            // Ideally, we merge the new fields.
                            // If is_read changed from false to true:
                            if (!existingMsg.is_read && newMsg.is_read) {
                                const newArr = [...prev];
                                newArr[existingIndex] = { ...existingMsg, ...newMsg };
                                return newArr;
                            }
                            return prev;
                        }

                        // Check if it's our own message that is currently pending (has temp- id)
                        // If so, replace the temp message with this real one
                        if (currentFriend && (Number(newMsg.sender_id) === Number(currentUser?.id))) {
                            const pendingMatch = prev.find(m =>
                                (String(m.id).startsWith('temp-') || m.clientId) &&
                                (m.message === newMsg.message || m.message.trim() === newMsg.message.trim())
                            );
                            if (pendingMatch) {
                                // Preserve clientId to prevent re-render flash
                                return prev.map(m => m.id === pendingMatch.id ? { ...newMsg, clientId: m.clientId || m.id } : m);
                            }
                        }

                        // Otherwise append
                        return [...prev, newMsg];
                    });

                    // If it is an incoming message from the open chat, mark as read
                    if (msgSender === currentFriendId) {
                        api.chat.markMessagesRead(currentFriendId);
                    }

                    // Scroll to bottom
                    if (!showScrollButton) {
                        setTimeout(() => scrollToBottom(), 50);
                    } else {
                        setNewMessagesBelow(c => c + 1);
                    }
                }
            }
        };

        window.addEventListener('chat-message', handleMsgEvent);

        const handleReadEvent = (e) => {
            const payload = e.detail;
            console.log("ChatPage: Processing Unified Read Signal", payload);

            if (!currentFriend) return;

            const friendId = Number(currentFriend.friend_id || currentFriend.id);
            const myId = Number(currentUser?.id);

            // Robust Check: Does this signal belong to this chat?
            // 1. By ID: payload.sender_id === friendId (Friend read my msg)
            // 2. By ID: payload.recipient_id === myId
            // 3. By Context: payload.friend_id === friendId
            // 4. By Message: payload.message_id (we check if we have it)

            let isRelated = false;

            if (payload.sender_id && Number(payload.sender_id) === friendId) isRelated = true;
            if (payload.friend_id && Number(payload.friend_id) === friendId) isRelated = true;

            // If strictly message based (e.g. payload = { id: 123, is_read: true })
            if (payload.id && messages.some(m => Number(m.id) === Number(payload.id))) isRelated = true;

            if (isRelated) {
                setMessages(prev => prev.map(m => {
                    // Update specific message if ID is provided
                    if (payload.id && Number(m.id) === Number(payload.id)) {
                        return { ...m, is_read: true };
                    }
                    // Bulk update: If friend read ANY message, likely they read ALL my previous unwatched messages
                    // Only update MY messages that were unread
                    if (!payload.id && !m.is_read && Number(m.sender_id) === myId) {
                        return { ...m, is_read: true };
                    }
                    return m;
                }));
            }
        };
        window.addEventListener('chat-read', handleReadEvent);

        // Listens for "chat-delivered" event
        const handleDeliveredEvent = (e) => {
            const payload = e.detail;
            if (!payload) return;

            console.log("📨 Delivered Event Payload:", payload);

            setMessages(prev => {
                return prev.map(msg => {
                    const ids = payload.message_ids || (payload.id ? [payload.id] : []);
                    // Robust check: match string or number IDs
                    if (ids.some(id => String(id) === String(msg.id))) {
                        console.log(`✅ MARKING DELIVERED: ${msg.id}`);
                        return { ...msg, is_delivered: true };
                    }
                    return msg;
                });
            });
        };
        window.addEventListener('chat-delivered', handleDeliveredEvent);

        const handleStatusEvent = (e) => {
            const payload = e.detail;
            if (!payload) return;
            console.log("👤 Status Update:", payload);

            setActiveFriends(prev => prev.map(f => {
                const fId = Number(f.friend_id || f.id);
                if (fId === Number(payload.id)) {
                    return { ...f, is_online: payload.is_online, last_seen: payload.last_seen || f.last_seen };
                }
                return f;
            }));

            setCurrentFriend(prev => {
                if (!prev) return prev;
                const fId = Number(prev.friend_id || prev.id);
                if (fId === Number(payload.id)) {
                    console.log("👤 Updating Current Friend Status:", payload.is_online);
                    return { ...prev, is_online: payload.is_online, last_seen: payload.last_seen || prev.last_seen };
                }
                return prev;
            });
        };
        window.addEventListener('chat-status-change', handleStatusEvent);

        const handleAuthRestored = () => {
            console.log("ChatPage: Auth Restored - Reloading Data");
            loadSidebarData(true);
        };
        window.addEventListener('auth-restored', handleAuthRestored);

        return () => {
            window.removeEventListener('chat-message', handleMsgEvent);
            window.removeEventListener('chat-read', handleReadEvent);
            window.removeEventListener('chat-delivered', handleDeliveredEvent);
            window.removeEventListener('chat-status-change', handleStatusEvent);
            window.removeEventListener('auth-restored', handleAuthRestored);
        };
    }, [currentFriend, showScrollButton, tabValue]);

    // --- Infinite Scroll Observer ---
    const lastMessageRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreMessages();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore]);

    const prevScrollHeightRef = useRef(null);
    const isLoadingOldMessagesRef = useRef(false);

    // --- Message Loading ---
    useEffect(() => {
        if (currentFriend) {
            setMessages([]);
            setPage(1);
            setHasMore(true);
            loadMessages(1, true); // Reset and load page 1
        }
    }, [currentFriend]);

    // Preserve scroll position when older messages are loaded
    React.useLayoutEffect(() => {
        if (isLoadingOldMessagesRef.current && chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                chatContainerRef.current.scrollTop = diff;
            }
            isLoadingOldMessagesRef.current = false;
        }
    }, [messages]);

    const loadMessages = async (pageNum, reset = false) => {
        if (!currentFriend) return;
        if (!reset) setLoadingMore(true);

        try {
            const res = await api.chat.getMessages(currentFriend.friend_id, pageNum, 100);
            if (res?.data) {
                const newMsgs = res.data;
                if (newMsgs.length < 100) setHasMore(false);

                if (reset) {
                    setMessages(newMsgs);
                    setShowScrollButton(false);
                    setNewMessagesBelow(0);
                    setTimeout(() => scrollToBottom(false), 100); // Instant scroll on load
                    // Mark read
                    const hasUnread = newMsgs.some(m => !m.is_read && m.sender_id === currentFriend.friend_id);
                    if (hasUnread) api.chat.markMessagesRead(currentFriend.friend_id);
                } else {
                    setMessages(prev => {
                        const merged = [...newMsgs, ...prev];
                        const uniqueMap = new Map();
                        merged.forEach(m => uniqueMap.set(m.id, m));

                        return Array.from(uniqueMap.values()).sort((a, b) => {
                            const timeA = new Date(a.created_at).getTime();
                            const timeB = new Date(b.created_at).getTime();
                            if (timeA !== timeB) return timeA - timeB;
                            return (a.id === b.id) ? 0 : (a.id > b.id ? 1 : -1);
                        });
                    });
                }
                setPage(pageNum);
            }
        } catch (e) {
            console.error("Load messages error:", e);
        } finally {
            setLoadingMore(false);
        }
    };



    const loadMoreMessages = () => {
        if (!loadingMore && hasMore) {
            if (chatContainerRef.current) {
                prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
                isLoadingOldMessagesRef.current = true;
            }
            loadMessages(page + 1);
        }
    };

    const loadSidebarData = async (force = false) => {
        if (tabValue === 0) api.chat.getActiveFriends(force).then(res => {
            if (res?.data && JSON.stringify(res.data) !== JSON.stringify(activeFriends)) {
                setActiveFriends(res.data);
            }
        });
        if (tabValue === 1) api.chat.getAllUsersForChat(force).then(res => {
            if (res?.data && JSON.stringify(res.data) !== JSON.stringify(allUsers)) {
                setAllUsers(res.data);
            }
        });
        if (tabValue === 2) api.chat.getFriendRequests().then(res => {
            if (res?.data && JSON.stringify(res.data) !== JSON.stringify(friendRequests)) {
                setFriendRequests(res.data);
            }
        });
    };



    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        setShowScrollButton(false);
        setNewMessagesBelow(0);
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (!isNearBottom) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
            setNewMessagesBelow(0);
        }
    };

    // --- Interactions ---

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && !selectedFile) || !currentFriend) return;

        const tempId = 'temp-' + Date.now();
        let attachmentPath = null;
        let attachmentType = null;

        if (selectedFile) {
            try {
                setUploading(true);
                // Compress if image
                let fileToUpload = selectedFile;
                if (selectedFile.type.startsWith('image/')) {
                    fileToUpload = await compressImage(selectedFile);
                }

                const uploadRes = await api.chat.uploadChatFile(fileToUpload);
                if (uploadRes.success) {
                    attachmentPath = uploadRes.path;
                    attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
                } else {
                    alert("Fayl yüklənmədi!");
                    setUploading(false);
                    return;
                }
            } catch (e) {
                console.error("Upload error:", e);
                setUploading(false);
                return;
            }
        }

        const newMessage = {
            id: tempId,
            sender_id: currentUser.id,
            recipient_id: currentFriend.friend_id,
            message: messageInput.trim(),
            created_at: new Date().toISOString(),
            is_read: false,
            reply_to_id: replyingTo?.id,
            attachment_path: attachmentPath,
            attachment_type: attachmentType,
            clientId: tempId // Persistent Key
        };

        setMessages(prev => [...prev, newMessage]);
        playMessageSent();

        // Reset Inputs
        setMessageInput('');
        setReplyingTo(null);
        setSelectedFile(null);
        setUploading(false);
        setTimeout(() => scrollToBottom(), 100);

        try {
            const res = await api.chat.sendMessage(
                currentFriend.friend_id,
                newMessage.message,
                newMessage.reply_to_id,
                newMessage.attachment_path,
                newMessage.attachment_type
            );

            if (res.success && res.id) {
                // Swap temp ID with real ID and Sync timestamp + STATUS
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? {
                        ...m,
                        id: res.id,
                        created_at: res.created_at || m.created_at,
                        is_delivered: res.is_delivered ?? m.is_delivered, // Capture status from backend
                        is_read: res.is_read ?? m.is_read
                    } : m
                ));
            } else {
                console.error("Message sent but no ID returned or failed");
            }

            // refreshSidebarAndLatest();
        } catch (error) {
            console.error("Send Error:", error);
            // Ideally mark message as failed
        }
    };

    const handleContextMenu = (event, msg) => {
        event.preventDefault();
        setContextMenu(contextMenu === null ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            msg: msg
        } : null);
    };

    const handleMenuClose = () => {
        setContextMenu(null);
    };

    const handleReply = () => {
        setReplyingTo(contextMenu.msg);
        handleMenuClose();
    };

    // --- Friend Context Menu Handlers ---
    const handleFriendContextMenu = (event, friend) => {
        event.preventDefault();
        setFriendContextMenu(friendContextMenu === null ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            friend: friend
        } : null);
    };

    const handleFriendMenuClose = () => {
        setFriendContextMenu(null);
    };

    const handleArchive = async () => {
        const friend = friendContextMenu.friend;
        handleFriendMenuClose();
        if (window.confirm(`${friend.friend_name} adlı istifadəçi ilə çatı arxivləmək istəyirsiniz? (Siyahıdan itəcək)`)) {
            try {
                await api.chat.archiveChat(friend.friend_id || friend.id);
                loadSidebarData(true);
                if (currentFriend && (currentFriend.friend_id === friend.friend_id)) {
                    setCurrentFriend(null);
                }
            } catch (e) {
                console.error("Archive error:", e);
                alert("Xəta baş verdi: " + e.message);
            }
        }
    };

    const handleClearChat = async (forEveryone) => {
        const friend = friendContextMenu.friend;
        handleFriendMenuClose();

        const message = forEveryone
            ? `${friend.friend_name} ilə bütün yazışmanı HƏR İKİ TƏRƏFDƏN silmək istədiyinizə əminsiniz? (Bu əməliyyat geri qaytarıla bilməz)`
            : `${friend.friend_name} ilə bütün yazışmanı MƏNDƏN (yalnız sizin ekranınızdan) silmək istədiyinizə əminsiniz?`;

        if (window.confirm(message)) {
            try {
                const friendId = friend.friend_id || friend.id; // handle both shapes
                await api.chat.clearChat(friendId, forEveryone);

                // Update local state if currently viewing this chat
                if (currentFriend && (currentFriend.friend_id === friendId || currentFriend.id === friendId)) {
                    setMessages([]);
                }

                // Refresh sidebar (unread count might change)
                loadSidebarData(true);
                alert("Çat tarixçəsi silindi.");
            } catch (e) {
                console.error("Failed to clear chat", e);
                alert("Silinmədi: " + e.message);
            }
        }
    };

    const handleDelete = async (forEveryone) => {
        const msgId = contextMenu.msg.id;
        handleMenuClose();
        try {
            await api.chat.deleteMessage(msgId, forEveryone);
            // Update local state
            setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                    if (forEveryone) return { ...m, is_deleted: true };
                    // If local delete, we could just filter it out or mark distinct
                    // For simplicity, filter out for local delete
                    if (!forEveryone) return null;
                }
                return m;
            }).filter(Boolean));
        } catch (e) {
            alert("Silinmədi: " + e.message);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(contextMenu.msg.message);
        handleMenuClose();
    };

    // --- Render Helpers ---

    const renderMessage = (msg) => {
        const isMe = Number(msg.sender_id) === Number(currentUser.id);
        const isDeleted = msg.is_deleted;

        // Find replied message
        const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;

        return (
            <Box
                key={msg.clientId || msg.id}
                onContextMenu={(e) => !isDeleted && handleContextMenu(e, msg)}
                sx={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    mb: 1,
                    position: 'relative',
                    animation: 'fadeIn 0.3s ease-out',
                    '@keyframes fadeIn': {
                        '0%': { opacity: 0, transform: `translateX(${isMe ? '20px' : '-20px'})` },
                        '100%': { opacity: 1, transform: 'translateX(0)' }
                    }
                }}
            >
                <Paper
                    elevation={1}
                    sx={{
                        p: 1,
                        px: 1.5,
                        borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', // Cleaner curves
                        bgcolor: isDeleted ? '#f0f0f0' : (isMe ? '#dcf8c6' : '#ffffff'),
                        color: isDeleted ? '#999' : 'inherit',
                        minWidth: 'min-content',
                        maxWidth: '100%',
                        width: 'fit-content',
                        wordBreak: 'break-word',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Reply Quote */}
                    {repliedMsg && !isDeleted && (
                        <Box sx={{
                            borderLeft: isMe ? 'none' : '4px solid #34B7F1',
                            borderRight: isMe ? '4px solid #34B7F1' : 'none',
                            bgcolor: 'rgba(0,0,0,0.05)',
                            p: 0.5, mb: 0.5, borderRadius: 1,
                            fontSize: '0.8rem', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#34B7F1' }}>
                                {repliedMsg.sender_id === currentUser.id ? 'Siz' : currentFriend.friend_name}
                            </Typography>
                            <Typography variant="body2" sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 200,
                                direction: 'ltr' // Ensure text doesn't break layout
                            }}>
                                {repliedMsg.message || (repliedMsg.attachment_path ? '[Fayl]' : '...')}
                            </Typography>
                        </Box>
                    )}

                    {/* Attachment */}
                    {msg.attachment_path && !isDeleted && (
                        <Box sx={{ mb: 1 }}>
                            {msg.attachment_type === 'image' ? (
                                <img
                                    src={api.getImageUrl(msg.attachment_path)}
                                    alt="attachment"
                                    style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }}
                                    onClick={() => window.open(api.getImageUrl(msg.attachment_path), '_blank')}
                                />
                            ) : (
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    href={api.getImageUrl(msg.attachment_path)}
                                    target="_blank"
                                    size="small"
                                >
                                    Faylı Endir
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* Message Body */}
                    <Typography variant="body1" sx={{ fontStyle: isDeleted ? 'italic' : 'normal' }}>
                        {isDeleted ? (
                            <span style={{ display: 'flex', alignItems: 'center' }}><CloseIcon fontSize="small" sx={{ mr: 0.5 }} /> Bu mesaj silinib</span>
                        ) : msg.message}
                    </Typography>

                    {/* Footer */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5, opacity: 0.6 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', mr: 0.5 }}>
                            {formatTime(msg.created_at)}
                            {isMe && !isDeleted && (
                                <Box component="span" sx={{ ml: 0.5, display: 'inline-flex', verticalAlign: 'middle', opacity: 0.7 }}>
                                    {msg.is_read ? (
                                        <DoneAllIcon sx={{ fontSize: 16, color: '#34b7f1' }} />
                                    ) : msg.is_delivered ? (
                                        <DoneAllIcon sx={{ fontSize: 16, color: 'inherit' }} />
                                    ) : (
                                        <CheckIcon sx={{ fontSize: 16, color: 'inherit' }} />
                                    )}
                                </Box>
                            )}
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        );
    };

    // Helper to fix timezone issue (Assume server sends UTC without Z)
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        let date = new Date(dateStr);
        // If the date string doesn't end with Z and looks like ISO, append Z to force UTC
        if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
            date = new Date(dateStr + 'Z');
        }
        try {
            return format(date, "dd.MM.yyyy HH.mm.ss");
        } catch (e) {
            return date.toLocaleTimeString();
        }
    };

    // Format Last Seen
    const formatLastSeen = (dateStr) => {
        if (!dateStr) return 'Offline';
        const date = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
        const now = new Date();
        const diff = now - date;
        const oneDay = 24 * 60 * 60 * 1000;

        if (date.toDateString() === now.toDateString()) {
            return `Bu gün ${format(date, "HH:mm")}`;
        }
        if (now.getDate() - date.getDate() === 1) {
            return `Dünən ${format(date, "HH:mm")}`;
        }
        return format(date, "dd.MM.yyyy HH:mm");
    };

    // --- Main Render ---
    return (
        <Box sx={{ display: 'flex', height: '100%', bgcolor: 'transparent' }}>
            {/* LEFT SIDEBAR (Similar to before but cleaner) */}
            <Paper sx={{ width: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(0,0,0,0.1)', bgcolor: alpha('#fff', 0.8) }}>
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Typography variant="h6" fontWeight="bold">💬 Mesajlar</Typography>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth" sx={{ mt: 1 }}>
                        <Tab label="ÇAT" />
                        <Tab label="İşçilər" />
                        <Tab label={<Badge badgeContent={friendRequests.length} color="error">Sorğular</Badge>} />
                    </Tabs>
                </Box>
                <Box sx={{ p: 1 }}>
                    <TextField
                        fullWidth size="small" placeholder="Axtarış..."
                        value={searchText} onChange={e => setSearchText(e.target.value)}
                        InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                    />
                </Box>
                <List sx={{ flex: 1, overflowY: 'auto' }}>
                    {/* Reuse previous logic for listing friends/users - simplified here for brevity */}
                    {tabValue === 0 && activeFriends.filter(f => f.friend_name.toLowerCase().includes(searchText.toLowerCase())).map(f => (
                        <ListItemButton
                            key={f.friend_id}
                            selected={currentFriend?.friend_id === f.friend_id}
                            onClick={() => setCurrentFriend(f)}
                            onContextMenu={(e) => handleFriendContextMenu(e, f)}
                        >
                            <ListItemAvatar>
                                <Badge variant="dot" color="success" invisible={!f.is_online}>
                                    <Avatar src={api.getImageUrl(f.profile_image)} alt={f.friend_name}>{f.friend_name[0]}</Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText primary={f.friend_name} secondary={f.is_online ? 'Yeni' : ''} />
                            {f.unread_count > 0 && <Badge badgeContent={f.unread_count} color="primary" />}
                        </ListItemButton>
                    ))}

                    {/* Tab 1: All Employees */}
                    {tabValue === 1 && allUsers.filter(u => u.name.toLowerCase().includes(searchText.toLowerCase())).map(u => {
                        const isFriend = activeFriends.some(f => Number(f.friend_id) === Number(u.id));

                        return (
                            <ListItemButton key={u.id} selected={currentFriend?.id === u.id} onClick={() => setCurrentFriend({ ...u, friend_id: u.id, friend_name: u.name })}>
                                <ListItemAvatar>
                                    <Avatar src={api.getImageUrl(u.profile_image)} alt={u.name}>{u.name[0]}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={u.name} secondary={u.department || 'İşçi'} />

                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {isFriend ? (
                                        <>
                                            <IconButton size="small" color="primary" onClick={(e) => {
                                                e.stopPropagation();
                                                // Open chat
                                                setCurrentFriend({ ...u, friend_id: u.id, friend_name: u.name });
                                                setTabValue(0);
                                            }}>
                                                <ChatIcon />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Bu şəxsi dostluqdan silmək istəyirsiniz?")) {
                                                    api.chat.removeFriend(u.id).then(() => {
                                                        loadSidebarData(true); // Refresh
                                                        alert("Silindi.");
                                                    });
                                                }
                                            }}>
                                                <PersonRemoveIcon />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <IconButton size="small" onClick={(e) => {
                                            e.stopPropagation();
                                            api.chat.requestFriendship(u.id).then(() => alert('Dostluq sorğusu göndərildi!'));
                                        }}>
                                            <PersonAddIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            </ListItemButton>
                        );
                    })}

                    {/* Tab 2: Friend Requests */}
                    {tabValue === 2 && friendRequests.map(req => (
                        <ListItem key={req.id}>
                            <ListItemAvatar>
                                <Avatar src={api.getImageUrl(req.profile_image)} alt={req.sender_name}>{req.sender_name?.[0]}</Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={req.sender_name} secondary="Dostluq sorğusu" />
                            <IconButton color="success" onClick={() => {
                                api.chat.respondFriendship(req.id, 'approve').then(() => loadSidebarData(true));
                            }}>
                                <CheckIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => {
                                api.chat.respondFriendship(req.id, 'reject').then(() => loadSidebarData(true));
                            }}>
                                <CloseIcon />
                            </IconButton>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* MAIN CHAT */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#e5ddd5' }}> {/* Default WhatsApp BG color */}
                {currentFriend ? (
                    <>
                        {/* Header */}
                        <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                            <Avatar sx={{ mr: 2 }} src={api.getImageUrl(currentFriend.profile_image)} alt={currentFriend.friend_name}>
                                {currentFriend.friend_name[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">{currentFriend.friend_name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {currentFriend.is_online
                                        ? 'Online'
                                        : (currentFriend.last_seen || currentFriend.last_online_at
                                            ? `Son görülmə: ${formatLastSeen(currentFriend.last_seen || currentFriend.last_online_at)}`
                                            : 'Offline')}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Messages List */}
                        <Box sx={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden', // Prevent horizontal scrollbar flash
                            p: 2,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }} ref={chatContainerRef} onScroll={handleScroll}>
                            <div ref={lastMessageRef} style={{ height: 20, textAlign: 'center', opacity: 0.5 }}>
                                {loadingMore && <CircularProgress size={20} />}
                            </div>
                            {messages.map(renderMessage)}
                            <div ref={messagesEndRef} />

                            {/* Scroll to Bottom Button */}
                            {showScrollButton && (
                                <Box sx={{ position: 'fixed', bottom: 120, right: 30, zIndex: 10 }}>
                                    <Fab
                                        color="secondary"
                                        size="small"
                                        onClick={scrollToBottom}
                                        sx={{ bgcolor: '#fff', color: '#555', '&:hover': { bgcolor: '#f0f0f0' } }}
                                    >
                                        <Badge badgeContent={newMessagesBelow} color="success">
                                            <KeyboardArrowDown />
                                        </Badge>
                                    </Fab>
                                </Box>
                            )}
                        </Box>

                        {/* Input Area */}

                        <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
                            {/* Reply Banner */}
                            {replyingTo && (
                                <Box sx={{ p: 1, mb: 1, bgcolor: '#fff', borderRadius: 1, borderLeft: '4px solid #34B7F1', display: 'flex', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="caption" color="primary">Cavablanır:</Typography>
                                        <Typography variant="body2" noWrap>{replyingTo.message}</Typography>
                                    </Box>
                                    <IconButton size="small" onClick={() => setReplyingTo(null)}><CloseIcon /></IconButton>
                                </Box>
                            )}

                            {/* File Preview */}
                            {selectedFile && (
                                <Box sx={{ p: 1, mb: 1, bgcolor: '#fff', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                                    <FileIcon sx={{ mr: 1, color: 'action.active' }} />
                                    <Typography variant="body2" sx={{ flex: 1 }}>{selectedFile.name}</Typography>
                                    <IconButton size="small" onClick={() => setSelectedFile(null)}><CloseIcon /></IconButton>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

                                {/* Native File Picker Implementation */}
                                <IconButton onClick={async () => {
                                    try {
                                        const selectedPath = await open({
                                            multiple: false,
                                            filters: [
                                                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
                                                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'] }
                                            ]
                                        });

                                        if (selectedPath) {
                                            const assetUrl = convertFileSrc(selectedPath);
                                            const response = await fetch(assetUrl);
                                            const blob = await response.blob();
                                            const filename = selectedPath.split(/[\\/]/).pop();
                                            const file = new File([blob], filename, { type: blob.type });
                                            setSelectedFile(file);
                                        }
                                    } catch (e) {
                                        console.error("Native Picker Error:", e);
                                    }
                                }}>
                                    <AttachFileIcon />
                                </IconButton>

                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Mesaj yazın..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    onPaste={(e) => {
                                        if (e.clipboardData.files.length > 0) {
                                            setSelectedFile(e.clipboardData.files[0]);
                                            e.preventDefault();
                                        }
                                    }}
                                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                                />
                                <IconButton color="primary" onClick={handleSendMessage} disabled={uploading}>
                                    {uploading ? <CircularProgress size={24} /> : <SendIcon />}
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Context Menu */}
                        <Menu
                            open={contextMenu !== null}
                            onClose={handleMenuClose}
                            anchorReference="anchorPosition"
                            anchorPosition={
                                contextMenu !== null
                                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                    : undefined
                            }
                        >
                            <MenuItem onClick={handleReply}><ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>Cavabla</MenuItem>
                            <MenuItem onClick={handleCopy}><ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>Kopyala</MenuItem>
                            {contextMenu?.msg?.sender_id === currentUser.id && (
                                <MenuItem onClick={() => handleDelete(true)} sx={{ color: 'error.main' }}>
                                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Hər kəsdən sil
                                </MenuItem>
                            )}
                            <MenuItem onClick={() => handleDelete(false)}>
                                <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>Məndən sil
                            </MenuItem>
                        </Menu>

                        {/* Friend List Context Menu */}
                        <Menu
                            open={friendContextMenu !== null}
                            onClose={handleFriendMenuClose}
                            anchorReference="anchorPosition"
                            anchorPosition={
                                friendContextMenu !== null
                                    ? { top: friendContextMenu.mouseY, left: friendContextMenu.mouseX }
                                    : undefined
                            }
                        >
                            <MenuItem onClick={handleArchive}>
                                <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
                                Arxivlə (Siyahıdan gizlət)
                            </MenuItem>
                            <MenuItem onClick={() => handleClearChat(false)}>
                                <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                                Çatı sil (Məndən)
                            </MenuItem>
                            <MenuItem onClick={() => handleClearChat(true)} sx={{ color: 'error.main' }}>
                                <ListItemIcon><DeleteForeverIcon fontSize="small" color="error" /></ListItemIcon>
                                Çatı sil (Hər iki tərəfdən)
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <Typography>Söhbətə başlamaq üçün birini seçin</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatPage;
