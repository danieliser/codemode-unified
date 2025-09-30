import type { ToolInfo, ToolRegistry } from '../types/core.js';
import type { JSONSchema7 } from 'json-schema';

export interface APIDefinition {
  namespace: string;
  methods: APIMethod[];
  typeDefinitions: string;
  implementation: string;
}

export interface APIMethod {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  returnType: string;
  async: boolean;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  optional: boolean;
  description?: string | undefined;
}

export class APIGenerator {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  generateUnifiedAPI(): string {
    const namespaces = this.groupToolsByNamespace();
    const apiDefinitions = new Map<string, APIDefinition>();

    // Generate API definitions for each namespace
    for (const [namespace, tools] of namespaces) {
      const definition = this.generateNamespaceAPI(namespace, tools);
      apiDefinitions.set(namespace, definition);
    }

    // Generate the unified API interface
    return this.generateUnifiedInterface(apiDefinitions);
  }

  private groupToolsByNamespace(): Map<string, ToolInfo[]> {
    const namespaces = new Map<string, ToolInfo[]>();

    for (const tool of this.registry.tools.values()) {
      const [namespace] = tool.namespace.split('.', 1);

      if (!namespaces.has(namespace)) {
        namespaces.set(namespace, []);
      }

      namespaces.get(namespace)!.push(tool);
    }

    return namespaces;
  }

  private generateNamespaceAPI(namespace: string, tools: ToolInfo[]): APIDefinition {
    const methods: APIMethod[] = [];
    const typeDefinitions: string[] = [];

    for (const tool of tools) {
      const method = this.generateMethodFromTool(tool);
      methods.push(method);

      // Generate TypeScript types from JSON Schema
      const types = this.generateTypesFromSchema(tool.name, tool.inputSchema, tool.outputSchema);
      if (types) {
        typeDefinitions.push(types);
      }
    }

    const implementation = this.generateImplementation(namespace, methods);

    return {
      namespace,
      methods,
      typeDefinitions: typeDefinitions.join('\n\n'),
      implementation
    };
  }

  private generateMethodFromTool(tool: ToolInfo): APIMethod {
    const parameters = this.extractParameters(tool.inputSchema);
    const returnType = this.extractReturnType(tool.outputSchema);

    return {
      name: this.camelCase(tool.name),
      description: tool.description,
      parameters,
      returnType,
      async: true // All MCP calls are async
    };
  }

  private extractParameters(schema: JSONSchema7): ParameterDefinition[] {
    if (!schema || schema.type !== 'object' || !schema.properties) {
      return [];
    }

    const required = schema.required || [];
    const parameters: ParameterDefinition[] = [];

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (typeof propSchema === 'boolean') continue;

      const type = this.jsonSchemaToTypeScript(propSchema);
      const optional = !required.includes(propName);

      parameters.push({
        name: this.camelCase(propName),
        type,
        optional,
        description: propSchema.description
      });
    }

