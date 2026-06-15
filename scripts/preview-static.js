import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('public');
const port = Number.parseInt(process.env.PORT || '4173', 10);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

http
  .createServer((request, response) => {
    let pathname = decodeURIComponent((request.url || '/').split('?')[0]);
    if (pathname === '/') pathname = '/survey/';
    if (pathname.endsWith('/')) pathname += 'index.html';

    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    fs.readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
      response.end(data);
    });
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`Static preview: http://127.0.0.1:${port}/survey/`);
  });
