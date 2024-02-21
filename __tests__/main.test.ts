/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')
// mock all the github api calls
jest.mock('@actions/github', () => ({
  getOctokit: () => {
    return {
      rest: {
        checks: {
          update: () => {
            return
          },
          create: () => {
            return {
              data: { id: 1 }
            }
          }
        }
      }
    }
  },
  context: {
    runId: '1',
    payload: {
      pull_request: {
        head: { sha: 'abcadaba' }
      }
    }
  }
}))

// Mock the GitHub Actions core library
let errorMock: jest.SpyInstance
let getInputMock: jest.SpyInstance
let setFailedMock: jest.SpyInstance

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
  })

  it('sets a failed status', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'log-path':
          return './__tests__/exception-failed-test-data.txt'
        case 'encoding':
          return 'utf-8'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).toHaveBeenNthCalledWith(1, 'Some unit tests failed.')
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('does not fail with no failures', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'log-path':
          return './__tests__/success-test-data.txt'
        case 'encoding':
          return 'utf-8'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(errorMock).not.toHaveBeenCalled()
  })
})

describe('generate summaries', () => {
  it('generates correct short summary', () => {
    const results = main.generateShortSummaryFromResults({
      results: [
        {
          passed: 1,
          failures: 2,
          ignored: 3,
          failureDetails: [],
          fixture: 'test'
        }
      ]
    })
    expect(results).toContain('1 passed')
    expect(results).toContain('2 failed')
    expect(results).toContain('3 ignored')
  })
  it('generates correct full summary from results', () => {
    const results = main.generateSummaryFromResults({
      results: [
        {
          passed: 1,
          failures: 0,
          ignored: 3,
          failureDetails: [],
          fixture: 'test'
        },
        {
          passed: 0,
          failures: 1,
          ignored: 0,
          failureDetails: [],
          fixture: 'FailFixture'
        }
      ]
    })
    expect(results).toContain('test: 1 Passed, 0 Failed, 3 Ignored')
    expect(results).toContain('FailFixture: 0 Passed, 1 Failed, 0 Ignored')
  })
  it('generates Annotations from results', () => {
    const results = main.generateAnnotationsFromResults({
      results: [
        {
          passed: 1,
          failures: 0,
          ignored: 3,
          failureDetails: [],
          fixture: 'test'
        },
        {
          passed: 0,
          failures: 1,
          ignored: 0,
          failureDetails: [
            { fileName: './test.h', lineInfo: 1, unitName: 'failUnit' }
          ],
          fixture: 'FailFixture'
        }
      ]
    })
    expect(results).not.toBeUndefined()
    expect(results?.length).toEqual(1)
    expect(results?.[0].start_line).toEqual(1)
    expect(results?.[0].path).toEqual('./test.h')
    expect(results?.[0].annotation_level).toEqual('failure')
    expect(results?.[0].message).toEqual('FailFixture: failUnit failed.')
  })
})
