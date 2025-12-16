import { NextResponse } from 'next/server'
import { extractMinuteFromStatus, formatMatchMinute } from '@/lib/utils/date'

export async function GET() {
  const tests = [
    { input: "37'", expectedMinute: 37, expectedAdded: undefined, expectedDisplay: "37'" },
    { input: "45+2'", expectedMinute: 45, expectedAdded: 2, expectedDisplay: "45+2'" },
    { input: "45+3'", expectedMinute: 45, expectedAdded: 3, expectedDisplay: "45+3'" },
    { input: "90+4'", expectedMinute: 90, expectedAdded: 4, expectedDisplay: "90+4'" },
    { input: "HT", expectedMinute: undefined, expectedAdded: undefined, expectedDisplay: "" },
  ]

  const results = tests.map(test => {
    const result = extractMinuteFromStatus(test.input)
    const display = formatMatchMinute(result?.minute, result?.addedTime)
    
    return {
      input: test.input,
      extracted: result,
      display: display,
      passed: 
        result?.minute === test.expectedMinute &&
        result?.addedTime === test.expectedAdded &&
        display === test.expectedDisplay,
    }
  })

  return NextResponse.json({
    results,
    allPassed: results.every(r => r.passed),
  })
}