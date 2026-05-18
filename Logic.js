const { WebSocketServer } = require('ws');

// Start the WebSocket server on port 8080
const wss = new WebSocketServer({ port: 8080 });

console.log('Retro Chat Server is running on ws://localhost:8080');

wss.on('connection', (ws) => {
    console.log('A user connected.');

    // Listen for messages from any single client
    ws.on('message', (data) => {
        // Parse the incoming raw message
        const messageString = data.toString();
        
        console.log(`Broadcasting: ${messageString}`);

        // Broadcast the message to EVERY connected user
        wss.clients.forEach((client) => {
            if (client.readyState === 1) { // 1 means the connection is OPEN
                client.send(messageString);
            }
        });
    });

    ws.on('close', () => {
        console.log('A user disconnected.');
    });
});
