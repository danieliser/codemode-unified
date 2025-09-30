/**
 * Auto-generated TypeScript declarations for MCP tools
 * Generated: 2025-09-30T10:43:39.406Z
 *
 * This file provides type-safe access to all MCP server tools
 * available in the codemode-unified execution environment.
 *
 * @packageDocumentation
 */

/** Result type for MCP tool calls */
interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/** Generated from automem.store_memory schema */

export interface AutomemStoreMemoryArgs {
  /**
   * The memory content to store
   */
  content: string;
  /**
   * Optional tags to categorize the memory
   */
  tags?: string[];
  /**
   * Optional importance score between 0 and 1
   */
  importance?: number;
  /**
   * Optional embedding vector for semantic search
   */
  embedding?: number[];
  /**
   * Optional metadata payload (entities, source, etc.)
   */
  metadata?: {
    [k: string]: unknown;
  };
  /**
   * Optional ISO timestamp indicating when this memory was created
   */
  timestamp?: string;
  [k: string]: unknown;
}

/** Generated from automem.recall_memory schema */

export interface AutomemRecallMemoryArgs {
  /**
   * Text query to search for in memory content
   */
  query?: string;
  /**
   * Embedding vector for semantic similarity search
   */
  embedding?: number[];
  /**
   * Maximum number of memories to return
   */
  limit?: number;
  /**
   * Natural language time window (e.g. "today", "last week", "last 7 days")
   */
  time_query?: string;
  /**
   * Explicit ISO timestamp lower bound
   */
  start?: string;
  /**
   * Explicit ISO timestamp upper bound
   */
  end?: string;
  /**
   * Return memories containing any of these tags
   */
  tags?: string[];
  [k: string]: unknown;
}

/** Generated from automem.associate_memories schema */

export interface AutomemAssociateMemoriesArgs {
  /**
   * ID of the first memory
   */
  memory1_id: string;
  /**
   * ID of the second memory
   */
  memory2_id: string;
  /**
   * Type of relationship between the memories
   */
  type: 'RELATES_TO' | 'LEADS_TO' | 'OCCURRED_BEFORE';
  /**
   * Strength of the association between 0 and 1
   */
  strength: number;
  [k: string]: unknown;
}

/** Generated from automem.update_memory schema */

export interface AutomemUpdateMemoryArgs {
  /**
   * ID of the memory to update
   */
  memory_id: string;
  content?: string;
  tags?: string[];
  importance?: number;
  metadata?: {
    [k: string]: unknown;
  };
  timestamp?: string;
  updated_at?: string;
  last_accessed?: string;
  type?: string;
  confidence?: number;
  [k: string]: unknown;
}

/** Generated from automem.delete_memory schema */

export interface AutomemDeleteMemoryArgs {
  /**
   * ID of the memory to delete
   */
  memory_id: string;
  [k: string]: unknown;
}

/** Generated from automem.search_memory_by_tag schema */

export interface AutomemSearchMemoryByTagArgs {
  /**
   * Tags to match (any of them qualifies)
   */
  tags: string[];
  /**
   * Maximum number of memories to return
   */
  limit?: number;
  [k: string]: unknown;
}

/** Generated from automem.check_database_health schema */

export interface AutomemCheckDatabaseHealthArgs {
  [k: string]: unknown;
}

/** Generated from sequential-thinking.sequentialthinking schema */

export interface SequentialThinkingSequentialthinkingArgs {
  /**
   * Your current thinking step
   */
  thought: string;
  /**
   * Whether another thought step is needed
   */
  nextThoughtNeeded: boolean;
  /**
   * Current thought number
   */
  thoughtNumber: number;
  /**
   * Estimated total thoughts needed
   */
  totalThoughts: number;
  /**
   * Whether this revises previous thinking
   */
  isRevision?: boolean;
  /**
   * Which thought is being reconsidered
   */
  revisesThought?: number;
  /**
   * Branching point thought number
   */
  branchFromThought?: number;
  /**
   * Branch identifier
   */
  branchId?: string;
  /**
   * If more thoughts are needed
   */
  needsMoreThoughts?: boolean;
  [k: string]: unknown;
}

