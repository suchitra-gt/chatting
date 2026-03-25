const { useState, useEffect, useRef } = React;

function App() {
    const [view, setView] = useState('login'); // 'login', 'register', 'chat'
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem('nebula_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Auth forms
    const [identifier, setIdentifier] = useState(''); // username or email for login
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // Chat state
    const [users, setUsers] = useState([]);
    const [activeContactId, setActiveContactId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef(null);

    // Initial check
    useEffect(() => {
        if (user) {
            setView('chat');
        }
    }, [user]);

    // Setup Lucide icons
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    // Handle Auth
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const clone = res.clone();
            let data;
            try {
                data = await res.json();
            } catch (err) {
                const text = await clone.text();
                throw new Error(`Server Error (Raw): ${text || 'Empty Response'}`);
            }
            if (!res.ok) throw new Error(data.error || 'Login failed');

            setUser(data.user);
            sessionStorage.setItem('nebula_user', JSON.stringify(data.user));
            setIdentifier('');
            setPassword('');
            setView('chat');
        } catch (err) {
            setAuthError(err.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, phone, password })
            });
            const clone = res.clone();
            let data;
            try {
                data = await res.json();
            } catch (err) {
                const text = await clone.text();
                throw new Error(`Server Error (Raw): ${text || 'Empty Response'}`);
            }
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            // Redirect to login instead of auto-logging in
            setUsername('');
            setEmail('');
            setPhone('');
            setPassword('');
            setView('login');
            // Give a hint that registration succeeded via the error state for now so they know what happened
            setAuthError('Registration successful! Please login.');
        } catch (err) {
            setAuthError(err.message);
        }
    };

    const handleLogout = () => {
        setUser(null);
        setActiveContactId(null);
        sessionStorage.removeItem('nebula_user');
        setView('login');
    };

    // Chat Syncing & User Fetching
    const fetchMessages = async () => {
        if (view !== 'chat') return;
        try {
            const res = await fetch('/api/messages');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    };

    const fetchUsers = async () => {
        if (view !== 'chat' || !user) return;
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                const otherUsers = data.filter(u => u.id !== user.id);
                setUsers(otherUsers);
                // Auto-select first user if none selected
                if (otherUsers.length > 0) {
                    setActiveContactId(prev => prev ? prev : otherUsers[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    useEffect(() => {
        if (view === 'chat') {
            fetchMessages();
            fetchUsers();
            const msgInterval = setInterval(fetchMessages, 2000);
            const userInterval = setInterval(fetchUsers, 5000);
            return () => {
                clearInterval(msgInterval);
                clearInterval(userInterval);
            };
        }
    }, [view, user]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeContactId, view]);

    const handleSend = async () => {
        if (!inputText.trim() || !user || !activeContactId) return;

        const newMsg = {
            senderId: user.id,
            senderName: user.username,
            recipientId: activeContactId,
            text: inputText
        };

        setInputText(''); // Optimistic clear

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMsg)
            });
            fetchMessages(); // Refresh immediately
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    // Derived State
    const visibleMessages = messages.filter(msg =>
        (msg.senderId === user?.id && msg.recipientId === activeContactId) ||
        (msg.senderId === activeContactId && msg.recipientId === user?.id)
    );
    const activeUser = users.find(u => u.id === activeContactId);

    // --- RENDERERS ---

    if (view === 'login' || view === 'register') {
        const isLogin = view === 'login';
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <div className="auth-header">
                        <div className="logo-icon" style={{ margin: '0 auto 1rem auto' }}>
                            <i data-lucide="zap" fill="white"></i>
                        </div>
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Sign in to continue to Nebula Chat' : 'Join Nebula Chat today'}</p>
                    </div>

                    {authError && <div className="auth-error">{authError}</div>}

                    <form onSubmit={isLogin ? handleLogin : handleRegister}>
                        {isLogin ? (
                            <div className="form-group">
                                <label>Username or Email</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder="Enter your username or email"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="Choose a username"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>
                        <button type="submit" className="auth-btn">
                            {isLogin ? 'Login' : 'Register'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => {
                            setView(isLogin ? 'register' : 'login');
                            setAuthError('');
                        }}>
                            {isLogin ? 'Register' : 'Login'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">
                        <i data-lucide="zap" fill="white"></i>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>NEBULA</h2>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Logged in as {user?.username}
                        </div>
                    </div>
                </div>

                <div className="contacts-list">
                    {users.length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                            Waiting for other users...
                        </div>
                    )}
                    {users.map(u => (
                        <div
                            key={u.id}
                            className={`contact-item ${activeContactId === u.id ? 'active' : ''}`}
                            onClick={() => setActiveContactId(u.id)}
                        >
                            <div className="avatar" style={{ background: 'linear-gradient(45deg, #7b61ff, #00d2ff)' }}>
                                <i data-lucide="user" style={{ margin: 'auto', display: 'block', marginTop: '12px', color: 'white' }}></i>
                            </div>
                            <div className="contact-info">
                                <div className="contact-name">{u.username}</div>
                                <div className="last-msg">Click to chat</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '1rem', marginTop: 'auto' }}>
                    <button className="auth-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }} onClick={handleLogout}>
                        <i data-lucide="log-out" style={{ width: '16px', height: '16px', marginRight: '8px' }}></i>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Chat */}
            <div className="chat-window">
                <header className="chat-header">
                    {activeUser ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="avatar" style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #7b61ff, #00d2ff)', margin: 0 }}>
                                    <i data-lucide="user" style={{ margin: 'auto', display: 'block', marginTop: '10px', color: 'white' }}></i>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{activeUser.username}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                                        Online
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                                <i data-lucide="more-vertical" style={{ cursor: 'pointer' }}></i>
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                            Welcome to Nebula Chat. Select a contact to talk.
                        </div>
                    )}
                </header>

                <div className="messages-container" ref={scrollRef}>
                    {activeUser && visibleMessages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                            No messages with {activeUser.username} yet. Say hi!
                        </div>
                    )}
                    {visibleMessages.map((msg, idx) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                            <div key={msg.id || idx} className={`message ${isMine ? 'sent' : 'received'}`}>
                                {!isMine && (
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, marginBottom: '4px', color: '#7b61ff' }}>
                                        {msg.senderName}
                                    </div>
                                )}
                                {msg.text}
                                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                                    {msg.time}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!activeContactId}
                    />
                    <button className="send-btn" onClick={handleSend} disabled={!activeContactId} style={{ opacity: activeContactId ? 1 : 0.5 }}>
                        <i data-lucide="send"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
