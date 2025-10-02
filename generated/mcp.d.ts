/**
 * Auto-generated TypeScript declarations for MCP tools
 * Generated: 2025-10-02T10:01:10.492Z
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
  /**
   * How to combine multiple tags: any (default) or all
   */
  tag_mode?: 'any' | 'all';
  /**
   * How to match tags: exact (default) or prefix
   */
  tag_match?: 'exact' | 'prefix';
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
  type:
    | 'RELATES_TO'
    | 'LEADS_TO'
    | 'OCCURRED_BEFORE'
    | 'PREFERS_OVER'
    | 'EXEMPLIFIES'
    | 'CONTRADICTS'
    | 'REINFORCES'
    | 'INVALIDATED_BY'
    | 'EVOLVED_INTO'
    | 'DERIVED_FROM'
    | 'PART_OF';
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

/** Generated from automem.check_database_health schema */

export interface AutomemCheckDatabaseHealthArgs {
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

/** Generated from fluentBoards.fluentboards-create-board schema */

export interface FluentBoardsFluentboardsCreateBoardArgs {
  /**
   * Board title (required)
   */
  title: string;
  /**
   * Board description
   */
  description?: string;
  /**
   * Board type
   */
  type?: 'to-do' | 'roadmap';
  /**
   * Board background configuration
   */
  background?: {
    /**
     * Background preset ID
     */
    id?:
      | 'solid_1'
      | 'solid_2'
      | 'solid_3'
      | 'solid_4'
      | 'solid_5'
      | 'gradient_1'
      | 'gradient_2'
      | 'gradient_3'
      | 'gradient_4';
    /**
     * Background color as hex code (e.g., #4A9B7F)
     */
    color?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-list-boards schema */

export interface FluentBoardsFluentboardsListBoardsArgs {
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of boards per page
   */
  per_page?: number;
  /**
   * Search boards by title
   */
  search?: string;
  /**
   * Filter boards by type
   */
  type?: 'to-do' | 'roadmap';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-board schema */

export interface FluentBoardsFluentboardsGetBoardArgs {
  /**
   * Board ID to retrieve
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-board schema */

export interface FluentBoardsFluentboardsUpdateBoardArgs {
  /**
   * Board ID to update (required)
   */
  board_id: number;
  /**
   * New board title
   */
  title?: string;
  /**
   * New board description
   */
  description?: string;
  /**
   * New board type
   */
  type?: 'to-do' | 'roadmap';
  /**
   * Currency code for budget tracking (e.g., USD, EUR, GBP)
   */
  currency?: string;
  /**
   * Board background configuration
   */
  background?: {
    /**
     * Background preset ID from available solid colors or gradients
     */
    id?:
      | 'solid_1'
      | 'solid_2'
      | 'solid_3'
      | 'solid_4'
      | 'solid_5'
      | 'solid_6'
      | 'solid_7'
      | 'solid_8'
      | 'solid_9'
      | 'solid_10'
      | 'solid_11'
      | 'solid_12'
      | 'solid_13'
      | 'solid_14'
      | 'solid_15'
      | 'solid_16'
      | 'solid_17'
      | 'solid_18'
      | 'solid_19'
      | 'solid_20'
      | 'solid_21'
      | 'solid_22'
      | 'solid_23'
      | 'gradient_1'
      | 'gradient_2'
      | 'gradient_3'
      | 'gradient_4'
      | 'gradient_5'
      | 'gradient_6';
    /**
     * Background color as hex code (e.g., #4A9B7F) or CSS gradient
     */
    color?: string;
    /**
     * Whether background is an image or solid color
     */
    is_image?: boolean;
    /**
     * Background image URL (if is_image is true)
     */
    image_url?: string;
    [k: string]: unknown;
  };
  /**
   * Board configuration settings
   */
  settings?: {
    /**
     * Send email notifications when tasks change stages
     */
    enable_stage_change_email?: boolean;
    [k: string]: unknown;
  };
  /**
   * Associated WordPress page ID for roadmap display
   */
  page_id?: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-board schema */

export interface FluentBoardsFluentboardsDeleteBoardArgs {
  /**
   * Board ID to delete
   */
  board_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-duplicate-board schema */

export interface FluentBoardsFluentboardsDuplicateBoardArgs {
  /**
   * Board ID to duplicate
   */
  board_id: number;
  /**
   * Title for the duplicated board (optional - will use "Copy of {original title}" if not provided)
   */
  new_title?: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-archive-board schema */

export interface FluentBoardsFluentboardsArchiveBoardArgs {
  /**
   * Board ID to archive
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-restore-board schema */

export interface FluentBoardsFluentboardsRestoreBoardArgs {
  /**
   * Board ID to restore
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-pin-board schema */

export interface FluentBoardsFluentboardsPinBoardArgs {
  /**
   * Board ID to pin
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-unpin-board schema */

export interface FluentBoardsFluentboardsUnpinBoardArgs {
  /**
   * Board ID to unpin
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-board-permissions schema */

export interface FluentBoardsFluentboardsUpdateBoardPermissionsArgs {
  /**
   * Board ID to update permissions for
   */
  board_id: number;
  /**
   * WordPress user ID to update permissions for
   */
  user_id: number;
  /**
   * Array of permission strings: ["create_tasks", "edit_tasks", "delete_tasks"]
   */
  permissions: string[];
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-board-users schema */

export interface FluentBoardsFluentboardsGetBoardUsersArgs {
  /**
   * Board ID to retrieve users from
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-add-board-member schema */

export interface FluentBoardsFluentboardsAddBoardMemberArgs {
  /**
   * Board ID to add member to
   */
  board_id: number;
  /**
   * WordPress user ID to add as member
   */
  user_id: number;
  /**
   * Member role: "member" (default), "manager" (board admin), "viewer" (read-only, Pro required)
   */
  role?: 'member' | 'admin' | 'viewer';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-remove-board-member schema */

export interface FluentBoardsFluentboardsRemoveBoardMemberArgs {
  /**
   * Board ID to remove member from
   */
  board_id: number;
  /**
   * WordPress user ID to remove from board
   */
  user_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-member-role schema */

export interface FluentBoardsFluentboardsUpdateMemberRoleArgs {
  /**
   * Board ID where member belongs
   */
  board_id: number;
  /**
   * WordPress user ID to update
   */
  user_id: number;
  /**
   * New role: "member", "manager" (board admin), "viewer" (read-only, Pro required)
   */
  role: 'member' | 'admin' | 'viewer';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-bulk-add-members schema */

export interface FluentBoardsFluentboardsBulkAddMembersArgs {
  /**
   * Array of operations: [{"board_id": 1, "user_id": 2, "role": "member"}, ...]
   */
  operations: {
    board_id: number;
    user_id: number;
    role?: 'member' | 'admin' | 'viewer';
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-create-task schema */

export interface FluentBoardsFluentboardsCreateTaskArgs {
  /**
   * Board ID where the task will be created
   */
  board_id: number;
  /**
   * Task title (required)
   */
  title: string;
  /**
   * Stage ID where the task should be placed
   */
  stage_id: number;
  /**
   * Task description (supports HTML and markdown)
   */
  description?: string;
  /**
   * Task priority level
   */
  priority?: 'low' | 'medium' | 'high';
  /**
   * Due date and time (Y-m-d H:i:s format)
   */
  due_at?: string;
  /**
   * Start date and time (Y-m-d H:i:s format)
   */
  started_at?: string;
  /**
   * Reminder date and time (Y-m-d H:i:s format)
   */
  remind_at?: string;
  /**
   * Type of reminder notification
   */
  reminder_type?: 'email' | 'dashboard' | 'both';
  /**
   * Lead/budget value for the task
   */
  lead_value?: number;
  /**
   * FluentCRM contact ID to associate with task
   */
  crm_contact_id?: number;
  /**
   * Type of task item
   */
  type?: 'task' | 'milestone' | 'roadmap';
  /**
   * Task status
   */
  status?: 'open' | 'closed';
  /**
   * Task scope or category
   */
  scope?: string;
  /**
   * Source where task originated from
   */
  source?: string;
  /**
   * Whether this task is a template
   */
  is_template?: 'yes' | 'no';
  /**
   * Array of user IDs to assign to the task
   */
  assignees?: number[];
  /**
   * Array of label IDs to apply to the task
   */
  labels?: number[];
  /**
   * Task-specific settings and configuration
   */
  settings?: {
    /**
     * Task cover image settings
     */
    cover?: {
      imageId?: number;
      backgroundImage?: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-list-tasks schema */

export interface FluentBoardsFluentboardsListTasksArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Filter tasks by stage ID
   */
  stage_id?: number;
  /**
   * Search tasks by title or description
   */
  search?: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-task schema */

export interface FluentBoardsFluentboardsGetTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-task schema */

export interface FluentBoardsFluentboardsUpdateTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID to update
   */
  task_id: number;
  /**
   * Updated task title
   */
  title?: string;
  /**
   * Updated task description (supports HTML and markdown)
   */
  description?: string;
  /**
   * New stage ID to move task to
   */
  stage_id?: number;
  /**
   * Updated task priority level
   */
  priority?: 'low' | 'medium' | 'high';
  /**
   * Updated due date and time (Y-m-d H:i:s format)
   */
  due_at?: string;
  /**
   * Updated start date and time (Y-m-d H:i:s format)
   */
  started_at?: string;
  /**
   * Updated reminder date and time (Y-m-d H:i:s format)
   */
  remind_at?: string;
  /**
   * Updated reminder notification type
   */
  reminder_type?: 'email' | 'dashboard' | 'both';
  /**
   * Updated lead/budget value for the task
   */
  lead_value?: number;
  /**
   * Updated FluentCRM contact ID
   */
  crm_contact_id?: number;
  /**
   * Updated task status
   */
  status?: 'open' | 'closed';
  /**
   * Updated task scope or category
   */
  scope?: string;
  /**
   * Updated source where task originated from
   */
  source?: string;
  /**
   * Minutes to log for time tracking
   */
  log_minutes?: number;
  /**
   * Updated array of user IDs assigned to the task
   */
  assignees?: number[];
  /**
   * Updated task-specific settings and configuration
   */
  settings?: {
    /**
     * Task cover image settings
     */
    cover?: {
      imageId?: number;
      backgroundImage?: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-task schema */

export interface FluentBoardsFluentboardsDeleteTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-clone-task schema */

export interface FluentBoardsFluentboardsCloneTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID to clone
   */
  task_id: number;
  /**
   * Title for the cloned task
   */
  title: string;
  /**
   * Target board ID for cloned task
   */
  target_board_id?: number;
  /**
   * Target stage ID for cloned task
   */
  stage_id: number;
  /**
   * Clone assignees
   */
  assignee?: boolean;
  /**
   * Clone subtasks
   */
  subtask?: boolean;
  /**
   * Clone labels
   */
  label?: boolean;
  /**
   * Clone attachments
   */
  attachment?: boolean;
  /**
   * Clone comments
   */
  comment?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-archive-task schema */

export interface FluentBoardsFluentboardsArchiveTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID to archive
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-restore-task schema */

export interface FluentBoardsFluentboardsRestoreTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID to restore
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-move-task schema */

export interface FluentBoardsFluentboardsMoveTaskArgs {
  /**
   * Current board ID
   */
  board_id: number;
  /**
   * Task ID to move
   */
  task_id: number;
  /**
   * New stage ID to move task to
   */
  newStageId: number;
  /**
   * New position index in stage (0-based)
   */
  newIndex: number;
  /**
   * New board ID (optional, for moving between boards)
   */
  newBoardId?: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-change-task-status schema */

export interface FluentBoardsFluentboardsChangeTaskStatusArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * New stage ID
   */
  stage_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-assign-yourself-to-task schema */

export interface FluentBoardsFluentboardsAssignYourselfToTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID to assign yourself to
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-detach-yourself-from-task schema */

export interface FluentBoardsFluentboardsDetachYourselfFromTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID to remove yourself from
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-create-stage schema */

export interface FluentBoardsFluentboardsCreateStageArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage title
   */
  title: string;
  /**
   * Stage position (optional - auto-assigned if not provided)
   */
  position?: number;
  /**
   * Stage settings (default_task_status, etc.)
   */
  settings?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-list-stages schema */

export interface FluentBoardsFluentboardsListStagesArgs {
  /**
   * Board ID to list stages from
   */
  board_id: number;
  /**
   * Include archived stages
   */
  include_archived?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-stage schema */

export interface FluentBoardsFluentboardsUpdateStageArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage ID to update
   */
  stage_id: number;
  /**
   * Updated stage title
   */
  title?: string;
  /**
   * Updated stage background color (hex)
   */
  bg_color?: string;
  /**
   * Updated stage settings
   */
  settings?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-stage schema */

export interface FluentBoardsFluentboardsDeleteStageArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage ID to archive
   */
  stage_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-restore-stage schema */

export interface FluentBoardsFluentboardsRestoreStageArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage ID to restore
   */
  stage_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-archived-stages schema */

export interface FluentBoardsFluentboardsGetArchivedStagesArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Page number (ignored if noPagination is true)
   */
  page?: number;
  /**
   * Number of stages per page (ignored if noPagination is true)
   */
  per_page?: number;
  /**
   * Return all archived stages without pagination
   */
  noPagination?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-stage-positions schema */

export interface FluentBoardsFluentboardsGetStagePositionsArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage ID
   */
  stage_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-reorder-stages schema */

export interface FluentBoardsFluentboardsReorderStagesArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Array of stage IDs in new order
   */
  stage_ids: number[];
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-move-all-tasks schema */

export interface FluentBoardsFluentboardsMoveAllTasksArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Source stage ID
   */
  old_stage_id: number;
  /**
   * Destination stage ID
   */
  new_stage_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-archive-all-tasks schema */

export interface FluentBoardsFluentboardsArchiveAllTasksArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage ID to archive all tasks from
   */
  stage_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-sort-stage-tasks schema */

export interface FluentBoardsFluentboardsSortStageTasksArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Stage ID
   */
  stage_id: number;
  /**
   * Sort field: priority, due_at, position, created_at, title
   */
  order: 'priority' | 'due_at' | 'position' | 'created_at' | 'title';
  /**
   * Sort direction: ASC (ascending) or DESC (descending)
   */
  orderBy: 'ASC' | 'DESC';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-add-comment schema */

export interface FluentBoardsFluentboardsAddCommentArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Comment text
   */
  comment: string;
  /**
   * Comment type - comment for new comments, reply for replies
   */
  comment_type?: 'comment' | 'reply';
  /**
   * Parent comment ID (required for replies)
   */
  parent_id?: number;
  /**
   * Array of user IDs to notify about this comment
   */
  notify_users?: number[];
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-comments schema */

export interface FluentBoardsFluentboardsGetCommentsArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-comment schema */

export interface FluentBoardsFluentboardsUpdateCommentArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Comment ID to update
   */
  comment_id: number;
  /**
   * Updated comment text
   */
  comment: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-comment schema */

export interface FluentBoardsFluentboardsDeleteCommentArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Comment ID to delete
   */
  comment_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-comment-privacy schema */

export interface FluentBoardsFluentboardsUpdateCommentPrivacyArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Comment ID
   */
  comment_id: number;
  /**
   * Whether comment should be private
   */
  is_private: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-reply schema */

export interface FluentBoardsFluentboardsUpdateReplyArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Reply ID to update
   */
  reply_id: number;
  /**
   * Updated reply text
   */
  comment: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-reply schema */

export interface FluentBoardsFluentboardsDeleteReplyArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Reply ID to delete
   */
  reply_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-create-label schema */

export interface FluentBoardsFluentboardsCreateLabelArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Label title/text
   */
  title: string;
  /**
   * Background color (hex) - e.g., #4bce97
   */
  bg_color: string;
  /**
   * Text color (hex)
   */
  color: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-list-labels schema */

export interface FluentBoardsFluentboardsListLabelsArgs {
  /**
   * Board ID to list labels from
   */
  board_id: number;
  /**
   * Only return labels that are used in tasks
   */
  used_only?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-label schema */

export interface FluentBoardsFluentboardsUpdateLabelArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Label ID to update
   */
  label_id: number;
  /**
   * Updated label title/text
   */
  title?: string;
  /**
   * Updated background color (hex)
   */
  bg_color?: string;
  /**
   * Updated text color (hex)
   */
  color?: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-label schema */

export interface FluentBoardsFluentboardsDeleteLabelArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Label ID to delete
   */
  label_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-add-label-to-task schema */

export interface FluentBoardsFluentboardsAddLabelToTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Label ID
   */
  label_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-remove-label-from-task schema */

export interface FluentBoardsFluentboardsRemoveLabelFromTaskArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Label ID
   */
  label_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-task-labels schema */

export interface FluentBoardsFluentboardsGetTaskLabelsArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-add-task-attachment schema */

export interface FluentBoardsFluentboardsAddTaskAttachmentArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Attachment title
   */
  title: string;
  /**
   * Attachment URL
   */
  url: string;
  /**
   * Attachment type
   */
  type?: 'file' | 'link';
  /**
   * Attachment description
   */
  description?: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-task-attachments schema */

export interface FluentBoardsFluentboardsGetTaskAttachmentsArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-attachment-files schema */

export interface FluentBoardsFluentboardsGetAttachmentFilesArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-update-attachment schema */

export interface FluentBoardsFluentboardsUpdateAttachmentArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Attachment ID to update
   */
  attachment_id: number;
  /**
   * Updated attachment title
   */
  title?: string;
  /**
   * Updated attachment URL
   */
  url?: string;
  /**
   * Updated attachment description
   */
  description?: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-delete-attachment schema */

export interface FluentBoardsFluentboardsDeleteAttachmentArgs {
  /**
   * Board ID
   */
  board_id: number;
  /**
   * Task ID
   */
  task_id: number;
  /**
   * Attachment ID to delete
   */
  attachment_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-all-users schema */

export interface FluentBoardsFluentboardsGetAllUsersArgs {
  /**
   * Page number for pagination
   */
  page?: number;
  /**
   * Number of users per page
   */
  per_page?: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-search-users schema */

export interface FluentBoardsFluentboardsSearchUsersArgs {
  /**
   * Search term to find users by login, email, nicename, first_name, or last_name
   */
  search_term: string;
  /**
   * Optional board ID to filter users with board access
   */
  board_id?: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-user-info schema */

export interface FluentBoardsFluentboardsGetUserInfoArgs {
  /**
   * WordPress user ID to retrieve information for
   */
  user_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-user-boards schema */

export interface FluentBoardsFluentboardsGetUserBoardsArgs {
  /**
   * WordPress user ID to get boards for
   */
  user_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-user-tasks schema */

export interface FluentBoardsFluentboardsGetUserTasksArgs {
  /**
   * WordPress user ID to get tasks for
   */
  user_id: number;
  /**
   * Filter by task status: "open", "in_progress", "completed", "closed"
   */
  status?: 'open' | 'in_progress' | 'completed' | 'closed';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-user-activities schema */

export interface FluentBoardsFluentboardsGetUserActivitiesArgs {
  /**
   * WordPress user ID to get activities for
   */
  user_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-set-super-admin schema */

export interface FluentBoardsFluentboardsSetSuperAdminArgs {
  /**
   * WordPress user ID to make super admin
   */
  user_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-remove-super-admin schema */

export interface FluentBoardsFluentboardsRemoveSuperAdminArgs {
  /**
   * WordPress user ID to remove super admin privileges from
   */
  user_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-bulk-set-super-admins schema */

export interface FluentBoardsFluentboardsBulkSetSuperAdminsArgs {
  /**
   * Array of WordPress user IDs to update
   */
  user_ids: number[];
  /**
   * True to grant super admin access, false to revoke
   */
  grant_access: boolean;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-dashboard-stats schema */

export interface FluentBoardsFluentboardsGetDashboardStatsArgs {
  /**
   * Time period for dashboard stats
   */
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-board-report schema */

export interface FluentBoardsFluentboardsGetBoardReportArgs {
  /**
   * Board ID for detailed report
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-all-board-reports schema */

export interface FluentBoardsFluentboardsGetAllBoardReportsArgs {
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-project-reports schema */

export interface FluentBoardsFluentboardsGetProjectReportsArgs {
  /**
   * Array of board IDs to include in report
   */
  board_ids?: number[];
  /**
   * Start date for report (YYYY-MM-DD format)
   */
  date_from?: string;
  /**
   * End date for report (YYYY-MM-DD format)
   */
  date_to?: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-member-reports schema */

export interface FluentBoardsFluentboardsGetMemberReportsArgs {
  /**
   * User ID for detailed member report
   */
  user_id: number;
  /**
   * Array of board IDs to include in report
   */
  board_ids?: number[];
  /**
   * Start date for report period
   */
  date_from?: string;
  /**
   * End date for report period
   */
  date_to?: string;
  /**
   * Type of member report
   */
  report_type?: 'tasks' | 'activities' | 'projects' | 'comprehensive';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-stage-wise-reports schema */

export interface FluentBoardsFluentboardsGetStageWiseReportsArgs {
  /**
   * Board ID for stage-wise reports
   */
  board_id: number;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-team-workload schema */

export interface FluentBoardsFluentboardsGetTeamWorkloadArgs {
  /**
   * Board ID for team workload analysis
   */
  board_id?: number;
  /**
   * Time period for workload analysis
   */
  period?: 'current' | 'upcoming' | 'overdue';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-timesheet-reports schema */

export interface FluentBoardsFluentboardsGetTimesheetReportsArgs {
  /**
   * Specific board ID for timesheet
   */
  board_id?: number;
  /**
   * Specific user ID for timesheet
   */
  user_id?: number;
  /**
   * Start date for timesheet (YYYY-MM-DD format)
   */
  date_from?: string;
  /**
   * End date for timesheet (YYYY-MM-DD format)
   */
  date_to?: string;
  /**
   * Type of timesheet report
   */
  report_type?: 'by-tasks' | 'by-users' | 'summary';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-timesheet-by-users schema */

export interface FluentBoardsFluentboardsGetTimesheetByUsersArgs {
  /**
   * Board ID for timesheet filter
   */
  board_id?: number;
  /**
   * Date range [start_date, end_date] in YYYY-MM-DD format
   *
   * @minItems 2
   * @maxItems 2
   */
  date_range?: [string, string];
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-get-timesheet-by-tasks schema */

export interface FluentBoardsFluentboardsGetTimesheetByTasksArgs {
  /**
   * Board ID for timesheet filter
   */
  board_id?: number;
  /**
   * Date range [start_date, end_date] in YYYY-MM-DD format
   *
   * @minItems 2
   * @maxItems 2
   */
  date_range?: [string, string];
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-test-verbose-enum schema */

export interface FluentBoardsFluentboardsTestVerboseEnumArgs {
  preset:
    | 'solid_1'
    | 'solid_2'
    | 'solid_3'
    | 'solid_4'
    | 'solid_5'
    | 'solid_6'
    | 'solid_7'
    | 'solid_8'
    | 'solid_9'
    | 'solid_10'
    | 'solid_11'
    | 'solid_12'
    | 'solid_13'
    | 'solid_14'
    | 'solid_15'
    | 'solid_16'
    | 'solid_17'
    | 'solid_18'
    | 'solid_19'
    | 'solid_20'
    | 'solid_21'
    | 'solid_22'
    | 'solid_23'
    | 'gradient_1'
    | 'gradient_2'
    | 'gradient_3'
    | 'gradient_4'
    | 'gradient_5'
    | 'gradient_6';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-test-pattern-enum schema */

export interface FluentBoardsFluentboardsTestPatternEnumArgs {
  /**
   * solid_1 to solid_23, or gradient_1 to gradient_6
   */
  preset: string;
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-generate-planet-verbose schema */

export interface FluentBoardsFluentboardsGeneratePlanetVerboseArgs {
  /**
   * Name of the planet
   */
  planet_name: string;
  /**
   * Planet surface texture
   */
  texture:
    | 'rock_1'
    | 'rock_2'
    | 'rock_3'
    | 'rock_4'
    | 'rock_5'
    | 'rock_6'
    | 'rock_7'
    | 'rock_8'
    | 'rock_9'
    | 'rock_10'
    | 'rock_11'
    | 'rock_12'
    | 'rock_13'
    | 'rock_14'
    | 'rock_15'
    | 'rock_16'
    | 'rock_17'
    | 'rock_18'
    | 'rock_19'
    | 'rock_20'
    | 'rock_21'
    | 'rock_22'
    | 'rock_23'
    | 'gas_1'
    | 'gas_2'
    | 'gas_3'
    | 'gas_4'
    | 'gas_5'
    | 'gas_6';
  [k: string]: unknown;
}

/** Generated from fluentBoards.fluentboards-generate-planet-pattern schema */

export interface FluentBoardsFluentboardsGeneratePlanetPatternArgs {
  /**
   * Name of the planet
   */
  planet_name: string;
  /**
   * Planet texture: rock_1 to rock_23, or gas_1 to gas_6
   */
  texture: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-create-subscriber schema */

export interface FluentCrmFluentcrmCreateSubscriberArgs {
  /**
   * Contact email address (required)
   */
  email: string;
  /**
   * Contact first name
   */
  first_name?: string;
  /**
   * Contact last name
   */
  last_name?: string;
  /**
   * Subscription status
   */
  status?: 'subscribed' | 'pending' | 'unsubscribed' | 'bounced' | 'complained';
  /**
   * Contact phone number
   */
  phone?: string;
  /**
   * Address line 1
   */
  address_line_1?: string;
  /**
   * Address line 2
   */
  address_line_2?: string;
  /**
   * City
   */
  city?: string;
  /**
   * State or province
   */
  state?: string;
  /**
   * Postal/ZIP code
   */
  postal_code?: string;
  /**
   * Country code (e.g., US, UK, CA)
   */
  country?: string;
  /**
   * Timezone identifier (e.g., America/New_York)
   */
  timezone?: string;
  /**
   * Date of birth (YYYY-MM-DD format)
   */
  date_of_birth?: string;
  /**
   * Custom field values as key-value pairs
   */
  custom_values?: {
    [k: string]: unknown;
  };
  /**
   * Array of tag IDs to assign
   */
  tags?: number[];
  /**
   * Array of list IDs to assign
   */
  lists?: number[];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-list-subscribers schema */

export interface FluentCrmFluentcrmListSubscribersArgs {
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of subscribers per page
   */
  per_page?: number;
  /**
   * Search subscribers by email, name, or phone
   */
  search?: string;
  /**
   * Filter by subscription status
   */
  status?: 'subscribed' | 'pending' | 'unsubscribed' | 'bounced' | 'complained';
  /**
   * Filter by tag IDs (subscribers must have ALL tags)
   */
  tags?: number[];
  /**
   * Filter by list IDs (subscribers must be in ALL lists)
   */
  lists?: number[];
  /**
   * Order results by field
   */
  orderby?: 'id' | 'email' | 'first_name' | 'last_name' | 'created_at' | 'updated_at';
  /**
   * Sort direction
   */
  order?: 'ASC' | 'DESC';
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-subscriber schema */

export interface FluentCrmFluentcrmGetSubscriberArgs {
  /**
   * Subscriber ID to retrieve
   */
  subscriber_id?: number;
  /**
   * Subscriber email to retrieve (alternative to ID)
   */
  email?: string;
  /**
   * Include related data (tags, lists, stats)
   */
  with?: ('tags' | 'lists' | 'stats' | 'custom_fields')[];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-subscriber schema */

export interface FluentCrmFluentcrmUpdateSubscriberArgs {
  /**
   * Subscriber ID to update (required)
   */
  subscriber_id: number;
  /**
   * New email address
   */
  email?: string;
  /**
   * New first name
   */
  first_name?: string;
  /**
   * New last name
   */
  last_name?: string;
  /**
   * New phone number
   */
  phone?: string;
  /**
   * New address line 1
   */
  address_line_1?: string;
  /**
   * New address line 2
   */
  address_line_2?: string;
  /**
   * New city
   */
  city?: string;
  /**
   * New state or province
   */
  state?: string;
  /**
   * New postal/ZIP code
   */
  postal_code?: string;
  /**
   * New country code
   */
  country?: string;
  /**
   * New timezone identifier
   */
  timezone?: string;
  /**
   * New date of birth (YYYY-MM-DD format)
   */
  date_of_birth?: string;
  /**
   * Custom field values to update
   */
  custom_values?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-delete-subscriber schema */

export interface FluentCrmFluentcrmDeleteSubscriberArgs {
  /**
   * Subscriber ID to delete
   */
  subscriber_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-bulk-import-subscribers schema */

export interface FluentCrmFluentcrmBulkImportSubscribersArgs {
  /**
   * Array of subscriber objects to import
   */
  subscribers: {
    email: string;
    first_name?: string;
    last_name?: string;
    status?: 'subscribed' | 'pending' | 'unsubscribed' | 'bounced' | 'complained';
    [k: string]: unknown;
  }[];
  /**
   * Tag IDs to assign to all imported subscribers
   */
  tags?: number[];
  /**
   * List IDs to assign to all imported subscribers
   */
  lists?: number[];
  /**
   * Update existing subscribers if email matches
   */
  update_existing?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-bulk-update-subscribers schema */

export interface FluentCrmFluentcrmBulkUpdateSubscribersArgs {
  /**
   * Array of subscriber IDs to update
   */
  subscriber_ids: number[];
  /**
   * Fields to update on all selected subscribers
   */
  update_data: {
    status?: 'subscribed' | 'pending' | 'unsubscribed' | 'bounced' | 'complained';
    timezone?: string;
    country?: string;
    custom_values?: {
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-bulk-delete-subscribers schema */

export interface FluentCrmFluentcrmBulkDeleteSubscribersArgs {
  /**
   * Array of subscriber IDs to delete
   */
  subscriber_ids: number[];
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-add-subscriber-to-list schema */

export interface FluentCrmFluentcrmAddSubscriberToListArgs {
  /**
   * Subscriber ID
   */
  subscriber_id: number;
  /**
   * List ID to assign subscriber to
   */
  list_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-remove-subscriber-from-list schema */

export interface FluentCrmFluentcrmRemoveSubscriberFromListArgs {
  /**
   * Subscriber ID
   */
  subscriber_id: number;
  /**
   * List ID to remove subscriber from
   */
  list_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-add-subscriber-tag schema */

export interface FluentCrmFluentcrmAddSubscriberTagArgs {
  /**
   * Subscriber ID
   */
  subscriber_id: number;
  /**
   * Tag ID to add to subscriber
   */
  tag_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-remove-subscriber-tag schema */

export interface FluentCrmFluentcrmRemoveSubscriberTagArgs {
  /**
   * Subscriber ID
   */
  subscriber_id: number;
  /**
   * Tag ID to remove from subscriber
   */
  tag_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-subscriber-status schema */

export interface FluentCrmFluentcrmUpdateSubscriberStatusArgs {
  /**
   * Subscriber ID
   */
  subscriber_id: number;
  /**
   * New subscription status
   */
  status: 'subscribed' | 'pending' | 'unsubscribed' | 'bounced' | 'complained';
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-merge-subscribers schema */

export interface FluentCrmFluentcrmMergeSubscribersArgs {
  /**
   * Primary subscriber ID to keep
   */
  primary_subscriber_id: number;
  /**
   * Array of subscriber IDs to merge into primary (will be deleted)
   */
  merge_subscriber_ids: number[];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-search-subscribers schema */

export interface FluentCrmFluentcrmSearchSubscribersArgs {
  /**
   * Advanced search filters
   */
  filters: {
    email_contains?: string;
    name_contains?: string;
    has_tags?: number[];
    has_lists?: number[];
    status_in?: ('subscribed' | 'pending' | 'unsubscribed' | 'bounced' | 'complained')[];
    country?: string;
    created_after?: string;
    created_before?: string;
    last_activity_after?: string;
    [k: string]: unknown;
  };
  page?: number;
  per_page?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-create-campaign schema */

export interface FluentCrmFluentcrmCreateCampaignArgs {
  /**
   * Campaign title for internal use
   */
  title: string;
  /**
   * Email subject line
   */
  subject: string;
  /**
   * HTML email body content
   */
  email_body: string;
  /**
   * Email template ID to use (optional)
   */
  template_id?: number;
  /**
   * Sender name (defaults to site settings)
   */
  sender_name?: string;
  /**
   * Sender email (defaults to site settings)
   */
  sender_email?: string;
  /**
   * Reply-to name
   */
  reply_to_name?: string;
  /**
   * Reply-to email
   */
  reply_to_email?: string;
  /**
   * Array of list IDs to target
   */
  list_ids?: number[];
  /**
   * Array of tag IDs to target
   */
  tag_ids?: number[];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-list-campaigns schema */

export interface FluentCrmFluentcrmListCampaignsArgs {
  /**
   * Filter by status: draft, scheduled, working, paused, archived (also: pending-scheduled, processing)
   */
  status?: 'draft' | 'scheduled' | 'pending-scheduled' | 'working' | 'processing' | 'paused' | 'archived';
  /**
   * Filter by type: campaign, recurring
   */
  type?: string;
  /**
   * Number of campaigns per page (default: 10)
   */
  per_page?: number;
  /**
   * Page number (default: 1)
   */
  page?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-campaign schema */

export interface FluentCrmFluentcrmGetCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  /**
   * Include campaign statistics (default: false)
   */
  include_stats?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-campaign schema */

export interface FluentCrmFluentcrmUpdateCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  /**
   * Campaign title
   */
  title?: string;
  /**
   * Email subject line
   */
  subject?: string;
  /**
   * HTML email body content
   */
  email_body?: string;
  /**
   * Sender name
   */
  sender_name?: string;
  /**
   * Sender email
   */
  sender_email?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-delete-campaign schema */

export interface FluentCrmFluentcrmDeleteCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  /**
   * Must be true to confirm deletion
   */
  confirm: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-duplicate-campaign schema */

export interface FluentCrmFluentcrmDuplicateCampaignArgs {
  /**
   * Campaign ID to duplicate
   */
  campaign_id: number;
  /**
   * Title for duplicated campaign (defaults to "Copy of {original}")
   */
  new_title?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-schedule-campaign schema */

export interface FluentCrmFluentcrmScheduleCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  /**
   * Schedule datetime in Y-m-d H:i:s format
   */
  scheduled_at: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-send-campaign schema */

export interface FluentCrmFluentcrmSendCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-pause-campaign schema */

export interface FluentCrmFluentcrmPauseCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-resume-campaign schema */

export interface FluentCrmFluentcrmResumeCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-cancel-campaign schema */

export interface FluentCrmFluentcrmCancelCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-test-send-campaign schema */

export interface FluentCrmFluentcrmTestSendCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  /**
   * Email address to send test to
   */
  test_email: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-preview-campaign schema */

export interface FluentCrmFluentcrmPreviewCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-campaign-analytics schema */

export interface FluentCrmFluentcrmGetCampaignAnalyticsArgs {
  /**
   * Campaign ID to get analytics for
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-campaign-contacts schema */

export interface FluentCrmFluentcrmGetCampaignContactsArgs {
  /**
   * Campaign ID to get contacts for
   */
  campaign_id: number;
  /**
   * Filter by status: sent, opened, clicked, bounced, unsubscribed
   */
  status?: 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  /**
   * Maximum number of contacts to return (default: 50, max: 500)
   */
  limit?: number;
  /**
   * Number of contacts to skip for pagination (default: 0)
   */
  offset?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-campaign-clicks schema */

export interface FluentCrmFluentcrmGetCampaignClicksArgs {
  /**
   * Campaign ID to get click tracking for
   */
  campaign_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-campaign-opens schema */

export interface FluentCrmFluentcrmGetCampaignOpensArgs {
  /**
   * Campaign ID to get open tracking for
   */
  campaign_id: number;
  /**
   * Maximum number of opens to return (default: 100, max: 500)
   */
  limit?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-email-performance-by-subject schema */

export interface FluentCrmFluentcrmGetEmailPerformanceBySubjectArgs {
  /**
   * Array of campaign IDs to compare (if empty, analyzes all campaigns)
   */
  campaign_ids?: number[];
  /**
   * Maximum number of campaigns to analyze (default: 20, max: 100)
   */
  limit?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-send-time-optimization schema */

export interface FluentCrmFluentcrmGetSendTimeOptimizationArgs {
  /**
   * Number of days to analyze (default: 90, max: 365)
   */
  days_back?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-compare-campaigns schema */

export interface FluentCrmFluentcrmCompareCampaignsArgs {
  /**
   * Array of campaign IDs to compare (minimum 2, maximum 10)
   *
   * @minItems 2
   * @maxItems 10
   */
  campaign_ids:
    | [number, number]
    | [number, number, number]
    | [number, number, number, number]
    | [number, number, number, number, number]
    | [number, number, number, number, number, number]
    | [number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number, number];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-create-list schema */

export interface FluentCrmFluentcrmCreateListArgs {
  /**
   * List title (required)
   */
  title: string;
  /**
   * List description
   */
  description?: string;
  /**
   * List slug (auto-generated from title if not provided)
   */
  slug?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-list-lists schema */

export interface FluentCrmFluentcrmListListsArgs {
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of lists per page
   */
  per_page?: number;
  /**
   * Search lists by title
   */
  search?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-list schema */

export interface FluentCrmFluentcrmGetListArgs {
  /**
   * List ID to retrieve
   */
  list_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-list schema */

export interface FluentCrmFluentcrmUpdateListArgs {
  /**
   * List ID to update (required)
   */
  list_id: number;
  /**
   * New list title
   */
  title?: string;
  /**
   * New list description
   */
  description?: string;
  /**
   * New list slug
   */
  slug?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-delete-list schema */

export interface FluentCrmFluentcrmDeleteListArgs {
  /**
   * List ID to delete
   */
  list_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  /**
   * If true, delete all subscribers in this list; if false, keep subscribers
   */
  delete_subscribers?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-list-subscribers schema */

export interface FluentCrmFluentcrmGetListSubscribersArgs {
  /**
   * List ID to get subscribers from
   */
  list_id: number;
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of subscribers per page
   */
  per_page?: number;
  /**
   * Filter by subscriber status
   */
  status?: 'subscribed' | 'unsubscribed' | 'pending' | 'bounced' | 'complained';
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-list-stats schema */

export interface FluentCrmFluentcrmGetListStatsArgs {
  /**
   * List ID to get statistics for
   */
  list_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-duplicate-list schema */

export interface FluentCrmFluentcrmDuplicateListArgs {
  /**
   * List ID to duplicate
   */
  list_id: number;
  /**
   * Title for the duplicated list (optional - will use "Copy of {original title}" if not provided)
   */
  new_title?: string;
  /**
   * If true, copy all subscribers to the new list
   */
  copy_subscribers?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-merge-lists schema */

export interface FluentCrmFluentcrmMergeListsArgs {
  /**
   * Array of list IDs to merge (at least 2 required)
   *
   * @minItems 2
   */
  source_list_ids: [number, number, ...number[]];
  /**
   * Title for the merged list
   */
  target_list_title: string;
  /**
   * If true, delete source lists after merging
   */
  delete_source?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-create-tag schema */

export interface FluentCrmFluentcrmCreateTagArgs {
  /**
   * Tag title (required)
   */
  title: string;
  /**
   * Tag description
   */
  description?: string;
  /**
   * Tag slug (optional - auto-generated from title if not provided)
   */
  slug?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-list-tags schema */

export interface FluentCrmFluentcrmListTagsArgs {
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of tags per page
   */
  per_page?: number;
  /**
   * Search tags by title or slug
   */
  search?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-tag schema */

export interface FluentCrmFluentcrmGetTagArgs {
  /**
   * Tag ID to retrieve
   */
  tag_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-tag schema */

export interface FluentCrmFluentcrmUpdateTagArgs {
  /**
   * Tag ID to update (required)
   */
  tag_id: number;
  /**
   * New tag title
   */
  title?: string;
  /**
   * New tag description
   */
  description?: string;
  /**
   * New tag slug
   */
  slug?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-delete-tag schema */

export interface FluentCrmFluentcrmDeleteTagArgs {
  /**
   * Tag ID to delete
   */
  tag_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-tag-subscribers schema */

export interface FluentCrmFluentcrmGetTagSubscribersArgs {
  /**
   * Tag ID
   */
  tag_id: number;
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of subscribers per page
   */
  per_page?: number;
  /**
   * Filter by subscriber status
   */
  status?: 'subscribed' | 'unsubscribed' | 'pending' | 'bounced' | 'complained';
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-tag-stats schema */

export interface FluentCrmFluentcrmGetTagStatsArgs {
  /**
   * Tag ID
   */
  tag_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-bulk-apply-tags schema */

export interface FluentCrmFluentcrmBulkApplyTagsArgs {
  /**
   * Array of subscriber IDs
   */
  subscriber_ids: number[];
  /**
   * Array of tag IDs to apply
   */
  tag_ids: number[];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-bulk-remove-tags schema */

export interface FluentCrmFluentcrmBulkRemoveTagsArgs {
  /**
   * Array of subscriber IDs
   */
  subscriber_ids: number[];
  /**
   * Array of tag IDs to remove
   */
  tag_ids: number[];
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-create-sequence schema */

export interface FluentCrmFluentcrmCreateSequenceArgs {
  /**
   * Sequence title (required)
   */
  title: string;
  /**
   * Sequence description
   */
  description?: string;
  /**
   * Sequence status
   */
  status?: 'draft' | 'published' | 'archived';
  /**
   * Sequence configuration settings
   */
  settings?: {
    /**
     * Prefix for all email subjects in this sequence
     */
    email_subject_prefix?: string;
    /**
     * Automatically unsubscribe contacts after sequence completes
     */
    unsubscribe_on_complete?: boolean;
    /**
     * Allow contacts to re-enter the sequence
     */
    allow_re_enrollment?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-list-sequences schema */

export interface FluentCrmFluentcrmListSequencesArgs {
  /**
   * Page number
   */
  page?: number;
  /**
   * Number of sequences per page
   */
  per_page?: number;
  /**
   * Filter by status
   */
  status?: 'draft' | 'published' | 'archived';
  /**
   * Search sequences by title
   */
  search?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-sequence schema */

export interface FluentCrmFluentcrmGetSequenceArgs {
  /**
   * Sequence ID to retrieve
   */
  sequence_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-sequence schema */

export interface FluentCrmFluentcrmUpdateSequenceArgs {
  /**
   * Sequence ID to update (required)
   */
  sequence_id: number;
  /**
   * New sequence title
   */
  title?: string;
  /**
   * New sequence description
   */
  description?: string;
  /**
   * New sequence status
   */
  status?: 'draft' | 'published' | 'archived';
  /**
   * Sequence configuration settings
   */
  settings?: {
    /**
     * Prefix for all email subjects in this sequence
     */
    email_subject_prefix?: string;
    /**
     * Automatically unsubscribe contacts after sequence completes
     */
    unsubscribe_on_complete?: boolean;
    /**
     * Allow contacts to re-enter the sequence
     */
    allow_re_enrollment?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-delete-sequence schema */

export interface FluentCrmFluentcrmDeleteSequenceArgs {
  /**
   * Sequence ID to delete
   */
  sequence_id: number;
  /**
   * Confirmation required: set to true to proceed with deletion
   */
  confirm_delete: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-add-subscriber-to-sequence schema */

export interface FluentCrmFluentcrmAddSubscriberToSequenceArgs {
  /**
   * Sequence ID
   */
  sequence_id: number;
  /**
   * Subscriber/contact ID to enroll
   */
  subscriber_id: number;
  /**
   * Restart sequence from beginning if already enrolled
   */
  restart?: boolean;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-remove-subscriber-from-sequence schema */

export interface FluentCrmFluentcrmRemoveSubscriberFromSequenceArgs {
  /**
   * Sequence ID
   */
  sequence_id: number;
  /**
   * Subscriber/contact ID to unenroll
   */
  subscriber_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-sequence-performance schema */

export interface FluentCrmFluentcrmGetSequencePerformanceArgs {
  /**
   * Sequence ID
   */
  sequence_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-create-template schema */

export interface FluentCrmFluentcrmCreateTemplateArgs {
  /**
   * Template name
   */
  post_title: string;
  /**
   * Email template HTML content
   */
  post_content: string;
  /**
   * Default email subject line
   */
  email_subject?: string;
  /**
   * Email pre-header text (preview text)
   */
  email_pre_header?: string;
  /**
   * Template configuration settings (JSON object)
   */
  template_config?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-list-templates schema */

export interface FluentCrmFluentcrmListTemplatesArgs {
  /**
   * Search term to filter templates
   */
  search?: string;
  /**
   * Number of templates per page
   */
  per_page?: number;
  /**
   * Page number for pagination
   */
  page?: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-get-template schema */

export interface FluentCrmFluentcrmGetTemplateArgs {
  /**
   * Template ID
   */
  template_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-update-template schema */

export interface FluentCrmFluentcrmUpdateTemplateArgs {
  /**
   * Template ID to update
   */
  template_id: number;
  /**
   * Template name
   */
  post_title?: string;
  /**
   * Email template HTML content
   */
  post_content?: string;
  /**
   * Default email subject line
   */
  email_subject?: string;
  /**
   * Email pre-header text (preview text)
   */
  email_pre_header?: string;
  /**
   * Template configuration settings (JSON object)
   */
  template_config?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-delete-template schema */

export interface FluentCrmFluentcrmDeleteTemplateArgs {
  /**
   * Template ID to delete
   */
  template_id: number;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-duplicate-template schema */

export interface FluentCrmFluentcrmDuplicateTemplateArgs {
  /**
   * Template ID to duplicate
   */
  template_id: number;
  /**
   * Title for the duplicated template (optional, defaults to "Copy of [original]")
   */
  new_title?: string;
  [k: string]: unknown;
}

/** Generated from fluentCrm.fluentcrm-apply-template-to-campaign schema */

export interface FluentCrmFluentcrmApplyTemplateToCampaignArgs {
  /**
   * Campaign ID
   */
  campaign_id: number;
  /**
   * Template ID to apply
   */
  template_id: number;
  [k: string]: unknown;
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
       * Check the health status of the AutoMem service and its connected databases
       */
      check_database_health(args: AutomemCheckDatabaseHealthArgs): Promise<MCPToolResult>;
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
    "sequential-thinking": {
      /**
       * A detailed tool for dynamic and reflective problem-solving through thoughts.
       */
      sequentialthinking(args: SequentialThinkingSequentialthinkingArgs): Promise<MCPToolResult>;
    };
    fluentBoards: {
      /**
       * Create a new board with comprehensive options
       */
      "fluentboards-create-board"(args: FluentBoardsFluentboardsCreateBoardArgs): Promise<MCPToolResult>;
      /**
       * List all boards accessible to the current user
       */
      "fluentboards-list-boards"(args: FluentBoardsFluentboardsListBoardsArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific board
       */
      "fluentboards-get-board"(args: FluentBoardsFluentboardsGetBoardArgs): Promise<MCPToolResult>;
      /**
       * Update an existing board with comprehensive options including background, currency, and settings
       */
      "fluentboards-update-board"(args: FluentBoardsFluentboardsUpdateBoardArgs): Promise<MCPToolResult>;
      /**
       * Delete a board permanently (requires confirmation)
       */
      "fluentboards-delete-board"(args: FluentBoardsFluentboardsDeleteBoardArgs): Promise<MCPToolResult>;
      /**
       * Create a duplicate copy of an existing board
       */
      "fluentboards-duplicate-board"(args: FluentBoardsFluentboardsDuplicateBoardArgs): Promise<MCPToolResult>;
      /**
       * Archive a board (soft delete - can be restored)
       */
      "fluentboards-archive-board"(args: FluentBoardsFluentboardsArchiveBoardArgs): Promise<MCPToolResult>;
      /**
       * Restore an archived board
       */
      "fluentboards-restore-board"(args: FluentBoardsFluentboardsRestoreBoardArgs): Promise<MCPToolResult>;
      /**
       * Pin a board to the top of the user's board list
       */
      "fluentboards-pin-board"(args: FluentBoardsFluentboardsPinBoardArgs): Promise<MCPToolResult>;
      /**
       * Unpin a board from the user's pinned list
       */
      "fluentboards-unpin-board"(args: FluentBoardsFluentboardsUnpinBoardArgs): Promise<MCPToolResult>;
      /**
       * Update specific permissions for a user on a board
       */
      "fluentboards-update-board-permissions"(args: FluentBoardsFluentboardsUpdateBoardPermissionsArgs): Promise<MCPToolResult>;
      /**
       * Get all users assigned to a board with their roles and permissions
       */
      "fluentboards-get-board-users"(args: FluentBoardsFluentboardsGetBoardUsersArgs): Promise<MCPToolResult>;
      /**
       * Add a user to a board with specified role
       */
      "fluentboards-add-board-member"(args: FluentBoardsFluentboardsAddBoardMemberArgs): Promise<MCPToolResult>;
      /**
       * Remove a user from a board
       */
      "fluentboards-remove-board-member"(args: FluentBoardsFluentboardsRemoveBoardMemberArgs): Promise<MCPToolResult>;
      /**
       * Update a board member's role and permissions
       */
      "fluentboards-update-member-role"(args: FluentBoardsFluentboardsUpdateMemberRoleArgs): Promise<MCPToolResult>;
      /**
       * Add multiple users to multiple boards with specified roles
       */
      "fluentboards-bulk-add-members"(args: FluentBoardsFluentboardsBulkAddMembersArgs): Promise<MCPToolResult>;
      /**
       * Create a new task with comprehensive parameters
       */
      "fluentboards-create-task"(args: FluentBoardsFluentboardsCreateTaskArgs): Promise<MCPToolResult>;
      /**
       * List tasks in a board
       */
      "fluentboards-list-tasks"(args: FluentBoardsFluentboardsListTasksArgs): Promise<MCPToolResult>;
      /**
       * Get details of a specific task including comments and attachments
       */
      "fluentboards-get-task"(args: FluentBoardsFluentboardsGetTaskArgs): Promise<MCPToolResult>;
      /**
       * Update an existing task with comprehensive properties
       */
      "fluentboards-update-task"(args: FluentBoardsFluentboardsUpdateTaskArgs): Promise<MCPToolResult>;
      /**
       * Delete a task permanently (requires confirmation)
       */
      "fluentboards-delete-task"(args: FluentBoardsFluentboardsDeleteTaskArgs): Promise<MCPToolResult>;
      /**
       * Clone/duplicate a task with options
       */
      "fluentboards-clone-task"(args: FluentBoardsFluentboardsCloneTaskArgs): Promise<MCPToolResult>;
      /**
       * Archive a task (soft delete)
       */
      "fluentboards-archive-task"(args: FluentBoardsFluentboardsArchiveTaskArgs): Promise<MCPToolResult>;
      /**
       * Restore an archived task
       */
      "fluentboards-restore-task"(args: FluentBoardsFluentboardsRestoreTaskArgs): Promise<MCPToolResult>;
      /**
       * Move task to different stage or board
       */
      "fluentboards-move-task"(args: FluentBoardsFluentboardsMoveTaskArgs): Promise<MCPToolResult>;
      /**
       * Change the status/stage of a task
       */
      "fluentboards-change-task-status"(args: FluentBoardsFluentboardsChangeTaskStatusArgs): Promise<MCPToolResult>;
      /**
       * Assign yourself to a task
       */
      "fluentboards-assign-yourself-to-task"(args: FluentBoardsFluentboardsAssignYourselfToTaskArgs): Promise<MCPToolResult>;
      /**
       * Remove yourself from a task
       */
      "fluentboards-detach-yourself-from-task"(args: FluentBoardsFluentboardsDetachYourselfFromTaskArgs): Promise<MCPToolResult>;
      /**
       * Create a new stage in a board
       */
      "fluentboards-create-stage"(args: FluentBoardsFluentboardsCreateStageArgs): Promise<MCPToolResult>;
      /**
       * List all stages in a board
       */
      "fluentboards-list-stages"(args: FluentBoardsFluentboardsListStagesArgs): Promise<MCPToolResult>;
      /**
       * Update an existing stage
       */
      "fluentboards-update-stage"(args: FluentBoardsFluentboardsUpdateStageArgs): Promise<MCPToolResult>;
      /**
       * Archive a stage (soft delete)
       */
      "fluentboards-delete-stage"(args: FluentBoardsFluentboardsDeleteStageArgs): Promise<MCPToolResult>;
      /**
       * Restore an archived stage
       */
      "fluentboards-restore-stage"(args: FluentBoardsFluentboardsRestoreStageArgs): Promise<MCPToolResult>;
      /**
       * Get all archived stages in a board
       */
      "fluentboards-get-archived-stages"(args: FluentBoardsFluentboardsGetArchivedStagesArgs): Promise<MCPToolResult>;
      /**
       * Get available positions for tasks in a stage
       */
      "fluentboards-get-stage-positions"(args: FluentBoardsFluentboardsGetStagePositionsArgs): Promise<MCPToolResult>;
      /**
       * Reorder stages in a board
       */
      "fluentboards-reorder-stages"(args: FluentBoardsFluentboardsReorderStagesArgs): Promise<MCPToolResult>;
      /**
       * Move all tasks from one stage to another
       */
      "fluentboards-move-all-tasks"(args: FluentBoardsFluentboardsMoveAllTasksArgs): Promise<MCPToolResult>;
      /**
       * Archive all tasks in a stage
       */
      "fluentboards-archive-all-tasks"(args: FluentBoardsFluentboardsArchiveAllTasksArgs): Promise<MCPToolResult>;
      /**
       * Reorder tasks within a stage
       */
      "fluentboards-sort-stage-tasks"(args: FluentBoardsFluentboardsSortStageTasksArgs): Promise<MCPToolResult>;
      /**
       * Add a comment to a task
       */
      "fluentboards-add-comment"(args: FluentBoardsFluentboardsAddCommentArgs): Promise<MCPToolResult>;
      /**
       * Get all comments for a task
       */
      "fluentboards-get-comments"(args: FluentBoardsFluentboardsGetCommentsArgs): Promise<MCPToolResult>;
      /**
       * Update an existing comment
       */
      "fluentboards-update-comment"(args: FluentBoardsFluentboardsUpdateCommentArgs): Promise<MCPToolResult>;
      /**
       * Delete a comment permanently
       */
      "fluentboards-delete-comment"(args: FluentBoardsFluentboardsDeleteCommentArgs): Promise<MCPToolResult>;
      /**
       * Update comment privacy settings
       */
      "fluentboards-update-comment-privacy"(args: FluentBoardsFluentboardsUpdateCommentPrivacyArgs): Promise<MCPToolResult>;
      /**
       * Update an existing reply
       */
      "fluentboards-update-reply"(args: FluentBoardsFluentboardsUpdateReplyArgs): Promise<MCPToolResult>;
      /**
       * Delete a reply permanently
       */
      "fluentboards-delete-reply"(args: FluentBoardsFluentboardsDeleteReplyArgs): Promise<MCPToolResult>;
      /**
       * Create a new label on a board
       */
      "fluentboards-create-label"(args: FluentBoardsFluentboardsCreateLabelArgs): Promise<MCPToolResult>;
      /**
       * List all labels in a board
       */
      "fluentboards-list-labels"(args: FluentBoardsFluentboardsListLabelsArgs): Promise<MCPToolResult>;
      /**
       * Update an existing label
       */
      "fluentboards-update-label"(args: FluentBoardsFluentboardsUpdateLabelArgs): Promise<MCPToolResult>;
      /**
       * Delete a label from a board
       */
      "fluentboards-delete-label"(args: FluentBoardsFluentboardsDeleteLabelArgs): Promise<MCPToolResult>;
      /**
       * Add a label to a task
       */
      "fluentboards-add-label-to-task"(args: FluentBoardsFluentboardsAddLabelToTaskArgs): Promise<MCPToolResult>;
      /**
       * Remove a label from a task
       */
      "fluentboards-remove-label-from-task"(args: FluentBoardsFluentboardsRemoveLabelFromTaskArgs): Promise<MCPToolResult>;
      /**
       * Get all labels assigned to a specific task
       */
      "fluentboards-get-task-labels"(args: FluentBoardsFluentboardsGetTaskLabelsArgs): Promise<MCPToolResult>;
      /**
       * Add an attachment to a task
       */
      "fluentboards-add-task-attachment"(args: FluentBoardsFluentboardsAddTaskAttachmentArgs): Promise<MCPToolResult>;
      /**
       * Get all attachments for a task
       */
      "fluentboards-get-task-attachments"(args: FluentBoardsFluentboardsGetTaskAttachmentsArgs): Promise<MCPToolResult>;
      /**
       * Get all files attached to a task (requires FluentBoards Pro)
       */
      "fluentboards-get-attachment-files"(args: FluentBoardsFluentboardsGetAttachmentFilesArgs): Promise<MCPToolResult>;
      /**
       * Update an existing attachment
       */
      "fluentboards-update-attachment"(args: FluentBoardsFluentboardsUpdateAttachmentArgs): Promise<MCPToolResult>;
      /**
       * Delete an attachment permanently
       */
      "fluentboards-delete-attachment"(args: FluentBoardsFluentboardsDeleteAttachmentArgs): Promise<MCPToolResult>;
      /**
       * Get all FluentBoards users with pagination
       */
      "fluentboards-get-all-users"(args: FluentBoardsFluentboardsGetAllUsersArgs): Promise<MCPToolResult>;
      /**
       * Search for WordPress users by name, email, or login
       */
      "fluentboards-search-users"(args: FluentBoardsFluentboardsSearchUsersArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific user including FluentBoards and FluentCRM data
       */
      "fluentboards-get-user-info"(args: FluentBoardsFluentboardsGetUserInfoArgs): Promise<MCPToolResult>;
      /**
       * Get all boards accessible to a user
       */
      "fluentboards-get-user-boards"(args: FluentBoardsFluentboardsGetUserBoardsArgs): Promise<MCPToolResult>;
      /**
       * Get all tasks assigned to a user across all boards
       */
      "fluentboards-get-user-tasks"(args: FluentBoardsFluentboardsGetUserTasksArgs): Promise<MCPToolResult>;
      /**
       * Get recent activities for a user across all boards
       */
      "fluentboards-get-user-activities"(args: FluentBoardsFluentboardsGetUserActivitiesArgs): Promise<MCPToolResult>;
      /**
       * Grant FluentBoards super admin privileges to a user
       */
      "fluentboards-set-super-admin"(args: FluentBoardsFluentboardsSetSuperAdminArgs): Promise<MCPToolResult>;
      /**
       * Remove FluentBoards super admin privileges from a user
       */
      "fluentboards-remove-super-admin"(args: FluentBoardsFluentboardsRemoveSuperAdminArgs): Promise<MCPToolResult>;
      /**
       * Grant or revoke FluentBoards super admin privileges for multiple users
       */
      "fluentboards-bulk-set-super-admins"(args: FluentBoardsFluentboardsBulkSetSuperAdminsArgs): Promise<MCPToolResult>;
      /**
       * Get dashboard statistics and key metrics
       */
      "fluentboards-get-dashboard-stats"(args: FluentBoardsFluentboardsGetDashboardStatsArgs): Promise<MCPToolResult>;
      /**
       * Get detailed report for a specific board
       */
      "fluentboards-get-board-report"(args: FluentBoardsFluentboardsGetBoardReportArgs): Promise<MCPToolResult>;
      /**
       * Get reports for all accessible boards
       */
      "fluentboards-get-all-board-reports"(args: FluentBoardsFluentboardsGetAllBoardReportsArgs): Promise<MCPToolResult>;
      /**
       * Get comprehensive project reports and analytics
       */
      "fluentboards-get-project-reports"(args: FluentBoardsFluentboardsGetProjectReportsArgs): Promise<MCPToolResult>;
      /**
       * Get comprehensive member performance and activity reports
       */
      "fluentboards-get-member-reports"(args: FluentBoardsFluentboardsGetMemberReportsArgs): Promise<MCPToolResult>;
      /**
       * Get stage-wise task distribution and progress reports
       */
      "fluentboards-get-stage-wise-reports"(args: FluentBoardsFluentboardsGetStageWiseReportsArgs): Promise<MCPToolResult>;
      /**
       * Get team workload and capacity analysis
       */
      "fluentboards-get-team-workload"(args: FluentBoardsFluentboardsGetTeamWorkloadArgs): Promise<MCPToolResult>;
      /**
       * Get time tracking and timesheet reports
       */
      "fluentboards-get-timesheet-reports"(args: FluentBoardsFluentboardsGetTimesheetReportsArgs): Promise<MCPToolResult>;
      /**
       * Get timesheet report grouped by users (Pro required)
       */
      "fluentboards-get-timesheet-by-users"(args: FluentBoardsFluentboardsGetTimesheetByUsersArgs): Promise<MCPToolResult>;
      /**
       * Get timesheet report grouped by tasks (Pro required)
       */
      "fluentboards-get-timesheet-by-tasks"(args: FluentBoardsFluentboardsGetTimesheetByTasksArgs): Promise<MCPToolResult>;
      /**
       * Echo if background preset is valid (verbose enum)
       */
      "fluentboards-test-verbose-enum"(args: FluentBoardsFluentboardsTestVerboseEnumArgs): Promise<MCPToolResult>;
      /**
       * Echo if background preset is valid (pattern validation)
       */
      "fluentboards-test-pattern-enum"(args: FluentBoardsFluentboardsTestPatternEnumArgs): Promise<MCPToolResult>;
      /**
       * Generate a planet with a texture
       */
      "fluentboards-generate-planet-verbose"(args: FluentBoardsFluentboardsGeneratePlanetVerboseArgs): Promise<MCPToolResult>;
      /**
       * Generate a planet with a texture
       */
      "fluentboards-generate-planet-pattern"(args: FluentBoardsFluentboardsGeneratePlanetPatternArgs): Promise<MCPToolResult>;
    };
    fluentCrm: {
      /**
       * Create a new contact with full profile data including email, name, status, and custom fields
       */
      "fluentcrm-create-subscriber"(args: FluentCrmFluentcrmCreateSubscriberArgs): Promise<MCPToolResult>;
      /**
       * List and search contacts with pagination, filtering by status, tags, lists, and search query
       */
      "fluentcrm-list-subscribers"(args: FluentCrmFluentcrmListSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific contact including relationships (tags, lists) and statistics
       */
      "fluentcrm-get-subscriber"(args: FluentCrmFluentcrmGetSubscriberArgs): Promise<MCPToolResult>;
      /**
       * Update contact profile information and custom fields
       */
      "fluentcrm-update-subscriber"(args: FluentCrmFluentcrmUpdateSubscriberArgs): Promise<MCPToolResult>;
      /**
       * Delete a contact permanently (requires confirmation)
       */
      "fluentcrm-delete-subscriber"(args: FluentCrmFluentcrmDeleteSubscriberArgs): Promise<MCPToolResult>;
      /**
       * Import multiple contacts from array with optional list and tag assignment
       */
      "fluentcrm-bulk-import-subscribers"(args: FluentCrmFluentcrmBulkImportSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Batch update contact properties for multiple subscribers
       */
      "fluentcrm-bulk-update-subscribers"(args: FluentCrmFluentcrmBulkUpdateSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Batch delete multiple contacts (requires confirmation)
       */
      "fluentcrm-bulk-delete-subscribers"(args: FluentCrmFluentcrmBulkDeleteSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Assign a contact to a FluentCRM list
       */
      "fluentcrm-add-subscriber-to-list"(args: FluentCrmFluentcrmAddSubscriberToListArgs): Promise<MCPToolResult>;
      /**
       * Remove a contact from a FluentCRM list
       */
      "fluentcrm-remove-subscriber-from-list"(args: FluentCrmFluentcrmRemoveSubscriberFromListArgs): Promise<MCPToolResult>;
      /**
       * Add a tag to a FluentCRM contact
       */
      "fluentcrm-add-subscriber-tag"(args: FluentCrmFluentcrmAddSubscriberTagArgs): Promise<MCPToolResult>;
      /**
       * Remove a tag from a FluentCRM contact
       */
      "fluentcrm-remove-subscriber-tag"(args: FluentCrmFluentcrmRemoveSubscriberTagArgs): Promise<MCPToolResult>;
      /**
       * Change contact subscription status (subscribed, unsubscribed, bounced, pending, complained)
       */
      "fluentcrm-update-subscriber-status"(args: FluentCrmFluentcrmUpdateSubscriberStatusArgs): Promise<MCPToolResult>;
      /**
       * Merge duplicate contacts, combining tags, lists, and activity history into primary contact
       */
      "fluentcrm-merge-subscribers"(args: FluentCrmFluentcrmMergeSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Advanced contact search with complex filters and conditions
       */
      "fluentcrm-search-subscribers"(args: FluentCrmFluentcrmSearchSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Create a new email campaign in FluentCRM
       */
      "fluentcrm-create-campaign"(args: FluentCrmFluentcrmCreateCampaignArgs): Promise<MCPToolResult>;
      /**
       * List email campaigns with filtering and pagination
       */
      "fluentcrm-list-campaigns"(args: FluentCrmFluentcrmListCampaignsArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific campaign
       */
      "fluentcrm-get-campaign"(args: FluentCrmFluentcrmGetCampaignArgs): Promise<MCPToolResult>;
      /**
       * Update campaign properties (draft campaigns only)
       */
      "fluentcrm-update-campaign"(args: FluentCrmFluentcrmUpdateCampaignArgs): Promise<MCPToolResult>;
      /**
       * Delete a campaign permanently
       */
      "fluentcrm-delete-campaign"(args: FluentCrmFluentcrmDeleteCampaignArgs): Promise<MCPToolResult>;
      /**
       * Duplicate an existing campaign as a draft
       */
      "fluentcrm-duplicate-campaign"(args: FluentCrmFluentcrmDuplicateCampaignArgs): Promise<MCPToolResult>;
      /**
       * Schedule a campaign for future sending
       */
      "fluentcrm-schedule-campaign"(args: FluentCrmFluentcrmScheduleCampaignArgs): Promise<MCPToolResult>;
      /**
       * Send a campaign immediately
       */
      "fluentcrm-send-campaign"(args: FluentCrmFluentcrmSendCampaignArgs): Promise<MCPToolResult>;
      /**
       * Pause a currently sending campaign
       */
      "fluentcrm-pause-campaign"(args: FluentCrmFluentcrmPauseCampaignArgs): Promise<MCPToolResult>;
      /**
       * Resume a paused campaign
       */
      "fluentcrm-resume-campaign"(args: FluentCrmFluentcrmResumeCampaignArgs): Promise<MCPToolResult>;
      /**
       * Cancel a scheduled campaign
       */
      "fluentcrm-cancel-campaign"(args: FluentCrmFluentcrmCancelCampaignArgs): Promise<MCPToolResult>;
      /**
       * Send a test email for the campaign
       */
      "fluentcrm-test-send-campaign"(args: FluentCrmFluentcrmTestSendCampaignArgs): Promise<MCPToolResult>;
      /**
       * Get rendered HTML preview of campaign
       */
      "fluentcrm-preview-campaign"(args: FluentCrmFluentcrmPreviewCampaignArgs): Promise<MCPToolResult>;
      /**
       * Get complete campaign metrics including sent, opened, clicked, bounced, unsubscribed counts and rates
       */
      "fluentcrm-get-campaign-analytics"(args: FluentCrmFluentcrmGetCampaignAnalyticsArgs): Promise<MCPToolResult>;
      /**
       * List contacts who received campaign with optional status filter (sent, opened, clicked, bounced, unsubscribed)
       */
      "fluentcrm-get-campaign-contacts"(args: FluentCrmFluentcrmGetCampaignContactsArgs): Promise<MCPToolResult>;
      /**
       * Get detailed click tracking data for campaign including URLs and click counts
       */
      "fluentcrm-get-campaign-clicks"(args: FluentCrmFluentcrmGetCampaignClicksArgs): Promise<MCPToolResult>;
      /**
       * Get open tracking data for campaign with timestamps and engagement patterns
       */
      "fluentcrm-get-campaign-opens"(args: FluentCrmFluentcrmGetCampaignOpensArgs): Promise<MCPToolResult>;
      /**
       * Compare subject line performance across multiple campaigns to identify effective patterns
       */
      "fluentcrm-get-email-performance-by-subject"(args: FluentCrmFluentcrmGetEmailPerformanceBySubjectArgs): Promise<MCPToolResult>;
      /**
       * Analyze best send times based on historical campaign performance data (day of week and hour)
       */
      "fluentcrm-get-send-time-optimization"(args: FluentCrmFluentcrmGetSendTimeOptimizationArgs): Promise<MCPToolResult>;
      /**
       * Compare performance metrics across multiple campaigns side-by-side
       */
      "fluentcrm-compare-campaigns"(args: FluentCrmFluentcrmCompareCampaignsArgs): Promise<MCPToolResult>;
      /**
       * Create a new contact list with title, description, and slug
       */
      "fluentcrm-create-list"(args: FluentCrmFluentcrmCreateListArgs): Promise<MCPToolResult>;
      /**
       * List all contact lists with pagination and search
       */
      "fluentcrm-list-lists"(args: FluentCrmFluentcrmListListsArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific list with subscriber count by status
       */
      "fluentcrm-get-list"(args: FluentCrmFluentcrmGetListArgs): Promise<MCPToolResult>;
      /**
       * Update list properties (title, description, slug)
       */
      "fluentcrm-update-list"(args: FluentCrmFluentcrmUpdateListArgs): Promise<MCPToolResult>;
      /**
       * Delete a list with option to keep or delete subscribers
       */
      "fluentcrm-delete-list"(args: FluentCrmFluentcrmDeleteListArgs): Promise<MCPToolResult>;
      /**
       * Get all subscribers in a list with pagination and status filtering
       */
      "fluentcrm-get-list-subscribers"(args: FluentCrmFluentcrmGetListSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Get list statistics including total, subscribed, unsubscribed, bounced counts
       */
      "fluentcrm-get-list-stats"(args: FluentCrmFluentcrmGetListStatsArgs): Promise<MCPToolResult>;
      /**
       * Clone a list with optional subscriber copy
       */
      "fluentcrm-duplicate-list"(args: FluentCrmFluentcrmDuplicateListArgs): Promise<MCPToolResult>;
      /**
       * Merge multiple lists into one, combining all subscribers
       */
      "fluentcrm-merge-lists"(args: FluentCrmFluentcrmMergeListsArgs): Promise<MCPToolResult>;
      /**
       * Create a new tag for subscriber organization
       */
      "fluentcrm-create-tag"(args: FluentCrmFluentcrmCreateTagArgs): Promise<MCPToolResult>;
      /**
       * List all tags with pagination and search
       */
      "fluentcrm-list-tags"(args: FluentCrmFluentcrmListTagsArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific tag including subscriber count
       */
      "fluentcrm-get-tag"(args: FluentCrmFluentcrmGetTagArgs): Promise<MCPToolResult>;
      /**
       * Update tag properties
       */
      "fluentcrm-update-tag"(args: FluentCrmFluentcrmUpdateTagArgs): Promise<MCPToolResult>;
      /**
       * Delete a tag permanently (requires confirmation)
       */
      "fluentcrm-delete-tag"(args: FluentCrmFluentcrmDeleteTagArgs): Promise<MCPToolResult>;
      /**
       * Get all subscribers associated with a specific tag
       */
      "fluentcrm-get-tag-subscribers"(args: FluentCrmFluentcrmGetTagSubscribersArgs): Promise<MCPToolResult>;
      /**
       * Get statistics for a tag including total subscribers and breakdown by status
       */
      "fluentcrm-get-tag-stats"(args: FluentCrmFluentcrmGetTagStatsArgs): Promise<MCPToolResult>;
      /**
       * Apply one or more tags to multiple subscribers
       */
      "fluentcrm-bulk-apply-tags"(args: FluentCrmFluentcrmBulkApplyTagsArgs): Promise<MCPToolResult>;
      /**
       * Remove one or more tags from multiple subscribers
       */
      "fluentcrm-bulk-remove-tags"(args: FluentCrmFluentcrmBulkRemoveTagsArgs): Promise<MCPToolResult>;
      /**
       * Create a new email sequence (FluentCRM Pro feature)
       */
      "fluentcrm-create-sequence"(args: FluentCrmFluentcrmCreateSequenceArgs): Promise<MCPToolResult>;
      /**
       * List all email sequences with filters (FluentCRM Pro feature)
       */
      "fluentcrm-list-sequences"(args: FluentCrmFluentcrmListSequencesArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific sequence including emails (FluentCRM Pro feature)
       */
      "fluentcrm-get-sequence"(args: FluentCrmFluentcrmGetSequenceArgs): Promise<MCPToolResult>;
      /**
       * Update an existing email sequence configuration (FluentCRM Pro feature)
       */
      "fluentcrm-update-sequence"(args: FluentCrmFluentcrmUpdateSequenceArgs): Promise<MCPToolResult>;
      /**
       * Delete a sequence permanently (FluentCRM Pro feature)
       */
      "fluentcrm-delete-sequence"(args: FluentCrmFluentcrmDeleteSequenceArgs): Promise<MCPToolResult>;
      /**
       * Enroll a contact in an email sequence (FluentCRM Pro feature)
       */
      "fluentcrm-add-subscriber-to-sequence"(args: FluentCrmFluentcrmAddSubscriberToSequenceArgs): Promise<MCPToolResult>;
      /**
       * Unenroll a contact from an email sequence (FluentCRM Pro feature)
       */
      "fluentcrm-remove-subscriber-from-sequence"(args: FluentCrmFluentcrmRemoveSubscriberFromSequenceArgs): Promise<MCPToolResult>;
      /**
       * Get analytics and performance metrics for a sequence (FluentCRM Pro feature)
       */
      "fluentcrm-get-sequence-performance"(args: FluentCrmFluentcrmGetSequencePerformanceArgs): Promise<MCPToolResult>;
      /**
       * Create a new email template in FluentCRM
       */
      "fluentcrm-create-template"(args: FluentCrmFluentcrmCreateTemplateArgs): Promise<MCPToolResult>;
      /**
       * List all email templates with optional category filtering
       */
      "fluentcrm-list-templates"(args: FluentCrmFluentcrmListTemplatesArgs): Promise<MCPToolResult>;
      /**
       * Get detailed information about a specific email template including HTML content
       */
      "fluentcrm-get-template"(args: FluentCrmFluentcrmGetTemplateArgs): Promise<MCPToolResult>;
      /**
       * Update an existing email template content and settings
       */
      "fluentcrm-update-template"(args: FluentCrmFluentcrmUpdateTemplateArgs): Promise<MCPToolResult>;
      /**
       * Delete an email template from FluentCRM
       */
      "fluentcrm-delete-template"(args: FluentCrmFluentcrmDeleteTemplateArgs): Promise<MCPToolResult>;
      /**
       * Create a copy of an existing email template
       */
      "fluentcrm-duplicate-template"(args: FluentCrmFluentcrmDuplicateTemplateArgs): Promise<MCPToolResult>;
      /**
       * Set a campaign to use a specific email template
       */
      "fluentcrm-apply-template-to-campaign"(args: FluentCrmFluentcrmApplyTemplateToCampaignArgs): Promise<MCPToolResult>;
    };
  };
}

export {};
