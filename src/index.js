const express = require('express');
const WebSocket = require('ws');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');

const { MongoClient } = require('mongodb');
const { OPEN } = require('ws');

require('dotenv').config();

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 6969;
const URI = process.env.URI;

const client = new MongoClient(URI);

async function main() {
  await client.connect();
  console.log('Successfully connected to Database');
  const db = client.db('chat');
  const chats = db.collection('chats');
  const accounts = db.collection('accounts');

  app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
      // Create accountaccounts
      for (let acc of await accounts.find({}).toArray()) {
        if (acc.username === username) {
          return res
            .json({
              error: 'Username already exists',
            })
            .status(400);
        }
      }
      await accounts.insertOne({
        username,
        password,
      });
      return res
        .json({
          message: `New user created`,
          successful: true,
          username,
        })
        .status(200);
    } else {
      return res
        .json({
          error: 'Username or password not supplied',
        })
        .status(400);
    }
  });

  app.delete('/removeaccount', async (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
      for (let acc of await accounts.find({}).toArray()) {
        if (acc.username === username && acc.password === password) {
          await accounts.deleteOne(acc);
          return res
            .json({
              message: `Deleted account with username: ${username} successfully`,
            })
            .status(204);
        }
      }
      return res
        .json({
          error: 'Account not found in database',
        })
        .status(400);
    } else {
      return res
        .json({
          error: 'Username or password not supplied',
        })
        .status(400);
    }
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
      for (let acc of await accounts.find({}).toArray()) {
        if (acc.username === username && acc.password === password) {
          return res
            .json({
              message: `Login successful to account: ${username}`,
              username,
              successful: true,
            })
            .status(200);
        }
      }
      return res
        .json({
          message: `Login unsuccessful to account ${username}`,
          username,
          successful: false,
        })
        .status(400);
    } else {
      return res
        .json({
          error: 'Username or password not supplied',
        })
        .status(400);
    }
  });

  const server = http.createServer(app);

  const ws = new WebSocket.Server({ server });

  ws.on('connection', (socket) => {
    console.log('New connection!');
    socket.on('message', (m) => {
      const message = String(m);
      console.log(`Received: ${message}`);
      ws.clients.forEach((s) => {
        if (s.readyState === OPEN) {
          s.send(String(message));
        }
      });
    });
  });

  server.listen(PORT, () =>
    console.log(
      `Listening on http://localhost:${PORT} and ws://localhost:${PORT}`,
    ),
  );
}

main();