/** Generated from context7.resolve-library-id schema */

export interface Context7ResolveLibraryIdArgs {
  /**
   * Library name to search for and retrieve a Context7-compatible library ID.
   */
  libraryName: string;
}

/** Generated from context7.get-library-docs schema */

export interface Context7GetLibraryDocsArgs {
  /**
   * Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js', '/supabase/supabase', '/vercel/next.js/v14.3.0-canary.87') retrieved from 'resolve-library-id' or directly from user query in the format '/org/project' or '/org/project/version'.
   */
  context7CompatibleLibraryID: string;
  /**
   * Topic to focus documentation on (e.g., 'hooks', 'routing').
   */
  topic?: string;
  /**
   * Maximum number of tokens of documentation to retrieve (default: 5000). Higher values provide more context but consume more tokens.
   */
  tokens?: number;
}

/** Generated from claude-code.Task schema */

export interface ClaudeCodeTaskArgs {
  /**
   * A short (3-5 word) description of the task
   */
  description: string;
  /**
   * The task for the agent to perform
   */
  prompt: string;
  /**
   * The type of specialized agent to use for this task
   */
  subagent_type: string;
}

/** Generated from claude-code.Bash schema */

export interface ClaudeCodeBashArgs {
  /**
   * The command to execute
   */
  command: string;
  /**
   * Optional timeout in milliseconds (max 300000)
   */
  timeout?: number;
  /**
   * Clear, concise description of what this command does in 5-10 words, in active voice. Examples:
   * Input: ls
   * Output: List files in current directory
   *
   * Input: git status
   * Output: Show working tree status
   *
   * Input: npm install
   * Output: Install package dependencies
   *
   * Input: mkdir foo
   * Output: Create directory 'foo'
   */
  description?: string;
  /**
   * Set to true to run this command in the background. Use BashOutput to read the output later.
   */
  run_in_background?: boolean;
}

/** Generated from claude-code.Glob schema */

export interface ClaudeCodeGlobArgs {
  /**
   * The glob pattern to match files against
   */
  pattern: string;
  /**
   * The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.
   */
  path?: string;
}

/** Generated from claude-code.Grep schema */

export interface ClaudeCodeGrepArgs {
  /**
   * The regular expression pattern to search for in file contents
   */
  pattern: string;
  /**
   * File or directory to search in (rg PATH). Defaults to current working directory.
   */
  path?: string;
  /**
   * Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob
   */
  glob?: string;
  /**
   * Output mode: "content" shows matching lines (supports -A/-B/-C context, -n line numbers, head_limit), "files_with_matches" shows file paths (supports head_limit), "count" shows match counts (supports head_limit). Defaults to "files_with_matches".
   */
  output_mode?: 'content' | 'files_with_matches' | 'count';
  /**
   * Number of lines to show before each match (rg -B). Requires output_mode: "content", ignored otherwise.
   */
  '-B'?: number;
  /**
   * Number of lines to show after each match (rg -A). Requires output_mode: "content", ignored otherwise.
   */
  '-A'?: number;
  /**
   * Number of lines to show before and after each match (rg -C). Requires output_mode: "content", ignored otherwise.
   */
  '-C'?: number;
  /**
   * Show line numbers in output (rg -n). Requires output_mode: "content", ignored otherwise.
   */
  '-n'?: boolean;
  /**
   * Case insensitive search (rg -i)
   */
  '-i'?: boolean;
  /**
   * File type to search (rg --type). Common types: js, py, rust, go, java, etc. More efficient than include for standard file types.
   */
  type?: string;
  /**
   * Limit output to first N lines/entries, equivalent to "| head -N". Works across all output modes: content (limits output lines), files_with_matches (limits file paths), count (limits count entries). When unspecified, shows all results from ripgrep.
   */
  head_limit?: number;
  /**
   * Enable multiline mode where . matches newlines and patterns can span lines (rg -U --multiline-dotall). Default: false.
   */
  multiline?: boolean;
}

