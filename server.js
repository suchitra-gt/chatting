const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure directories and JSON files exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/register', (req, res) => {
    const data = req.body;
    if (!data.username || !data.password || !data.email || !data.phone) {
        return res.status(400).json({ error: 'Please provide username, email, phone, and password' });
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    if (users.find(u => u.username === data.username || u.email === data.email)) {
        return res.status(400).json({ error: 'Username or email already taken' });
    }
    const newUser = {
        id: `usr_${Date.now()}`,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password
    };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.status(201).json({ message: 'Registered successfully', user: { id: newUser.id, username: newUser.username } });
});

app.post('/api/login', (req, res) => {
    const data = req.body;
    if (!data.identifier || !data.password) {
        return res.status(400).json({ error: 'Please provide username/email and password' });
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const user = users.find(u =>
        (u.username === data.identifier || u.email === data.identifier) &&
        u.password === data.password
    );
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Logged in', user: { id: user.id, username: user.username } });
});

app.get('/api/messages', (req, res) => {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    res.status(200).json(messages);
});

app.post('/api/messages', (req, res) => {
    const data = req.body;
    if (!data.senderId || !data.text || !data.recipientId) {
        return res.status(400).json({ error: 'Invalid message data' });
    }
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    const newMsg = {
        id: `msg_${Date.now()}`,
        senderId: data.senderId,
        senderName: data.senderName,
        recipientId: data.recipientId,
        text: data.text,
        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(newMsg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    res.status(201).json(newMsg);
});

app.get('/api/users', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email || '',
            phone: u.phone || ''
        }));
        res.status(200).json(safeUsers);
    } catch (e) {
        res.status(500).json({ error: 'Failed to parse users file' });
    }
});

// Fallback to index.html for SPA-like behavior (optional, but good)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running at: http://localhost:${PORT}/`);
});
