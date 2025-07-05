// index.js const express = require("express"); const fileUpload = require("express-fileupload"); const fs = require("fs"); const { Boom } = require("@hapi/boom"); const makeWASocket = require("@whiskeysockets/baileys").default; const { useSingleFileAuthState } = require("@whiskeysockets/baileys"); const path = require("path");

const app = express(); const PORT = process.env.PORT || 3000;

app.use(express.static("public")); app.use(fileUpload()); app.use(express.json());

let sock; let isSending = false;

app.post("/upload", async (req, res) => { try { const creds = req.body.creds; const message = req.files.message; const target = req.body.target; const targetType = req.body.targetType; // contact or group

if (!creds || !message || !target) {
  return res.status(400).send("Missing required fields");
}

// Save creds.json
fs.writeFileSync("creds.json", creds);

// Save message.txt
const messagePath = path.join(__dirname, "messages", "message.txt");
message.mv(messagePath, async (err) => {
  if (err) return res.status(500).send("Failed to save message");

  const { state, saveCreds } = useSingleFileAuthState("creds.json");
  sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      const msgText = fs.readFileSync(messagePath, "utf-8");
      isSending = true;

      try {
        if (targetType === "group") {
          await sock.sendMessage(target, { text: msgText });
        } else {
          const jid = target + "@s.whatsapp.net";
          await sock.sendMessage(jid, { text: msgText });
        }
        res.send("Message sent successfully!");
      } catch (err) {
        res.status(500).send("Failed to send message");
      }
    } else if (
      connection === "close" &&
      (lastDisconnect.error = Boom && lastDisconnect.error.output.statusCode !== 401)
    ) {
      sock = makeWASocket({ auth: state });
    }
  });
});

} catch (err) { console.error(err); res.status(500).send("Server error"); } });

app.post("/stop", (req, res) => { isSending = false; if (sock) sock.logout(); res.send("Stopped messaging session"); });

app.get("/", (req, res) => { res.send(`

  <!DOCTYPE html>  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WHATSAPP SERVER - KING MAKER YUVI</title>
    <style>
      body {
        background: url('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif') no-repeat center center fixed;
        background-size: cover;
        font-family: sans-serif;
        color: #fff;
        text-align: center;
        padding-top: 50px;
      }
      .glass {
        background: rgba(0,0,0,0.6);
        border-radius: 20px;
        padding: 30px;
        width: 90%;
        max-width: 500px;
        margin: auto;
        box-shadow: 0 0 10px #ff00cc;
      }
      input, textarea, select, button {
        margin: 10px 0;
        padding: 10px;
        width: 100%;
        border: none;
        border-radius: 8px;
        outline: none;
      }
      button {
        background: #00ff99;
        color: #000;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 0 10px pink;
      }
    </style>
  </head>
  <body>
    <div class="glass">
      <h2>WHATSAPP SERVER BY KING MAKER YUVI</h2>
      <form id="sendForm">
        <label>Paste creds.json:</label>
        <textarea name="creds" rows="5" required></textarea><label>Upload message.txt:</label>
    <input type="file" name="message" accept=".txt" required>

    <label>Target Number or Group ID:</label>
    <input type="text" name="target" placeholder="9187XXXXXXX or group ID" required>

    <label>Type:</label>
    <select name="targetType">
      <option value="contact">Contact</option>
      <option value="group">Group</option>
    </select>

    <button type="submit">Start Messaging</button>
  </form>

  <form id="stopForm">
    <button type="submit">Stop Messaging</button>
  </form>
</div>

<script>
  const sendForm = document.getElementById('sendForm');
  const stopForm = document.getElementById('stopForm');

  sendForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(sendForm);
    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      alert(await res.text());
    } catch (err) {
      alert('Failed to start messaging');
    }
  });

  stopForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/stop', { method: 'POST' });
    alert('Stopped messaging');
  });
</script>

  </body>
  </html>
  `);
});app.listen(PORT, () => { console.log("Server running on port " + PORT); });

