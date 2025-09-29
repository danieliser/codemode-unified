import { EventEmitter } from 'events';
import type {
  CapabilitySet,
  NetworkCapabilities,
  FilesystemCapabilities,
  MCPCapabilities,
  SystemCapabilities,
  AuthContext
} from '../types/core.js';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  capabilities: CapabilitySet;
  codeRestrictions: CodeRestrictions;
  auditLevel: 'none' | 'basic' | 'detailed';
  priority: number; // Higher priority policies override lower ones
}

export interface CodeRestrictions {
  allowedImports: string[];
  blockedImports: string[];
  allowedGlobals: string[];
  blockedGlobals: string[];
  allowEval: boolean;
  allowFunction: boolean;
  allowAsync: boolean;
  maxCodeLength: number;
  blockedPatterns: RegExp[];
}

export interface SecurityViolation {
  type: 'capability' | 'code' | 'resource' | 'authentication';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  executionId?: string;
  userId?: string;
}

export class SecurityPolicyEngine extends EventEmitter {
  private policies: Map<string, SecurityPolicy> = new Map();
  private violations: SecurityViolation[] = [];
  private defaultPolicy: SecurityPolicy;

  constructor() {
    super();
    this.defaultPolicy = this.createDefaultPolicy();
    this.registerDefaultPolicies();
  }

