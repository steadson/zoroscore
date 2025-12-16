import { NextRequest, NextResponse } from 'next/server'
import { fetchTodayMatches } from '@/lib/services/livescore.service'
import { syncMatchesToDb, getMatchStats, matchCache } from '@/lib/services/match.service'

/**
 * Manual sync endpoint
 * 1. Fetches from LiveScore API
 * 2. Updates IN-MEMORY cache (fast)
 * 3. Optionally syncs to DB (if 15 mins passed)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('🔄 Manual sync started...')

    // Step 1: Fetch matches from LiveScore API
    const matches = await fetchTodayMatches()
    console.log(`📥 Fetched ${matches.length} matches from LiveScore`)

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches found for today',
        stats: { fetched: 0, cached: 0, dbSynced: 0 },
        duration: `${Date.now() - startTime}ms`,
      })
    }

    // Step 2: Update IN-MEMORY cache (FAST!)
    matchCache.updateMatches(matches)
    console.log(`💾 Updated ${matches.length} matches in memory cache`)

    // Step 3: Sync to DB if 15 minutes passed
    let dbSyncResult = null
    if (matchCache.shouldSyncToDb()) {
      console.log('⏰ 15 minutes passed, syncing to database...')
      try {
        dbSyncResult = await syncMatchesToDb(matches)
        console.log(`✅ Synced ${dbSyncResult.success} matches to database`)
      } catch (error) {
        console.warn('⚠️  Database sync failed, but memory cache is updated:', error)
      }
    } else {
      console.log('⏭️  Skipping DB sync (not yet 15 minutes)')
    }

    // Step 4: Get statistics
    const stats = await getMatchStats()
    const duration = Date.now() - startTime

    console.log(`✅ Sync completed in ${duration}ms`)
    console.log(`📊 Cache stats:`, stats)

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        fetched: matches.length,
        cached: matches.length,
        dbSynced: dbSyncResult?.success || 0,
        dbFailed: dbSyncResult?.failed || 0,
      },
      cache: stats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      dbSyncErrors: dbSyncResult?.errors?.slice(0, 3) || [],
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Manual sync failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Manual sync failed',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}