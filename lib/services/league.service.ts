import { apiGet, defaultRateLimiter } from '@/lib/utils/api'

const LIVESCORE_BASE_URL =
  process.env.LIVESCORE_BASE_URL_LEAGUE || 
  'https://prod-cdn-public-api.livescore.com/v1/api';
const DEFAULT_LOCALE = 'en'
const DEFAULT_COUNTRY_CODE = 'NG'

/**
 * League/Competition Details Interface
 */
export interface LeagueDetails {
  CompN: string // Competition Name (e.g., "LaLiga")
  CompId?: string // Competition ID (e.g., "75") - now optional
  CompD: string // Competition Description (e.g., "Spain")
  CompUrlName?: string // URL-friendly name (e.g., "laliga")
  Ccd: string // Country code (e.g., "spain")
  Scd?: string // Stage code (e.g., "serbian-cup")
  CompST?: string // Competition short title
  Cnm: string // Country name
  CnmT?: string // Country name for template
  badgeUrl?: string // Badge/logo URL
  firstColor?: string // Primary color
  secondColor?: string // Secondary color
  Feed?: {
    Id: string
    Items: string[]
  }
  Stages?: LeagueStage[]
  Tables?: LeagueTable[]
}

export interface LeagueStage {
  Sid: string
  Snm: string // Stage name
  Scd: string // Stage code
  Cnm: string
  Ccd: string
  CompId?: string
  Scu: number
  Events?: LeagueEvent[]
}

export interface LeagueEvent {
  Eid: string
  Esd: number // Event start date
  Eps: string // Event period status
  Esid: number
  Epr: number
  Tr1?: string // Team 1 score
  Tr2?: string // Team 2 score
  Trh1?: string // Team 1 halftime score
  Trh2?: string // Team 2 halftime score
  T1: TeamInfo[]
  T2: TeamInfo[]
  Ecov?: number
  Ewt?: number
  Et?: number
}

export interface TeamInfo {
  ID: string
  Nm: string // Team name
  Img?: string // Team logo
  Abr?: string // Abbreviation
  Fc?: string // First color
  Sc?: string // Second color
}

export interface LeagueTable {
  LTT: number
  team: TeamStanding[]
  phrX?: any[]
}

export interface TeamStanding {
  rnk: number // Rank
  Tid: string // Team ID
  Tnm: string // Team name
  Img?: string // Team logo
  win: number // Wins
  winn: string
  wreg: number
  wap: number
  lst: number // Losses
  lstn: string
  lreg: number
  drw: number // Draws
  drwn: string
  gf: number // Goals for
  ga: number // Goals against
  gd: number // Goal difference
  pts: number // Points
  ptsn: string
  pld: number // Played
  phr?: number[]
  Ipr: number
}

/**
 * Fetch competition/league details by CompId
 */
export async function fetchLeagueDetails(
  compId: string
): Promise<LeagueDetails> {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/competition/${compId}/leagueTable/?locale=${DEFAULT_LOCALE}`

    console.log(`📊 Fetching league details: ${url}`)

    const data = await apiGet<LeagueDetails>(url)

    if (!data) {
      throw new Error('No league data returned')
    }

    console.log(`✅ Fetched league details for ${data.CompN}`)

    return data
  } catch (error) {
    console.error(`Error fetching league details for ${compId}:`, error)
    throw error
  }
}

/**
 * Fetch league details by Stage (Ccd/Scd) - for leagues without CompId
 * URL format: /app/stage/soccer/{Ccd}/{Scd}/1?countryCode=NG&locale=en
 */
export async function fetchLeagueByStage(
  ccd: string,
  scd: string,
  countryCode: string = DEFAULT_COUNTRY_CODE
): Promise<LeagueDetails> {
  try {
    await defaultRateLimiter.waitIfNeeded()

    const url = `${LIVESCORE_BASE_URL}/app/stage/soccer/${ccd}/${scd}/1?countryCode=${countryCode}&locale=${DEFAULT_LOCALE}`

    console.log(`📊 Fetching league by stage: ${url}`)

    const data = await apiGet<LeagueDetails>(url)

    if (!data) {
      throw new Error('No league data returned')
    }

    console.log(`✅ Fetched league details for ${data.CompN || data.Cnm}`)

    return data
  } catch (error) {
    console.error(`Error fetching league by stage ${ccd}/${scd}:`, error)
    throw error
  }
}

/**
 * Fetch league details with fallback
 * Tries CompId first, then falls back to Ccd/Scd if CompId fails or is missing
 */
export async function fetchLeagueDetailsWithFallback(
  compId: string | undefined,
  ccd: string,
  scd: string
): Promise<LeagueDetails | null> {
  // Try CompId first if available
  if (compId && compId !== 'undefined') {
    try {
      console.log(`🔄 Trying CompId route: ${compId}`)
      return await fetchLeagueDetails(compId)
    } catch (error) {
      console.warn(`⚠️ CompId ${compId} failed, trying Ccd/Scd fallback...`)
    }
  } else {
    console.log(`⏭️ No valid CompId, using Ccd/Scd route directly`)
  }

  // Fallback to Ccd/Scd
  try {
    console.log(`🔄 Trying Ccd/Scd route: ${ccd}/${scd}`)
    return await fetchLeagueByStage(ccd, scd)
  } catch (error) {
    console.error(`❌ Both CompId and Ccd/Scd failed for ${ccd}/${scd}`)
    return null
  }
}

/**
 * Get full logo URL from badge path
 */
export function getLeagueLogoUrl(badgeUrl?: string): string | undefined {
  if (!badgeUrl) return undefined

  // Same logic as livescore.service.ts
  if (badgeUrl.includes("/enet/")) {
    return `https://lsm-static-prod.livescore.com/medium/${badgeUrl}`
  }

  return `https://storage.livescore.com/images/competition/high/${badgeUrl}`
}

/**
 * Get team logo URL
 */
export function getTeamLogoUrl(teamImg?: string): string | undefined {
  if (!teamImg) return undefined
  return `https://lsm-static-prod.livescore.com/medium/${teamImg}`
}

/**
 * Parse event status (same as match status)
 */
export function parseEventStatus(
  eps: string
): 'upcoming' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled' {
  const status = eps?.toUpperCase().trim()

  if (status === 'FT' || status === 'AET' || status === 'PEN') {
    return 'finished'
  }

  if (status === 'HT') {
    return 'halftime'
  }

  if (status.endsWith("'") || status.includes("'+")) {
    return 'live'
  }

  if (status === 'LIVE' || status === '1H' || status === '2H') {
    return 'live'
  }

  if (status === 'NS' || status === 'TBA') {
    return 'upcoming'
  }

  if (status === 'PST' || status === 'POSTPONED') {
    return 'postponed'
  }

  if (status === 'CANC' || status === 'ABD' || status === 'CANCELLED') {
    return 'cancelled'
  }

  return 'upcoming'
}