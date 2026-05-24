import Conf from 'conf';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config();

const DEFAULT_BACKEND_URL = 'https://elite-cron-backend.elitedev.space/api/v1';

interface MochiConfig {
  apiKey?: string;
  apiUrl?: string;
}

const configStore = new Conf<MochiConfig>({
  projectName: 'mochi-mcp-kit',
  defaults: {
    apiUrl: DEFAULT_BACKEND_URL,
  },
});

/**
 * Resolves the API key by checking environment variables, the Conf store, 
 * and backward-compatible locations (~/.mochirc and ~/.config/mochi/config.json).
 */
export function getApiKey(): string | undefined {
  // 1. Check environment variables
  if (process.env.MOCHI_API_KEY) {
    return process.env.MOCHI_API_KEY;
  }

  // 2. Check the typed Conf store
  const storedKey = configStore.get('apiKey');
  if (storedKey) {
    return storedKey;
  }

  // 3. Fallback to ~/.mochirc
  try {
    const mochircPath = path.join(os.homedir(), '.mochirc');
    if (fs.existsSync(mochircPath)) {
      const config = JSON.parse(fs.readFileSync(mochircPath, 'utf8'));
      if (config.apiKey) return config.apiKey;
    }
  } catch (e) {}

  // 4. Fallback to ~/.config/mochi/config.json
  try {
    const configPath = path.join(os.homedir(), '.config', 'mochi', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.apiKey) return config.apiKey;
    }
  } catch (e) {}

  return undefined;
}

/**
 * Resolves the API URL by checking env variables, Conf store, or using the default fallback.
 */
export function getApiUrl(): string {
  if (process.env.MOCHI_API_URL) {
    return process.env.MOCHI_API_URL;
  }
  if (process.env.MOCHI_BACKEND_URL) {
    return process.env.MOCHI_BACKEND_URL;
  }

  const storedUrl = configStore.get('apiUrl');
  if (storedUrl) {
    return storedUrl;
  }

  return DEFAULT_BACKEND_URL;
}

/**
 * Saves the API key to the secure conf storage and maintains ~/.mochirc synchronization.
 */
export function setApiKey(key: string): void {
  configStore.set('apiKey', key);

  // Synchronize with ~/.mochirc for backward compatibility with older tools
  try {
    const mochircPath = path.join(os.homedir(), '.mochirc');
    let existing: Record<string, any> = {};
    if (fs.existsSync(mochircPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(mochircPath, 'utf8'));
      } catch (e) {}
    }
    existing.apiKey = key;
    fs.writeFileSync(mochircPath, JSON.stringify(existing, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Saves a custom API URL.
 */
export function setApiUrl(url: string): void {
  configStore.set('apiUrl', url);
}

/**
 * Gets the raw configuration file path.
 */
export function getConfigPath(): string {
  return configStore.path;
}
