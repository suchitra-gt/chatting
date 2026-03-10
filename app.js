const { useState, useEffect, useRef } = React;

const INITIAL_CONTACTS = [
    { id: 'global', name: 'Global Space', avatar: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=100&h=100&auto=format&fit=crop', lastMsg: 'Connect with everyone' },
    { id: 'dev-team', name: 'Dev Team', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&auto=format&fit=crop', lastMsg: 'Project updates' },
];

const chatChannel = new BroadcastChannel('nebula_chat');

function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('nebula_user');
        return saved ? JSON.parse(saved) : { id: 'user-' + Math.random().toString(36).substr(2, 9), name: 'Explorer_' + Math.floor(Math.random() * 1000) };
    });

    const [activeContactId, setActiveContactId] = useState('global');
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('nebula_messages');
        return saved ? JSON.parse(saved) : { 'global': [], 'dev-team': [] };
    });

    const [inputText, setInputText] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const scrollRef = useRef(null);

    const activeContact = INITIAL_CONTACTS.find(c => c.id === activeContactId);

    // Persistence
    useEffect(() => {
        localStorage.setItem('nebula_messages', JSON.stringify(messages));
        localStorage.setItem('nebula_user', JSON.stringify(user));
    }, [messages, user]);

    // Real-time Sync + Notifications
    useEffect(() => {
        const handleSync = (event) => {
            const { type, payload } = event.data;
            if (type === 'NEW_MESSAGE') {
                const { channel, message } = payload;

                setMessages(prev => ({
                    ...prev,
                    [channel]: [...(prev[channel] || []), message]
                }));

                // Trigger Popup if not sender
                if (message.senderId !== user.id) {
                    const id = Date.now();
                    setNotifications(prev => [...prev, { id, ...message, channelName: INITIAL_CONTACTS.find(c => c.id === channel)?.name }]);

                    // Auto-hide after 4 seconds
                    setTimeout(() => {
                        setNotifications(prev => prev.filter(n => n.id !== id));
                    }, 4000);
                }
            }
        };

        chatChannel.onmessage = handleSync;
        return () => chatChannel.onmessage = null;
    }, [user.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeContactId]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeContactId, notifications]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMsg = {
            text: inputText,
            senderId: user.id,
            senderName: user.name,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const payload = {
            channel: activeContactId,
            message: newMsg
        };

        setMessages(prev => ({
            ...prev,
            [activeContactId]: [...(prev[activeContactId] || []), newMsg]
        }));

        chatChannel.postMessage({ type: 'NEW_MESSAGE', payload });
        setInputText('');
    };

    return (
        <div className="app-container">
            {/* Toast Notifications */}
            <div className="notifications-container">
                {notifications.map(n => (
                    <div key={n.id} className="toast">
                        <div className="logo-icon" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                            <i data-lucide="message-square" style={{ width: '16px', height: '16px' }}></i>
                        </div>
                        <div className="toast-content">
                            <div className="toast-user">{n.senderName} ({n.channelName})</div>
                            <div className="toast-text">{n.text}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">
                        <i data-lucide="zap" fill="white"></i>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>NEBULA</h2>
                        <div
                            style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setIsEditingName(true)}
                        >
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    className="chat-input"
                                    style={{ padding: '2px 8px', height: '24px', fontSize: '0.75rem', width: '120px' }}
                                    value={user.name}
                                    onChange={(e) => setUser(p => ({ ...p, name: e.target.value }))}
                                    onBlur={() => setIsEditingName(false)}
                                    onKeyPress={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                />
                            ) : (
                                <span>{user.name} <i data-lucide="edit-3" style={{ width: '10px', height: '10px' }}></i></span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="contacts-list">
                    {INITIAL_CONTACTS.map(contact => (
                        <div
                            key={contact.id}
                            className={`contact-item ${activeContactId === contact.id ? 'active' : ''}`}
                            onClick={() => setActiveContactId(contact.id)}
                        >
                            <div
                                className="avatar"
                                style={{ backgroundImage: `url(${contact.avatar})` }}
                            ></div>
                            <div className="contact-info">
                                <div className="contact-name">{contact.name}</div>
                                <div className="last-msg">{contact.lastMsg}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat */}
            <div className="chat-window">
                <header className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            className="avatar"
                            style={{ width: '40px', height: '40px', backgroundImage: `url(${activeContact.avatar})`, margin: 0 }}
                        ></div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{activeContact.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                                Online
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                        <i data-lucide="video" style={{ cursor: 'pointer' }}></i>
                        <i data-lucide="phone" style={{ cursor: 'pointer' }}></i>
                        <i data-lucide="more-vertical" style={{ cursor: 'pointer' }}></i>
                    </div>
                </header>

                <div className="messages-container" ref={scrollRef}>
                    {messages[activeContactId]?.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                            {msg.senderId !== user.id && (
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, marginBottom: '4px', color: '#7b61ff' }}>
                                    {msg.senderName}
                                </div>
                            )}
                            {msg.text}
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                                {msg.time}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={handleSend}>
                        <i data-lucide="send"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

setTimeout(() => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}, 100);
