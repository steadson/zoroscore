import { apiGet, defaultRateLimiter } from '@/lib/utils/api'
import {
  parseLiveScoreDate,
  parseMatchStatus,
  formatDateForLiveScore,
  getTodayLiveScoreFormat,
  
} from '@/lib/utils/date'
import { Match, MatchEvent, MatchStatus, Team } from '@/lib/types'
import { extractMinuteFromStatus, formatMatchMinute } from '@/lib/utils/date'
interface LiveScoreTeam {
  ID: string
  Nm: string
  Img?: string
  Abr?: string
  Fc?: string
  Sc?: string
}

interface LiveScoreIncident {
  IT: number
  Nm: number
  Sc?: number[]
  NoP?: boolean
}

interface LiveScoreEvent {
  Eid: string
  Esd: number
  Eps: string
  Esid: number
  Epr: number
  Tr1: string
  Tr2: string
  Trh1?: string
  Trh2?: string
  T1: LiveScoreTeam[]
  T2: LiveScoreTeam[]
  'Inc-f'?: {
    [period: string]: LiveScoreIncident[]
  }
  Ecov?: number
  Ewt?: number
  Et?: number
}

interface LiveScoreStage {
  Sid: string
  Snm: string
  Scd: string
  Cnm: string
  Ccd: string
  CompId: string
  CompN: string
  badgeUrl?: string
  firstColor?: string
  Events: LiveScoreEvent[]
}

interface LiveScoreResponse {
  Ts: number
  Stages: LiveScoreStage[]
}

const LIVESCORE_BASE_URL =
  process.env.LIVESCORE_API_URL || 'https://prod-cdn-mev-api.livescore.com/v1/api'
const DEFAULT_COUNTRY_CODE = 'NG'
const DEFAULT_LOCALE = 'en'
const DEFAULT_PAGE = 1

export async function fetchMatchesByDate(
  date: string = getTodayLiveScoreFormat(),
  page: number = DEFAULT_PAGE
): Promise<Match[]> {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/date/soccer/${date}/${page}?countryCode=${DEFAULT_COUNTRY_CODE}&locale=${DEFAULT_LOCALE}`

    console.log(`ðŸ”„ Fetching matches from LiveScore: ${url}`)

    const data = await apiGet<LiveScoreResponse>(url)

    if (!data || !data.Stages) {
      console.warn('No stages found in LiveScore response')
      return []
    }

    const matches: Match[] = []

    for (const stage of data.Stages) {
      if (!stage.Events || stage.Events.length === 0) {
        continue
      }

      for (const event of stage.Events) {
        try {
          const match = transformLiveScoreMatch(event, stage)
          matches.push(match)
        } catch (error) {
          console.error(`Failed to transform match ${event.Eid}:`, error)
        }
      }
    }

    console.log(`âœ… Fetched ${matches.length} matches from LiveScore`)

    return matches
  } catch (error) {
    console.error('Error fetching matches from LiveScore:', error)
    throw error
  }
}
export async function fetchLiveMatchesFromAPI (): Promise<Match[]> {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/live/soccer/1?countryCode=${DEFAULT_COUNTRY_CODE}&locale=${DEFAULT_LOCALE}`

    console.log(`ðŸ”´ Fetching LIVE matches from LiveScore: ${url}`)

    const data = await apiGet<LiveScoreResponse>(url)

    if (!data || !data.Stages) {
      console.log('No live matches at the moment')
      return []
    }

    const matches: Match[] = []

    for (const stage of data.Stages) {
      if (!stage.Events || stage.Events.length === 0) {
        continue
      }

      for (const event of stage.Events) {
        try {
          const match = transformLiveScoreMatch(event, stage)
          matches.push(match)
          // Double-check it's actually live (should be, but verify)
          // if (match.status === 'live' || match.status === 'halftime') {
          //   matches.push(match)
          // }
        } catch (error) {
          console.error(`Failed to transform match ${event.Eid}:`, error)
        }
      }
    }

    console.log(`âœ… Fetched ${matches.length} LIVE matches`)

    return matches
  } catch (error) {
    console.error('Error fetching live matches from LiveScore:', error)
    throw error
  }
}
export function transformLiveScoreMatch(event: LiveScoreEvent, stage: LiveScoreStage): Match {
  const homeTeam: Team = {
    id: event.T1[0]?.ID || 'unknown',
    name: event.T1[0]?.Nm || 'Unknown Team',
    logo: event.T1[0]?.Img ? `https://lsm-static-prod.livescore.com/medium/${event.T1[0].Img}` : undefined,
    shortName: event.T1[0]?.Abr,
  }

  const awayTeam: Team = {
    id: event.T2[0]?.ID || 'unknown',
    name: event.T2[0]?.Nm || 'Unknown Team',
    logo: event.T2[0]?.Img ? `https://lsm-static-prod.livescore.com/medium/${event.T2[0].Img}` : undefined,
    shortName: event.T2[0]?.Abr,
  }

  const score = {
    home: parseInt(event.Tr1 || '0'),
    away: parseInt(event.Tr2 || '0'),
    halfTime: event.Trh1 && event.Trh2
      ? {
          home: parseInt(event.Trh1),
          away: parseInt(event.Trh2),
        }
      : undefined,
  }

  const startTime = parseLiveScoreDate(event.Esd)
  const status = parseMatchStatus(event.Eps)
  const matchEvents = extractMatchEvents(event['Inc-f'])

  // Extract minute and added time separately
  let minute: number | undefined
  let addedTime: number | undefined
  
  if (status === 'live') {
    const timeInfo = extractMinuteFromStatus(event.Eps)
    if (timeInfo) {
      minute = timeInfo.minute
      addedTime = timeInfo.addedTime
    }
  } else if (status === 'halftime') {
    minute = 45
    addedTime = undefined
  }

  let ttl: Date | undefined
  if (status === 'finished') {
    ttl = new Date(startTime.getTime() + 48 * 60 * 60 * 1000)
  }

  const match: Match = {
    match_id: event.Eid,
    homeTeam,
    awayTeam,
    score,
    status,
    startTime,
    league: {
      id: stage.CompId || stage.Sid,
      name: stage.Snm,
      country: stage.Cnm,
      logo: stage.badgeUrl
        ? stage.badgeUrl.includes("/enet/")
          ? `https://lsm-static-prod.livescore.com/medium/${stage.badgeUrl}`
          : `https://storage.livescore.com/images/competition/high/${stage.badgeUrl}`
        : stage.Ccd
          ? `https://storage.livescore.com/images/flag/${stage.Ccd}.jpg`
          : undefined,
          ccd: stage.Ccd,                    // ← ADD THIS
      scd: stage.Scd,                    // ← ADD THIS
      compId: stage.CompId || undefined, // ← ADD THIS
    },
    events: matchEvents,
    stats: undefined,
    minute,
    addedTime,  // â† ADD THIS
    lastUpdated: new Date(),
    ttl,
  }

  return match
}

