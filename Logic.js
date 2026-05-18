const { WebSocketServer } = require('ws');

// Start the WebSocket server
const wss = new WebSocketServer({ port: 8080 });
console.log('Voting Chat Server is running on ws://localhost:8080');

// Use Sets to track active connections and unique votes
const connectedClients = new Set();
const clientsWhoVoted = new Set();

// Helper function to send data to all connected users
function broadcast(messageObj) {
    const dataString = JSON.stringify(messageObj);
    for (const client of connectedClients) {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(dataString);
        }
    }
}

// Logic to evaluate the votes
function checkVotes() {
    const totalPlayers = connectedClients.size;
    const totalVotes = clientsWhoVoted.size;

    if (totalPlayers > 0 && totalVotes === totalPlayers) {
        // Unanimous vote reached: Send reset command and clear votes
        broadcast({ type: 'reset' });
        clientsWhoVoted.clear();
    } else {
        // Send a system update showing the current vote tally
        broadcast({ 
            type: 'system', 
            text: `${totalVotes}/${totalPlayers} players have voted to reset the chat.` 
        });
    }
}

wss.on('connection', (ws) => {
    // Add new user to active clients
    connectedClients.add(ws);

    ws.on('message', (data) => {
        const parsed = JSON.parse(data.toString());

        if (parsed.type === 'chat') {
            // Forward normal chat messages
            broadcast({ type: 'chat', user: parsed.user, text: parsed.text });
        } else if (parsed.type === 'vote') {
            // Record the user's vote and check if it triggers a reset
            clientsWhoVoted.add(ws);
            checkVotes();
        }
    });

    ws.on('close', () => {
        // Clean up when a user closes their browser
        connectedClients.delete(ws);
        clientsWhoVoted.delete(ws);
        
        // Re-check the votes (e.g., if the only person who didn't vote leaves)
        if (connectedClients.size > 0) {
            checkVotes();
        } else {
            // Reset the state entirely if the server is empty
            clientsWhoVoted.clear(); 
        }
    });
});
          
