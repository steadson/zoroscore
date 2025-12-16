import connectDB from '@/lib/db/mongodb'
import { MatchModel } from '@/models'
import { Match } from '@/lib/types'
import matchCache from '@/lib/cache/matchCache'

/**
 * Save or update a single match in the database
 * Used for periodic DB backups
 */
export async function saveMatchToDb(match: Match): Promise<void> {
  await connectDB()

  try {
    await MatchModel.findOneAndUpdate(
      { match_id: match.match_id },
      {
        $set: {
          ...match,
          lastUpdated: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    )
  } catch (error) {
    console.error(`Failed to save match ${match.match_id} to DB:`, error)
    throw error
  }
}

/**
 * Save multiple matches to database (backup every 15 mins)
 */
export async function syncMatchesToDb(
  matches: Match[]
): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  await connectDB()

  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const match of matches) {
    try {
      await saveMatchToDb(match)
      success++
    } catch (error) {
      failed++
      errors.push(
        `Match ${match.match_id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  // Update cache's last DB sync time
  if (success > 0) {
    matchCache.setLastDbSync()
  }

  return { success, failed, errors }
}

/**
 * Load matches from database to memory (on startup)
 */
export async function loadMatchesFromDb(): Promise<Match[]> {
  await connectDB()

  try {
    const matches = await MatchModel.find()
      .sort({ startTime: -1 })
      .lean<Match[]>()

    console.log(`📥 Loaded ${matches.length} matches from database`)
    return matches
  } catch (error) {
    console.error('Failed to load matches from database:', error)
    return []
  }
}

/**
 * Get all matches (from memory first, DB as fallback)
 */
export async function getAllMatches(): Promise<Match[]> {
  // Try memory first
  if (!matchCache.isEmpty()) {
    return matchCache.getAllMatches()
  }

  // Fallback to DB if memory is empty
  console.log('⚠️  Memory cache empty, loading from database...')
  const matches = await loadMatchesFromDb()
  
  if (matches.length > 0) {
    matchCache.setMatches(matches)
  }

  return matches
}

/**
 * Get matches by status (from memory)
 */
export async function getMatchesByStatus(
  status: Match['status']
): Promise<Match[]> {
  // Check memory first
  if (!matchCache.isEmpty()) {
    return matchCache.getMatchesByStatus(status)
  }

  // Load from DB if memory empty
  await getAllMatches()
  return matchCache.getMatchesByStatus(status)
}

/**
 * Get live matches (from memory)
 */
export async function getLiveMatches(): Promise<Match[]> {
  if (!matchCache.isEmpty()) {
    return matchCache.getLiveMatches();
  }

  await getAllMatches();
  return matchCache.getLiveMatches();
}

/**
 * Get today's matches (from memory)
 */
export async function getTodayMatches(): Promise<Match[]> {
  if (!matchCache.isEmpty()) {
    return matchCache.getTodayMatches()
  }

  await getAllMatches()
  return matchCache.getTodayMatches()
}

/**
 * Get a single match by ID (from memory)
 */
export async function getMatchById(matchId: string): Promise<Match | null> {
  const match = matchCache.getMatch(matchId)
  
  if (match) {
    return match
  }

  // If not in memory, check DB
  await connectDB()
  const dbMatch = await MatchModel.findOne({ match_id: matchId }).lean<Match>()
  
  if (dbMatch) {
    matchCache.setMatch(dbMatch)
  }

  return dbMatch
}

/**
 * Get match statistics (from memory)
 */
export async function getMatchStats() {
  if (matchCache.isEmpty()) {
    await getAllMatches()
  }

  return matchCache.getStats()
}

/**
 * Get matches grouped by league (from memory)
 */
export async function getMatchesGroupedByLeague(): Promise<
  Record<string, Match[]>
> {
  if (matchCache.isEmpty()) {
    await getAllMatches();
  }

  return matchCache.getMatchesGroupedByLeague();
}

/**
 * Delete old finished matches from database
 */
export async function cleanupOldMatches(): Promise<number> {
  await connectDB()

  const result = await MatchModel.deleteMany({
    status: 'finished',
    ttl: { $lt: new Date() },
  })

  return result.deletedCount || 0
}

// Export the cache for direct access
export { matchCache }