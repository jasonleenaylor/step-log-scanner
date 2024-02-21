export interface FailureDetail {
  unitName: string
  fileName: string
  lineInfo: number
}

export interface TestResult {
  fixture: string
  failures: number
  ignored: number
  passed: number
  failureDetails: FailureDetail[]
}

export interface TestResults {
  results: TestResult[]
}

class TestResultInstance implements TestResult {
  fixture: string
  failures: number
  ignored: number
  passed: number
  failureDetails: FailureDetail[]

  // prettier-ignore
  constructor() {
    this.fixture = ''
    this.failures = 0
    this.ignored = 0
    this.passed = 0
    this.failureDetails = []
  }
}

class FailureDetailInstance implements FailureDetail {
  unitName: string
  fileName: string
  lineInfo: number
  // prettier-ignore
  constructor() {
    this.unitName = ''
    this.fileName = ''
    this.lineInfo = 0
  }
}

export function parseTestResults(text: string): TestResults {
  const lines = text.split('\n')
  const testResults: TestResult[] = []
  const initialFixtureLine = /^NUnit report for (.+):/u
  const summaryLine = /Failures: (\d+) {4}Ignored: (\d+) {4}Passed: (\d+)/u
  const unitFailedLine = /(.*) FAILED in \d+\.?\d* secs\./u
  const exceptionLine = /(?:\s+at.*in )(.*)(?::line )(\d+)/u
  const unitPlusPlusLine = /(.*\.h):(\d+)/
  let result: TestResult | undefined = undefined
  let currentFailure = new FailureDetailInstance()
  // Find the beginning of the report for the fixture
  for (const line of lines) {
    const initMatch = line.match(initialFixtureLine)
    if (initMatch) {
      if (result) {
        if (currentFailure) {
          result.failureDetails.push(currentFailure)
        }
        testResults.push(result)
      }
      result = new TestResultInstance()
      result.fixture = initMatch[1]
      continue
    }
    if (!result) continue
    const summaryMatch = line.match(summaryLine)
    if (summaryMatch) {
      result.failures = parseInt(summaryMatch[1])
      result.ignored = parseInt(summaryMatch[2])
      result.passed = parseInt(summaryMatch[3])
      continue
    }
    if (result.failures) {
      const unitFailed = line.match(unitFailedLine)
      if (unitFailed) {
        if (currentFailure.unitName !== '') {
          result.failureDetails.push(currentFailure)
          currentFailure = new FailureDetailInstance()
        }
        currentFailure.unitName = unitFailed[1]
        continue
      }
      const exceptionMatch = line.match(exceptionLine)
      if (exceptionMatch) {
        currentFailure.fileName = exceptionMatch[1]
        currentFailure.lineInfo = parseInt(exceptionMatch[2])
        continue
      }
      const unitFailure = line.match(unitPlusPlusLine)
      if (unitFailure) {
        currentFailure.fileName = unitFailure[1]
        currentFailure.lineInfo = parseInt(unitFailure[2])
        continue
      }
    }
  }
  if (currentFailure.unitName !== '') {
    result?.failureDetails.push(currentFailure)
  }
  if (result) testResults.push(result)

  return { results: testResults }
}

export default parseTestResults
