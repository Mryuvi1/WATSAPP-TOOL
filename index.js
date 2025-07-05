
const { Boom } = require('@hapi/boom');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const qrcode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        if (qr) {
            await qrcode.toFile('./public/qr.png', qr);
            console.log("✅ QR Code generated at /qr.png");
        }
        if (connection === 'open') {
            console.log('✅ WhatsApp connection established!');
        }
    });
}

connectToWhatsApp();

app.get('/qr', (req, res) => {
    const qrPath = './public/qr.png';
    if (fs.existsSync(qrPath)) {
        res.sendFile(qrPath, { root: '.' });
    } else {
        res.status(404).send('QR not ready yet. Wait...');
    }
});

app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).send({ error: 'Missing number or message' });

    const jid = number.includes('@s.whatsapp.net') ? number : number + '@s.whatsapp.net';
    try {
        await sock.sendMessage(jid, { text: message });
        res.send({ status: 'success', number, message });
    } catch (e) {
        res.status(500).send({ status: 'fail', error: e.message });
    }
});

app.listen(PORT, () => console.log(`🔥 Server started on http://localhost:${PORT}`));
