# Neutral

## Welcome messages

Welcome settings are stored in a JSON file. Local development uses `.data/welcome-settings.json` automatically. The `.data` directory is ignored by Git.

For Render, mount a persistent disk at `/var/data` and set:

```text
WELCOME_SETTINGS_PATH=/var/data/welcome-settings.json
YAPPER_PUBLIC_URL=https://your-domain.example
YAPPER_WEBHOOK_SECRET=<the webhook secret from Yapin Developer settings>
```

Keep `YAPPER_BOT_TOKEN` configured as well. In Yapin' Developer settings, set the bot's event webhook URL to `https://your-domain.example/api/yapin/events` and use the same webhook secret. The webhook receives signed events; only `member_join` events for servers with welcome messages enabled are handled.

Welcome message templates accept `{{mention}}`, `{{username}}`, and `{{member_count}}`. For example:

```text
Welcome {{mention}}! You're member #{{member_count}}.
```

The bot must be able to see the selected text channel and send messages there. Yapin' does not retry failed event webhook deliveries, so the endpoint responds immediately after handling each event.