/** Generated from claude-code.ExitPlanMode schema */

export interface ClaudeCodeExitPlanModeArgs {
  /**
   * The plan you came up with, that you want to run by the user for approval. Supports markdown. The plan should be pretty concise.
   */
  plan: string;
}

/** Generated from claude-code.Read schema */

export interface ClaudeCodeReadArgs {
  /**
   * The absolute path to the file to read
   */
  file_path: string;
  /**
   * The line number to start reading from. Only provide if the file is too large to read at once
   */
  offset?: number;
  /**
   * The number of lines to read. Only provide if the file is too large to read at once.
   */
  limit?: number;
}

/** Generated from claude-code.Edit schema */

export interface ClaudeCodeEditArgs {
  /**
   * The absolute path to the file to modify
   */
  file_path: string;
  /**
   * The text to replace
   */
  old_string: string;
  /**
   * The text to replace it with (must be different from old_string)
   */
  new_string: string;
  /**
   * Replace all occurences of old_string (default false)
   */
  replace_all?: boolean;
}

/** Generated from claude-code.Write schema */

export interface ClaudeCodeWriteArgs {
  /**
   * The absolute path to the file to write (must be absolute, not relative)
   */
  file_path: string;
  /**
   * The content to write to the file
   */
  content: string;
}

/** Generated from claude-code.NotebookEdit schema */

export interface ClaudeCodeNotebookEditArgs {
  /**
   * The absolute path to the Jupyter notebook file to edit (must be absolute, not relative)
   */
  notebook_path: string;
  /**
   * The ID of the cell to edit. When inserting a new cell, the new cell will be inserted after the cell with this ID, or at the beginning if not specified.
   */
  cell_id?: string;
  /**
   * The new source for the cell
   */
  new_source: string;
  /**
   * The type of the cell (code or markdown). If not specified, it defaults to the current cell type. If using edit_mode=insert, this is required.
   */
  cell_type?: 'code' | 'markdown';
  /**
   * The type of edit to make (replace, insert, delete). Defaults to replace.
   */
  edit_mode?: 'replace' | 'insert' | 'delete';
}

/** Generated from claude-code.WebFetch schema */

export interface ClaudeCodeWebFetchArgs {
  /**
   * The URL to fetch content from
   */
  url: string;
  /**
   * The prompt to run on the fetched content
   */
  prompt: string;
}

/** Generated from claude-code.TodoWrite schema */

export interface ClaudeCodeTodoWriteArgs {
  /**
   * The updated todo list
   */
  todos: {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
  }[];
}

/** Generated from claude-code.WebSearch schema */

export interface ClaudeCodeWebSearchArgs {
  /**
   * The search query to use
   */
  query: string;
  /**
   * Only include search results from these domains
   */
  allowed_domains?: string[];
  /**
   * Never include search results from these domains
   */
  blocked_domains?: string[];
}

/** Generated from claude-code.BashOutput schema */

export interface ClaudeCodeBashOutputArgs {
  /**
   * The ID of the background shell to retrieve output from
   */
  bash_id: string;
  /**
   * Optional regular expression to filter the output lines. Only lines matching this regex will be included in the result. Any lines that do not match will no longer be available to read.
   */
  filter?: string;
}

/** Generated from claude-code.KillShell schema */

export interface ClaudeCodeKillShellArgs {
  /**
   * The ID of the background shell to kill
   */
  shell_id: string;
}

/** Generated from claude-code.SlashCommand schema */

export interface ClaudeCodeSlashCommandArgs {
  /**
   * The slash command to execute with its arguments, e.g., "/review-pr 123"
   */
  command: string;
}