  private createDefaultPolicy(): SecurityPolicy {
    return {
      id: 'default',
      name: 'Default Security Policy',
      description: 'Restrictive default policy for untrusted code',
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
      codeRestrictions: {
        allowedImports: [],
        blockedImports: ['fs', 'child_process', 'cluster', 'crypto', 'os', 'path', 'net', 'http', 'https'],
        allowedGlobals: ['console', 'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean'],
        blockedGlobals: ['process', 'global', 'require', '__dirname', '__filename', 'Buffer'],
        allowEval: false,
        allowFunction: false,
        allowAsync: true,
        maxCodeLength: 10000,
        blockedPatterns: [
          /eval\s*\(/i,
          /Function\s*\(/i,
          /setTimeout\s*\(/i,
          /setInterval\s*\(/i,
          /process\./i,
          /require\s*\(/i,
          /import\s*\(/i
        ]
      },
      auditLevel: 'detailed',
      priority: 0
    };
  }

  private registerDefaultPolicies(): void {
    // Trusted user policy
    this.registerPolicy({
      id: 'trusted',
      name: 'Trusted User Policy',
      description: 'Extended capabilities for trusted users',
      capabilities: {
        network: {
          allowedHosts: ['api.github.com', 'httpbin.org'],
          allowedPorts: [80, 443],
          maxRequestsPerSecond: 10,
          maxRequestSize: 1024 * 1024 // 1MB
        },
        filesystem: {
          allowedPaths: ['/tmp', '/var/tmp'],
          readOnly: false,
          maxFileSize: 1024 * 1024, // 1MB
          allowedExtensions: ['.txt', '.json', '.csv']
        },
        mcp: {
          allowedServers: ['filesystem', 'helpscout'],
          allowedTools: [],
          maxCallsPerSecond: 5,
          maxConcurrentCalls: 3
        },
        system: {
          allowEnvironmentAccess: false,
          allowProcessSpawn: false,
          maxProcesses: 0
        }
      },
      codeRestrictions: {
        allowedImports: ['date-fns', 'lodash'],
        blockedImports: ['fs', 'child_process', 'cluster'],
        allowedGlobals: ['console', 'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'fetch'],
        blockedGlobals: ['process', 'global', 'require'],
        allowEval: false,
        allowFunction: false,
        allowAsync: true,
        maxCodeLength: 50000,
        blockedPatterns: [
          /eval\s*\(/i,
          /Function\s*\(/i,
          /process\./i
        ]
      },
      auditLevel: 'basic',
      priority: 10
    });

    // Development policy
    this.registerPolicy({
      id: 'development',
      name: 'Development Policy',
      description: 'Relaxed policy for development and testing',
      capabilities: {
        network: {
          allowedHosts: ['*'],
          allowedPorts: [80, 443, 3000, 8000, 8080],
          maxRequestsPerSecond: 20,
          maxRequestSize: 5 * 1024 * 1024 // 5MB
        },
        filesystem: {
          allowedPaths: ['/tmp', '/var/tmp', process.cwd()],
          readOnly: false,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedExtensions: ['*']
        },
        mcp: {
          allowedServers: ['*'],
          allowedTools: ['*'],
          maxCallsPerSecond: 20,
          maxConcurrentCalls: 10
        },
        system: {
          allowEnvironmentAccess: true,
          allowProcessSpawn: false,
          maxProcesses: 0
        }
      },
      codeRestrictions: {
        allowedImports: ['*'],
        blockedImports: ['child_process', 'cluster'],
        allowedGlobals: ['*'],
        blockedGlobals: ['process.exit'],
        allowEval: false,
        allowFunction: false,
        allowAsync: true,
        maxCodeLength: 100000,
        blockedPatterns: [
          /process\.exit/i,
          /require\s*\(\s*['"]child_process['"]\s*\)/i
        ]
      },
      auditLevel: 'basic',
      priority: 5
    });
  }

  registerPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
    this.emit('policyRegistered', policy);
  }

  getPolicy(policyId: string): SecurityPolicy | null {
    return this.policies.get(policyId) || null;
  }

  // Determine the effective policy for a user/context
  getEffectivePolicy(authContext?: AuthContext, requestedCapabilities?: CapabilitySet): SecurityPolicy {
    let effectivePolicy = { ...this.defaultPolicy };

    // Apply policies in priority order
    const sortedPolicies = Array.from(this.policies.values())
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      if (this.policyApplies(policy, authContext)) {
        effectivePolicy = this.mergeCapabilities(effectivePolicy, policy);
      }
    }

    // Further restrict based on requested capabilities
    if (requestedCapabilities) {
      effectivePolicy = this.intersectCapabilities(effectivePolicy, requestedCapabilities);
    }

    return effectivePolicy;
  }

  private policyApplies(policy: SecurityPolicy, authContext?: AuthContext): boolean {
    if (!authContext) {
      return policy.id === 'default';
    }

    // Simple policy matching based on scopes
    // In a real implementation, this would be more sophisticated
    const scopes = authContext.scopes || [];

    if (scopes.includes('admin')) {
      return true;
    }

    if (scopes.includes('trusted') && ['trusted', 'default'].includes(policy.id)) {
      return true;
    }

    if (scopes.includes('developer') && policy.id === 'development') {
      return true;
    }

    return policy.id === 'default';
  }

  private mergeCapabilities(base: SecurityPolicy, override: SecurityPolicy): SecurityPolicy {
    return {
      ...base,
      capabilities: {
        network: this.mergeNetworkCapabilities(base.capabilities.network, override.capabilities.network),
        filesystem: this.mergeFilesystemCapabilities(base.capabilities.filesystem, override.capabilities.filesystem),
        mcp: this.mergeMCPCapabilities(base.capabilities.mcp, override.capabilities.mcp),
        system: this.mergeSystemCapabilities(base.capabilities.system, override.capabilities.system)
      },
      codeRestrictions: this.mergeCodeRestrictions(base.codeRestrictions, override.codeRestrictions),
      auditLevel: override.auditLevel
    };
  }

  private mergeNetworkCapabilities(base?: NetworkCapabilities, override?: NetworkCapabilities): NetworkCapabilities {
    if (!base && !override) return {};
    if (!base) return override!;
    if (!override) return base;

    return {
      allowedHosts: this.mergeStringArrays(base.allowedHosts, override.allowedHosts),
      allowedPorts: this.mergeNumberArrays(base.allowedPorts, override.allowedPorts),
      maxRequestsPerSecond: Math.max(base.maxRequestsPerSecond || 0, override.maxRequestsPerSecond || 0),
      maxRequestSize: Math.max(base.maxRequestSize || 0, override.maxRequestSize || 0)
    };
  }

  private mergeFilesystemCapabilities(base?: FilesystemCapabilities, override?: FilesystemCapabilities): FilesystemCapabilities {
    if (!base && !override) return {};
    if (!base) return override!;
    if (!override) return base;

    return {
      allowedPaths: this.mergeStringArrays(base.allowedPaths, override.allowedPaths),
      readOnly: base.readOnly && override.readOnly, // More restrictive
      maxFileSize: Math.max(base.maxFileSize || 0, override.maxFileSize || 0),
      allowedExtensions: this.mergeStringArrays(base.allowedExtensions, override.allowedExtensions)
    };
  }

  private mergeMCPCapabilities(base?: MCPCapabilities, override?: MCPCapabilities): MCPCapabilities {
    if (!base && !override) return {};
    if (!base) return override!;
    if (!override) return base;

    return {
      allowedServers: this.mergeStringArrays(base.allowedServers, override.allowedServers),
      allowedTools: this.mergeStringArrays(base.allowedTools, override.allowedTools),
      maxCallsPerSecond: Math.max(base.maxCallsPerSecond || 0, override.maxCallsPerSecond || 0),
      maxConcurrentCalls: Math.max(base.maxConcurrentCalls || 0, override.maxConcurrentCalls || 0)
    };
  }

  private mergeSystemCapabilities(base?: SystemCapabilities, override?: SystemCapabilities): SystemCapabilities {
    if (!base && !override) return {};
    if (!base) return override!;
    if (!override) return base;

    return {
      allowEnvironmentAccess: base.allowEnvironmentAccess || override.allowEnvironmentAccess,
      allowProcessSpawn: base.allowProcessSpawn || override.allowProcessSpawn,
      maxProcesses: Math.max(base.maxProcesses || 0, override.maxProcesses || 0)
    };
  }

  private mergeCodeRestrictions(base: CodeRestrictions, override: CodeRestrictions): CodeRestrictions {
    return {
      allowedImports: this.mergeStringArrays(base.allowedImports, override.allowedImports),
      blockedImports: this.mergeStringArrays(base.blockedImports, override.blockedImports),
      allowedGlobals: this.mergeStringArrays(base.allowedGlobals, override.allowedGlobals),
      blockedGlobals: this.mergeStringArrays(base.blockedGlobals, override.blockedGlobals),
      allowEval: base.allowEval || override.allowEval,
      allowFunction: base.allowFunction || override.allowFunction,
      allowAsync: base.allowAsync || override.allowAsync,
      maxCodeLength: Math.max(base.maxCodeLength, override.maxCodeLength),
      blockedPatterns: [...base.blockedPatterns, ...override.blockedPatterns]
    };
  }

  private mergeStringArrays(base?: string[], override?: string[]): string[] {
    const baseArray = base || [];
    const overrideArray = override || [];

    // Handle wildcard
    if (overrideArray.includes('*')) return ['*'];
    if (baseArray.includes('*')) return ['*'];

    return [...new Set([...baseArray, ...overrideArray])];
  }

  private mergeNumberArrays(base?: number[], override?: number[]): number[] {
    const baseArray = base || [];
    const overrideArray = override || [];
    return [...new Set([...baseArray, ...overrideArray])];
  }

  private intersectCapabilities(policy: SecurityPolicy, requested: CapabilitySet): SecurityPolicy {
    // Restrict policy to only what was requested
    const intersected = { ...policy };

    if (requested.network) {
      intersected.capabilities.network = this.intersectNetworkCapabilities(
        policy.capabilities.network,
        requested.network
      );
    }

    if (requested.filesystem) {
      intersected.capabilities.filesystem = this.intersectFilesystemCapabilities(
        policy.capabilities.filesystem,
        requested.filesystem
      );
    }

    if (requested.mcp) {
      intersected.capabilities.mcp = this.intersectMCPCapabilities(
        policy.capabilities.mcp,
        requested.mcp
      );
    }

    if (requested.system) {
      intersected.capabilities.system = this.intersectSystemCapabilities(
        policy.capabilities.system,
        requested.system
      );
    }

    return intersected;
  }

  private intersectNetworkCapabilities(policy?: NetworkCapabilities, requested?: NetworkCapabilities): NetworkCapabilities {
    if (!policy || !requested) return {};

    return {
      allowedHosts: this.intersectStringArrays(policy.allowedHosts, requested.allowedHosts),
      allowedPorts: this.intersectNumberArrays(policy.allowedPorts, requested.allowedPorts),
      maxRequestsPerSecond: Math.min(policy.maxRequestsPerSecond || 0, requested.maxRequestsPerSecond || 0),
      maxRequestSize: Math.min(policy.maxRequestSize || 0, requested.maxRequestSize || 0)
    };
  }

  private intersectFilesystemCapabilities(policy?: FilesystemCapabilities, requested?: FilesystemCapabilities): FilesystemCapabilities {
    if (!policy || !requested) return {};

    return {
      allowedPaths: this.intersectStringArrays(policy.allowedPaths, requested.allowedPaths),
      readOnly: policy.readOnly || requested.readOnly, // More restrictive
      maxFileSize: Math.min(policy.maxFileSize || 0, requested.maxFileSize || 0),
      allowedExtensions: this.intersectStringArrays(policy.allowedExtensions, requested.allowedExtensions)
    };
  }

  private intersectMCPCapabilities(policy?: MCPCapabilities, requested?: MCPCapabilities): MCPCapabilities {
    if (!policy || !requested) return {};

    return {
      allowedServers: this.intersectStringArrays(policy.allowedServers, requested.allowedServers),
      allowedTools: this.intersectStringArrays(policy.allowedTools, requested.allowedTools),
      maxCallsPerSecond: Math.min(policy.maxCallsPerSecond || 0, requested.maxCallsPerSecond || 0),
      maxConcurrentCalls: Math.min(policy.maxConcurrentCalls || 0, requested.maxConcurrentCalls || 0)
    };
  }

  private intersectSystemCapabilities(policy?: SystemCapabilities, requested?: SystemCapabilities): SystemCapabilities {
    if (!policy || !requested) return {};

    return {
      allowEnvironmentAccess: policy.allowEnvironmentAccess && requested.allowEnvironmentAccess,
      allowProcessSpawn: policy.allowProcessSpawn && requested.allowProcessSpawn,
      maxProcesses: Math.min(policy.maxProcesses || 0, requested.maxProcesses || 0)
    };
  }

  private intersectStringArrays(policy?: string[], requested?: string[]): string[] {
    if (!policy || !requested) return [];

    // Handle wildcards
    if (policy.includes('*')) return requested;
    if (requested.includes('*')) return policy;

    return policy.filter(item => requested.includes(item));
  }

  private intersectNumberArrays(policy?: number[], requested?: number[]): number[] {
    if (!policy || !requested) return [];

    return policy.filter(item => requested.includes(item));
  }

  // Validate code against security policy
  validateCode(code: string, policy: SecurityPolicy): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check code length
    if (code.length > policy.codeRestrictions.maxCodeLength) {
      violations.push({
        type: 'code',
        severity: 'medium',
        message: `Code length ${code.length} exceeds maximum ${policy.codeRestrictions.maxCodeLength}`,
        details: { codeLength: code.length, maxLength: policy.codeRestrictions.maxCodeLength },
        timestamp: new Date()
      });
    }

    // Check blocked patterns
    for (const pattern of policy.codeRestrictions.blockedPatterns) {
      if (pattern.test(code)) {
        violations.push({
          type: 'code',
          severity: 'high',
          message: `Code contains blocked pattern: ${pattern.source}`,
          details: { pattern: pattern.source },
          timestamp: new Date()
        });
      }
    }

    // Check blocked imports
    for (const blockedImport of policy.codeRestrictions.blockedImports) {
      const importRegex = new RegExp(`import.*['"]${blockedImport}['"]|require\\(['"]${blockedImport}['"]\\)`, 'i');
      if (importRegex.test(code)) {
        violations.push({
          type: 'code',
          severity: 'high',
          message: `Code attempts to import blocked module: ${blockedImport}`,
          details: { module: blockedImport },
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  // Record a security violation
  recordViolation(violation: SecurityViolation): void {
    this.violations.push(violation);

    // Keep only last 10000 violations
    if (this.violations.length > 10000) {
      this.violations = this.violations.slice(-10000);
    }

    this.emit('violation', violation);

    // Emit critical violations immediately
    if (violation.severity === 'critical') {
      this.emit('criticalViolation', violation);
    }
  }

  getViolations(limit?: number, severity?: string): SecurityViolation[] {
    let filtered = this.violations;

    if (severity) {
      filtered = filtered.filter(v => v.severity === severity);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get security metrics
  getSecurityMetrics(): {
    totalPolicies: number;
    totalViolations: number;
    recentViolations: number;
    violationsBySeverity: Record<string, number>;
    violationsByType: Record<string, number>;
  } {
    const now = Date.now();
    const recentViolations = this.violations.filter(
      v => now - v.timestamp.getTime() < 3600000 // Last hour
    );

    const violationsBySeverity = this.violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const violationsByType = this.violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPolicies: this.policies.size,
      totalViolations: this.violations.length,
      recentViolations: recentViolations.length,
      violationsBySeverity,
      violationsByType
    };
  }

  shutdown(): void {
    this.removeAllListeners();
    this.violations.length = 0;
    this.policies.clear();
  }
}