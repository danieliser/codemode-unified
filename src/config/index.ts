import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { config as loadEnv } from 'dotenv';
import { ConfigSchema, type Config } from './schema.js';

// Load environment variables
loadEnv();

export class ConfigManager {
  private config: Config | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || process.env.CONFIG_PATH || './config.yaml';
  }

  async load(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    let fileConfig = {};

    // Try to load config file
    try {
      const configData = await readFile(this.configPath, 'utf-8');
      if (this.configPath.endsWith('.json')) {
        fileConfig = JSON.parse(configData);
      } else {
        fileConfig = parseYaml(configData);
      }
    } catch (error: unknown) {
      console.warn(`Config file not found at ${this.configPath}, using defaults`);
    }

    // Merge with environment variables
    const envConfig = this.loadFromEnvironment();
    const mergedConfig = this.mergeConfig(fileConfig, envConfig);

    // Validate and parse with Zod
    const result = ConfigSchema.safeParse(mergedConfig);

    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.config = result.data;
    return this.config;
  }

  private loadFromEnvironment(): Partial<Config> {
    const env = process.env;

    return {
      server: {
        port: env.PORT ? parseInt(env.PORT) : undefined,
        host: env.HOST,
        cors: {
          enabled: env.CORS_ENABLED ? env.CORS_ENABLED === 'true' : undefined,
          origins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : undefined
        }
      },
      security: {
        auth: {
          provider: env.AUTH_PROVIDER as any,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          secretKey: env.JWT_SECRET,
          privateKey: env.JWT_PRIVATE_KEY,
          publicKey: env.JWT_PUBLIC_KEY,
          algorithm: env.JWT_ALGORITHM as any,
          expirationTime: env.JWT_EXPIRATION ? parseInt(env.JWT_EXPIRATION) : undefined
        }
      },
      sandbox: {
        limits: {
          memory: env.SANDBOX_MEMORY ? parseInt(env.SANDBOX_MEMORY) : undefined,
          timeout: env.SANDBOX_TIMEOUT ? parseInt(env.SANDBOX_TIMEOUT) : undefined,
          cpuQuota: env.SANDBOX_CPU_QUOTA ? parseFloat(env.SANDBOX_CPU_QUOTA) : undefined
        }
      },
      logging: {
        level: env.LOG_LEVEL as any,
        format: env.LOG_FORMAT as any
      }
    } as Partial<Config>;
  }

  private mergeConfig(fileConfig: any, envConfig: any): any {
    // Deep merge function - only merge non-undefined values
    const merge = (target: any, source: any): any => {
      for (const key in source) {
        if (source[key] !== undefined && source[key] !== null) {
          if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = target[key] || {};
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
      return target;
    };

    return merge({ ...fileConfig }, envConfig);
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  reload(): void {
    this.config = null;
  }
}

// Create default config manager instance
export const configManager = new ConfigManager();

// Helper function to get config
export async function getConfig(): Promise<Config> {
  return configManager.load();
}

// Default configuration
export const defaultConfig: Config = ConfigSchema.parse({});

export { ConfigSchema, type Config } from './schema.js';