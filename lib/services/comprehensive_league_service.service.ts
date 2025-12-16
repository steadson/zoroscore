import { apiGet, defaultRateLimiter } from '@/lib/utils/api'

const LIVESCORE_BASE_URL =
  process.env.LIVESCORE_BASE_URL_LEAGUE || 
  'https://prod-cdn-public-api.livescore.com/v1/api'
const DEFAULT_LOCALE = 'en'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PlayerStat {
  rank: number
  playerId: string
  playerName: string
  firstName?: string
  lastName?: string
  teamId: string
  teamName: string
  teamLogo: string
  imageUrl?: string
  value: number
}

export interface TeamStanding {
  rank: number
  teamId: string
  teamName: string
  teamLogo: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  promotionZone?: number[]
}

export interface TeamForm {
  rank: number
  teamId: string
  teamName: string
  teamLogo: string
  points: number
  goalDifference: number
  form: FormResult[]
}

export interface FormResult {
  result: number // 1 = win, 0 = draw, -1 = loss
  matchId: string
}

export interface LeagueStats {
  topScorers: PlayerStat[]
  assists: PlayerStat[]
  yellowCards: PlayerStat[]
  redCards: PlayerStat[]
  shots: PlayerStat[]
}

export interface LeagueTable {
  overall: TeamStanding[]
  home: TeamStanding[]
  away: TeamStanding[]
  form: TeamForm[]
}

export interface LeagueDetails {
  compId: string
  compName: string
  compDescription: string
  compUrlName: string
  country: string
    countryCode: string
    CompD: string
    CompN: string
  badgeUrl: string
  firstColor: string
  stageName: string
  stageCode: string
}

export interface LeagueMatch {
  matchId: string
  homeTeam: {
    id: string
    name: string
    logo: string
    abbreviation?: string
  }
  awayTeam: {
    id: string
    name: string
    logo: string
    abbreviation?: string
  }
  score: {
    home: number | null
    away: number | null
  }
  status: string
  startTime: number
  round?: string
}

export interface LeagueMatches {
  upcoming: LeagueMatch[]
  results: LeagueMatch[]
  live: LeagueMatch[]
}

export interface ComprehensiveLeagueData {
  details: LeagueDetails
  stats: LeagueStats
  table: LeagueTable
  matches: LeagueMatches
  lastUpdated: string
}

// ============================================================================
// RAW API RESPONSE INTERFACES
// ============================================================================

interface RawLeagueDetailsResponse {
  CompN: string
  CompId: string
  CompD: string
  CompUrlName: string
  Ccd: string
  CompST: string
  Cnm?: string
  badgeUrl?: string
  firstColor?: string
  Stages?: Array<{
    Sid: string
    Snm: string
    Scd: string
    Events?: RawLeagueEvent[]
  }>
}

interface RawLeagueEvent {
  Eid: string
  Esd: number
  Eps: string
  Tr1?: string
  Tr2?: string
  T1: Array<{
    ID: string
    Nm: string
    Img?: string
    Abr?: string
  }>
  T2: Array<{
    ID: string
    Nm: string
    Img?: string
    Abr?: string
  }>
  ErnInf?: string
}

interface RawStatsResponse {
  CompId: string
  CompN: string
  Stat?: Array<{
    Typ: number
    Plrs?: Array<{
      Rnk: number
      Pid: string
      Pnm: string
      Fn?: string
      Ln?: string
      Tid: string
      Tnm: string
      Img?: string
      imageUrl?: string
      Scrs?: Record<string, string>
    }>
  }>
}

interface RawLeagueTableResponse {
  Stages?: Array<{
    LeagueTable?: {
      L?: Array<{
        Tables?: Array<{
          LTT: number
          team?: Array<{
            rnk: number
            Tid: string
            Tnm: string
            Img?: string
            pld: number
            win: number
            drw: number
            lst: number
            gf: number
            ga: number
            gd: number
            pts: number
            phr?: number[]
            Form?: Array<{
              r: number
              Eid: string
            }>
          }>
        }>
      }>
    }
  }>
}

// ============================================================================
// MAIN FUNCTION - FETCH ALL LEAGUE DATA
// ============================================================================

/**
 * Fetch comprehensive league data from all endpoints
 * This is the main function called from API routes
 */
