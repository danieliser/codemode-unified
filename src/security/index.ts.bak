import { EventEmitter } from 'events';
import { ResourceMonitor } from './resource-monitor.js';
import { SecurityPolicyEngine } from './policy-engine.js';
import type {
  SecurityConfig,
  ResourceLimits,
  AuthContext,
  CapabilitySet,
  ExecutionOptions
} from '../types/core.js';

export interface SecurityValidationResult {
  allowed: boolean;
  policy: any;
  violations: any[];
  effectiveCapabilities: CapabilitySet;
}

export interface SecurityAuditLog {
  timestamp: Date;
  executionId: string;
  userId?: string;
  action: string;
  resource: string;
  result: 'allowed' | 'denied';
  policy: string;
  details: any;
}

export class SecurityManager extends EventEmitter {
  private resourceMonitor: ResourceMonitor;
  private policyEngine: SecurityPolicyEngine;
  private auditLogs: SecurityAuditLog[] = [];
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    super();
    this.config = config;

    // Initialize components
    const resourceLimits: ResourceLimits = {
      memory: 128 * 1024 * 1024, // 128MB
      timeout: 30000, // 30s
      cpuQuota: 0.5, // 50%
      maxStackSize: 1024 * 1024 // 1MB
    };

    this.resourceMonitor = new ResourceMonitor(resourceLimits);
    this.policyEngine = new SecurityPolicyEngine();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Forward resource monitor events
    this.resourceMonitor.on('violation', (violation) => {
      this.emit('resourceViolation', violation);
      this.auditAction('resource_violation', violation.executionId, 'denied', 'system', violation);
    });

    this.resourceMonitor.on('timeout', (executionId) => {
      this.emit('executionTimeout', executionId);
      this.auditAction('execution_timeout', executionId, 'denied', 'system', { reason: 'timeout' });
    });

    // Forward policy engine events
    this.policyEngine.on('violation', (violation) => {
      this.emit('securityViolation', violation);
      this.auditAction('security_violation', violation.executionId || 'unknown', 'denied', 'policy', violation);
    });

