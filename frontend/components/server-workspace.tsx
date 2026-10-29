"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  AudioLines,
  Ban,
  Folder,
  Pencil,
  Server,
  Shield,
  Trash2,
  UserRound,
  UserRoundX,
  Users,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { RefreshButton } from "@/components/refresh-button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import type {
  BotBan,
  BotCategory,
  BotChannel,
  BotMember,
  BotServer,
  ChannelManagementAction,
  ChannelManagementData,
  ModerationData,
} from "@/lib/yapin-servers"

type Tab = "overview" | "channels" | "moderation"
type Action = "kick" | "ban" | "unban"

function displayName(member: BotMember | BotBan) {
  return ("nickname" in member ? member.nickname : null) || member.displayName || member.username
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function UserAvatar({ user }: { user: BotMember | BotBan }) {
  const name = displayName(user)
  return user.avatarUrl ? (
    <Image
      alt=""
      className="moderation-avatar"
      height={40}
      loading="lazy"
      src={user.avatarUrl}
      unoptimized
      width={40}
    />
  ) : (
    <span className="moderation-avatar moderation-avatar-fallback">{initials(name)}</span>
  )
}

function ModerationForm({
  action,
  serverId,
  user,
  submitting,
  onSubmit,
}: {
  action: Action
  serverId: string
  user: BotMember | BotBan
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  const label = action === "unban" ? "Unban" : action === "kick" ? "Kick" : "Ban"
  const userId = "userId" in user ? user.userId : user.id
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ size: "sm", variant: action === "ban" ? "destructive" : "outline" })}
      >
        {action === "ban" ? <Ban aria-hidden="true" /> : action === "kick" ? <UserRoundX aria-hidden="true" /> : <UserRound aria-hidden="true" />}
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} {displayName(user)}?</DialogTitle>
          <DialogDescription>
            {action === "kick"
              ? "This member will be removed from the server. They can rejoin unless they are banned."
              : action === "ban"
                ? "This member will be banned from the server and will not be able to rejoin until unbanned."
                : "This member will be able to rejoin the server again."}
          </DialogDescription>
        </DialogHeader>
        <form
          action={`/api/dashboard/${serverId}/moderation`}
          className="moderation-action-form"
          method="post"
          onSubmit={onSubmit}
        >
          <input name="action" type="hidden" value={action} />
          <input name="user_id" type="hidden" value={userId} />
          <DialogFooter>
            <DialogClose
              disabled={submitting}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Cancel
            </DialogClose>
            <Button
              disabled={submitting}
              size="sm"
              type="submit"
              variant={action === "ban" ? "destructive" : "default"}
            >
              {submitting ? "Working…" : `Confirm ${label.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MemberRow({
  member,
  server,
  submitting,
  onSubmit,
}: {
  member: BotMember
  server: BotServer
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="moderation-user-row">
      <UserAvatar user={member} />
      <div className="moderation-user-name">
        <strong>{displayName(member)}</strong>
        <span>@{member.username}</span>
      </div>
      {member.id === server.ownerId ? (
        <span className="owner-label">Server owner</span>
      ) : (
        <div className="moderation-actions">
          <ModerationForm action="kick" serverId={server.id} user={member} submitting={submitting} onSubmit={onSubmit} />
          <ModerationForm action="ban" serverId={server.id} user={member} submitting={submitting} onSubmit={onSubmit} />
        </div>
      )}
    </div>
  )
}

function BanRow({
  ban,
  serverId,
  submitting,
  onSubmit,
}: {
  ban: BotBan
  serverId: string
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="moderation-user-row">
      <UserAvatar user={ban} />
      <div className="moderation-user-name">
        <strong>{displayName(ban)}</strong>
        <span>@{ban.username}</span>
      </div>
      <div className="moderation-actions">
        <ModerationForm action="unban" serverId={serverId} user={ban} submitting={submitting} onSubmit={onSubmit} />
      </div>
    </div>
  )
}

function DataNotice({ children }: { children: React.ReactNode }) {
  return <p className="moderation-data-notice" role="status">{children}</p>
}

function ChannelActionDialog({
  serverId,
  targetId,
  targetName,
  targetType,
  action,
  submitting,
  onSubmit,
}: {
  serverId: string
  targetId: string
  targetName: string
  targetType: "channel" | "category"
  action: "rename" | "delete"
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const deleting = action === "delete"
  const label = targetType === "category" ? "category" : "channel"
  const operation = deleting ? "Delete" : "Rename"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={`${operation} ${label} ${targetName}`}
        className={buttonVariants({ size: "icon-sm", variant: deleting ? "ghost" : "outline" })}
        title={`${operation} ${label}`}
      >
        {deleting ? <Trash2 aria-hidden="true" /> : <Pencil aria-hidden="true" />}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{operation} {targetName}?</DialogTitle>
          <DialogDescription>
            {deleting
              ? `This permanently deletes the ${label}. This action cannot be undone.`
              : `Change the name of this ${label}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          action={`/api/dashboard/${serverId}/channels`}
          className="channel-action-form"
          method="post"
          onSubmit={async (event) => {
            const success = await onSubmit(event)
            if (success) setOpen(false)
          }}
        >
          <input
            name="action"
            type="hidden"
            value={`${action}-${targetType}` as ChannelManagementAction}
          />
          <input name="target_id" type="hidden" value={targetId} />
          {!deleting ? (
            <label className="channel-name-field">
              <span>Name</span>
              <input
                autoComplete="off"
                defaultValue={targetName}
                maxLength={100}
                minLength={1}
                name="name"
                required
              />
            </label>
          ) : null}
          <DialogFooter>
            <DialogClose
              disabled={submitting}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Cancel
            </DialogClose>
            <Button
              disabled={submitting}
              size="sm"
              type="submit"
              variant={deleting ? "destructive" : "default"}
            >
              {submitting ? "Working…" : `${operation} ${label}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChannelRow({
  channel,
  serverId,
  submitting,
  onSubmit,
}: {
  channel: BotChannel
  serverId: string
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<boolean>
}) {
  const Icon = channel.kind === "voice" ? AudioLines : Server

  return (
    <div className="channel-management-row">
      <span className="channel-management-icon"><Icon aria-hidden="true" size={17} /></span>
      <div className="channel-management-name">
        <strong>{channel.name}</strong>
        <span>{channel.kind === "voice" ? "Voice channel" : "Text channel"}</span>
      </div>
      <div className="channel-row-actions">
        <ChannelActionDialog
          action="rename"
          onSubmit={onSubmit}
          serverId={serverId}
          submitting={submitting}
          targetId={channel.id}
          targetName={channel.name}
          targetType="channel"
        />
        <ChannelActionDialog
          action="delete"
          onSubmit={onSubmit}
          serverId={serverId}
          submitting={submitting}
          targetId={channel.id}
          targetName={channel.name}
          targetType="channel"
        />
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  serverId,
  submitting,
  onSubmit,
}: {
  category: BotCategory
  serverId: string
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<boolean>
}) {
  return (
    <div className="channel-management-row">
      <span className="channel-management-icon"><Folder aria-hidden="true" size={17} /></span>
      <div className="channel-management-name">
        <strong>{category.name}</strong>
        <span>Category</span>
      </div>
      <div className="channel-row-actions">
        <ChannelActionDialog
          action="rename"
          onSubmit={onSubmit}
          serverId={serverId}
          submitting={submitting}
          targetId={category.id}
          targetName={category.name}
          targetType="category"
        />
        <ChannelActionDialog
          action="delete"
          onSubmit={onSubmit}
          serverId={serverId}
          submitting={submitting}
          targetId={category.id}
          targetName={category.name}
          targetType="category"
        />
      </div>
    </div>
  )
}

export function ServerWorkspace({
  server,
  moderation,
  channelData,
}: {
  server: BotServer
  moderation: ModerationData
  channelData: ChannelManagementData
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [filter, setFilter] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [channelSubmitting, setChannelSubmitting] = useState(false)
  const query = filter.trim().toLowerCase()
  const members = moderation.members.filter((member) =>
    `${displayName(member)} ${member.username}`.toLowerCase().includes(query),
  )
  const bans = moderation.bans.filter((ban) =>
    `${displayName(ban)} ${ban.username}`.toLowerCase().includes(query),
  )

  async function handleModeration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const action = formData.get("action") as Action
    const endpoint = form.getAttribute("action")
    if (!endpoint) throw new Error("Missing moderation endpoint")

    setSubmitting(true)
    try {
      const response = await fetch(endpoint, { method: "POST", body: formData })
      if (!response.ok) throw new Error("Moderation action failed")

      const messages = {
        kick: { title: "Member kicked", description: "The member was removed from this server." },
        ban: { title: "Member banned", description: "The member was banned from this server." },
        unban: { title: "Ban removed", description: "The member can join this server again." },
      }
      toast.add({ type: "success", ...messages[action], timeout: 5000 })
      router.refresh()
    } catch {
      toast.add({
        type: "error",
        title: "Moderation action failed",
        description: "Check the bot’s permissions and try again.",
        timeout: 7000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleChannelManagement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const action = formData.get("action") as ChannelManagementAction
    const endpoint = form.getAttribute("action")
    if (!endpoint) throw new Error("Missing channel endpoint")

    setChannelSubmitting(true)
    try {
      const response = await fetch(endpoint, { method: "POST", body: formData })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || "The channel action failed.")

      const messages: Record<ChannelManagementAction, { title: string; description: string }> = {
        "rename-channel": { title: "Channel renamed", description: "The channel name was updated." },
        "delete-channel": { title: "Channel deleted", description: "The channel was removed from the server." },
        "rename-category": { title: "Category renamed", description: "The category name was updated." },
        "delete-category": { title: "Category deleted", description: "The category was removed from the server." },
      }
      toast.add({ type: "success", ...messages[action], timeout: 5000 })
      router.refresh()
      return true
    } catch (error) {
      toast.add({
        type: "error",
        title: "Channel action failed",
        description: error instanceof Error ? error.message : "Check the bot’s permissions and try again.",
        timeout: 7000,
      })
      return false
    } finally {
      setChannelSubmitting(false)
    }
  }

  return (
    <section className="server-workspace">
      <a className="back-link" href="/dashboard"><ArrowLeft aria-hidden="true" size={16} /> All servers</a>
      <div className="server-workspace-heading">
        <div className="server-workspace-identity">
          <div className="server-workspace-icon">
            {server.iconUrl ? (
              <Image alt="" height={56} src={server.iconUrl} unoptimized width={56} />
            ) : (
              <Server aria-hidden="true" size={23} />
            )}
          </div>
          <div>
            <span className="eyebrow">SERVER DASHBOARD</span>
            <h1>{server.name}</h1>
          </div>
        </div>
        <RefreshButton />
      </div>

      <div className="workspace-tabs" role="tablist" aria-label={`${server.name} dashboard`}>
        <button
          aria-controls="server-overview-panel"
          aria-selected={tab === "overview"}
          id="server-overview-tab"
          onClick={() => setTab("overview")}
          role="tab"
          type="button"
        >
          Overview
        </button>
        <button
          aria-controls="server-channels-panel"
          aria-selected={tab === "channels"}
          id="server-channels-tab"
          onClick={() => setTab("channels")}
          role="tab"
          type="button"
        >
          Channels
        </button>
        <button
          aria-controls="server-moderation-panel"
          aria-selected={tab === "moderation"}
          id="server-moderation-tab"
          onClick={() => setTab("moderation")}
          role="tab"
          type="button"
        >
          Moderation
        </button>
      </div>

      {tab === "overview" ? (
        <div
          aria-labelledby="server-overview-tab"
          className="overview-panel"
          id="server-overview-panel"
          role="tabpanel"
        >
          <div className="overview-panel-heading">
            <h2>Server summary</h2>
            <p>Current information available to Neutral.</p>
          </div>
          <dl className="overview-stats">
            <div className="overview-stat">
              <dt><Users aria-hidden="true" size={15} /> Members</dt>
              <dd>{moderation.membersError ? "—" : moderation.members.length === 500 ? "500+" : moderation.members.length}</dd>
              <span>{moderation.membersError ? "Unavailable" : "Loaded members"}</span>
            </div>
            <div className="overview-stat">
              <dt><Server aria-hidden="true" size={15} /> Channels</dt>
              <dd>{channelData.error ? "—" : channelData.channels.length}</dd>
              <span>{channelData.error ? "Unavailable" : "Text and voice"}</span>
            </div>
            <div className="overview-stat">
              <dt><Folder aria-hidden="true" size={15} /> Categories</dt>
              <dd>{channelData.error ? "—" : channelData.categories.length}</dd>
              <span>{channelData.error ? "Unavailable" : "Server groups"}</span>
            </div>
            <div className="overview-stat">
              <dt><Shield aria-hidden="true" size={15} /> Banned users</dt>
              <dd>{moderation.bansError ? "—" : moderation.bans.length}</dd>
              <span>{moderation.bansError ? "Unavailable" : "Active bans"}</span>
            </div>
          </dl>
          <div className="overview-owner-note">
            <Shield aria-hidden="true" size={16} />
            <span>Owner access verified for this server.</span>
          </div>
        </div>
      ) : tab === "channels" ? (
        <div
          aria-labelledby="server-channels-tab"
          className="channels-panel"
          id="server-channels-panel"
          role="tabpanel"
        >
          <div className="moderation-heading">
            <div>
              <h2>Channels and categories</h2>
              <p>Rename or remove text channels, voice channels, and categories.</p>
            </div>
          </div>
          {channelData.error ? (
            <DataNotice>
              {channelData.error === "missing-token"
                ? "The bot token is not configured."
                : "Could not load this server’s channels. Check that the bot can manage channels."}
            </DataNotice>
          ) : (
            <>
              <section className="moderation-section">
                <div className="moderation-section-title">
                  <h3>Categories</h3>
                  <span>{channelData.categories.length}</span>
                </div>
                {channelData.categories.length ? (
                  <div className="channel-management-list">
                    {channelData.categories.map((category) => (
                      <CategoryRow
                        category={category}
                        key={category.id}
                        onSubmit={handleChannelManagement}
                        serverId={server.id}
                        submitting={channelSubmitting}
                      />
                    ))}
                  </div>
                ) : <DataNotice>No categories in this server.</DataNotice>}
              </section>
              {(["text", "voice"] as const).map((kind) => {
                const channels = channelData.channels.filter((channel) => channel.kind === kind)
                return (
                  <section className="moderation-section" key={kind}>
                    <div className="moderation-section-title">
                      <h3>{kind === "voice" ? "Voice channels" : "Text channels"}</h3>
                      <span>{channels.length}</span>
                    </div>
                    {channels.length ? (
                      <div className="channel-management-list">
                        {channels.map((channel) => (
                          <ChannelRow
                            channel={channel}
                            key={channel.id}
                            onSubmit={handleChannelManagement}
                            serverId={server.id}
                            submitting={channelSubmitting}
                          />
                        ))}
                      </div>
                    ) : <DataNotice>No {kind === "voice" ? "voice" : "text"} channels.</DataNotice>}
                  </section>
                )
              })}
            </>
          )}
        </div>
      ) : (
        <div
          aria-labelledby="server-moderation-tab"
          className="moderation-panel"
          id="server-moderation-panel"
          role="tabpanel"
        >
          <div className="moderation-heading">
            <div>
              <h2>Member moderation</h2>
              <p>Kick or ban members, and remove existing bans. Yapin checks the bot&apos;s role permissions.</p>
            </div>
            <input
              aria-label="Filter members and bans"
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Find a member"
              type="search"
              value={filter}
            />
          </div>

          <section className="moderation-section">
            <div className="moderation-section-title">
              <h3>Members</h3>
              <span>{moderation.members.length}</span>
            </div>
            {moderation.membersError ? (
              <DataNotice>
                Could not load members. Check that the bot is in the server and has permission to view members.
              </DataNotice>
            ) : members.length ? (
              <div className="moderation-user-list">
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    server={server}
                    submitting={submitting}
                    onSubmit={handleModeration}
                  />
                ))}
              </div>
            ) : (
              <DataNotice>{query ? "No matching members." : "No members found."}</DataNotice>
            )}
          </section>

          <section className="moderation-section">
            <div className="moderation-section-title">
              <h3>Banned users</h3>
              <span>{moderation.bans.length}</span>
            </div>
            {moderation.bansError ? (
              <DataNotice>
                Could not load bans. The bot needs permission to view the server’s ban list.
              </DataNotice>
            ) : bans.length ? (
              <div className="moderation-user-list">
                {bans.map((ban) => (
                  <BanRow
                    key={ban.userId}
                    ban={ban}
                    serverId={server.id}
                    submitting={submitting}
                    onSubmit={handleModeration}
                  />
                ))}
              </div>
            ) : (
              <DataNotice>{query ? "No matching bans." : "No banned users."}</DataNotice>
            )}
          </section>
        </div>
      )}
    </section>
  )
}