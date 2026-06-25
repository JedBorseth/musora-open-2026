/**
 * Mirror of src/lib/golf-data (team structure) for server-side validation.
 */
export const TEAM_LABELS: Record<string, string> = {
  t1: 'Elton John',
  t2: 'John Fogerty',
  t3: 'John F. Kennedy',
  t4: 'John F. Kennedy Jr.',
  t5: 'John Lennon',
  t6: 'John Cena',
  t7: 'John Mayer',
  t8: 'John Daly',
  t9: 'John Travolta',
  t10: 'John Stamos',
  t11: 'John Legend',
  t12: 'Papa John',
  t13: 'John Krasinski',
  t14: 'Johnny Cash',
  t15: 'Johnny Depp',
  t16: 'Jon Bon Jovi',
  t17: 'John Deere',
  t18: 'Lil Jon',
  t19: 'John McEnroe',
  t20: 'Jon Wick',
  t21: 'Johnny Knoxville',
  t22: 'John McClane',
}

export const TEAM_SLOT_NUMBERS = [1, 2, 3, 4] as const

export function teamSlotPlayerId(slot: number): string {
  return `slot${slot}`
}

export function defaultTeamSlotName(slot: number): string {
  if (slot === 1) return 'Team Captain'
  return `Player ${slot}`
}

export function rosterPlayerIdsForTeamId(teamId: string): Array<string> {
  if (!TEAM_LABELS[teamId]) return []
  return TEAM_SLOT_NUMBERS.map((slot) => teamSlotPlayerId(slot))
}