    this.policyEngine.on('criticalViolation', (violation) => {
      this.emit('criticalSecurityViolation', violation);
      this.auditAction('critical_violation', violation.executionId || 'unknown', 'denied', 'policy', violation);
    });
  }

  // Main security validation function
  validateExecution(
    code: string,
    authContext?: AuthContext,
    requestedCapabilities?: CapabilitySet,
    executionId?: string
  ): SecurityValidationResult {
    // Get effective security policy
    const effectivePolicy = this.policyEngine.getEffectivePolicy(authContext, requestedCapabilities);

    // Validate code against policy
    const codeViolations = this.policyEngine.validateCode(code, effectivePolicy);

    // Check if execution should be allowed
    const allowed = codeViolations.length === 0 ||
      codeViolations.every(v => v.severity === 'low');

    // Record violations
    for (const violation of codeViolations) {
      if (executionId) {
        violation.executionId = executionId;
      }
      if (authContext) {
        violation.userId = authContext.userId;
      }
      this.policyEngine.recordViolation(violation);
    }

    // Audit the validation
    this.auditAction(
      'code_validation',
      executionId || 'unknown',
      allowed ? 'allowed' : 'denied',
      effectivePolicy.id,
      {
        codeLength: code.length,
        violations: codeViolations.length,
        policy: effectivePolicy.name
      },
      authContext?.userId
    );

    return {
      allowed,
      policy: effectivePolicy,
      violations: codeViolations,
      effectiveCapabilities: effectivePolicy.capabilities
    };
  }

  // Start monitoring an execution
  startExecution(executionId: string, options: ExecutionOptions): void {
    this.resourceMonitor.startExecution(executionId);

    this.auditAction(
      'execution_start',
      executionId,
      'allowed',
      'system',
      {
        timeout: options.timeout,
        memoryLimit: options.memoryLimit,
        capabilities: options.capabilities
      }
    );
  }

  // Update resource usage during execution
  updateResourceUsage(executionId: string, usage: any): void {
    this.resourceMonitor.updateResourceUsage(executionId, usage);
  }

  // End execution and get metrics
  endExecution(executionId: string): any {
    const metrics = this.resourceMonitor.endExecution(executionId);

    this.auditAction(
      'execution_end',
      executionId,
      'allowed',
      'system',
      metrics
    );

    return metrics;
  }

  // Force terminate an execution
  terminateExecution(executionId: string, reason: string): boolean {
    const terminated = this.resourceMonitor.terminateExecution(executionId, reason);

    if (terminated) {
      this.auditAction(
        'execution_terminated',
        executionId,
        'denied',
        'system',
        { reason }
      );
    }

    return terminated;
  }

  // Validate network access
  validateNetworkAccess(
    host: string,
    port: number,
    capabilities?: CapabilitySet,
    executionId?: string
  ): boolean {
    const networkCaps = capabilities?.network;
    if (!networkCaps) {
      this.auditAction('network_access', executionId || 'unknown', 'denied', 'no_capabilities', { host, port });
      return false;
    }

    // Check allowed hosts
    const allowedHosts = networkCaps.allowedHosts || [];
    if (allowedHosts.length > 0 && !allowedHosts.includes('*') && !allowedHosts.includes(host)) {
      this.auditAction('network_access', executionId || 'unknown', 'denied', 'host_blocked', { host, port });
      return false;
    }

    // Check allowed ports
    const allowedPorts = networkCaps.allowedPorts || [];
    if (allowedPorts.length > 0 && !allowedPorts.includes(port)) {
      this.auditAction('network_access', executionId || 'unknown', 'denied', 'port_blocked', { host, port });
      return false;
    }

    this.auditAction('network_access', executionId || 'unknown', 'allowed', 'policy', { host, port });
    return true;
  }

  // Validate filesystem access
  validateFilesystemAccess(
    path: string,
    operation: 'read' | 'write',
    capabilities?: CapabilitySet,
    executionId?: string
  ): boolean {
    const fsCaps = capabilities?.filesystem;
    if (!fsCaps) {
      this.auditAction('filesystem_access', executionId || 'unknown', 'denied', 'no_capabilities', { path, operation });
      return false;
    }

    // Check allowed paths
    const allowedPaths = fsCaps.allowedPaths || [];
    if (allowedPaths.length > 0 && !allowedPaths.some(allowedPath => path.startsWith(allowedPath))) {
      this.auditAction('filesystem_access', executionId || 'unknown', 'denied', 'path_blocked', { path, operation });
      return false;
    }

    // Check read-only restriction
    if (operation === 'write' && fsCaps.readOnly) {
      this.auditAction('filesystem_access', executionId || 'unknown', 'denied', 'readonly_violation', { path, operation });
      return false;
    }

    // Check file extension
    const allowedExtensions = fsCaps.allowedExtensions || [];
    if (allowedExtensions.length > 0 && !allowedExtensions.includes('*')) {
      const extension = path.split('.').pop();
      if (extension && !allowedExtensions.includes(`.${extension}`)) {
        this.auditAction('filesystem_access', executionId || 'unknown', 'denied', 'extension_blocked', { path, operation });
        return false;
      }
    }

    this.auditAction('filesystem_access', executionId || 'unknown', 'allowed', 'policy', { path, operation });
    return true;
  }

  // Validate MCP tool access
  validateMCPAccess(
    serverName: string,
    toolName: string,
    capabilities?: CapabilitySet,
    executionId?: string
  ): boolean {
    const mcpCaps = capabilities?.mcp;
    if (!mcpCaps) {
      this.auditAction('mcp_access', executionId || 'unknown', 'denied', 'no_capabilities', { serverName, toolName });
      return false;
    }

    // Check allowed servers
    const allowedServers = mcpCaps.allowedServers || [];
    if (allowedServers.length > 0 && !allowedServers.includes('*') && !allowedServers.includes(serverName)) {
      this.auditAction('mcp_access', executionId || 'unknown', 'denied', 'server_blocked', { serverName, toolName });
      return false;
    }

    // Check allowed tools
    const allowedTools = mcpCaps.allowedTools || [];
    const fullToolName = `${serverName}.${toolName}`;
    if (allowedTools.length > 0 && !allowedTools.includes('*') && !allowedTools.includes(fullToolName)) {
      this.auditAction('mcp_access', executionId || 'unknown', 'denied', 'tool_blocked', { serverName, toolName });
      return false;
    }

    this.auditAction('mcp_access', executionId || 'unknown', 'allowed', 'policy', { serverName, toolName });
    return true;
  }

  private auditAction(
    action: string,
    executionId: string,
    result: 'allowed' | 'denied',
    policy: string,
    details: any,
    userId?: string
  ): void {
    if (this.config.audit.enabled && this.config.audit.logLevel !== 'none') {
      const auditLog: SecurityAuditLog = {
        timestamp: new Date(),
        executionId,
        userId,
        action,
        resource: details?.resource || 'code',
        result,
        policy,
        details
      };

      this.auditLogs.push(auditLog);

      // Keep only recent audit logs (configurable retention)
      const retentionMs = this.config.audit.retention * 24 * 60 * 60 * 1000; // Convert days to ms
      const cutoff = new Date(Date.now() - retentionMs);
      this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoff);

      this.emit('auditLog', auditLog);
    }
  }

  // Get security health status
  getSecurityHealth(): {
    resourceHealth: any;
    policyMetrics: any;
    auditSummary: any;
    activeExecutions: number;
    recentViolations: number;
  } {
    const resourceHealth = this.resourceMonitor.getSystemHealth();
    const policyMetrics = this.policyEngine.getSecurityMetrics();

    const now = Date.now();
    const recentAuditLogs = this.auditLogs.filter(
      log => now - log.timestamp.getTime() < 3600000 // Last hour
    );

    const deniedActions = recentAuditLogs.filter(log => log.result === 'denied').length;

    return {
      resourceHealth,
      policyMetrics,
      auditSummary: {
        totalAuditLogs: this.auditLogs.length,
        recentLogs: recentAuditLogs.length,
        recentDenials: deniedActions
      },
      activeExecutions: resourceHealth.activeExecutions,
      recentViolations: resourceHealth.recentViolations + policyMetrics.recentViolations
    };
  }

  // Get audit logs
  getAuditLogs(limit?: number, filter?: { action?: string; result?: string; userId?: string }): SecurityAuditLog[] {
    let filtered = this.auditLogs;

    if (filter) {
      if (filter.action) {
        filtered = filtered.filter(log => log.action === filter.action);
      }
      if (filter.result) {
        filtered = filtered.filter(log => log.result === filter.result);
      }
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Update security configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  async shutdown(): Promise<void> {
    this.resourceMonitor.shutdown();
    this.policyEngine.shutdown();
    this.auditLogs.length = 0;
    this.removeAllListeners();
  }
}

// Factory function
export function createSecurityManager(config: SecurityConfig): SecurityManager {
  return new SecurityManager(config);
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  auth: {
    provider: 'jwt',
    issuer: 'code-mode-unified',
    audience: 'code-execution',
    secretKey: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expirationTime: 3600 // 1 hour
  },
  capabilities: {
    network: {
      allowedHosts: [],
      allowedPorts: [],
      maxRequestsPerSecond: 0,
      maxRequestSize: 0
    },
    filesystem: {
      allowedPaths: [],
      readOnly: true,
      maxFileSize: 0,
      allowedExtensions: []
    },
    mcp: {
      allowedServers: [],
      allowedTools: [],
      maxCallsPerSecond: 0,
      maxConcurrentCalls: 0
    },
    system: {
      allowEnvironmentAccess: false,
      allowProcessSpawn: false,
      maxProcesses: 0
    }
  },
  audit: {
    enabled: true,
    logLevel: 'all',
    storage: 'file',
    retention: 30 // 30 days
  }
};

export { ResourceMonitor } from './resource-monitor.js';
export { SecurityPolicyEngine } from './policy-engine.js';
export type { SecurityPolicy, CodeRestrictions, SecurityViolation } from './policy-engine.js';
export type { ResourceUsage, ResourceViolation } from './resource-monitor.js';