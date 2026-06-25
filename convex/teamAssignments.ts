import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  TEAM_LABELS,
  TEAM_SLOT_NUMBERS,
  defaultTeamSlotName,
  teamSlotPlayerId,
} from './golfRoster'

const MAX_TEAM_SLOTS = 4

function normalizePlayerName(name: string, slot: number): string {
  const trimmed = name.trim()
  return trimmed || defaultTeamSlotName(slot)
}

async function rowsForTeam(ctx: QueryCtx | MutationCtx, teamId: string) {
  return await ctx.db
    .query('assignedTeamSlots')
    .withIndex('by_team_id', (q) => q.eq('teamId', teamId))
    .collect()
}

function rosterFromRows(
  rows: Array<{ slot: number; playerName: string }>,
): Array<{ id: string; slot: number; name: string; claimed: boolean }> {
  return TEAM_SLOT_NUMBERS.map((slot) => {
    const row = rows.find((r) => r.slot === slot)
    return {
      id: teamSlotPlayerId(slot),
      slot,
      name: row?.playerName ?? defaultTeamSlotName(slot),
      claimed: row !== undefined,
    }
  })
}

export const listTeamAvailability = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('assignedTeamSlots').collect()
    return Object.entries(TEAM_LABELS).map(([teamId, teamName]) => {
      const claimedSlots = rows
        .filter((r) => r.teamId === teamId)
        .map((r) => r.slot)
        .filter((slot) => slot >= 1 && slot <= MAX_TEAM_SLOTS)
      return {
        teamId,
        teamName,
        claimedCount: new Set(claimedSlots).size,
        maxCount: MAX_TEAM_SLOTS,
      }
    })
  },
})

export const teamRoster = query({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    if (!TEAM_LABELS[args.teamId]) {
      throw new ConvexError('Unknown team')
    }
    const rows = await rowsForTeam(ctx, args.teamId)
    return rosterFromRows(rows)
  },
})

export const listAssignedTeamSlots = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('assignedTeamSlots').collect()
    return rows
      .map((row) => ({
        teamId: row.teamId,
        teamName: TEAM_LABELS[row.teamId] ?? row.teamId,
        slot: row.slot,
        playerId: teamSlotPlayerId(row.slot),
        playerName: row.playerName,
      }))
      .sort((a, b) => {
        const teamCmp = a.teamName.localeCompare(b.teamName)
        if (teamCmp !== 0) return teamCmp
        return a.slot - b.slot
      })
  },
})

export const claimTeamSlot = mutation({
  args: {
    teamId: v.string(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    if (!TEAM_LABELS[args.teamId]) {
      throw new ConvexError('Unknown team')
    }

    const rows = await rowsForTeam(ctx, args.teamId)
    const claimed = new Set(
      rows
        .map((r) => r.slot)
        .filter((slot) => slot >= 1 && slot <= MAX_TEAM_SLOTS),
    )
    const slot = TEAM_SLOT_NUMBERS.find((candidate) => !claimed.has(candidate))
    if (slot === undefined) {
      throw new ConvexError(
        'That team already has four players assigned. Pick another team or ask an admin to clear a slot.',
      )
    }

    const existing = await ctx.db
      .query('assignedTeamSlots')
      .withIndex('by_team_id_and_slot', (q) =>
        q.eq('teamId', args.teamId).eq('slot', slot),
      )
      .unique()
    if (existing !== null) {
      throw new ConvexError(
        'That team slot was just claimed. Pick the team again to get the next open slot.',
      )
    }

    await ctx.db.insert('assignedTeamSlots', {
      teamId: args.teamId,
      slot,
      playerName: normalizePlayerName(args.playerName, slot),
    })

    const nextRows = await rowsForTeam(ctx, args.teamId)
    return {
      teamId: args.teamId,
      teamName: TEAM_LABELS[args.teamId],
      slot,
      playerId: teamSlotPlayerId(slot),
      playerName: normalizePlayerName(args.playerName, slot),
      roster: rosterFromRows(nextRows),
    }
  },
})

export const releaseTeamSlot = mutation({
  args: {
    teamId: v.string(),
    slot: v.number(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('assignedTeamSlots')
      .withIndex('by_team_id_and_slot', (q) =>
        q.eq('teamId', args.teamId).eq('slot', args.slot),
      )
      .collect()
    for (const row of rows) {
      await ctx.db.delete(row._id)
    }
  },
})
