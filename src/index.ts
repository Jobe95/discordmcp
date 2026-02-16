import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  CategoryChannel,
  ChannelType,
  Client,
  ColorResolvable,
  GatewayIntentBits,
  GuildChannel,
  GuildMember,
  PermissionFlagsBits,
  Role,
  TextChannel,
  VoiceChannel,
  ThreadAutoArchiveDuration,
  ForumChannel,
  AuditLogEvent,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  AutoModerationRuleTriggerType,
  AutoModerationRuleEventType,
  AutoModerationActionType,
  ActivityType,
} from "discord.js";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

type GuildChannelTypes =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildCategory
  | ChannelType.GuildAnnouncement
  | ChannelType.GuildStageVoice
  | ChannelType.GuildForum;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
  ],
});

// Helper function to find a guild by name or ID
async function findGuild(guildIdentifier?: string) {
  if (!guildIdentifier) {
    if (client.guilds.cache.size === 1) {
      return client.guilds.cache.first()!;
    }
    const guildList = Array.from(client.guilds.cache.values())
      .map((g) => `"${g.name}"`)
      .join(", ");
    throw new Error(
      `Bot is in multiple servers. Please specify server name or ID. Available servers: ${guildList}`,
    );
  }

  try {
    const guild = await client.guilds.fetch(guildIdentifier);
    if (guild) return guild;
  } catch {
    const guilds = client.guilds.cache.filter(
      (g) => g.name.toLowerCase() === guildIdentifier.toLowerCase(),
    );

    if (guilds.size === 0) {
      const availableGuilds = Array.from(client.guilds.cache.values())
        .map((g) => `"${g.name}"`)
        .join(", ");
      throw new Error(
        `Server "${guildIdentifier}" not found. Available servers: ${availableGuilds}`,
      );
    }
    if (guilds.size > 1) {
      const guildList = guilds.map((g) => `${g.name} (ID: ${g.id})`).join(", ");
      throw new Error(
        `Multiple servers found with name "${guildIdentifier}": ${guildList}. Please specify the server ID.`,
      );
    }
    return guilds.first()!;
  }
  throw new Error(`Server "${guildIdentifier}" not found`);
}

// Helper function to find a text channel by name or ID within a specific guild
async function findTextChannel(
  channelIdentifier: string,
  guildIdentifier?: string,
): Promise<TextChannel> {
  const guild = await findGuild(guildIdentifier);

  try {
    const channel = await client.channels.fetch(channelIdentifier);
    if (channel instanceof TextChannel && channel.guild.id === guild.id) {
      return channel;
    }
  } catch {
    const channels = guild.channels.cache.filter(
      (channel): channel is TextChannel =>
        channel instanceof TextChannel &&
        (channel.name.toLowerCase() === channelIdentifier.toLowerCase() ||
          channel.name.toLowerCase() ===
            channelIdentifier.toLowerCase().replace("#", "")),
    );

    if (channels.size === 0) {
      const availableChannels = guild.channels.cache
        .filter((c): c is TextChannel => c instanceof TextChannel)
        .map((c) => `"#${c.name}"`)
        .join(", ");
      throw new Error(
        `Channel "${channelIdentifier}" not found in server "${guild.name}". Available channels: ${availableChannels}`,
      );
    }
    if (channels.size > 1) {
      const channelList = channels
        .map((c) => `#${c.name} (${c.id})`)
        .join(", ");
      throw new Error(
        `Multiple channels found with name "${channelIdentifier}" in server "${guild.name}": ${channelList}. Please specify the channel ID.`,
      );
    }
    return channels.first()!;
  }
  throw new Error(
    `Channel "${channelIdentifier}" is not a text channel or not found in server "${guild.name}"`,
  );
}

// Helper function to find any channel by name or ID
async function findChannel(
  channelIdentifier: string,
  guildIdentifier?: string,
): Promise<GuildChannel> {
  const guild = await findGuild(guildIdentifier);

  try {
    const channel = await client.channels.fetch(channelIdentifier);
    if (channel && "guild" in channel && channel.guild.id === guild.id) {
      return channel as GuildChannel;
    }
  } catch {
    const channels = guild.channels.cache.filter(
      (channel) =>
        channel.name.toLowerCase() === channelIdentifier.toLowerCase() ||
        channel.name.toLowerCase() ===
          channelIdentifier.toLowerCase().replace("#", ""),
    );

    if (channels.size === 0) {
      const availableChannels = guild.channels.cache
        .map((c) => `"${c.name}" (${c.type})`)
        .join(", ");
      throw new Error(
        `Channel "${channelIdentifier}" not found in server "${guild.name}". Available channels: ${availableChannels}`,
      );
    }
    if (channels.size > 1) {
      const channelList = channels.map((c) => `${c.name} (${c.id})`).join(", ");
      throw new Error(
        `Multiple channels found with name "${channelIdentifier}": ${channelList}. Please specify the channel ID.`,
      );
    }
    return channels.first()! as GuildChannel;
  }
  throw new Error(
    `Channel "${channelIdentifier}" not found in server "${guild.name}"`,
  );
}

// Helper function to find a category by name or ID
async function findCategory(
  categoryIdentifier: string,
  guildIdentifier?: string,
): Promise<CategoryChannel> {
  const guild = await findGuild(guildIdentifier);

  try {
    const channel = await client.channels.fetch(categoryIdentifier);
    if (channel instanceof CategoryChannel && channel.guild.id === guild.id) {
      return channel;
    }
  } catch {
    const categories = guild.channels.cache.filter(
      (channel): channel is CategoryChannel =>
        channel instanceof CategoryChannel &&
        channel.name.toLowerCase() === categoryIdentifier.toLowerCase(),
    );

    if (categories.size === 0) {
      const availableCategories = guild.channels.cache
        .filter((c): c is CategoryChannel => c instanceof CategoryChannel)
        .map((c) => `"${c.name}"`)
        .join(", ");
      throw new Error(
        `Category "${categoryIdentifier}" not found. Available categories: ${availableCategories}`,
      );
    }
    if (categories.size > 1) {
      const categoryList = categories
        .map((c) => `${c.name} (${c.id})`)
        .join(", ");
      throw new Error(
        `Multiple categories found with name "${categoryIdentifier}": ${categoryList}. Please specify the category ID.`,
      );
    }
    return categories.first()!;
  }
  throw new Error(`Category "${categoryIdentifier}" not found`);
}

// Helper function to find a role by name or ID
async function findRole(
  roleIdentifier: string,
  guildIdentifier?: string,
): Promise<Role> {
  const guild = await findGuild(guildIdentifier);
  await guild.roles.fetch();

  const role =
    guild.roles.cache.get(roleIdentifier) ||
    guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleIdentifier.toLowerCase(),
    );

  if (!role) {
    const availableRoles = guild.roles.cache
      .filter((r) => r.name !== "@everyone")
      .map((r) => `"${r.name}"`)
      .join(", ");
    throw new Error(
      `Role "${roleIdentifier}" not found. Available roles: ${availableRoles}`,
    );
  }
  return role;
}

// Helper function to find a member by username, display name, or ID
async function findMember(
  memberIdentifier: string,
  guildIdentifier?: string,
): Promise<GuildMember> {
  const guild = await findGuild(guildIdentifier);
  await guild.members.fetch();

  const member =
    guild.members.cache.get(memberIdentifier) ||
    guild.members.cache.find(
      (m) =>
        m.user.username.toLowerCase() === memberIdentifier.toLowerCase() ||
        m.displayName.toLowerCase() === memberIdentifier.toLowerCase() ||
        m.user.tag.toLowerCase() === memberIdentifier.toLowerCase(),
    );

  if (!member) {
    throw new Error(
      `Member "${memberIdentifier}" not found in server "${guild.name}"`,
    );
  }
  return member;
}

// Helper function to find a thread by name or ID
async function findThread(
  threadIdentifier: string,
  guildIdentifier?: string,
) {
  const guild = await findGuild(guildIdentifier);

  try {
    const channel = await client.channels.fetch(threadIdentifier);
    if (channel && channel.isThread() && channel.guild.id === guild.id) {
      return channel;
    }
  } catch {
    // Fetch all active threads
    const { threads } = await guild.channels.fetchActiveThreads();
    const thread = threads.find(
      (t) => t.name.toLowerCase() === threadIdentifier.toLowerCase(),
    );
    if (thread) return thread;

    const availableThreads = threads.map((t) => `"${t.name}"`).join(", ");
    throw new Error(
      `Thread "${threadIdentifier}" not found. Active threads: ${availableThreads || "none"}`,
    );
  }
  throw new Error(`Thread "${threadIdentifier}" not found`);
}

// Helper function to find a forum channel by name or ID
async function findForumChannel(
  channelIdentifier: string,
  guildIdentifier?: string,
): Promise<ForumChannel> {
  const guild = await findGuild(guildIdentifier);

  try {
    const channel = await client.channels.fetch(channelIdentifier);
    if (channel instanceof ForumChannel && channel.guild.id === guild.id) {
      return channel;
    }
  } catch {
    const channels = guild.channels.cache.filter(
      (channel): channel is ForumChannel => channel instanceof ForumChannel &&
        channel.name.toLowerCase() === channelIdentifier.toLowerCase(),
    );

    if (channels.size === 0) {
      const available = guild.channels.cache
        .filter((c): c is ForumChannel => c instanceof ForumChannel)
        .map((c) => `"${c.name}"`)
        .join(", ");
      throw new Error(
        `Forum channel "${channelIdentifier}" not found. Available forums: ${available || "none"}`,
      );
    }
    if (channels.size > 1) {
      const list = channels.map((c) => `${c.name} (${c.id})`).join(", ");
      throw new Error(
        `Multiple forum channels found: ${list}. Specify the channel ID.`,
      );
    }
    return channels.first()!;
  }
  throw new Error(`Forum channel "${channelIdentifier}" not found`);
}

// Helper function to find an emoji by name or ID
async function findEmoji(
  emojiIdentifier: string,
  guildIdentifier?: string,
) {
  const guild = await findGuild(guildIdentifier);
  await guild.emojis.fetch();

  const emoji =
    guild.emojis.cache.get(emojiIdentifier) ||
    guild.emojis.cache.find(
      (e) => e.name?.toLowerCase() === emojiIdentifier.toLowerCase(),
    );

  if (!emoji) {
    const available = guild.emojis.cache
      .map((e) => `"${e.name}"`)
      .join(", ");
    throw new Error(
      `Emoji "${emojiIdentifier}" not found. Available emojis: ${available || "none"}`,
    );
  }
  return emoji;
}

