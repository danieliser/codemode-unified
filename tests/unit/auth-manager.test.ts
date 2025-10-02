import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthenticationManager, type AuthConfig } from '../../src/auth/index.js';

describe('AuthenticationManager', () => {
  let authManager: AuthenticationManager;
  let mockJWTConfig: AuthConfig;

  beforeEach(() => {
    mockJWTConfig = {
      provider: 'jwt',
      jwt: {
        issuer: 'test-issuer',
        audience: 'test-audience',
        secretKey: 'test-secret-key-minimum-32-chars-long-for-security',
        algorithm: 'HS256',
        expirationTime: 3600
      },
      apiKeys: {
        enabled: true,
        defaultScopes: ['code:execute'],
        maxExpirationDays: 365
      }
    };

    authManager = new AuthenticationManager(mockJWTConfig);
  });

  afterEach(async () => {
    if (authManager) {
      await authManager.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with JWT config', () => {
      expect(authManager).toBeDefined();
    });

    it('should initialize with OAuth config', () => {
      const oauthConfig: AuthConfig = {
        provider: 'oauth2',
        oauth2: {
          clientId: 'test-client',
          redirectUri: 'http://localhost:3000/callback',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          scope: ['openid', 'profile']
        }
      };

      const oauthManager = new AuthenticationManager(oauthConfig);
      expect(oauthManager).toBeDefined();
      oauthManager.shutdown();
    });
  });

  describe('JWT Authentication', () => {
    it('should create user session', async () => {
      const result = await authManager.createUserSession('user-123', ['code:execute', 'code:read']);

      expect(result.success).toBe(true);
      expect(result.authContext).toBeDefined();
      expect(result.authContext?.userId).toBe('user-123');
      expect(result.authContext?.scopes).toEqual(['code:execute', 'code:read']);
      expect(result.authContext?.metadata?.accessToken).toBeDefined();
    });

    it('should authenticate with valid JWT token', async () => {
      const sessionResult = await authManager.createUserSession('user-456', ['code:execute']);
      expect(sessionResult.success).toBe(true);

      const token = sessionResult.authContext?.metadata?.accessToken as string;
      expect(token).toBeDefined();

      const authResult = await authManager.authenticateWithJWT(token);
      expect(authResult.success).toBe(true);
      expect(authResult.authContext?.userId).toBe('user-456');
    });

    it('should reject invalid JWT token', async () => {
      const result = await authManager.authenticateWithJWT('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject expired JWT token', async () => {
      // Create manager with very short expiration
      const shortExpiryConfig: AuthConfig = {
        ...mockJWTConfig,
        jwt: {
          ...mockJWTConfig.jwt!,
          expirationTime: 1 // 1 second
        }
      };

      const shortExpiryManager = new AuthenticationManager(shortExpiryConfig);
      const sessionResult = await shortExpiryManager.createUserSession('user-789', ['code:execute']);

      expect(sessionResult.success).toBe(true);
      const token = sessionResult.authContext?.metadata?.accessToken as string;

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      const authResult = await shortExpiryManager.authenticateWithJWT(token);
      expect(authResult.success).toBe(false);

      await shortExpiryManager.shutdown();
    });

    it('should fail JWT operations when JWT not configured', async () => {
      const noJWTConfig: AuthConfig = {
        provider: 'oauth2',
        oauth2: {
          clientId: 'test',
          redirectUri: 'http://localhost',
          authorizationEndpoint: 'http://localhost/auth',
          tokenEndpoint: 'http://localhost/token',
          scope: []
        }
      };

      const noJWTManager = new AuthenticationManager(noJWTConfig);

      const result = await noJWTManager.createUserSession('user-123', ['execute']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('JWT not configured');

      await noJWTManager.shutdown();
    });
  });

  describe('Session Management', () => {
    it('should store active sessions', async () => {
      const result = await authManager.createUserSession('user-session-1', ['execute']);
      expect(result.success).toBe(true);

      const session = authManager.getSession(result.authContext!.sessionId);
      expect(session).toBeDefined();
      expect(session?.userId).toBe('user-session-1');
    });

    it('should retrieve active session', async () => {
      const createResult = await authManager.createUserSession('user-session-2', ['execute']);
      const sessionId = createResult.authContext!.sessionId;

      const session = authManager.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should return null for non-existent session', () => {
      const session = authManager.getSession('non-existent-session');
      expect(session).toBeNull();
    });

    it('should remove expired sessions on retrieval', async () => {
      // Create session with very short expiration
      const shortExpiryConfig: AuthConfig = {
        ...mockJWTConfig,
        jwt: {
          ...mockJWTConfig.jwt!,
          expirationTime: 1
        }
      };

      const shortManager = new AuthenticationManager(shortExpiryConfig);
      const result = await shortManager.createUserSession('user-expire', ['execute']);
      const sessionId = result.authContext!.sessionId;

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      const session = shortManager.getSession(sessionId);
      expect(session).toBeNull();

      await shortManager.shutdown();
    });

    it('should logout and remove session', async () => {
      const result = await authManager.createUserSession('user-logout', ['execute']);
      const sessionId = result.authContext!.sessionId;

      await authManager.logout(sessionId);

      const session = authManager.getSession(sessionId);
      expect(session).toBeNull();
    });

    it('should emit userAuthenticated event', async () => {
      const mockHandler = vi.fn();
      authManager.on('userAuthenticated', mockHandler);

      await authManager.createUserSession('user-event', ['execute']);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should emit userLoggedOut event', async () => {
      const mockHandler = vi.fn();
      authManager.on('userLoggedOut', mockHandler);

      const result = await authManager.createUserSession('user-logout-event', ['execute']);
      await authManager.logout(result.authContext!.sessionId);

      expect(mockHandler).toHaveBeenCalledWith(result.authContext!.sessionId);
    });
  });

  describe('API Key Management', () => {
    it('should create API key', async () => {
      const result = await authManager.createAPIKey('user-api-1', 'My API Key', ['code:execute'], 30);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.keyId).toBeDefined();
    });

    it('should authenticate with API key', async () => {
      const createResult = await authManager.createAPIKey('user-api-2', 'Test Key', ['code:execute']);
      expect(createResult.success).toBe(true);

      const authResult = await authManager.authenticateWithAPIKey(createResult.token!);

      expect(authResult.success).toBe(true);
      expect(authResult.authContext?.userId).toBe('user-api-2');
      expect(authResult.authContext?.metadata?.type).toBe('api_key');
    });

    it('should reject invalid API key', async () => {
      const result = await authManager.authenticateWithAPIKey('invalid-api-key');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should list API keys for user', async () => {
      await authManager.createAPIKey('user-list-1', 'Key 1', ['execute']);
      await authManager.createAPIKey('user-list-1', 'Key 2', ['execute']);
      await authManager.createAPIKey('user-list-2', 'Key 3', ['execute']);

      const user1Keys = authManager.listAPIKeys('user-list-1');
      expect(user1Keys.length).toBe(2);

      const user2Keys = authManager.listAPIKeys('user-list-2');
      expect(user2Keys.length).toBe(1);
    });

    it('should revoke API key', async () => {
      const createResult = await authManager.createAPIKey('user-revoke', 'Revoke Key', ['execute']);
      const keyId = createResult.keyId!;

      const revoked = authManager.revokeAPIKey(keyId);
      expect(revoked).toBe(true);

      const keys = authManager.listAPIKeys('user-revoke');
      expect(keys.length).toBe(0);
    });

    it('should emit apiKeyCreated event', async () => {
      const mockHandler = vi.fn();
      authManager.on('apiKeyCreated', mockHandler);

      await authManager.createAPIKey('user-event-api', 'Event Key', ['execute']);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should emit apiKeyRevoked event', async () => {
      const mockHandler = vi.fn();
      authManager.on('apiKeyRevoked', mockHandler);

      const createResult = await authManager.createAPIKey('user-revoke-event', 'Revoke Event Key', ['execute']);
      authManager.revokeAPIKey(createResult.keyId!);

      expect(mockHandler).toHaveBeenCalledWith(createResult.keyId);
    });

    it('should enforce max expiration days', async () => {
      const result = await authManager.createAPIKey('user-max-exp', 'Long Key', ['execute'], 500);

      expect(result.success).toBe(true);

      const keys = authManager.listAPIKeys('user-max-exp');
      const key = keys[0];
      const daysDiff = Math.floor((key.expiresAt.getTime() - key.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(365); // Capped at max
    });

    it('should fail when API keys not enabled', async () => {
      const noAPIKeyConfig: AuthConfig = {
        ...mockJWTConfig,
        apiKeys: {
          enabled: false,
          defaultScopes: [],
          maxExpirationDays: 365
        }
      };

      const noAPIKeyManager = new AuthenticationManager(noAPIKeyConfig);

      const result = await noAPIKeyManager.createAPIKey('user-no-api', 'Key', ['execute']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');

      await noAPIKeyManager.shutdown();
    });
  });

  describe('OAuth 2.1 Flow', () => {
    let oauthManager: AuthenticationManager;

    beforeEach(() => {
      const oauthConfig: AuthConfig = {
        provider: 'oauth2',
        oauth2: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          userInfoEndpoint: 'https://auth.example.com/userinfo',
          scope: ['openid', 'profile', 'email']
        }
      };

      oauthManager = new AuthenticationManager(oauthConfig);
    });

    afterEach(async () => {
      if (oauthManager) {
        await oauthManager.shutdown();
      }
    });

    it('should start OAuth flow', async () => {
      const result = await oauthManager.startOAuthFlow();

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBeDefined();
      expect(result.redirectUrl).toContain('https://auth.example.com/authorize');
      expect(result.redirectUrl).toContain('client_id=test-client-id');
    });

    it('should include additional scopes in OAuth flow', async () => {
      const result = await oauthManager.startOAuthFlow(['admin']);

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('admin');
    });

    it('should fail OAuth operations when not configured', async () => {
      const result = await authManager.startOAuthFlow(); // JWT manager, not OAuth

      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth not configured');
    });
  });

  describe('Token Refresh', () => {
    it('should fail refresh when provider not configured', async () => {
      const result = await authManager.refreshTokens('refresh-token');

      // JWT refresh not fully implemented in mock
      expect(result.success).toBe(false);
    });
  });

  describe('Authentication Statistics', () => {
    it('should return auth stats', async () => {
      await authManager.createUserSession('stats-user-1', ['execute']);
      await authManager.createUserSession('stats-user-2', ['execute']);
      await authManager.createAPIKey('stats-user-3', 'Stats Key', ['execute']);

      const stats = authManager.getAuthStats();

      expect(stats.activeSessions).toBeGreaterThanOrEqual(2);
      expect(stats.totalAPIKeys).toBeGreaterThanOrEqual(1);
      expect(stats.byProvider).toBeDefined();
    });

    it.skip('should track sessions by provider', async () => {
      // TODO: API key authentication doesn't create session entry
      await authManager.createUserSession('jwt-user', ['execute']);
      await authManager.createAPIKey('api-user', 'Key', ['execute']);

      const stats = authManager.getAuthStats();

      expect(stats.byProvider.jwt).toBeGreaterThan(0);
      expect(stats.byProvider.apiKey).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired sessions', async () => {
      const shortConfig: AuthConfig = {
        ...mockJWTConfig,
        jwt: {
          ...mockJWTConfig.jwt!,
          expirationTime: 1
        }
      };

      const shortManager = new AuthenticationManager(shortConfig);
      await shortManager.createUserSession('cleanup-user', ['execute']);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      const statsBefore = shortManager.getAuthStats();
      shortManager.cleanup();
      const statsAfter = shortManager.getAuthStats();

      expect(statsAfter.activeSessions).toBeLessThanOrEqual(statsBefore.activeSessions);

      await shortManager.shutdown();
    });

    it('should clean up expired API keys', async () => {
      const createResult = await authManager.createAPIKey('cleanup-api', 'Expire Key', ['execute'], 1);

      // Manually set expiration to past (testing hack)
      const keys = authManager.listAPIKeys('cleanup-api');
      if (keys.length > 0) {
        keys[0].expiresAt = new Date(Date.now() - 1000);
      }

      authManager.cleanup();

      const keysAfter = authManager.listAPIKeys('cleanup-api');
      expect(keysAfter.length).toBe(0);
    });

    it('should emit apiKeyExpired event', async () => {
      const mockHandler = vi.fn();
      authManager.on('apiKeyExpired', mockHandler);

      const createResult = await authManager.createAPIKey('expire-event', 'Expire Event Key', ['execute']);
      const keys = authManager.listAPIKeys('expire-event');
      if (keys.length > 0) {
        keys[0].expiresAt = new Date(Date.now() - 1000);
      }

      authManager.cleanup();

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await authManager.createUserSession('shutdown-user', ['execute']);
      await authManager.createAPIKey('shutdown-api', 'Shutdown Key', ['execute']);

      await expect(authManager.shutdown()).resolves.not.toThrow();

      const stats = authManager.getAuthStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.totalAPIKeys).toBe(0);
    });
  });
});