export async function fetchComprehensiveLeagueData(
  compId: string | undefined,
  ccd?: string,
  scd?: string
): Promise<ComprehensiveLeagueData | null> {
  try {
    console.log(`📊 Fetching comprehensive data for league ${compId}`)

    // Fetch all data in parallel
    const [detailsResult, statsResult, tableResult] = await Promise.allSettled([
      fetchLeagueDetailsFromAPI(compId, ccd, scd),
      fetchLeagueStatsFromAPI(compId, ccd, scd),
      fetchLeagueTableFromAPI(compId, ccd, scd),
    ])

    // Handle results
    const details = detailsResult.status === 'fulfilled' ? detailsResult.value : null
    const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
    const table = tableResult.status === 'fulfilled' ? tableResult.value : null

    if (!details) {
      console.error('Failed to fetch league details')
      return null
    }

    // Extract matches from details
    const matches = details.rawEvents ? extractMatches(details.rawEvents, details.compId) : {
      upcoming: [],
      results: [],
      live: [],
    }

    const comprehensiveData: ComprehensiveLeagueData = {
      details: {
        compId: details.compId,
        compName: details.compName,
        compDescription: details.compDescription,
        compUrlName: details.compUrlName,
        country: details.country,
        countryCode: details.countryCode,
        badgeUrl: details.badgeUrl,
        CompN: details.compN,
        CompD:details.compD,
        firstColor: details.firstColor,
        stageName: details.stageName,
        stageCode: details.stageCode,
      },
      stats: stats || {
        topScorers: [],
        assists: [],
        yellowCards: [],
        redCards: [],
        shots: [],
      },
      table: table || {
        overall: [],
        home: [],
        away: [],
        form: [],
      },
      matches,
      lastUpdated: new Date().toISOString(),
    }

    console.log(`✅ Successfully fetched comprehensive data for ${details.compName}`)
    return comprehensiveData
  } catch (error) {
    console.error('Error fetching comprehensive league data:', error)
    return null
  }
}

// ============================================================================
// INDIVIDUAL API ENDPOINT FUNCTIONS
// ============================================================================

/**
 * Fetch league details and matches from /details/1/ endpoint
 */
async function fetchLeagueDetailsFromAPI(
  compId: string | undefined,
  ccd?: string,
  scd?: string
) {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/competition/${compId}/details/1/?locale=${DEFAULT_LOCALE}`
    console.log(`📋 Fetching league details: ${url}`)

    const data = await apiGet<RawLeagueDetailsResponse>(url)

    if (!data) {
      throw new Error('No league details data returned')
    }

    const stage = data.Stages?.[0]

    return {
        compId: data.CompId,
        compD: data.CompD,
        compN: data.CompN,
      compName: data.CompN,
      compDescription: data.CompD,
      compUrlName: data.CompUrlName,
      country: data.Cnm || data.CompST,
      countryCode: data.Ccd,
      badgeUrl: data.badgeUrl || '',
      firstColor: data.firstColor || '',
      stageName: stage?.Snm || '',
      stageCode: stage?.Scd || '',
      rawEvents: stage?.Events || [],
    }
  } catch (error) {
    console.error(`Error fetching league details for ${compId}:`, error)
    throw error
  }
}

/**
 * Fetch league statistics from /stat/ endpoint
 */
async function fetchLeagueStatsFromAPI(
  compId: string | undefined,
  ccd?: string,
  scd?: string
): Promise<LeagueStats> {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/competition/${compId}/stat/?locale=${DEFAULT_LOCALE}`
    console.log(`📊 Fetching league stats: ${url}`)

    const data = await apiGet<RawStatsResponse>(url)

    if (!data || !data.Stat) {
      console.warn('No statistics data returned')
      return {
        topScorers: [],
        assists: [],
        yellowCards: [],
        redCards: [],
        shots: [],
      }
    }

    const stats: LeagueStats = {
      topScorers: [],
      assists: [],
      yellowCards: [],
      redCards: [],
      shots: [],
    }

    data.Stat.forEach((statCategory) => {
      const players = parsePlayerStats(statCategory)

      switch (statCategory.Typ) {
        case 1: // Goals
          stats.topScorers = players
          break
        case 3: // Assists
          stats.assists = players
          break
        case 4: // Red cards
          stats.redCards = players
          break
        case 6: // Yellow cards
          stats.yellowCards = players
          break
        case 8: // Shots
          stats.shots = players
          break
      }
    })

    console.log(`✅ Fetched stats for ${data.CompN}`)
    return stats
  } catch (error) {
    console.error(`Error fetching league stats for ${compId}:`, error)
    throw error
  }
}

/**
 * Fetch league table from /leagueTable/ endpoint
 */
