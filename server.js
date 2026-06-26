const { createServer } = require('http');
const { setupWSConnection } = require('y-webrtc/bin/server');
const WebSocket = require('ws');

const server = createServer((req, res) => {
    // Health check endpoint for Railway
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Grimoire Signaling Server is running!');
});

const wss = new WebSocket.Server({ server });
wss.on('connection', setupWSConnection);

const PORT = process.env.PORT || 4444;
server.listen(PORT, () => {
    console.log(`Grimoire signaling server listening on port ${PORT}`);
});