// Helper function to find a scheduled event by name or ID
async function findScheduledEvent(
  eventIdentifier: string,
  guildIdentifier?: string,
) {
  const guild = await findGuild(guildIdentifier);
  const events = await guild.scheduledEvents.fetch();

  const event =
    events.get(eventIdentifier) ||
    events.find(
      (e) => e.name.toLowerCase() === eventIdentifier.toLowerCase(),
    );

  if (!event) {
    const available = events.map((e) => `"${e.name}"`).join(", ");
    throw new Error(
      `Scheduled event "${eventIdentifier}" not found. Available events: ${available || "none"}`,
    );
  }
  return event;
}

// Helper function to find an automod rule by name or ID
async function findAutoModRule(
  ruleIdentifier: string,
  guildIdentifier?: string,
) {
  const guild = await findGuild(guildIdentifier);
  const rules = await guild.autoModerationRules.fetch();

  const rule =
    rules.get(ruleIdentifier) ||
    rules.find(
      (r) => r.name.toLowerCase() === ruleIdentifier.toLowerCase(),
    );

  if (!rule) {
    const available = rules.map((r) => `"${r.name}"`).join(", ");
    throw new Error(
      `AutoMod rule "${ruleIdentifier}" not found. Available rules: ${available || "none"}`,
    );
  }
  return rule;
}

// Validation schemas
const SendMessageSchema = z.object({
  server: z
    .string()
    .optional()
    .describe("Server name or ID (optional if bot is only in one server)"),
  channel: z.string().describe("Channel name or ID"),
  message: z.string(),
});

const ReadMessagesSchema = z.object({
  server: z
    .string()
    .optional()
    .describe("Server name or ID (optional if bot is only in one server)"),
  channel: z.string().describe("Channel name or ID"),
  limit: z.number().min(1).max(100).default(50),
});

const ListServersSchema = z.object({});

const GetServerInfoSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const ListChannelsSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const CreateChannelSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("Channel name"),
  type: z
    .enum(["text", "voice", "category", "announcement", "forum", "stage"])
    .default("text"),
  category: z
    .string()
    .optional()
    .describe("Category name or ID to place the channel in"),
  topic: z.string().optional().describe("Channel topic (for text channels)"),
  nsfw: z.boolean().optional().describe("Whether the channel is NSFW"),
  bitrate: z
    .number()
    .optional()
    .describe("Bitrate for voice channels (8000-96000)"),
  userLimit: z
    .number()
    .optional()
    .describe("User limit for voice channels (0-99, 0 = unlimited)"),
  rateLimitPerUser: z
    .number()
    .optional()
    .describe("Slowmode in seconds (0-21600)"),
  position: z.number().optional().describe("Position of the channel"),
});

const EditChannelSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID to edit"),
  name: z.string().optional().describe("New channel name"),
  topic: z.string().optional().describe("New channel topic"),
  nsfw: z.boolean().optional().describe("Whether the channel is NSFW"),
  bitrate: z.number().optional().describe("Bitrate for voice channels"),
  userLimit: z.number().optional().describe("User limit for voice channels"),
  rateLimitPerUser: z.number().optional().describe("Slowmode in seconds"),
  position: z.number().optional().describe("New position"),
  category: z
    .string()
    .optional()
    .describe(
      'Category to move channel to (use "none" to remove from category)',
    ),
});

const DeleteChannelSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID to delete"),
});

const ListRolesSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const CreateRoleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("Role name"),
  color: z
    .string()
    .optional()
    .describe("Role color (hex code like #FF0000 or color name)"),
  hoist: z
    .boolean()
    .optional()
    .describe("Whether to display role members separately"),
  mentionable: z
    .boolean()
    .optional()
    .describe("Whether the role can be mentioned"),
  permissions: z
    .array(z.string())
    .optional()
    .describe("Array of permission names"),
  position: z.number().optional().describe("Role position"),
});

const EditRoleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  role: z.string().describe("Role name or ID to edit"),
  name: z.string().optional().describe("New role name"),
  color: z.string().optional().describe("New role color"),
  hoist: z
    .boolean()
    .optional()
    .describe("Whether to display role members separately"),
  mentionable: z
    .boolean()
    .optional()
    .describe("Whether the role can be mentioned"),
  permissions: z
    .array(z.string())
    .optional()
    .describe("Array of permission names"),
  position: z.number().optional().describe("New role position"),
});

const DeleteRoleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  role: z.string().describe("Role name or ID to delete"),
});

const AssignRoleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member username, display name, or ID"),
  role: z.string().describe("Role name or ID to assign"),
});

const RemoveRoleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member username, display name, or ID"),
  role: z.string().describe("Role name or ID to remove"),
});

const ListMembersSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  limit: z.number().min(1).max(1000).default(100),
});

const GetMemberInfoSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member username, display name, or ID"),
});

const KickMemberSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member to kick"),
  reason: z.string().optional().describe("Reason for kick"),
});

const BanMemberSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member to ban"),
  reason: z.string().optional().describe("Reason for ban"),
  deleteMessageDays: z
    .number()
    .min(0)
    .max(7)
    .optional()
    .describe("Days of messages to delete (0-7)"),
});

const UnbanMemberSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  userId: z.string().describe("User ID to unban"),
  reason: z.string().optional().describe("Reason for unban"),
});

const TimeoutMemberSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member to timeout"),
  duration: z
    .number()
    .describe("Timeout duration in minutes (0 to remove timeout)"),
  reason: z.string().optional().describe("Reason for timeout"),
});

const SetChannelPermissionsSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  target: z.string().describe("Role or member name/ID to set permissions for"),
  targetType: z
    .enum(["role", "member"])
    .describe("Whether target is a role or member"),
  allow: z.array(z.string()).optional().describe("Permissions to allow"),
  deny: z.array(z.string()).optional().describe("Permissions to deny"),
});

const CreateCategorySchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("Category name"),
  position: z.number().optional().describe("Category position"),
});

const MoveChannelToCategorySchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  category: z
    .string()
    .describe('Category name or ID (use "none" to remove from category)'),
});

const CreateWebhookSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  name: z.string().describe("Webhook name"),
  avatar: z.string().optional().describe("Avatar URL"),
});

const ListWebhooksSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z
    .string()
    .optional()
    .describe(
      "Channel name or ID (optional, lists all server webhooks if not provided)",
    ),
});

const DeleteWebhookSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  webhookId: z.string().describe("Webhook ID to delete"),
});

const PinMessageSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  messageId: z.string().describe("Message ID to pin"),
});

const UnpinMessageSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  messageId: z.string().describe("Message ID to unpin"),
});

const GetPinnedMessagesSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
});

const DeleteMessageSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  messageId: z.string().describe("Message ID to delete"),
});

const BulkDeleteMessagesSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  count: z
    .number()
    .min(2)
    .max(100)
    .describe("Number of messages to delete (2-100)"),
});

const SetServerNameSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("New server name"),
});

const CreateInviteSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  maxAge: z
    .number()
    .optional()
    .describe("Max age in seconds (0 = never expires)"),
  maxUses: z.number().optional().describe("Max uses (0 = unlimited)"),
  temporary: z.boolean().optional().describe("Whether membership is temporary"),
  unique: z.boolean().optional().describe("Whether to create a unique invite"),
});

const ListInvitesSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const DeleteInviteSchema = z.object({
  code: z.string().describe("Invite code to delete"),
});

const ListBansSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

// Thread schemas
const CreateThreadSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID to create thread in"),
  name: z.string().describe("Thread name"),
  message: z.string().optional().describe("Message ID to create thread from"),
  autoArchiveDuration: z.enum(["60", "1440", "4320", "10080"]).optional().describe("Auto-archive duration in minutes (60, 1440, 4320, 10080)"),
  type: z.enum(["public", "private"]).default("public").describe("Thread type"),
});

const ListThreadsSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Channel name or ID"),
  archived: z.boolean().default(false).describe("Include archived threads"),
});

const SendThreadMessageSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  thread: z.string().describe("Thread name or ID"),
  message: z.string().describe("Message content"),
});

const ArchiveThreadSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  thread: z.string().describe("Thread name or ID"),
  archived: z.boolean().default(true).describe("true to archive, false to unarchive"),
});

const DeleteThreadSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  thread: z.string().describe("Thread name or ID"),
});

const EditThreadSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  thread: z.string().describe("Thread name or ID"),
  name: z.string().optional().describe("New thread name"),
  autoArchiveDuration: z.enum(["60", "1440", "4320", "10080"]).optional().describe("Auto-archive in minutes"),
  rateLimitPerUser: z.number().optional().describe("Slowmode in seconds (0-21600)"),
  locked: z.boolean().optional().describe("Whether thread is locked"),
});

// Forum schemas
const CreateForumPostSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Forum channel name or ID"),
  name: z.string().describe("Post title"),
  content: z.string().describe("Post content"),
  tags: z.array(z.string()).optional().describe("Tag names to apply"),
});

const ListForumTagsSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Forum channel name or ID"),
});

const ManageForumTagsSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  channel: z.string().describe("Forum channel name or ID"),
  action: z.enum(["create", "edit", "delete"]).describe("Action to perform"),
  name: z.string().describe("Tag name (for create/edit: new name, for delete: existing name)"),
  newName: z.string().optional().describe("New name when editing"),
  emoji: z.string().optional().describe("Unicode emoji for the tag"),
  moderated: z.boolean().optional().describe("Whether only mods can apply this tag"),
});

// Guild settings schemas
const EditServerSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().optional().describe("New server name"),
  description: z.string().optional().describe("Server description"),
  icon: z.string().optional().describe("Icon URL or base64"),
  systemChannel: z.string().optional().describe("System channel name or ID"),
  afkChannel: z.string().optional().describe("AFK voice channel name or ID"),
  afkTimeout: z.number().optional().describe("AFK timeout in seconds (60, 300, 900, 1800, 3600)"),
  verificationLevel: z.enum(["none", "low", "medium", "high", "very_high"]).optional().describe("Verification level"),
  defaultNotifications: z.enum(["all", "mentions"]).optional().describe("Default notification setting"),
  explicitContentFilter: z.enum(["disabled", "members_without_roles", "all_members"]).optional().describe("Explicit content filter"),
});

const SetBotNicknameSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  nickname: z.string().optional().describe("New nickname (omit to clear)"),
});

const SetBotActivitySchema = z.object({
  type: z.enum(["playing", "watching", "listening", "competing"]).describe("Activity type"),
  name: z.string().describe("Activity text"),
  status: z.enum(["online", "idle", "dnd", "invisible"]).default("online").describe("Bot status"),
});

// Emoji schemas
const ListEmojisSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const CreateEmojiSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("Emoji name"),
  url: z.string().describe("Image URL for the emoji"),
  roles: z.array(z.string()).optional().describe("Roles that can use this emoji"),
});

const DeleteEmojiSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  emoji: z.string().describe("Emoji name or ID"),
});

// Scheduled event schemas
const CreateEventSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("Event name"),
  description: z.string().optional().describe("Event description"),
  startTime: z.string().describe("Start time (ISO 8601)"),
  endTime: z.string().optional().describe("End time (ISO 8601, required for external events)"),
  channel: z.string().optional().describe("Voice/stage channel for the event"),
  location: z.string().optional().describe("External location (if not in a channel)"),
  image: z.string().optional().describe("Event cover image URL"),
});

const ListEventsSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const EditEventSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  event: z.string().describe("Event name or ID"),
  name: z.string().optional().describe("New event name"),
  description: z.string().optional().describe("New description"),
  startTime: z.string().optional().describe("New start time (ISO 8601)"),
  endTime: z.string().optional().describe("New end time (ISO 8601)"),
  status: z.enum(["scheduled", "active", "completed", "canceled"]).optional().describe("Event status"),
});

const DeleteEventSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  event: z.string().describe("Event name or ID"),
});

// Audit log schema
const GetAuditLogSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  limit: z.number().min(1).max(100).default(10).describe("Number of entries"),
  type: z.string().optional().describe("Action type filter (e.g. ChannelCreate, MemberBanAdd)"),
  user: z.string().optional().describe("Filter by user who performed action"),
});

// AutoMod schemas
const ListAutoModRulesSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
});

const CreateAutoModRuleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  name: z.string().describe("Rule name"),
  triggerType: z.enum(["keyword", "spam", "keyword_preset", "mention_spam"]).describe("Trigger type"),
  keywords: z.array(z.string()).optional().describe("Keywords to filter (for keyword trigger)"),
  regexPatterns: z.array(z.string()).optional().describe("Regex patterns (for keyword trigger)"),
  presets: z.array(z.enum(["profanity", "sexual_content", "slurs"])).optional().describe("Preset word lists"),
  mentionLimit: z.number().optional().describe("Max mentions per message (for mention_spam)"),
  actions: z.array(z.object({
    type: z.enum(["block", "alert", "timeout"]).describe("Action type"),
    channel: z.string().optional().describe("Alert channel (for alert action)"),
    duration: z.number().optional().describe("Timeout duration in seconds (for timeout action)"),
  })).describe("Actions to take when rule triggers"),
  enabled: z.boolean().default(true),
});

const EditAutoModRuleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  rule: z.string().describe("Rule name or ID"),
  name: z.string().optional().describe("New rule name"),
  enabled: z.boolean().optional().describe("Enable/disable rule"),
  keywords: z.array(z.string()).optional().describe("New keywords"),
  regexPatterns: z.array(z.string()).optional().describe("New regex patterns"),
  actions: z.array(z.object({
    type: z.enum(["block", "alert", "timeout"]),
    channel: z.string().optional(),
    duration: z.number().optional(),
  })).optional().describe("New actions"),
});

const DeleteAutoModRuleSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  rule: z.string().describe("Rule name or ID"),
});

// Nickname schema
const SetNicknameSchema = z.object({
  server: z.string().optional().describe("Server name or ID"),
  member: z.string().describe("Member username, display name, or ID"),
  nickname: z.string().optional().describe("New nickname (omit to clear)"),
});

// Permission name to flag mapping (supports SCREAMING_SNAKE_CASE input)
const permissionMapping: Record<string, bigint> = {
  CREATE_INSTANT_INVITE: PermissionFlagsBits.CreateInstantInvite,
  KICK_MEMBERS: PermissionFlagsBits.KickMembers,
  BAN_MEMBERS: PermissionFlagsBits.BanMembers,
  ADMINISTRATOR: PermissionFlagsBits.Administrator,
  MANAGE_CHANNELS: PermissionFlagsBits.ManageChannels,
  MANAGE_GUILD: PermissionFlagsBits.ManageGuild,
  ADD_REACTIONS: PermissionFlagsBits.AddReactions,
  VIEW_AUDIT_LOG: PermissionFlagsBits.ViewAuditLog,
  PRIORITY_SPEAKER: PermissionFlagsBits.PrioritySpeaker,
  STREAM: PermissionFlagsBits.Stream,
  VIEW_CHANNEL: PermissionFlagsBits.ViewChannel,
  SEND_MESSAGES: PermissionFlagsBits.SendMessages,
  SEND_TTS_MESSAGES: PermissionFlagsBits.SendTTSMessages,
  MANAGE_MESSAGES: PermissionFlagsBits.ManageMessages,
  EMBED_LINKS: PermissionFlagsBits.EmbedLinks,
  ATTACH_FILES: PermissionFlagsBits.AttachFiles,
  READ_MESSAGE_HISTORY: PermissionFlagsBits.ReadMessageHistory,
  MENTION_EVERYONE: PermissionFlagsBits.MentionEveryone,
  USE_EXTERNAL_EMOJIS: PermissionFlagsBits.UseExternalEmojis,
  VIEW_GUILD_INSIGHTS: PermissionFlagsBits.ViewGuildInsights,
  CONNECT: PermissionFlagsBits.Connect,
  SPEAK: PermissionFlagsBits.Speak,
  MUTE_MEMBERS: PermissionFlagsBits.MuteMembers,
  DEAFEN_MEMBERS: PermissionFlagsBits.DeafenMembers,
  MOVE_MEMBERS: PermissionFlagsBits.MoveMembers,
  USE_VAD: PermissionFlagsBits.UseVAD,
  CHANGE_NICKNAME: PermissionFlagsBits.ChangeNickname,
  MANAGE_NICKNAMES: PermissionFlagsBits.ManageNicknames,
  MANAGE_ROLES: PermissionFlagsBits.ManageRoles,
  MANAGE_WEBHOOKS: PermissionFlagsBits.ManageWebhooks,
  MANAGE_EMOJIS_AND_STICKERS: PermissionFlagsBits.ManageGuildExpressions,
  USE_APPLICATION_COMMANDS: PermissionFlagsBits.UseApplicationCommands,
  REQUEST_TO_SPEAK: PermissionFlagsBits.RequestToSpeak,
  MANAGE_EVENTS: PermissionFlagsBits.ManageEvents,
  MANAGE_THREADS: PermissionFlagsBits.ManageThreads,
  CREATE_PUBLIC_THREADS: PermissionFlagsBits.CreatePublicThreads,
  CREATE_PRIVATE_THREADS: PermissionFlagsBits.CreatePrivateThreads,
  USE_EXTERNAL_STICKERS: PermissionFlagsBits.UseExternalStickers,
  SEND_MESSAGES_IN_THREADS: PermissionFlagsBits.SendMessagesInThreads,
  USE_EMBEDDED_ACTIVITIES: PermissionFlagsBits.UseEmbeddedActivities,
  MODERATE_MEMBERS: PermissionFlagsBits.ModerateMembers,
};

// Maps SCREAMING_SNAKE_CASE to PascalCase for discord.js permissionOverwrites.edit()
const permissionNameMapping: Record<string, string> = {
  CREATE_INSTANT_INVITE: "CreateInstantInvite",
  KICK_MEMBERS: "KickMembers",
  BAN_MEMBERS: "BanMembers",
  ADMINISTRATOR: "Administrator",
  MANAGE_CHANNELS: "ManageChannels",
  MANAGE_GUILD: "ManageGuild",
  ADD_REACTIONS: "AddReactions",
  VIEW_AUDIT_LOG: "ViewAuditLog",
  PRIORITY_SPEAKER: "PrioritySpeaker",
  STREAM: "Stream",
  VIEW_CHANNEL: "ViewChannel",
  SEND_MESSAGES: "SendMessages",
  SEND_TTS_MESSAGES: "SendTTSMessages",
  MANAGE_MESSAGES: "ManageMessages",
  EMBED_LINKS: "EmbedLinks",
  ATTACH_FILES: "AttachFiles",
  READ_MESSAGE_HISTORY: "ReadMessageHistory",
  MENTION_EVERYONE: "MentionEveryone",
  USE_EXTERNAL_EMOJIS: "UseExternalEmojis",
  VIEW_GUILD_INSIGHTS: "ViewGuildInsights",
  CONNECT: "Connect",
  SPEAK: "Speak",
  MUTE_MEMBERS: "MuteMembers",
  DEAFEN_MEMBERS: "DeafenMembers",
  MOVE_MEMBERS: "MoveMembers",
  USE_VAD: "UseVAD",
  CHANGE_NICKNAME: "ChangeNickname",
  MANAGE_NICKNAMES: "ManageNicknames",
  MANAGE_ROLES: "ManageRoles",
  MANAGE_WEBHOOKS: "ManageWebhooks",
  MANAGE_EMOJIS_AND_STICKERS: "ManageGuildExpressions",
  USE_APPLICATION_COMMANDS: "UseApplicationCommands",
  REQUEST_TO_SPEAK: "RequestToSpeak",
  MANAGE_EVENTS: "ManageEvents",
  MANAGE_THREADS: "ManageThreads",
  CREATE_PUBLIC_THREADS: "CreatePublicThreads",
  CREATE_PRIVATE_THREADS: "CreatePrivateThreads",
  USE_EXTERNAL_STICKERS: "UseExternalStickers",
  SEND_MESSAGES_IN_THREADS: "SendMessagesInThreads",
  USE_EMBEDDED_ACTIVITIES: "UseEmbeddedActivities",
  MODERATE_MEMBERS: "ModerateMembers",
};

