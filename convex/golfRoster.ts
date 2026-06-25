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

/** Keep in sync with PLAYERS in src/lib/golf-data.ts (id + teamId only). */
export const PLAYERS: Array<{ id: string; teamId: string }> = [
  { id: 'p1', teamId: 't1' },
  { id: 'p2', teamId: 't2' },
  { id: 'p3', teamId: 't3' },
  { id: 'p4', teamId: 't4' },
  { id: 'p5', teamId: 't5' },
  { id: 'p6', teamId: 't6' },
  { id: 'p7', teamId: 't7' },
  { id: 'p8', teamId: 't8' },
  { id: 'p9', teamId: 't9' },
  { id: 'p10', teamId: 't10' },
  { id: 'p11', teamId: 't11' },
  { id: 'p12', teamId: 't12' },
  { id: 'p13', teamId: 't13' },
  { id: 'p14', teamId: 't14' },
  { id: 'p15', teamId: 't15' },
  { id: 'p16', teamId: 't16' },
  { id: 'p17', teamId: 't17' },
  { id: 'p18', teamId: 't18' },
  { id: 'p19', teamId: 't19' },
  { id: 'p20', teamId: 't20' },
  { id: 'p21', teamId: 't21' },
  { id: 'p22', teamId: 't22' },
]

export function rosterPlayerIdsForTeamId(teamId: string): Array<string> {
  if (!TEAM_LABELS[teamId]) return []
  return PLAYERS.filter((p) => p.teamId === teamId).map((p) => p.id)
}
