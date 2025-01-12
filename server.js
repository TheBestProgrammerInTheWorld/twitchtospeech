let twitchClient; // A global variable to store the Twitch client instance

const express = require('express');
const cors = require('cors');
const tmi = require('tmi.js');

const app = express();
app.use(cors());
app.use(express.json());

// Store connected clients
let clients = new Set();

// Example route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Route to receive Twitch credentials and connect to Twitch chat
app.post('/connect', (req, res) => {
    const { channel } = req.body;

    if (!channel) {
        return res.status(400).send('Missing channel name.');
    }

    // Create an anonymous client - no auth needed for just reading chat
    twitchClient = new tmi.Client({
        connection: {
            secure: true,
            reconnect: true
        },
        channels: [channel]
    });

    // Attempt to connect to Twitch
    twitchClient
        .connect()
        .then(() => {
            console.log(`Connected to Twitch channel: ${channel}`);
            res.status(200).send('Connected to Twitch chat successfully!');
        })
        .catch((error) => {
            console.error('Error connecting to Twitch:', error);
            res.status(500).send('Failed to connect to Twitch chat.');
        });

    // Listen for chat messages
    twitchClient.on('message', (channel, tags, message, self) => {
        const chatMessage = {
            username: tags['display-name'],
            message: message,
            timestamp: new Date().toISOString()
        };
        
        // Send to all connected clients
        clients.forEach(client => {
            client.write(`data: ${JSON.stringify(chatMessage)}\n\n`);
        });
    });
});

// Add SSE endpoint
app.get('/chat-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add this client to our connected clients
    clients.add(res);

    // Remove client when they disconnect
    req.on('close', () => clients.delete(res));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
