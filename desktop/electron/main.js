const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = 0; // ephemeral

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};

// Tiny static file server so BrowserRouter routing works inside Electron.
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(DIST_DIR, urlPath);
      if (!filePath.startsWith(DIST_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback: serve index.html for unknown routes
          fs.readFile(path.join(DIST_DIR, 'index.html'), (e2, idx) => {
            if (e2) { res.writeHead(404); return res.end('Not found'); }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(idx);
          });
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

let mainWindow = null;

async function createWindow() {
  const server = await startServer();
  const { port } = server.address();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d1a18',
    title: 'Haamkay Enterprises',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links (http/https) in the user's default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