function parsePermissions(permissions: string[]): bigint {
  let result = BigInt(0);
  for (const perm of permissions) {
    const flag = permissionMapping[perm.toUpperCase()];
    if (flag) {
      result |= flag;
    }
  }
  return result;
}

function buildPermissionOverwriteOptions(
  allow?: string[],
  deny?: string[],
): Record<string, boolean> {
  const options: Record<string, boolean> = {};

  if (allow) {
    for (const perm of allow) {
      const pascalName = permissionNameMapping[perm.toUpperCase()];
      if (pascalName) {
        options[pascalName] = true;
      }
    }
  }

  if (deny) {
    for (const perm of deny) {
      const pascalName = permissionNameMapping[perm.toUpperCase()];
      if (pascalName) {
        options[pascalName] = false;
      }
    }
  }

  return options;
}

function getChannelTypeName(type: ChannelType): string {
  const typeNames: Record<number, string> = {
    [ChannelType.GuildText]: "text",
    [ChannelType.GuildVoice]: "voice",
    [ChannelType.GuildCategory]: "category",
    [ChannelType.GuildAnnouncement]: "announcement",
    [ChannelType.GuildForum]: "forum",
    [ChannelType.GuildStageVoice]: "stage",
  };
  return typeNames[type] || "unknown";
}

