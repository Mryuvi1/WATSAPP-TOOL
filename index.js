import { makeWASocket, useMultiFileAuthState, delay, DisconnectReason } from '@whiskeysockets/baileys';
import fs from 'fs';
import pino from 'pino';
import dotenv from 'dotenv';
dotenv.config();

const TARGET = process.env.TARGET_NUMBER;
const MESSAGE_FILE = process.env.MESSAGE_FILE;
const HATER_NAME = process.env.HATER_NAME;
const DELAY = parseInt(process.env.MESSAGE_DELAY || '5') * 1000;
const PAIR_PHONE = process.env.PAIR_PHONE;

const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

const sock = makeWASocket({
  logger: pino({ level: 'silent' }),
  auth: state
});

if (!sock.authState.creds.registered) {
  console.log('[!] Pairing not complete. Generating pairing code...');
  const code = await sock.requestPairingCode(PAIR_PHONE);
  console.log(`[✓] Pairing Code: ${code}`);
  console.log('[✱] Login with this code in WhatsApp and restart the service.');
  process.exit(0);
}

let messages = fs.readFileSync(MESSAGE_FILE, 'utf-8').split('\n').filter(Boolean);
const chatId = TARGET + '@c.us';

async function startSending() {
  while (true) {
    for (const msg of messages) {
      const fullMsg = `${HATER_NAME} ${msg}`;
      try {
        await sock.sendMessage(chatId, { text: fullMsg });
        console.log(`[✓] Sent: ${fullMsg}`);
        await delay(DELAY);
      } catch (err) {
        console.log('[!] Error sending message:', err.message);
        await delay(5000);
      }
    }
  }
}

sock.ev.on('connection.update', async ({ connection }) => {
  if (connection === 'open') {
    console.log('[✓] WhatsApp Connected. Sending will begin...');
    await startSending();
  } else if (connection === 'close') {
    console.log('[!] Disconnected. Restart required.');
  }
});

sock.ev.on('creds.update', saveCreds);
