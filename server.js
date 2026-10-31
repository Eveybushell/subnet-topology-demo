const http = require('http');
const os = require('os');

const PORT = 3000;
const hostname = os.hostname();

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Request successful',
    handledBy: hostname,
    url: req.url
  }));
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});