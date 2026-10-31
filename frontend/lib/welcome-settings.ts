import "server-only"

import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export type WelcomeSettings = {
  enabled: boolean
  channelId: string
  message: string
}

export type WelcomeSettingsResult = {
  available: boolean
  settings: WelcomeSettings
}

type StoredWelcomeSettings = WelcomeSettings & { ownerId: string }
type WelcomeStore = Record<string, StoredWelcomeSettings>

const defaultSettings: WelcomeSettings = {
  enabled: false,
  channelId: "",
  message: "Welcome {{mention}} to the server! You are member #{{member_count}}.",
}

let writeQueue: Promise<void> = Promise.resolve()

function settingsPath() {
  return process.env.WELCOME_SETTINGS_PATH || join(process.cwd(), ".data", "welcome-settings.json")
}

export function welcomeStorageAvailable() {
  return process.env.NODE_ENV !== "production" || Boolean(process.env.WELCOME_SETTINGS_PATH)
}

export function welcomeWebhookConfigured() {
  return Boolean(process.env.YAPPER_WEBHOOK_SECRET && process.env.YAPPER_BOT_TOKEN)
}

async function readStore(): Promise<WelcomeStore> {
  try {
    const contents = await readFile(settingsPath(), "utf8")
    const value: unknown = JSON.parse(contents)
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as WelcomeStore
      : {}
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {}
    }
    throw error
  }
}

export async function getWelcomeSettings(
  serverId: string,
  ownerId: string,
): Promise<WelcomeSettingsResult> {
  const available = welcomeStorageAvailable()
  if (!available) return { available, settings: defaultSettings }

  const store = await readStore()
  const stored = store[serverId]
  if (!stored || stored.ownerId !== ownerId) return { available, settings: defaultSettings }

  return {
    available,
    settings: {
      enabled: stored.enabled === true,
      channelId: typeof stored.channelId === "string" ? stored.channelId : "",
      message: typeof stored.message === "string" ? stored.message : defaultSettings.message,
    },
  }
}

export async function saveWelcomeSettings(
  serverId: string,
  ownerId: string,
  settings: WelcomeSettings,
) {
  if (!welcomeStorageAvailable()) throw new Error("Persistent welcome storage is not configured.")

  const operation = writeQueue.then(async () => {
    const store = await readStore()
    store[serverId] = { ...settings, ownerId }

    const path = settingsPath()
    await mkdir(dirname(path), { recursive: true })
    const temporaryPath = `${path}.${process.pid}.tmp`
    await writeFile(temporaryPath, JSON.stringify(store), { mode: 0o600 })
    await rename(temporaryPath, path)
  })
  writeQueue = operation.catch(() => undefined)
  await operation
}

export async function getEnabledWelcomeSettings(serverId: string) {
  const store = await readStore()
  const settings = store[serverId]
  if (!settings?.enabled || !settings.channelId || !settings.message) return null
  return settings
}