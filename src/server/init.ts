import { getApiClient } from "../shared/api/client";
import { BlogPackageOptions } from "../shared/types";
import { startBlogServer } from "./server";

let isInitialized = false;
let serverInfo: { port: number; stop: () => Promise<void> } | null = null;

/**
 * Initialize the blog package with optional server configuration
 * @param options Configuration options for the package
 * @throws {Error} If server fails to start
 */
export async function initializeBlogPackage(options: BlogPackageOptions = {}) {
  if (isInitialized) {
    if (!options.silent) {
      console.warn('Blog package is already initialized');
    }
    return;
  }

  const {
    autoStartServer = true,
    dbPath,
    port = 3001,
    maxPort = 3100,
    silent = false
  } = options;

  if (autoStartServer) {
    try {
      serverInfo = await startBlogServer({ dbPath, port, maxPort, silent });
      getApiClient(serverInfo.port);
      isInitialized = true;

      // Clean up handlers
      const cleanup = async () => {
        if (serverInfo) {
          await serverInfo.stop();
        }
      };

      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('uncaughtException', cleanup);

      if (!silent) {
        console.log(`Blog package initialized successfully on port ${serverInfo.port}`);
      }
    } catch (error) {
      if (!silent) {
        console.error('Failed to initialize blog package:', error);
      }
      throw new Error('Failed to initialize blog package');
    }
  } else {
    isInitialized = true;
    if (!silent) {
      console.log('Blog package initialized without server (manual API client configuration required)');
    }
  }
}

/**
 * Stop the blog server if running
 */
export async function stopBlogServer(): Promise<void> {
  if (serverInfo) {
    await serverInfo.stop();
    serverInfo = null;
    isInitialized = false;
  }
}
