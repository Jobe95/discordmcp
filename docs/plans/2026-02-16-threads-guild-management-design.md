# Discord MCP: Threads & Guild Management

## Scope

Add 25 new tools to the existing Discord MCP server, extending the current pattern in `src/index.ts`.

## New Tools

### Threads (6)
- `create-thread` — from message or standalone (name, autoArchiveDuration, type: public/private)
- `list-threads` — active threads in channel, optional archived
- `send-thread-message` — send message to thread
- `archive-thread` — archive/unarchive
- `delete-thread` — delete thread
- `edit-thread` — name, auto-archive duration, rate limit, locked

### Forum Posts (3)
- `create-forum-post` — create post in forum channel (name, content, applied tags)
- `list-forum-tags` — list available tags on forum channel
- `manage-forum-tags` — create/edit/delete tags on forum channel

### Guild Settings (3)
- `edit-server` — icon, description, system channel, AFK channel/timeout, verification level, default notifications, explicit content filter
- `set-bot-nickname` — change bot nickname in server
- `set-bot-activity` — set presence (playing/watching/listening/competing + status text)

### Emoji Management (3)
- `list-emojis` — list custom emojis
- `create-emoji` — from URL (name, image URL, restricted roles)
- `delete-emoji` — delete custom emoji

### Scheduled Events (4)
- `create-event` — name, description, start/end, location or voice channel, image
- `list-events` — list scheduled events
- `edit-event` — edit details
- `delete-event` — cancel/delete

### Audit Log (1)
- `get-audit-log` — fetch entries, filter by action type/user/limit

### Auto-Moderation (4)
- `list-automod-rules` — list all rules
- `create-automod-rule` — keyword filter, spam, mention spam + actions
- `edit-automod-rule` — edit rule
- `delete-automod-rule` — delete rule

### Nickname Management (1)
- `set-nickname` — set/clear nickname for any member

## Architecture

Extend existing pattern: Zod schema + tool definition + switch-case handler. No structural changes. Same helper function pattern for resource lookups.

## New Helpers Needed
- `findThread(threadId, guildId?)` — find thread by name/ID
- `findEmoji(emojiId, guildId?)` — find emoji by name/ID
- `findEvent(eventId, guildId?)` — find scheduled event by name/ID

## Discord.js Requirements
- May need `GuildScheduledEvents` intent for events
- Emoji operations need `MANAGE_EMOJIS_AND_STICKERS` permission
- Automod needs `MANAGE_GUILD` permission
- Audit log needs `VIEW_AUDIT_LOG` permission
