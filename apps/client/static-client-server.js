const path = require('path');

const express = require('express');

const app = express();
const PORT = process.env.CLIENT_PORT || 2222;

const BASE_URL = path.join(__dirname, 'steam-idler-client-dist');

app.use(express.static(BASE_URL));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(BASE_URL, 'index.html'));
});

app.listen(PORT, () => {
  console.log(
    `[CLIENT] [LOG] [${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] Client server is running on http://YOUR_LOCAL_IP_ADDRESS:${PORT}`,
  );
});