function extractMatchEvents(incidents?: { [period: string]: LiveScoreIncident[] }): MatchEvent[] {
  const events: MatchEvent[] = []

  if (!incidents) {
    return events
  }

  Object.entries(incidents).forEach(([period, periodIncidents]) => {
    const periodNum = parseInt(period)
    const baseMinute = periodNum === 1 ? 0 : 45

    periodIncidents.forEach((incident, index) => {
      const minute = baseMinute + (incident.Nm || 0)

      let type: MatchEvent['type'] = 'goal'
      
      if (incident.IT === 1 || incident.IT === 1037) {
        type = 'goal'
      } else if (incident.IT === 2) {
        type = 'yellow_card'
      } else if (incident.IT === 3) {
        type = 'red_card'
      } else if (incident.IT === 4) {
        type = 'substitution'
      }

      events.push({
        id: `${period}-${index}-${incident.IT}`,
        type,
        minute,
        team: 'home',
        description: `Event at ${minute}'`,
      })
    })
  })

  return events
}

export async function fetchTodayMatches(): Promise<Match[]> {
  return fetchMatchesByDate(getTodayLiveScoreFormat())
}

export async function fetchMatchesForDateRange(startDate: Date, days: number = 1): Promise<Match[]> {
  const allMatches: Match[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = formatDateForLiveScore(date)

    const matches = await fetchMatchesByDate(dateStr)
    allMatches.push(...matches)
  }

  return allMatches
}

export function filterMatchesByStatus(matches: Match[], status: MatchStatus): Match[] {
  return matches.filter((match) => match.status === status)
}

export function groupMatchesByLeague(matches: Match[]): Record<string, Match[]> {
  return matches.reduce((acc, match) => {
    const leagueId = match.league.id
    if (!acc[leagueId]) {
      acc[leagueId] = []
    }
    acc[leagueId].push(match)
    return acc
  }, {} as Record<string, Match[]>)
}

export function sortMatchesByTime(matches: Match[], ascending: boolean = true): Match[] {
  return [...matches].sort((a, b) => {
    const timeA = a.startTime.getTime()
    const timeB = b.startTime.getTime()
    return ascending ? timeA - timeB : timeB - timeA
  })
}