# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Checksum-based validation for MCP tool type declarations
  - FNV-1a hash calculation of tool signatures (namespace + input schema)
  - Automatic detection of tool list changes on server initialization
  - Checksum persistence to `generated/mcp.d.ts.checksum`
  - Auto-regeneration of TypeScript declarations when tools change
  - Skip regeneration when tools unchanged (faster startup)
- Configurable type declaration distribution
  - Optional `copyToPath` configuration for CodeGenService
  - Environment variable `CODEMODE_TYPE_COPY_PATH` (comma-separated paths)
  - Supports copying generated types to multiple destinations
  - Ensures type definitions available across project structure
- Enhanced MCP configuration logging
  - Debug output for server discovery and configuration
  - Tool discovery progress indicators
  - Connection status and tool count reporting

### Changed
- Updated `@modelcontextprotocol/sdk` from 0.4.0 to 1.18.2
  - Fixed protocol version compatibility issues
  - Updated Server constructor for new API
  - Enabled connection to MCP servers using 2025-06-18 protocol
- Improved `execute_code` tool description
  - Added **IMPORTANT** directive for agents
  - Explicit instruction to read `mcp://types/declarations` resource
  - Ensures type-safe code generation with current tool definitions

### Fixed
- MCP type declarations now automatically regenerate when new servers connect
- Protocol version compatibility with newer MCP servers (2025-06-18 protocol)
- TypeScript declarations stay synchronized with available MCP tools across all connected servers

## [0.1.0] - 2025-10-02

### Added
- Initial release with MCP integration
- Multi-runtime code execution (QuickJS, Bun, Deno, isolated-vm, E2B)
- TypeScript declaration generation from MCP tool schemas
- MCP Resources and Prompts support
- Two-pass execution for async MCP tool calls in sync runtimes

[Unreleased]: https://github.com/danieliser/codemode-unified/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/danieliser/codemode-unified/releases/tag/v0.1.0