async function fetchLeagueTableFromAPI(
  compId: string | undefined,
  ccd?: string,
  scd?: string
): Promise<LeagueTable> {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/competition/${compId}/leagueTable/?locale=${DEFAULT_LOCALE}`
    console.log(`🏆 Fetching league table: ${url}`)

    const data = await apiGet<RawLeagueTableResponse>(url)

    if (!data || !data.Stages?.[0]?.LeagueTable?.L?.[0]?.Tables) {
      console.warn('No league table data returned')
      return {
        overall: [],
        home: [],
        away: [],
        form: [],
      }
    }

    const tables = data.Stages[0].LeagueTable.L[0].Tables

    const table: LeagueTable = {
      overall: [],
      home: [],
      away: [],
      form: [],
    }

    // Overall standings (LTT: 1)
    const overallTable = tables.find((t) => t.LTT === 1)
    if (overallTable?.team) {
      table.overall = parseStandings(overallTable.team)
    }

    // Home standings (LTT: 2)
    const homeTable = tables.find((t) => t.LTT === 2)
    if (homeTable?.team) {
      table.home = parseStandings(homeTable.team)
    }

    // Away standings (LTT: 3)
    const awayTable = tables.find((t) => t.LTT === 3)
    if (awayTable?.team) {
      table.away = parseStandings(awayTable.team)
    }

    // Form table (LTT: 4)
    const formTable = tables.find((t) => t.LTT === 4)
    if (formTable?.team) {
      table.form = parseFormTable(formTable.team)
    }

    console.log(`✅ Fetched league table with ${table.overall.length} teams`)
    return table
  } catch (error) {
    console.error(`Error fetching league table for ${compId}:`, error)
    throw error
  }
}

// ============================================================================
// PARSING HELPER FUNCTIONS
// ============================================================================

function parsePlayerStats(statCategory: any): PlayerStat[] {
  if (!statCategory.Plrs || !Array.isArray(statCategory.Plrs)) {
    return []
  }

  return statCategory.Plrs.map((player: any) => ({
    rank: player.Rnk,
    playerId: player.Pid,
    playerName: player.Pnm,
    firstName: player.Fn,
    lastName: player.Ln,
    teamId: player.Tid,
    teamName: player.Tnm,
    teamLogo: player.Img || '',
    imageUrl: player.imageUrl,
    value: parseInt(Object.values(player.Scrs || {})[0] as string) || 0,
  }))
}

function parseStandings(teams: any[]): TeamStanding[] {
  return teams.map((team) => ({
    rank: team.rnk,
    teamId: team.Tid,
    teamName: team.Tnm,
    teamLogo: team.Img || '',
    played: team.pld,
    won: team.win,
    drawn: team.drw,
    lost: team.lst,
    goalsFor: team.gf,
    goalsAgainst: team.ga,
    goalDifference: team.gd,
    points: team.pts,
    promotionZone: team.phr,
  }))
}

function parseFormTable(teams: any[]): TeamForm[] {
  return teams.map((team) => ({
    rank: team.rnk,
    teamId: team.Tid,
    teamName: team.Tnm,
    teamLogo: team.Img || '',
    points: team.pts,
    goalDifference: team.gd,
    form:
      team.Form?.map((f: any) => ({
        result: f.r,
        matchId: f.Eid,
      })) || [],
  }))
}

function extractMatches(events: RawLeagueEvent[], compId: string): LeagueMatches {
  const matches: LeagueMatches = {
    upcoming: [],
    results: [],
    live: [],
  }

  events.forEach((event) => {
    const match: LeagueMatch = {
      matchId: event.Eid,
      homeTeam: {
        id: event.T1?.[0]?.ID || '',
        name: event.T1?.[0]?.Nm || '',
        logo: event.T1?.[0]?.Img || '',
        abbreviation: event.T1?.[0]?.Abr || '',
      },
      awayTeam: {
        id: event.T2?.[0]?.ID || '',
        name: event.T2?.[0]?.Nm || '',
        logo: event.T2?.[0]?.Img || '',
        abbreviation: event.T2?.[0]?.Abr || '',
      },
      score: {
        home: event.Tr1 ? parseInt(event.Tr1) : null,
        away: event.Tr2 ? parseInt(event.Tr2) : null,
      },
      status: event.Eps || 'NS',
      startTime: event.Esd,
      round: event.ErnInf,
    }

    // Categorize match
    if (event.Eps === 'FT') {
      matches.results.push(match)
    } else if (event.Eps === 'NS') {
      matches.upcoming.push(match)
    } else if (
      event.Eps &&
      (event.Eps.includes("'") || 
       event.Eps.includes('+') || 
       event.Eps === 'HT' || 
       event.Eps === 'INT')
    ) {
      matches.live.push(match)
    }
  })

  return matches
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getLeagueLogoUrl(badgeUrl: string): string {
  if (!badgeUrl) return ''
  
  if (badgeUrl.startsWith('http')) {
    return badgeUrl
  }

  if (badgeUrl.includes('teambadge/') || badgeUrl.includes('enet/')) {
    return `https://lsm-static-prod.livescore.com/medium/${badgeUrl}`
  }

  return `https://storage.livescore.com/images/competition/high/${badgeUrl}`
}

export function getTeamLogoUrl(teamImg: string): string {
  if (!teamImg) return ''
  
  if (teamImg.startsWith('http')) {
    return teamImg
  }

  return `https://lsm-static-prod.livescore.com/medium/${teamImg}`
}