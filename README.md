# Discord MCP Server

A Model Context Protocol (MCP) server that enables LLMs to interact with Discord — manage messages, channels, roles, members, threads, forums, emojis, scheduled events, automod, and more.

## Features

### Messages
- `send-message` — Send a message to a channel
- `read-messages` — Read recent messages from a channel
- `delete-message` — Delete a specific message
- `bulk-delete-messages` — Delete multiple recent messages (2-100)
- `pin-message` / `unpin-message` — Pin or unpin messages
- `get-pinned-messages` — Get all pinned messages

### Servers
- `list-servers` — List all servers the bot is in
- `get-server-info` — Get detailed server information
- `set-server-name` — Change server name
- `edit-server` — Edit server settings (description, icon, verification level, notifications, content filter, AFK channel/timeout, system channel)

### Channels
- `list-channels` — List all channels in a server
- `create-channel` — Create text, voice, category, announcement, forum, or stage channels
- `edit-channel` — Edit channel settings
- `delete-channel` — Delete a channel
- `create-category` — Create a channel category
- `move-channel-to-category` — Move a channel to a category
- `set-channel-permissions` — Set permissions for a role or member on a channel

### Threads
- `create-thread` — Create a thread (public/private), optionally from a message
- `list-threads` — List active/archived threads in a channel
- `send-thread-message` — Send a message to a thread
- `edit-thread` — Edit thread settings (name, archive duration, slowmode, locked)
- `archive-thread` — Archive or unarchive a thread
- `delete-thread` — Delete a thread

### Forums
- `create-forum-post` — Create a post in a forum channel with optional tags
- `list-forum-tags` — List available tags on a forum channel
- `manage-forum-tags` — Create, edit, or delete forum tags

### Roles
- `list-roles` — List all roles
- `create-role` — Create a role with color, permissions, hoisted/mentionable options
- `edit-role` — Edit an existing role
- `delete-role` — Delete a role
- `assign-role` / `remove-role` — Assign or remove a role from a member

### Members
- `list-members` — List server members
- `get-member-info` — Get detailed member info
- `set-nickname` — Set or clear a member's nickname
- `kick-member` — Kick a member
- `ban-member` / `unban-member` — Ban or unban a member
- `timeout-member` — Timeout (mute) a member
- `list-bans` — List all banned users

### Emojis
- `list-emojis` — List all custom emojis
- `create-emoji` — Create a custom emoji from an image URL
- `delete-emoji` — Delete a custom emoji

### Scheduled Events
- `create-event` — Create a scheduled event (voice/stage channel or external location)
- `list-events` — List scheduled events
- `edit-event` — Edit a scheduled event
- `delete-event` — Delete a scheduled event

### Audit Log
- `get-audit-log` — Fetch audit log entries with optional filters (action type, user, limit)

### Auto-Moderation
- `list-automod-rules` — List all automod rules
- `create-automod-rule` — Create a rule (keyword filter, spam, keyword preset, mention spam)
- `edit-automod-rule` — Edit an automod rule
- `delete-automod-rule` — Delete an automod rule

### Bot
- `set-bot-nickname` — Change the bot's nickname in a server
- `set-bot-activity` — Set the bot's activity/presence (playing, watching, listening, competing)

### Webhooks
- `create-webhook` — Create a webhook for a channel
- `list-webhooks` — List webhooks in a server or channel
- `delete-webhook` — Delete a webhook

### Invites
- `create-invite` — Create an invite link
- `list-invites` — List all invites
- `delete-invite` — Delete an invite

## Prerequisites

- Node.js 16+
- A Discord bot token with appropriate permissions
- Bot invited to your server with the intents: Guilds, GuildMessages, MessageContent, GuildMembers, GuildPresences, GuildScheduledEvents, AutoModerationConfiguration

## Setup

1. Clone and install:

```bash
git clone https://github.com/Jobe95/discordmcp.git
cd discordmcp
pnpm install
```

2. Create a `.env` file:

```
ALFRED_DISCORD_BOT_TOKEN=your_discord_bot_token_here
```

3. Build:

```bash
pnpm build
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["path/to/discordmcp/build/index.js"],
      "env": {
        "ALFRED_DISCORD_BOT_TOKEN": "your_discord_bot_token_here"
      }
    }
  }
}
```

## Testing

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## License

MIT — see [LICENSE](LICENSE).