// Create server instance
const server = new Server(
  {
    name: "discord",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Message tools
      {
        name: "send-message",
        description: "Send a message to a Discord channel",
        inputSchema: {
          type: "object",
          properties: {
            server: {
              type: "string",
              description:
                "Server name or ID (optional if bot is only in one server)",
            },
            channel: { type: "string", description: "Channel name or ID" },
            message: { type: "string", description: "Message content to send" },
          },
          required: ["channel", "message"],
        },
      },
      {
        name: "read-messages",
        description: "Read recent messages from a Discord channel",
        inputSchema: {
          type: "object",
          properties: {
            server: {
              type: "string",
              description:
                "Server name or ID (optional if bot is only in one server)",
            },
            channel: { type: "string", description: "Channel name or ID" },
            limit: {
              type: "number",
              description: "Number of messages to fetch (max 100)",
              default: 50,
            },
          },
          required: ["channel"],
        },
      },
      {
        name: "delete-message",
        description: "Delete a specific message",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            messageId: { type: "string", description: "Message ID to delete" },
          },
          required: ["channel", "messageId"],
        },
      },
      {
        name: "bulk-delete-messages",
        description:
          "Delete multiple recent messages (2-100, messages must be less than 14 days old)",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            count: {
              type: "number",
              description: "Number of messages to delete (2-100)",
            },
          },
          required: ["channel", "count"],
        },
      },
      {
        name: "pin-message",
        description: "Pin a message in a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            messageId: { type: "string", description: "Message ID to pin" },
          },
          required: ["channel", "messageId"],
        },
      },
      {
        name: "unpin-message",
        description: "Unpin a message in a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            messageId: { type: "string", description: "Message ID to unpin" },
          },
          required: ["channel", "messageId"],
        },
      },
      {
        name: "get-pinned-messages",
        description: "Get all pinned messages in a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
          },
          required: ["channel"],
        },
      },
      // Server tools
      {
        name: "list-servers",
        description: "List all Discord servers the bot is in",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get-server-info",
        description: "Get detailed information about a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "set-server-name",
        description: "Change the server name",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "New server name" },
          },
          required: ["name"],
        },
      },
      // Channel tools
      {
        name: "list-channels",
        description: "List all channels in a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "create-channel",
        description: "Create a new channel in a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "Channel name" },
            type: {
              type: "string",
              enum: [
                "text",
                "voice",
                "category",
                "announcement",
                "forum",
                "stage",
              ],
              description: "Channel type",
              default: "text",
            },
            category: {
              type: "string",
              description: "Category name or ID to place the channel in",
            },
            topic: {
              type: "string",
              description: "Channel topic (for text channels)",
            },
            nsfw: {
              type: "boolean",
              description: "Whether the channel is NSFW",
            },
            bitrate: {
              type: "number",
              description: "Bitrate for voice channels (8000-96000)",
            },
            userLimit: {
              type: "number",
              description: "User limit for voice channels (0-99)",
            },
            rateLimitPerUser: {
              type: "number",
              description: "Slowmode in seconds (0-21600)",
            },
            position: {
              type: "number",
              description: "Position of the channel",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "edit-channel",
        description: "Edit an existing channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: {
              type: "string",
              description: "Channel name or ID to edit",
            },
            name: { type: "string", description: "New channel name" },
            topic: { type: "string", description: "New channel topic" },
            nsfw: {
              type: "boolean",
              description: "Whether the channel is NSFW",
            },
            bitrate: {
              type: "number",
              description: "Bitrate for voice channels",
            },
            userLimit: {
              type: "number",
              description: "User limit for voice channels",
            },
            rateLimitPerUser: {
              type: "number",
              description: "Slowmode in seconds",
            },
            position: { type: "number", description: "New position" },
            category: {
              type: "string",
              description: "Category to move channel to (use 'none' to remove)",
            },
          },
          required: ["channel"],
        },
      },
      {
        name: "delete-channel",
        description: "Delete a channel from a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: {
              type: "string",
              description: "Channel name or ID to delete",
            },
          },
          required: ["channel"],
        },
      },
      {
        name: "create-category",
        description: "Create a new category in a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "Category name" },
            position: { type: "number", description: "Category position" },
          },
          required: ["name"],
        },
      },
      {
        name: "move-channel-to-category",
        description: "Move a channel to a category",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            category: {
              type: "string",
              description:
                "Category name or ID (use 'none' to remove from category)",
            },
          },
          required: ["channel", "category"],
        },
      },
      {
        name: "set-channel-permissions",
        description: "Set permissions for a role or member on a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            target: { type: "string", description: "Role or member name/ID" },
            targetType: {
              type: "string",
              enum: ["role", "member"],
              description: "Whether target is a role or member",
            },
            allow: {
              type: "array",
              items: { type: "string" },
              description: "Permissions to allow",
            },
            deny: {
              type: "array",
              items: { type: "string" },
              description: "Permissions to deny",
            },
          },
          required: ["channel", "target", "targetType"],
        },
      },
      // Role tools
      {
        name: "list-roles",
        description: "List all roles in a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "create-role",
        description: "Create a new role in a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "Role name" },
            color: {
              type: "string",
              description: "Role color (hex code like #FF0000)",
            },
            hoist: {
              type: "boolean",
              description: "Display role members separately",
            },
            mentionable: {
              type: "boolean",
              description: "Allow anyone to mention this role",
            },
            permissions: {
              type: "array",
              items: { type: "string" },
              description:
                "Permission names (e.g., SEND_MESSAGES, MANAGE_CHANNELS)",
            },
            position: { type: "number", description: "Role position" },
          },
          required: ["name"],
        },
      },
      {
        name: "edit-role",
        description: "Edit an existing role",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            role: { type: "string", description: "Role name or ID to edit" },
            name: { type: "string", description: "New role name" },
            color: { type: "string", description: "New role color" },
            hoist: {
              type: "boolean",
              description: "Display role members separately",
            },
            mentionable: {
              type: "boolean",
              description: "Allow anyone to mention this role",
            },
            permissions: {
              type: "array",
              items: { type: "string" },
              description: "Permission names",
            },
            position: { type: "number", description: "New role position" },
          },
          required: ["role"],
        },
      },
      {
        name: "delete-role",
        description: "Delete a role from a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            role: { type: "string", description: "Role name or ID to delete" },
          },
          required: ["role"],
        },
      },
      {
        name: "assign-role",
        description: "Assign a role to a member",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: {
              type: "string",
              description: "Member username, display name, or ID",
            },
            role: { type: "string", description: "Role name or ID to assign" },
          },
          required: ["member", "role"],
        },
      },
      {
        name: "remove-role",
        description: "Remove a role from a member",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: {
              type: "string",
              description: "Member username, display name, or ID",
            },
            role: { type: "string", description: "Role name or ID to remove" },
          },
          required: ["member", "role"],
        },
      },
      // Member tools
      {
        name: "list-members",
        description: "List members in a Discord server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            limit: {
              type: "number",
              description: "Number of members to fetch (max 1000)",
              default: 100,
            },
          },
        },
      },
      {
        name: "get-member-info",
        description: "Get detailed information about a server member",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: {
              type: "string",
              description: "Member username, display name, or ID",
            },
          },
          required: ["member"],
        },
      },
      {
        name: "kick-member",
        description: "Kick a member from the server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: { type: "string", description: "Member to kick" },
            reason: { type: "string", description: "Reason for kick" },
          },
          required: ["member"],
        },
      },
      {
        name: "ban-member",
        description: "Ban a member from the server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: { type: "string", description: "Member to ban" },
            reason: { type: "string", description: "Reason for ban" },
            deleteMessageDays: {
              type: "number",
              description: "Days of messages to delete (0-7)",
            },
          },
          required: ["member"],
        },
      },
      {
        name: "unban-member",
        description: "Unban a user from the server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            userId: { type: "string", description: "User ID to unban" },
            reason: { type: "string", description: "Reason for unban" },
          },
          required: ["userId"],
        },
      },
      {
        name: "timeout-member",
        description: "Timeout (mute) a member for a specified duration",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: { type: "string", description: "Member to timeout" },
            duration: {
              type: "number",
              description: "Timeout duration in minutes (0 to remove)",
            },
            reason: { type: "string", description: "Reason for timeout" },
          },
          required: ["member", "duration"],
        },
      },
      {
        name: "list-bans",
        description: "List all banned users in the server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      // Webhook tools
      {
        name: "create-webhook",
        description: "Create a webhook for a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            name: { type: "string", description: "Webhook name" },
            avatar: { type: "string", description: "Avatar URL" },
          },
          required: ["channel", "name"],
        },
      },
      {
        name: "list-webhooks",
        description: "List webhooks in a server or channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: {
              type: "string",
              description: "Channel name or ID (optional)",
            },
          },
        },
      },
      {
        name: "delete-webhook",
        description: "Delete a webhook",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            webhookId: { type: "string", description: "Webhook ID to delete" },
          },
          required: ["webhookId"],
        },
      },
      // Invite tools
      {
        name: "create-invite",
        description: "Create an invite link for a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            maxAge: {
              type: "number",
              description: "Max age in seconds (0 = never expires)",
            },
            maxUses: {
              type: "number",
              description: "Max uses (0 = unlimited)",
            },
            temporary: {
              type: "boolean",
              description: "Grant temporary membership",
            },
            unique: { type: "boolean", description: "Create a unique invite" },
          },
          required: ["channel"],
        },
      },
      {
        name: "list-invites",
        description: "List all invites in a server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "delete-invite",
        description: "Delete an invite",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "Invite code to delete" },
          },
          required: ["code"],
        },
      },
      // Thread tools
      {
        name: "create-thread",
        description: "Create a thread in a channel, optionally from a message",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID (optional if bot is only in one server)" },
            channel: { type: "string", description: "Channel name or ID to create thread in" },
            name: { type: "string", description: "Thread name" },
            message: { type: "string", description: "Message ID to create thread from (optional)" },
            autoArchiveDuration: { type: "string", enum: ["60", "1440", "4320", "10080"], description: "Auto-archive in minutes" },
            type: { type: "string", enum: ["public", "private"], description: "Thread type", default: "public" },
          },
          required: ["channel", "name"],
        },
      },
      {
        name: "list-threads",
        description: "List threads in a channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Channel name or ID" },
            archived: { type: "boolean", description: "Include archived threads", default: false },
          },
          required: ["channel"],
        },
      },
      {
        name: "send-thread-message",
        description: "Send a message to a thread",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            thread: { type: "string", description: "Thread name or ID" },
            message: { type: "string", description: "Message content" },
          },
          required: ["thread", "message"],
        },
      },
      {
        name: "archive-thread",
        description: "Archive or unarchive a thread",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            thread: { type: "string", description: "Thread name or ID" },
            archived: { type: "boolean", description: "true to archive, false to unarchive", default: true },
          },
          required: ["thread"],
        },
      },
      {
        name: "delete-thread",
        description: "Delete a thread",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            thread: { type: "string", description: "Thread name or ID" },
          },
          required: ["thread"],
        },
      },
      {
        name: "edit-thread",
        description: "Edit thread settings (name, archive duration, slowmode, locked)",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            thread: { type: "string", description: "Thread name or ID" },
            name: { type: "string", description: "New thread name" },
            autoArchiveDuration: { type: "string", enum: ["60", "1440", "4320", "10080"], description: "Auto-archive in minutes" },
            rateLimitPerUser: { type: "number", description: "Slowmode in seconds (0-21600)" },
            locked: { type: "boolean", description: "Whether thread is locked" },
          },
          required: ["thread"],
        },
      },
      // Forum tools
      {
        name: "create-forum-post",
        description: "Create a post in a forum channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Forum channel name or ID" },
            name: { type: "string", description: "Post title" },
            content: { type: "string", description: "Post content" },
            tags: { type: "array", items: { type: "string" }, description: "Tag names to apply" },
          },
          required: ["channel", "name", "content"],
        },
      },
      {
        name: "list-forum-tags",
        description: "List available tags on a forum channel",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Forum channel name or ID" },
          },
          required: ["channel"],
        },
      },
      {
        name: "manage-forum-tags",
        description: "Create, edit, or delete forum tags",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            channel: { type: "string", description: "Forum channel name or ID" },
            action: { type: "string", enum: ["create", "edit", "delete"], description: "Action" },
            name: { type: "string", description: "Tag name" },
            newName: { type: "string", description: "New name when editing" },
            emoji: { type: "string", description: "Unicode emoji" },
            moderated: { type: "boolean", description: "Only mods can apply" },
          },
          required: ["channel", "action", "name"],
        },
      },
      // Guild settings tools
      {
        name: "edit-server",
        description: "Edit server settings (name, description, icon, verification, notifications, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "New server name" },
            description: { type: "string", description: "Server description" },
            icon: { type: "string", description: "Icon URL" },
            systemChannel: { type: "string", description: "System channel name or ID" },
            afkChannel: { type: "string", description: "AFK voice channel name or ID" },
            afkTimeout: { type: "number", description: "AFK timeout in seconds" },
            verificationLevel: { type: "string", enum: ["none", "low", "medium", "high", "very_high"], description: "Verification level" },
            defaultNotifications: { type: "string", enum: ["all", "mentions"], description: "Default notifications" },
            explicitContentFilter: { type: "string", enum: ["disabled", "members_without_roles", "all_members"], description: "Content filter" },
          },
        },
      },
      {
        name: "set-bot-nickname",
        description: "Change the bot's nickname in a server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            nickname: { type: "string", description: "New nickname (omit to clear)" },
          },
        },
      },
      {
        name: "set-bot-activity",
        description: "Set the bot's activity/presence (playing, watching, listening, competing)",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["playing", "watching", "listening", "competing"], description: "Activity type" },
            name: { type: "string", description: "Activity text" },
            status: { type: "string", enum: ["online", "idle", "dnd", "invisible"], description: "Bot status", default: "online" },
          },
          required: ["type", "name"],
        },
      },
      // Emoji tools
      {
        name: "list-emojis",
        description: "List all custom emojis in the server",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "create-emoji",
        description: "Create a custom emoji from an image URL",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "Emoji name" },
            url: { type: "string", description: "Image URL" },
            roles: { type: "array", items: { type: "string" }, description: "Roles that can use this emoji" },
          },
          required: ["name", "url"],
        },
      },
      {
        name: "delete-emoji",
        description: "Delete a custom emoji",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            emoji: { type: "string", description: "Emoji name or ID" },
          },
          required: ["emoji"],
        },
      },
      // Scheduled event tools
      {
        name: "create-event",
        description: "Create a scheduled event (in voice/stage channel or external location)",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "Event name" },
            description: { type: "string", description: "Event description" },
            startTime: { type: "string", description: "Start time (ISO 8601)" },
            endTime: { type: "string", description: "End time (ISO 8601, required for external)" },
            channel: { type: "string", description: "Voice/stage channel (omit for external)" },
            location: { type: "string", description: "External location" },
            image: { type: "string", description: "Cover image URL" },
          },
          required: ["name", "startTime"],
        },
      },
      {
        name: "list-events",
        description: "List scheduled events",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "edit-event",
        description: "Edit a scheduled event",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            event: { type: "string", description: "Event name or ID" },
            name: { type: "string", description: "New name" },
            description: { type: "string", description: "New description" },
            startTime: { type: "string", description: "New start time" },
            endTime: { type: "string", description: "New end time" },
            status: { type: "string", enum: ["scheduled", "active", "completed", "canceled"], description: "Event status" },
          },
          required: ["event"],
        },
      },
      {
        name: "delete-event",
        description: "Delete a scheduled event",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            event: { type: "string", description: "Event name or ID" },
          },
          required: ["event"],
        },
      },
      // Audit log tool
      {
        name: "get-audit-log",
        description: "Fetch audit log entries with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            limit: { type: "number", description: "Number of entries (max 100)", default: 10 },
            type: { type: "string", description: "Action type (e.g. ChannelCreate, MemberBanAdd)" },
            user: { type: "string", description: "Filter by user" },
          },
        },
      },
      // AutoMod tools
      {
        name: "list-automod-rules",
        description: "List all auto-moderation rules",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
          },
        },
      },
      {
        name: "create-automod-rule",
        description: "Create an auto-moderation rule (keyword filter, spam, mention spam)",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            name: { type: "string", description: "Rule name" },
            triggerType: { type: "string", enum: ["keyword", "spam", "keyword_preset", "mention_spam"], description: "Trigger type" },
            keywords: { type: "array", items: { type: "string" }, description: "Keywords to filter" },
            regexPatterns: { type: "array", items: { type: "string" }, description: "Regex patterns" },
            presets: { type: "array", items: { type: "string", enum: ["profanity", "sexual_content", "slurs"] }, description: "Preset word lists" },
            mentionLimit: { type: "number", description: "Max mentions per message" },
            actions: { type: "array", items: { type: "object", properties: { type: { type: "string", enum: ["block", "alert", "timeout"] }, channel: { type: "string" }, duration: { type: "number" } }, required: ["type"] }, description: "Actions to take" },
            enabled: { type: "boolean", description: "Enable rule", default: true },
          },
          required: ["name", "triggerType", "actions"],
        },
      },
      {
        name: "edit-automod-rule",
        description: "Edit an auto-moderation rule",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            rule: { type: "string", description: "Rule name or ID" },
            name: { type: "string", description: "New name" },
            enabled: { type: "boolean", description: "Enable/disable" },
            keywords: { type: "array", items: { type: "string" }, description: "New keywords" },
            regexPatterns: { type: "array", items: { type: "string" }, description: "New regex" },
            actions: { type: "array", items: { type: "object", properties: { type: { type: "string", enum: ["block", "alert", "timeout"] }, channel: { type: "string" }, duration: { type: "number" } }, required: ["type"] }, description: "New actions" },
          },
          required: ["rule"],
        },
      },
      {
        name: "delete-automod-rule",
        description: "Delete an auto-moderation rule",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            rule: { type: "string", description: "Rule name or ID" },
          },
          required: ["rule"],
        },
      },
      // Nickname tool
      {
        name: "set-nickname",
        description: "Set or clear a member's nickname",
        inputSchema: {
          type: "object",
          properties: {
            server: { type: "string", description: "Server name or ID" },
            member: { type: "string", description: "Member username, display name, or ID" },
            nickname: { type: "string", description: "New nickname (omit to clear)" },
          },
          required: ["member"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Message tools
      case "send-message": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          message,
        } = SendMessageSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const sent = await channel.send(message);
        return {
          content: [
            {
              type: "text",
              text: `Message sent successfully to #${channel.name} in ${channel.guild.name}. Message ID: ${sent.id}`,
            },
          ],
        };
      }

      case "read-messages": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          limit,
        } = ReadMessagesSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const messages = await channel.messages.fetch({ limit });
        const formattedMessages = Array.from(messages.values())
          .reverse()
          .map((msg) => ({
            id: msg.id,
            channel: `#${channel.name}`,
            server: channel.guild.name,
            author: msg.author.tag,
            content: msg.content,
            timestamp: msg.createdAt.toISOString(),
            attachments:
              msg.attachments.size > 0
                ? msg.attachments.map((a) => a.url)
                : undefined,
          }));
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedMessages, null, 2) },
          ],
        };
      }

      case "delete-message": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          messageId,
        } = DeleteMessageSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const message = await channel.messages.fetch(messageId);
        await message.delete();
        return {
          content: [
            {
              type: "text",
              text: `Message ${messageId} deleted successfully from #${channel.name}`,
            },
          ],
        };
      }

      case "bulk-delete-messages": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          count,
        } = BulkDeleteMessagesSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const deleted = await channel.bulkDelete(count, true);
        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted ${deleted.size} messages from #${channel.name}`,
            },
          ],
        };
      }

      case "pin-message": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          messageId,
        } = PinMessageSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const message = await channel.messages.fetch(messageId);
        await message.pin();
        return {
          content: [
            {
              type: "text",
              text: `Message ${messageId} pinned successfully in #${channel.name}`,
            },
          ],
        };
      }

      case "unpin-message": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          messageId,
        } = UnpinMessageSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const message = await channel.messages.fetch(messageId);
        await message.unpin();
        return {
          content: [
            {
              type: "text",
              text: `Message ${messageId} unpinned successfully in #${channel.name}`,
            },
          ],
        };
      }

      case "get-pinned-messages": {
        const { server: serverIdentifier, channel: channelIdentifier } =
          GetPinnedMessagesSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const pinned = await channel.messages.fetchPinned();
        const formattedMessages = Array.from(pinned.values()).map((msg) => ({
          id: msg.id,
          author: msg.author.tag,
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
        }));
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedMessages, null, 2) },
          ],
        };
      }

      // Server tools
      case "list-servers": {
        ListServersSchema.parse(args);
        const guilds = Array.from(client.guilds.cache.values()).map((g) => ({
          id: g.id,
          name: g.name,
          memberCount: g.memberCount,
          ownerId: g.ownerId,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(guilds, null, 2) }],
        };
      }

      case "get-server-info": {
        const { server: serverIdentifier } = GetServerInfoSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        await guild.fetch();
        const info = {
          id: guild.id,
          name: guild.name,
          description: guild.description,
          memberCount: guild.memberCount,
          ownerId: guild.ownerId,
          createdAt: guild.createdAt.toISOString(),
          icon: guild.iconURL(),
          banner: guild.bannerURL(),
          features: guild.features,
          verificationLevel: guild.verificationLevel,
          premiumTier: guild.premiumTier,
          premiumSubscriptionCount: guild.premiumSubscriptionCount,
          channelCount: guild.channels.cache.size,
          roleCount: guild.roles.cache.size,
          emojiCount: guild.emojis.cache.size,
        };
        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
        };
      }

      case "set-server-name": {
        const { server: serverIdentifier, name: newName } =
          SetServerNameSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const oldName = guild.name;
        await guild.setName(newName);
        return {
          content: [
            {
              type: "text",
              text: `Server name changed from "${oldName}" to "${newName}"`,
            },
          ],
        };
      }

      // Channel tools
      case "list-channels": {
        const { server: serverIdentifier } = ListChannelsSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const channels = Array.from(guild.channels.cache.values())
          .filter(
            (c) =>
              "position" in c &&
              typeof (c as GuildChannel).position === "number",
          )
          .sort(
            (a, b) =>
              ((a as GuildChannel).position || 0) -
              ((b as GuildChannel).position || 0),
          )
          .map((c) => {
            const channel = c as GuildChannel;
            return {
              id: channel.id,
              name: channel.name,
              type: getChannelTypeName(channel.type),
              position: channel.position,
              parentId: channel.parentId,
              parentName: channel.parent?.name,
            };
          });
        return {
          content: [{ type: "text", text: JSON.stringify(channels, null, 2) }],
        };
      }

      case "create-channel": {
        const {
          server: serverIdentifier,
          name,
          type,
          category,
          topic,
          nsfw,
          bitrate,
          userLimit,
          rateLimitPerUser,
          position,
        } = CreateChannelSchema.parse(args);
        const guild = await findGuild(serverIdentifier);

        const channelTypeMap: Record<string, ChannelType> = {
          text: ChannelType.GuildText,
          voice: ChannelType.GuildVoice,
          category: ChannelType.GuildCategory,
          announcement: ChannelType.GuildAnnouncement,
          forum: ChannelType.GuildForum,
          stage: ChannelType.GuildStageVoice,
        };

        const options: {
          name: string;
          type: GuildChannelTypes;
          parent?: CategoryChannel;
          topic?: string;
          nsfw?: boolean;
          bitrate?: number;
          userLimit?: number;
          rateLimitPerUser?: number;
          position?: number;
        } = {
          name,
          type: (channelTypeMap[type] ||
            ChannelType.GuildText) as GuildChannelTypes,
        };

        if (category) {
          options.parent = await findCategory(category, serverIdentifier);
        }
        if (topic) options.topic = topic;
        if (nsfw !== undefined) options.nsfw = nsfw;
        if (bitrate) options.bitrate = bitrate;
        if (userLimit !== undefined) options.userLimit = userLimit;
        if (rateLimitPerUser !== undefined)
          options.rateLimitPerUser = rateLimitPerUser;
        if (position !== undefined) options.position = position;

        const channel = await guild.channels.create(options);
        return {
          content: [
            {
              type: "text",
              text: `Channel "${channel.name}" (${getChannelTypeName(channel.type)}) created successfully. ID: ${channel.id}`,
            },
          ],
        };
      }

      case "edit-channel": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          name,
          topic,
          nsfw,
          bitrate,
          userLimit,
          rateLimitPerUser,
          position,
          category,
        } = EditChannelSchema.parse(args);
        const channel = await findChannel(channelIdentifier, serverIdentifier);

        const options: {
          name?: string;
          topic?: string;
          nsfw?: boolean;
          bitrate?: number;
          userLimit?: number;
          rateLimitPerUser?: number;
          position?: number;
          parent?: CategoryChannel | null;
        } = {};

        if (name) options.name = name;
        if (topic !== undefined) options.topic = topic;
        if (nsfw !== undefined) options.nsfw = nsfw;
        if (bitrate) options.bitrate = bitrate;
        if (userLimit !== undefined) options.userLimit = userLimit;
        if (rateLimitPerUser !== undefined)
          options.rateLimitPerUser = rateLimitPerUser;
        if (position !== undefined) options.position = position;
        if (category !== undefined) {
          if (category.toLowerCase() === "none") {
            options.parent = null;
          } else {
            options.parent = await findCategory(category, serverIdentifier);
          }
        }

        await channel.edit(options);
        return {
          content: [
            {
              type: "text",
              text: `Channel "${channel.name}" updated successfully`,
            },
          ],
        };
      }

      case "delete-channel": {
        const { server: serverIdentifier, channel: channelIdentifier } =
          DeleteChannelSchema.parse(args);
        const channel = await findChannel(channelIdentifier, serverIdentifier);
        const channelName = channel.name;
        await channel.delete();
        return {
          content: [
            {
              type: "text",
              text: `Channel "${channelName}" deleted successfully`,
            },
          ],
        };
      }

      case "create-category": {
        const {
          server: serverIdentifier,
          name,
          position,
        } = CreateCategorySchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const category = await guild.channels.create({
          name,
          type: ChannelType.GuildCategory,
          position,
        });
        return {
          content: [
            {
              type: "text",
              text: `Category "${category.name}" created successfully. ID: ${category.id}`,
            },
          ],
        };
      }

      case "move-channel-to-category": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          category: categoryIdentifier,
        } = MoveChannelToCategorySchema.parse(args);
        const channel = await findChannel(channelIdentifier, serverIdentifier);

        if (categoryIdentifier.toLowerCase() === "none") {
          await channel.setParent(null);
          return {
            content: [
              {
                type: "text",
                text: `Channel "${channel.name}" removed from its category`,
              },
            ],
          };
        }

        const category = await findCategory(
          categoryIdentifier,
          serverIdentifier,
        );
        await channel.setParent(category);
        return {
          content: [
            {
              type: "text",
              text: `Channel "${channel.name}" moved to category "${category.name}"`,
            },
          ],
        };
      }

      case "set-channel-permissions": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          target,
          targetType,
          allow,
          deny,
        } = SetChannelPermissionsSchema.parse(args);
        const channel = await findChannel(channelIdentifier, serverIdentifier);

        let targetId: string;

        if (targetType === "role") {
          const role = await findRole(target, serverIdentifier);
          targetId = role.id;
        } else {
          const member = await findMember(target, serverIdentifier);
          targetId = member.id;
        }

        const permissionOptions = buildPermissionOverwriteOptions(allow, deny);

        await channel.permissionOverwrites.edit(targetId, permissionOptions);

        return {
          content: [
            {
              type: "text",
              text: `Permissions updated for ${targetType} "${target}" on channel "${channel.name}". Allowed: ${allow?.join(", ") || "none"}, Denied: ${deny?.join(", ") || "none"}`,
            },
          ],
        };
      }

      // Role tools
      case "list-roles": {
        const { server: serverIdentifier } = ListRolesSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        await guild.roles.fetch();
        const roles = Array.from(guild.roles.cache.values())
          .sort((a, b) => b.position - a.position)
          .map((r) => ({
            id: r.id,
            name: r.name,
            color: r.hexColor,
            position: r.position,
            hoist: r.hoist,
            mentionable: r.mentionable,
            memberCount: r.members.size,
            managed: r.managed,
          }));
        return {
          content: [{ type: "text", text: JSON.stringify(roles, null, 2) }],
        };
      }

      case "create-role": {
        const {
          server: serverIdentifier,
          name,
          color,
          hoist,
          mentionable,
          permissions,
          position,
        } = CreateRoleSchema.parse(args);
        const guild = await findGuild(serverIdentifier);

        const options: {
          name: string;
          color?: ColorResolvable;
          hoist?: boolean;
          mentionable?: boolean;
          permissions?: bigint;
          position?: number;
        } = { name };

        if (color) options.color = color as ColorResolvable;
        if (hoist !== undefined) options.hoist = hoist;
        if (mentionable !== undefined) options.mentionable = mentionable;
        if (permissions) options.permissions = parsePermissions(permissions);
        if (position !== undefined) options.position = position;

        const role = await guild.roles.create(options);
        return {
          content: [
            {
              type: "text",
              text: `Role "${role.name}" created successfully. ID: ${role.id}`,
            },
          ],
        };
      }

      case "edit-role": {
        const {
          server: serverIdentifier,
          role: roleIdentifier,
          name,
          color,
          hoist,
          mentionable,
          permissions,
          position,
        } = EditRoleSchema.parse(args);
        const role = await findRole(roleIdentifier, serverIdentifier);

        const options: {
          name?: string;
          color?: ColorResolvable;
          hoist?: boolean;
          mentionable?: boolean;
          permissions?: bigint;
          position?: number;
        } = {};

        if (name) options.name = name;
        if (color) options.color = color as ColorResolvable;
        if (hoist !== undefined) options.hoist = hoist;
        if (mentionable !== undefined) options.mentionable = mentionable;
        if (permissions) options.permissions = parsePermissions(permissions);
        if (position !== undefined) options.position = position;

        await role.edit(options);
        return {
          content: [
            { type: "text", text: `Role "${role.name}" updated successfully` },
          ],
        };
      }

      case "delete-role": {
        const { server: serverIdentifier, role: roleIdentifier } =
          DeleteRoleSchema.parse(args);
        const role = await findRole(roleIdentifier, serverIdentifier);
        const roleName = role.name;
        await role.delete();
        return {
          content: [
            { type: "text", text: `Role "${roleName}" deleted successfully` },
          ],
        };
      }

      case "assign-role": {
        const {
          server: serverIdentifier,
          member: memberIdentifier,
          role: roleIdentifier,
        } = AssignRoleSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        const role = await findRole(roleIdentifier, serverIdentifier);
        await member.roles.add(role);
        return {
          content: [
            {
              type: "text",
              text: `Role "${role.name}" assigned to ${member.user.tag}`,
            },
          ],
        };
      }

      case "remove-role": {
        const {
          server: serverIdentifier,
          member: memberIdentifier,
          role: roleIdentifier,
        } = RemoveRoleSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        const role = await findRole(roleIdentifier, serverIdentifier);
        await member.roles.remove(role);
        return {
          content: [
            {
              type: "text",
              text: `Role "${role.name}" removed from ${member.user.tag}`,
            },
          ],
        };
      }

      // Member tools
      case "list-members": {
        const { server: serverIdentifier, limit } =
          ListMembersSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const members = await guild.members.fetch({ limit });
        const formattedMembers = Array.from(members.values()).map((m) => ({
          id: m.id,
          username: m.user.username,
          displayName: m.displayName,
          tag: m.user.tag,
          bot: m.user.bot,
          joinedAt: m.joinedAt?.toISOString(),
          roles: m.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => r.name),
        }));
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedMembers, null, 2) },
          ],
        };
      }

      case "get-member-info": {
        const { server: serverIdentifier, member: memberIdentifier } =
          GetMemberInfoSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        const info = {
          id: member.id,
          username: member.user.username,
          displayName: member.displayName,
          tag: member.user.tag,
          bot: member.user.bot,
          avatar: member.user.avatarURL(),
          joinedAt: member.joinedAt?.toISOString(),
          createdAt: member.user.createdAt.toISOString(),
          roles: member.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => ({
              id: r.id,
              name: r.name,
              color: r.hexColor,
            })),
          permissions: member.permissions.toArray(),
          nickname: member.nickname,
          communicationDisabledUntil:
            member.communicationDisabledUntil?.toISOString(),
          pending: member.pending,
          premiumSince: member.premiumSince?.toISOString(),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
        };
      }

      case "kick-member": {
        const {
          server: serverIdentifier,
          member: memberIdentifier,
          reason,
        } = KickMemberSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        const memberTag = member.user.tag;
        await member.kick(reason);
        return {
          content: [
            {
              type: "text",
              text: `${memberTag} has been kicked from the server${reason ? `. Reason: ${reason}` : ""}`,
            },
          ],
        };
      }

      case "ban-member": {
        const {
          server: serverIdentifier,
          member: memberIdentifier,
          reason,
          deleteMessageDays,
        } = BanMemberSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        const memberTag = member.user.tag;
        await member.ban({
          reason,
          deleteMessageSeconds: deleteMessageDays
            ? deleteMessageDays * 86400
            : undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: `${memberTag} has been banned from the server${reason ? `. Reason: ${reason}` : ""}`,
            },
          ],
        };
      }

      case "unban-member": {
        const {
          server: serverIdentifier,
          userId,
          reason,
        } = UnbanMemberSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        await guild.members.unban(userId, reason);
        return {
          content: [
            {
              type: "text",
              text: `User ${userId} has been unbanned${reason ? `. Reason: ${reason}` : ""}`,
            },
          ],
        };
      }

      case "timeout-member": {
        const {
          server: serverIdentifier,
          member: memberIdentifier,
          duration,
          reason,
        } = TimeoutMemberSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        const memberTag = member.user.tag;

        if (duration === 0) {
          await member.timeout(null, reason);
          return {
            content: [
              { type: "text", text: `Timeout removed from ${memberTag}` },
            ],
          };
        }

        await member.timeout(duration * 60 * 1000, reason);
        return {
          content: [
            {
              type: "text",
              text: `${memberTag} has been timed out for ${duration} minutes${reason ? `. Reason: ${reason}` : ""}`,
            },
          ],
        };
      }

      case "list-bans": {
        const { server: serverIdentifier } = ListBansSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const bans = await guild.bans.fetch();
        const formattedBans = Array.from(bans.values()).map((b) => ({
          userId: b.user.id,
          username: b.user.username,
          tag: b.user.tag,
          reason: b.reason,
        }));
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedBans, null, 2) },
          ],
        };
      }

      // Webhook tools
      case "create-webhook": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          name,
          avatar,
        } = CreateWebhookSchema.parse(args);
        const channel = await findTextChannel(
          channelIdentifier,
          serverIdentifier,
        );
        const webhook = await channel.createWebhook({ name, avatar });
        return {
          content: [
            {
              type: "text",
              text: `Webhook "${webhook.name}" created successfully.\nID: ${webhook.id}\nURL: ${webhook.url}`,
            },
          ],
        };
      }

      case "list-webhooks": {
        const { server: serverIdentifier, channel: channelIdentifier } =
          ListWebhooksSchema.parse(args);
        const guild = await findGuild(serverIdentifier);

        let webhooks;
        if (channelIdentifier) {
          const channel = await findTextChannel(
            channelIdentifier,
            serverIdentifier,
          );
          webhooks = await channel.fetchWebhooks();
        } else {
          webhooks = await guild.fetchWebhooks();
        }

        const formattedWebhooks = Array.from(webhooks.values()).map((w) => ({
          id: w.id,
          name: w.name,
          channelId: w.channelId,
          url: w.url,
          avatar: w.avatarURL(),
        }));
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedWebhooks, null, 2) },
          ],
        };
      }

      case "delete-webhook": {
        const { webhookId } = DeleteWebhookSchema.parse(args);
        const webhook = await client.fetchWebhook(webhookId);
        const webhookName = webhook.name;
        await webhook.delete();
        return {
          content: [
            {
              type: "text",
              text: `Webhook "${webhookName}" deleted successfully`,
            },
          ],
        };
      }

      // Invite tools
      case "create-invite": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          maxAge,
          maxUses,
          temporary,
          unique,
        } = CreateInviteSchema.parse(args);
        const channel = await findChannel(channelIdentifier, serverIdentifier);

        if (!("createInvite" in channel)) {
          throw new Error("Cannot create invite for this channel type");
        }

        const invite = await (
          channel as TextChannel | VoiceChannel
        ).createInvite({
          maxAge: maxAge ?? 0,
          maxUses: maxUses ?? 0,
          temporary: temporary ?? false,
          unique: unique ?? false,
        });

        return {
          content: [
            {
              type: "text",
              text: `Invite created: https://discord.gg/${invite.code}\nMax age: ${invite.maxAge === 0 ? "Never" : `${invite.maxAge} seconds`}\nMax uses: ${invite.maxUses === 0 ? "Unlimited" : invite.maxUses}`,
            },
          ],
        };
      }

      case "list-invites": {
        const { server: serverIdentifier } = ListInvitesSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const invites = await guild.invites.fetch();
        const formattedInvites = Array.from(invites.values()).map((i) => ({
          code: i.code,
          url: i.url,
          channelName: i.channel?.name,
          inviter: i.inviter?.tag,
          uses: i.uses,
          maxUses: i.maxUses === 0 ? "Unlimited" : i.maxUses,
          maxAge: i.maxAge === 0 ? "Never" : `${i.maxAge} seconds`,
          temporary: i.temporary,
          createdAt: i.createdAt?.toISOString(),
        }));
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedInvites, null, 2) },
          ],
        };
      }

      case "delete-invite": {
        const { code } = DeleteInviteSchema.parse(args);
        const invite = await client.fetchInvite(code);
        await invite.delete();
        return {
          content: [
            { type: "text", text: `Invite ${code} deleted successfully` },
          ],
        };
      }

      // Thread tools
      case "create-thread": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          name,
          message: messageId,
          autoArchiveDuration,
          type,
        } = CreateThreadSchema.parse(args);
        const channel = await findTextChannel(channelIdentifier, serverIdentifier);

        const durationMap: Record<string, ThreadAutoArchiveDuration> = {
          "60": ThreadAutoArchiveDuration.OneHour,
          "1440": ThreadAutoArchiveDuration.OneDay,
          "4320": ThreadAutoArchiveDuration.ThreeDays,
          "10080": ThreadAutoArchiveDuration.OneWeek,
        };

        if (messageId) {
          const msg = await channel.messages.fetch(messageId);
          const thread = await msg.startThread({
            name,
            autoArchiveDuration: autoArchiveDuration ? durationMap[autoArchiveDuration] : undefined,
          });
          return {
            content: [{ type: "text", text: `Thread "${thread.name}" created from message. ID: ${thread.id}` }],
          };
        }

        const thread = await channel.threads.create({
          name,
          autoArchiveDuration: autoArchiveDuration ? durationMap[autoArchiveDuration] : undefined,
          type: type === "private" ? ChannelType.PrivateThread : ChannelType.PublicThread,
        });
        return {
          content: [{ type: "text", text: `Thread "${thread.name}" created. ID: ${thread.id}` }],
        };
      }

      case "list-threads": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          archived,
        } = ListThreadsSchema.parse(args);
        const channel = await findTextChannel(channelIdentifier, serverIdentifier);

        const active = await channel.threads.fetchActive();
        let threads = Array.from(active.threads.values());

        if (archived) {
          const archivedThreads = await channel.threads.fetchArchived();
          threads = [...threads, ...Array.from(archivedThreads.threads.values())];
        }

        const formatted = threads.map((t) => ({
          id: t.id,
          name: t.name,
          archived: t.archived,
          locked: t.locked,
          messageCount: t.messageCount,
          memberCount: t.memberCount,
          createdAt: t.createdAt?.toISOString(),
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(formatted, null, 2) }],
        };
      }

      case "send-thread-message": {
        const {
          server: serverIdentifier,
          thread: threadIdentifier,
          message,
        } = SendThreadMessageSchema.parse(args);
        const thread = await findThread(threadIdentifier, serverIdentifier);
        const sent = await thread.send(message);
        return {
          content: [{ type: "text", text: `Message sent to thread "${thread.name}". Message ID: ${sent.id}` }],
        };
      }

      case "archive-thread": {
        const {
          server: serverIdentifier,
          thread: threadIdentifier,
          archived,
        } = ArchiveThreadSchema.parse(args);
        const thread = await findThread(threadIdentifier, serverIdentifier);
        await thread.setArchived(archived);
        return {
          content: [{ type: "text", text: `Thread "${thread.name}" ${archived ? "archived" : "unarchived"}` }],
        };
      }

      case "delete-thread": {
        const {
          server: serverIdentifier,
          thread: threadIdentifier,
        } = DeleteThreadSchema.parse(args);
        const thread = await findThread(threadIdentifier, serverIdentifier);
        const threadName = thread.name;
        await thread.delete();
        return {
          content: [{ type: "text", text: `Thread "${threadName}" deleted` }],
        };
      }

      case "edit-thread": {
        const {
          server: serverIdentifier,
          thread: threadIdentifier,
          name,
          autoArchiveDuration,
          rateLimitPerUser,
          locked,
        } = EditThreadSchema.parse(args);
        const thread = await findThread(threadIdentifier, serverIdentifier);

        const durationMap: Record<string, ThreadAutoArchiveDuration> = {
          "60": ThreadAutoArchiveDuration.OneHour,
          "1440": ThreadAutoArchiveDuration.OneDay,
          "4320": ThreadAutoArchiveDuration.ThreeDays,
          "10080": ThreadAutoArchiveDuration.OneWeek,
        };

        const options: Record<string, unknown> = {};
        if (name) options.name = name;
        if (autoArchiveDuration) options.autoArchiveDuration = durationMap[autoArchiveDuration];
        if (rateLimitPerUser !== undefined) options.rateLimitPerUser = rateLimitPerUser;
        if (locked !== undefined) options.locked = locked;

        await thread.edit(options);
        return {
          content: [{ type: "text", text: `Thread "${thread.name}" updated` }],
        };
      }

      // Forum tools
      case "create-forum-post": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          name,
          content,
          tags,
        } = CreateForumPostSchema.parse(args);
        const forum = await findForumChannel(channelIdentifier, serverIdentifier);

        const appliedTags = tags
          ? forum.availableTags
              .filter((t) => tags.some((tag) => tag.toLowerCase() === t.name.toLowerCase()))
              .map((t) => t.id)
          : [];

        const post = await forum.threads.create({
          name,
          message: { content },
          appliedTags,
        });
        return {
          content: [{ type: "text", text: `Forum post "${post.name}" created. ID: ${post.id}` }],
        };
      }

      case "list-forum-tags": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
        } = ListForumTagsSchema.parse(args);
        const forum = await findForumChannel(channelIdentifier, serverIdentifier);

        const tags = forum.availableTags.map((t) => ({
          id: t.id,
          name: t.name,
          emoji: t.emoji,
          moderated: t.moderated,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(tags, null, 2) }],
        };
      }

      case "manage-forum-tags": {
        const {
          server: serverIdentifier,
          channel: channelIdentifier,
          action,
          name,
          newName,
          emoji,
          moderated,
        } = ManageForumTagsSchema.parse(args);
        const forum = await findForumChannel(channelIdentifier, serverIdentifier);

        let tags = [...forum.availableTags];

        if (action === "create") {
          tags.push({
            name,
            emoji: emoji ? { id: null, name: emoji } : null,
            moderated: moderated ?? false,
            id: undefined as unknown as string,
          });
          await forum.setAvailableTags(tags);
          return {
            content: [{ type: "text", text: `Tag "${name}" created on forum "${forum.name}"` }],
          };
        }

        if (action === "edit") {
          const idx = tags.findIndex((t) => t.name.toLowerCase() === name.toLowerCase());
          if (idx === -1) throw new Error(`Tag "${name}" not found`);
          if (newName) tags[idx] = { ...tags[idx], name: newName };
          if (emoji) tags[idx] = { ...tags[idx], emoji: { id: null, name: emoji } };
          if (moderated !== undefined) tags[idx] = { ...tags[idx], moderated };
          await forum.setAvailableTags(tags);
          return {
            content: [{ type: "text", text: `Tag "${name}" updated` }],
          };
        }

        // delete
        tags = tags.filter((t) => t.name.toLowerCase() !== name.toLowerCase());
        await forum.setAvailableTags(tags);
        return {
          content: [{ type: "text", text: `Tag "${name}" deleted from forum "${forum.name}"` }],
        };
      }

      // Guild settings tools
      case "edit-server": {
        const {
          server: serverIdentifier,
          name,
          description,
          icon,
          systemChannel,
          afkChannel,
          afkTimeout,
          verificationLevel,
          defaultNotifications,
          explicitContentFilter,
        } = EditServerSchema.parse(args);
        const guild = await findGuild(serverIdentifier);

        const options: Record<string, unknown> = {};
        if (name) options.name = name;
        if (description !== undefined) options.description = description;
        if (icon) options.icon = icon;
        if (systemChannel) {
          const ch = await findTextChannel(systemChannel, serverIdentifier);
          options.systemChannel = ch;
        }
        if (afkChannel) {
          const ch = await findChannel(afkChannel, serverIdentifier);
          options.afkChannel = ch;
        }
        if (afkTimeout !== undefined) options.afkTimeout = afkTimeout;
        if (verificationLevel) {
          const levels: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, very_high: 4 };
          options.verificationLevel = levels[verificationLevel];
        }
        if (defaultNotifications) {
          options.defaultMessageNotifications = defaultNotifications === "all" ? 0 : 1;
        }
        if (explicitContentFilter) {
          const filters: Record<string, number> = { disabled: 0, members_without_roles: 1, all_members: 2 };
          options.explicitContentFilter = filters[explicitContentFilter];
        }

        await guild.edit(options);
        return {
          content: [{ type: "text", text: `Server "${guild.name}" settings updated` }],
        };
      }

      case "set-bot-nickname": {
        const {
          server: serverIdentifier,
          nickname,
        } = SetBotNicknameSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        const me = guild.members.me;
        if (!me) throw new Error("Bot is not a member of this server");
        await me.setNickname(nickname ?? null);
        return {
          content: [{ type: "text", text: nickname ? `Bot nickname set to "${nickname}"` : "Bot nickname cleared" }],
        };
      }

      case "set-bot-activity": {
        const { type, name, status } = SetBotActivitySchema.parse(args);

        const typeMap: Record<string, ActivityType> = {
          playing: ActivityType.Playing,
          watching: ActivityType.Watching,
          listening: ActivityType.Listening,
          competing: ActivityType.Competing,
        };

        client.user?.setPresence({
          activities: [{ name, type: typeMap[type] }],
          status,
        });
        return {
          content: [{ type: "text", text: `Bot activity set to ${type} "${name}" with status ${status}` }],
        };
      }

      // Emoji tools
      case "list-emojis": {
        const { server: serverIdentifier } = ListEmojisSchema.parse(args);
        const guild = await findGuild(serverIdentifier);
        await guild.emojis.fetch();
        const emojis = Array.from(guild.emojis.cache.values()).map((e) => ({
          id: e.id,
          name: e.name,
          animated: e.animated,
          url: e.url,
          roles: e.roles.cache.map((r) => r.name),
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(emojis, null, 2) }],
        };
      }

      case "create-emoji": {
        const {
          server: serverIdentifier,
          name,
          url,
          roles,
        } = CreateEmojiSchema.parse(args);
        const guild = await findGuild(serverIdentifier);

        const roleObjects = roles
          ? await Promise.all(roles.map((r) => findRole(r, serverIdentifier)))
          : undefined;

        const emoji = await guild.emojis.create({
          attachment: url,
          name,
          roles: roleObjects?.map((r) => r.id),
        });
        return {
          content: [{ type: "text", text: `Emoji "${emoji.name}" created. ID: ${emoji.id}` }],
        };
      }

      case "delete-emoji": {
        const {
          server: serverIdentifier,
          emoji: emojiIdentifier,
        } = DeleteEmojiSchema.parse(args);
        const emoji = await findEmoji(emojiIdentifier, serverIdentifier);
        const emojiName = emoji.name;
        await emoji.delete();
        return {
          content: [{ type: "text", text: `Emoji "${emojiName}" deleted` }],
        };
      }

      // Nickname tool
      case "set-nickname": {
        const {
          server: serverIdentifier,
          member: memberIdentifier,
          nickname,
        } = SetNicknameSchema.parse(args);
        const member = await findMember(memberIdentifier, serverIdentifier);
        await member.setNickname(nickname ?? null);
        return {
          content: [{ type: "text", text: nickname ? `Nickname for ${member.user.tag} set to "${nickname}"` : `Nickname cleared for ${member.user.tag}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
      );
    }
    throw error;
  }
});

// Discord client login and error handling
client.once("ready", () => {
  console.error("Discord bot is ready!");
});

// Start the server
async function main() {
  const token = process.env.ALFRED_DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("ALFRED_DISCORD_BOT_TOKEN environment variable is not set");
  }

  try {
    await client.login(token);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Discord MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

main();
