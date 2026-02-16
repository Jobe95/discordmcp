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
