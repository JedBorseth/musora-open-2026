import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ConvexError } from 'convex/values'
import { useMutation } from 'convex/react'
import * as React from 'react'
import { ArrowLeftIcon } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import { PlayerCombobox } from '~/components/player-combobox'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { emptyProfile, loadProfile, saveProfile } from '~/lib/device-profile'
import { TEAM_LABELS, defaultTeamSlotName } from '~/lib/golf-data'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/play/setup')({
  component: PlaySetupPage,
})

type Step = 'role' | 'team' | 'player'

function PlaySetupPage() {
  const navigate = useNavigate()
  const [ready, setReady] = React.useState(false)
  const [step, setStep] = React.useState<Step>('role')
  const [teamId, setTeamId] = React.useState<string | null>(null)
  const [playerName, setPlayerName] = React.useState('')
  const [startingHoleInput, setStartingHoleInput] = React.useState('1')

  const availabilityOpts = convexQuery(
    api.teamAssignments.listTeamAvailability,
    {},
  )
  const { data: teamAvailability, isPending: availabilityPending } =
    useQuery(availabilityOpts)
  const claimTeamSlot = useMutation(api.teamAssignments.claimTeamSlot)
  const ensureTeamPlaceholder = useMutation(
    api.golf.ensureTeamPlaceholderScorecard,
  )

  const availableTeams = React.useMemo(
    () =>
      (teamAvailability ?? []).filter(
        (team) => team.claimedCount < team.maxCount,
      ),
    [teamAvailability],
  )

  const teamOptions = React.useMemo(
    () =>
      availableTeams.map((team) => ({
        id: team.teamId,
        name: `${team.teamName} (${team.claimedCount}/${team.maxCount})`,
      })),
    [availableTeams],
  )

  const selectedTeam = React.useMemo(
    () => teamAvailability?.find((team) => team.teamId === teamId) ?? null,
    [teamAvailability, teamId],
  )

  const nextSlot = Math.min((selectedTeam?.claimedCount ?? 0) + 1, 4)

  React.useEffect(() => {
    if (step !== 'team') return
    if (teamId === null) return
    const stillAvailable = availableTeams.some((team) => team.teamId === teamId)
    if (!stillAvailable) setTeamId(null)
  }, [step, teamId, availableTeams])

  React.useEffect(() => {
    if (!selectedTeam) return
    setPlayerName(defaultTeamSlotName(nextSlot))
  }, [selectedTeam, nextSlot])

  React.useEffect(() => {
    const existing = loadProfile()
    if (existing?.onboardingComplete) {
      if (existing.role === 'player') {
        void navigate({ to: '/play', replace: true })
        return
      }
      void navigate({ to: '/leaderboard', replace: true })
      return
    }
    setReady(true)
  }, [navigate])

  function finishSpectator() {
    saveProfile({
      ...emptyProfile(),
      role: 'spectator',
      onboardingComplete: true,
    })
    void navigate({ to: '/leaderboard' })
  }

  async function finishPlayerSetup(): Promise<void> {
    if (!selectedTeam) return

    const startingHole = Number.parseInt(startingHoleInput, 10)
    const normalizedHole =
      Number.isInteger(startingHole) && startingHole >= 1 && startingHole <= 18
        ? startingHole
        : 1

    let claim: Awaited<ReturnType<typeof claimTeamSlot>>
    try {
      claim = await claimTeamSlot({
        teamId: selectedTeam.teamId,
        playerName,
      })
    } catch (e: unknown) {
      if (e instanceof ConvexError && typeof e.data === 'string') {
        window.alert(e.data)
        return
      }
      window.alert(
        e instanceof Error ? e.message : 'Could not save your team spot.',
      )
      return
    }

    const fallback = TEAM_LABELS[claim.teamId] ?? selectedTeam.teamName
    let serverTeamDisplayName: string
    try {
      const ensured = await ensureTeamPlaceholder({
        teamId: claim.teamId,
        teamName: fallback,
      })
      serverTeamDisplayName = ensured.teamDisplayName
    } catch (e: unknown) {
      if (e instanceof ConvexError && typeof e.data === 'string') {
        window.alert(e.data)
        return
      }
      window.alert(
        e instanceof Error
          ? e.message
          : 'Could not register your team on the leaderboard. Try again.',
      )
      return
    }

    saveProfile({
      version: 2,
      role: 'player',
      playerId: claim.playerId,
      playerName: claim.playerName,
      teamId: claim.teamId,
      teamName: serverTeamDisplayName,
      teamSlot: claim.slot,
      startingHole: normalizedHole,
      onboardingComplete: true,
    })
    void navigate({ to: '/play' })
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
        Loading setup…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mb-6 flex items-center gap-2">
        <Link
          to="/"
          aria-label="Back home"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
            'rounded-full',
          )}
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Play golf
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Quick setup
          </h1>
        </div>
      </div>

      {step === 'role' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Are you playing?</CardTitle>
            <CardDescription>
              Spectators jump straight to the live leaderboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              size="lg"
              className="h-12 rounded-xl text-base"
              onClick={() => setStep('team')}
            >
              I&apos;m playing
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl text-base"
              onClick={finishSpectator}
            >
              Just spectating
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'team' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pick your team</CardTitle>
            <CardDescription>
              Each team can be joined by four phones. Full teams disappear from
              this list. If your team is full, ask an admin to clear a team
              slot. You can also spectate as a guest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availabilityPending ? (
              <p className="text-sm text-muted-foreground">Loading teams…</p>
            ) : teamOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every team already has four players assigned. Ask an admin to
                clear a team slot if this is a mistake.
              </p>
            ) : (
              <PlayerCombobox
                players={teamOptions}
                valueId={teamId}
                onSelect={setTeamId}
                placeholder="Search teams…"
              />
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={() => setStep('role')}
            >
              Back
            </Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={
                !teamId || availabilityPending || teamOptions.length === 0
              }
              onClick={() => setStep('player')}
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 'player' && selectedTeam && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your player info</CardTitle>
            <CardDescription>
              You are joining {selectedTeam.teamName} as player {nextSlot} of 4.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Your name</Label>
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={defaultTeamSlotName(nextSlot)}
                className="rounded-xl"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starting-hole">Starting hole</Label>
              <Input
                id="starting-hole"
                value={startingHoleInput}
                onChange={(e) =>
                  setStartingHoleInput(
                    e.target.value.replace(/\D/g, '').slice(0, 2),
                  )
                }
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="1"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Choose a hole from 1 to 18. You can still move around once play
                starts.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={() => setStep('team')}
            >
              Back
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={() => void finishPlayerSetup()}
            >
              Start on hole {startingHoleInput || '1'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
