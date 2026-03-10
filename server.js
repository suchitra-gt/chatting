const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

// Ensure directories and JSON files exist
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const sendJSONResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const parseJSONBody = (req, callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        try {
            callback(null, JSON.parse(body));
        } catch (err) {
            callback(err, null);
        }
    });
};

const server = http.createServer((req, res) => {
    // API Routes
    if (req.url === '/api/register' && req.method === 'POST') {
        parseJSONBody(req, (err, data) => {
            if (err || !data.username || !data.password || !data.email || !data.phone) {
                return sendJSONResponse(res, 400, { error: 'Please provide username, email, phone, and password' });
            }
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            if (users.find(u => u.username === data.username || u.email === data.email)) {
                return sendJSONResponse(res, 400, { error: 'Username or email already taken' });
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
            sendJSONResponse(res, 201, { message: 'Registered successfully', user: { id: newUser.id, username: newUser.username } });
        });
        return;
    }

    if (req.url === '/api/login' && req.method === 'POST') {
        parseJSONBody(req, (err, data) => {
            if (err || !data.identifier || !data.password) {
                return sendJSONResponse(res, 400, { error: 'Please provide username/email and password' });
            }
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            const user = users.find(u =>
                (u.username === data.identifier || u.email === data.identifier) &&
                u.password === data.password
            );
            if (!user) {
                return sendJSONResponse(res, 401, { error: 'Invalid credentials' });
            }
            sendJSONResponse(res, 200, { message: 'Logged in', user: { id: user.id, username: user.username } });
        });
        return;
    }

    if (req.url === '/api/messages' && req.method === 'GET') {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        return sendJSONResponse(res, 200, messages);
    }

    if (req.url === '/api/messages' && req.method === 'POST') {
        parseJSONBody(req, (err, data) => {
            if (err || !data.senderId || !data.text || !data.recipientId) {
                return sendJSONResponse(res, 400, { error: 'Invalid message data' });
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
            sendJSONResponse(res, 201, newMsg);
        });
        return;
    }

    if (req.url === '/api/users' && req.method === 'GET') {
        try {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            // Return only safe data
            const safeUsers = users.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email || '',
                phone: u.phone || ''
            }));
            return sendJSONResponse(res, 200, safeUsers);
        } catch (e) {
            return sendJSONResponse(res, 500, { error: 'Failed to parse users file' });
        }
    }

    // Static files
    let filePath = './public' + req.url;
    if (filePath === './public/') {
        filePath = './public/index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404: File Not Found');
            } else {
                res.writeHead(500);
                res.end('500: Internal Server Error - ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Server running at: http://localhost:${PORT}/`);
    console.log(`📂 Serving files from: ${path.resolve('.')}`);
    console.log(`Press Ctrl+C to stop the server.\n`);
});
