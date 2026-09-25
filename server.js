// 中秋祝福页 —— 零依赖静态服务器
// 用法: node server.js [端口] [根目录]
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 8099;
const HOST = process.env.MOON_HOST || '127.0.0.1';
const ROOT = path.resolve(process.argv[3] || __dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body === undefined || body === null) res.end();
  else res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, '400 Bad Request');
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' }, '405 Method Not Allowed');
  }

  if (urlPath.endsWith('/')) urlPath += 'index.html';

  // 防目录穿越
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, '403 Forbidden');
  }

  // 不对外暴露服务器脚本、启动脚本和隐藏文件
  const rel = path.relative(ROOT, filePath);
  const segments = rel.split(path.sep);
  if (segments.some((s) => s.startsWith('.')) || rel === 'server.js' || rel === 'start.cmd') {
    return send(res, 404, { 'Content-Type': 'text/html; charset=utf-8' }, '<h1>404 Not Found</h1>');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, { 'Content-Type': 'text/html; charset=utf-8' }, '<h1>404 Not Found</h1>');
    }

    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const baseHeaders = {
      'Content-Type': type,
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes'
    };

    // 支持 Range 请求（音频拖动进度条）
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start >= stat.size || end >= stat.size || start > end) {
          return send(res, 416, { ...baseHeaders, 'Content-Range': `bytes */${stat.size}` });
        }
        res.writeHead(206, {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Content-Length': end - start + 1
        });
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(filePath, { start, end }).pipe(res);
      }
    }

    res.writeHead(200, { ...baseHeaders, 'Content-Length': stat.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`中秋祝福页已启动: http://${HOST}:${PORT}/`);
  console.log(`根目录: ${ROOT}`);
});

server.on('error', (e) => {
  console.error('服务器启动失败: ' + e.message);
  process.exit(1);
});