declare global {
  const mcp: {
    automem: {
      /**
       * Store a memory with optional tags, importance score, metadata, timestamps, and embedding vector
       */
      store_memory(args: AutomemStoreMemoryArgs): Promise<MCPToolResult>;
      /**
       * Recall memories with hybrid semantic/keyword search and optional time/tag filters
       */
      recall_memory(args: AutomemRecallMemoryArgs): Promise<MCPToolResult>;
      /**
       * Create an association between two memories with a relationship type and strength
       */
      associate_memories(args: AutomemAssociateMemoriesArgs): Promise<MCPToolResult>;
      /**
       * Update an existing memory (content, tags, metadata, timestamps, importance)
       */
      update_memory(args: AutomemUpdateMemoryArgs): Promise<MCPToolResult>;
      /**
       * Delete a memory and its embedding
       */
      delete_memory(args: AutomemDeleteMemoryArgs): Promise<MCPToolResult>;
      /**
       * Retrieve memories that contain specific tags
       */
      search_memory_by_tag(args: AutomemSearchMemoryByTagArgs): Promise<MCPToolResult>;
      /**
       * Check the health status of the AutoMem service and its connected databases
       */
      check_database_health(args: AutomemCheckDatabaseHealthArgs): Promise<MCPToolResult>;
    };
    "sequential-thinking": {
      /**
       * A detailed tool for dynamic and reflective problem-solving through thoughts.
       */
      sequentialthinking(args: SequentialThinkingSequentialthinkingArgs): Promise<MCPToolResult>;
    };
    context7: {
      /**
       * Resolves a package/product name to a Context7-compatible library ID and returns a list of matching libraries.
       */
      "resolve-library-id"(args: Context7ResolveLibraryIdArgs): Promise<MCPToolResult>;
      /**
       * Fetches up-to-date documentation for a library.
       */
      "get-library-docs"(args: Context7GetLibraryDocsArgs): Promise<MCPToolResult>;
    };
    "claude-code": {
      /**
       * Launch a new agent to handle complex, multi-step tasks autonomously.
       */
      Task(args: ClaudeCodeTaskArgs): Promise<MCPToolResult>;
      /**
       * Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.
       */
      Bash(args: ClaudeCodeBashArgs): Promise<MCPToolResult>;
      /**
       * - Fast file pattern matching tool that works with any codebase size
       */
      Glob(args: ClaudeCodeGlobArgs): Promise<MCPToolResult>;
      /**
       * A powerful search tool built on ripgrep
       */
      Grep(args: ClaudeCodeGrepArgs): Promise<MCPToolResult>;
      /**
       * Use this tool when you are in plan mode and have finished presenting your plan and are ready to code. This will prompt the user to exit plan mode.
       */
      ExitPlanMode(args: ClaudeCodeExitPlanModeArgs): Promise<MCPToolResult>;
      /**
       * Reads a file from the local filesystem. You can access any file directly by using this tool.
       */
      Read(args: ClaudeCodeReadArgs): Promise<MCPToolResult>;
      /**
       * Performs exact string replacements in files.
       */
      Edit(args: ClaudeCodeEditArgs): Promise<MCPToolResult>;
      /**
       * Writes a file to the local filesystem.
       */
      Write(args: ClaudeCodeWriteArgs): Promise<MCPToolResult>;
      /**
       * Completely replaces the contents of a specific cell in a Jupyter notebook (.
       */
      NotebookEdit(args: ClaudeCodeNotebookEditArgs): Promise<MCPToolResult>;
      /**
       * 
       */
      WebFetch(args: ClaudeCodeWebFetchArgs): Promise<MCPToolResult>;
      /**
       * Use this tool to create and manage a structured task list for your current coding session. This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.
       */
      TodoWrite(args: ClaudeCodeTodoWriteArgs): Promise<MCPToolResult>;
      /**
       * 
       */
      WebSearch(args: ClaudeCodeWebSearchArgs): Promise<MCPToolResult>;
      /**
       * 
       */
      BashOutput(args: ClaudeCodeBashOutputArgs): Promise<MCPToolResult>;
      /**
       * 
       */
      KillShell(args: ClaudeCodeKillShellArgs): Promise<MCPToolResult>;
      /**
       * Execute a slash command within the main conversation
       */
      SlashCommand(args: ClaudeCodeSlashCommandArgs): Promise<MCPToolResult>;
    };
  };
}

export {};
