import jsonServer from 'json-server';
import path from 'path';
// import fs from 'fs';
import { Server } from 'http';
import { BlogServerOptions } from '../shared/types';

let serverInstance: Server | null = null;

/**
 * Start the blog server
 * @param options Server configuration options
 * @returns Promise resolving to server info
 * @throws {Error} If server fails to start
 */
export async function startBlogServer(options: BlogServerOptions = {}): Promise<{
  port: number;
  stop: () => Promise<void>;
}> {
  if (serverInstance) {
    throw new Error('Blog server is already running');
  }

  const {
    dbPath = path.join(process.cwd(), 'blog-db.json'),
    port = 3001,
    maxPort = 3100,
    silent = false
  } = options;

  // Ensure db.json exists
//   if (!fs.existsSync(dbPath)) {
//     fs.writeFileSync(dbPath, JSON.stringify({
//       posts: [],
//       images: [],
//       users: [],
//       settings: {}
//     }, null, 2));
//     if (!silent) console.log(`Created new database file at ${dbPath}`);
//   }

  const server = jsonServer.create();
  const router = jsonServer.router(dbPath);
  const middlewares = jsonServer.defaults({ noCors: false });

  // Custom middleware for validation and security
  server.use(jsonServer.bodyParser);
  server.use((req, res, next) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Add timestamps to posts and images
    if (req.method === 'POST' || req.method === 'PATCH') {
      const now = new Date().toISOString();
      if (req.method === 'POST') {
        req.body.createdAt = now;
      }
      req.body.updatedAt = now;
    }
    next();
  });

  // Rate limiting middleware
  server.use((req, res, next) => {
    // Simple rate limiting - can be enhanced with redis or other solutions
    const rateLimit = 100; // requests per minute
    // Implement your rate limiting logic here
    next();
  });

  server.use(middlewares);
  server.use(router);

  const actualPort = await findAvailablePort(port, maxPort);

  return new Promise((resolve, reject) => {
    serverInstance = server.listen(actualPort, () => {
      if (!silent) {
        console.log(`Blog API server running on port ${actualPort}`);
        console.log(`Database file: ${dbPath}`);
      }
      resolve({
        port: actualPort,
        stop: () => stopBlogServer(),
      });
    });

    serverInstance.on('error', (err) => {
      reject(new Error(`Server error: ${err.message}`));
    });
  });
}

/**
 * Stop the blog server
 * @returns Promise that resolves when server is stopped
 */
export async function stopBlogServer(): Promise<void> {
  if (!serverInstance) return;

  return new Promise((resolve, reject) => {
    serverInstance?.close((err) => {
      if (err) {
        reject(new Error(`Failed to stop server: ${err.message}`));
      } else {
        serverInstance = null;
        resolve();
      }
    });
  });
}

/**
 * Find an available port in the specified range
 * @param startPort Starting port number
 * @param maxPort Maximum port number to try
 * @returns Promise resolving to available port number
 * @throws {Error} If no available port is found
 */
async function findAvailablePort(startPort: number, maxPort: number): Promise<number> {
  const net = await import('net');

  return new Promise((resolve, reject) => {
    function testPort(port: number) {
      if (port > maxPort) {
        reject(new Error(`No available ports found between ${startPort} and ${maxPort}`));
        return;
      }

      const server = net.createServer();
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          testPort(port + 1);
        } else {
          reject(err);
        }
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port);
    }

    testPort(startPort);
  });
}
