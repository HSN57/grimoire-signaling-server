const WebSocket = require('ws');
const http = require('http');

// Simple pub/sub room tracking
const rooms = new Map();

// HTTP server for health check (Railway needs an open port)
const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Grimoire Signaling Server is running!');
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws) => {
    const subscribedTopics = new Set();

    ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch (e) { return; }

        switch (msg.type) {
            case 'subscribe': {
                const topics = msg.topics || [];
                topics.forEach(topic => {
                    subscribedTopics.add(topic);
                    if (!rooms.has(topic)) rooms.set(topic, new Set());
                    rooms.get(topic).add(ws);
                });
                break;
            }
            case 'unsubscribe': {
                const topics = msg.topics || [];
                topics.forEach(topic => {
                    subscribedTopics.delete(topic);
                    if (rooms.has(topic)) rooms.get(topic).delete(ws);
                });
                break;
            }
            case 'publish': {
                const topic = msg.topic;
                if (rooms.has(topic)) {
                    const msgStr = JSON.stringify(msg);
                    rooms.get(topic).forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(msgStr);
                        }
                    });
                }
                break;
            }
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    });

    ws.on('close', () => {
        subscribedTopics.forEach(topic => {
            if (rooms.has(topic)) {
                rooms.get(topic).delete(ws);
                if (rooms.get(topic).size === 0) rooms.delete(topic);
            }
        });
    });
});

const PORT = process.env.PORT || 4444;
httpServer.listen(PORT, () => {
    console.log(`Grimoire signaling server running on port ${PORT}`);
});