    return parameters;
  }

  private extractReturnType(schema?: JSONSchema7): string {
    if (!schema) {
      return 'unknown';
    }

    return this.jsonSchemaToTypeScript(schema);
  }

  private jsonSchemaToTypeScript(schema: JSONSchema7): string {
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return schema.enum.map(e => `'${e}'`).join(' | ');
        }
        return 'string';

      case 'number':
      case 'integer':
        return 'number';

      case 'boolean':
        return 'boolean';

      case 'array':
        if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
          const itemType = this.jsonSchemaToTypeScript(schema.items);
          return `${itemType}[]`;
        }
        return 'unknown[]';

      case 'object':
        if (schema.properties) {
          const props: string[] = [];
          const required = schema.required || [];

          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            if (typeof propSchema === 'boolean') continue;

            const propType = this.jsonSchemaToTypeScript(propSchema);
            const optional = !required.includes(propName);
            const description = propSchema.description ? `/** ${propSchema.description} */\n  ` : '';

            props.push(`${description}${propName}${optional ? '?' : ''}: ${propType}`);
          }

          return `{\n  ${props.join(';\n  ')}\n}`;
        }
        return 'Record<string, unknown>';

      default:
        return 'unknown';
    }
  }

  private generateTypesFromSchema(
    toolName: string,
    inputSchema: JSONSchema7,
    outputSchema?: JSONSchema7
  ): string {
    const types: string[] = [];

    // Generate input type
    if (inputSchema && inputSchema.type === 'object') {
      const inputType = this.jsonSchemaToTypeScript(inputSchema);
      const typeName = `${this.pascalCase(toolName)}Input`;
      types.push(`export interface ${typeName} ${inputType}`);
    }

    // Generate output type
    if (outputSchema) {
      const outputType = this.jsonSchemaToTypeScript(outputSchema);
      const typeName = `${this.pascalCase(toolName)}Output`;
      types.push(`export interface ${typeName} ${outputType}`);
    }

    return types.join('\n\n');
  }

  private generateImplementation(namespace: string, methods: APIMethod[]): string {
    const methodImpls = methods.map(method => {
      const params = method.parameters.map(p =>
        `${p.name}${p.optional ? '?' : ''}: ${p.type}`
      ).join(', ');

      const paramObject = method.parameters.length > 0
        ? `{ ${method.parameters.map(p => p.name).join(', ')} }`
        : '{}';

      return `
  /**
   * ${method.description}
   */
  async ${method.name}(${params}): Promise<${method.returnType}> {
    return await this.callTool('${namespace}.${method.name}', ${paramObject});
  }`;
    }).join('\n');

    return `
export class ${this.pascalCase(namespace)}API {
  constructor(private callTool: (namespace: string, args: any) => Promise<any>) {}
${methodImpls}
}`;
  }

  private generateUnifiedInterface(apiDefinitions: Map<string, APIDefinition>): string {
    const imports: string[] = [];
    const properties: string[] = [];
    const implementations: string[] = [];
    const allTypes: string[] = [];

    for (const [namespace, definition] of apiDefinitions) {
      const className = `${this.pascalCase(namespace)}API`;

      // Collect types
      if (definition.typeDefinitions) {
        allTypes.push(`// ${namespace} types\n${definition.typeDefinitions}`);
      }

      // Collect implementations
      implementations.push(definition.implementation);

      // Add to unified interface
      properties.push(`  readonly ${namespace}: ${className};`);
    }

    const unifiedInterface = `
// Type definitions
${allTypes.join('\n\n')}

// API implementations
${implementations.join('\n\n')}

// Unified MCP API interface
export interface UnifiedMCPAPI {
${properties.join('\n')}
}

// Factory function to create unified API
export function createUnifiedAPI(callTool: (namespace: string, args: any) => Promise<any>): UnifiedMCPAPI {
  return {
${Array.from(apiDefinitions.entries()).map(([namespace, def]) =>
    `    ${namespace}: new ${this.pascalCase(namespace)}API(callTool)`
  ).join(',\n')}
  };
}

// Export for use in sandbox context
export const mcpAPI = {
  createUnified: createUnifiedAPI
};
`;

    return unifiedInterface;
  }

  private camelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
              .replace(/^./, char => char.toLowerCase());
  }

  private pascalCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
              .replace(/^./, char => char.toUpperCase());
  }

  // Generate runtime API that can be injected into sandbox
  generateRuntimeAPI(): string {
    return `
// Runtime MCP API for sandbox injection
class MCPRuntime {
  constructor(aggregator) {
    this.aggregator = aggregator;
  }

  async callTool(namespace, args) {
    try {
      const result = await this.aggregator.callTool(namespace, args);
      return result;
    } catch (error) {
      throw new Error('MCP call failed: ' + (error && error.message ? error.message : String(error)));
    }
  }

  listTools() {
    return this.aggregator.getAvailableTools();
  }

  getServerStatus() {
    return this.aggregator.getServerStatus();
  }
}

// Global MCP API object for sandbox
globalThis.mcp = new Proxy({}, {
  get(target, namespace) {
    if (typeof namespace !== 'string') return undefined;

    return new Proxy({}, {
      get(target, toolName) {
        if (typeof toolName !== 'string') return undefined;

        return async (...args) => {
          const fullNamespace = \`\${namespace}.\${toolName}\`;
          const callId = Date.now() + '_' + Math.random().toString(36).substring(2, 9);
          const placeholder = \`"__MCP_RESULT_\${callId}__"\`;

          // Log the MCP call for tracking
          console.log('MCP_CALL_TRACKING: ' + JSON.stringify({
            id: callId,
            namespace: fullNamespace,
            args: args[0] || {}
          }));

          // Return placeholder string for sync/async bridging
          return placeholder;
        };
      }
    });
  }
});
`;
  }
}