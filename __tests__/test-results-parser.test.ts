import parseTestResults, {
  FailureDetail,
  TestResults
} from '../src/test-results-parser'
import * as fs from 'fs'

describe('parse test results', () => {
  test('parse successful test runs', () => {
    const text = fs.readFileSync('./__tests__/success-test-data.txt', {
      encoding: 'utf-8'
    })
    const parsedData: TestResults | null = parseTestResults(text)

    expect(parsedData).not.toBeNull()
    expect(parsedData.results[0].fixture).toBe('ITextDllTests.dll')
    expect(parsedData.results[0].failures).toBe(0)
    expect(parsedData.results[0].ignored).toBe(4)
    expect(parsedData.results[0].passed).toBe(173)
    expect(parsedData.results[0].failureDetails).toEqual([])
  })

  test('should parse text file with failures', () => {
    const text = fs.readFileSync(
      './__tests__/exception-failed-test-data.txt',
      'utf-8'
    )
    const parsedData: TestResults | null = parseTestResults(text)

    expect(parsedData).not.toBeNull()
    expect(parsedData.results[0].fixture).toBe('ParatextImportTests.dll')
    expect(parsedData.results[0].failures).toBe(1)
    expect(parsedData.results[0].ignored).toBe(40)
    expect(parsedData.results[0].passed).toBe(640)

    const expectedFailureDetails: FailureDetail[] = [
      {
        unitName:
          'EnsurePictureFilePathIsRooted_RootedButNoDriveLetter_FoundRelativeToCurrentDrive',
        fileName:
          'C:\\Repositories\\fwroot\\fw\\Src\\ParatextImport\\ParatextImportTests\\ImportTests\\ParatextImportTests.cs',
        lineInfo: 1387
      }
    ]

    expect(parsedData.results[0].failureDetails).toEqual(expectedFailureDetails)
  })

  test('should parse text file with two assertion failures', () => {
    const text = fs.readFileSync(
      './__tests__/asserts-failed-test-data.txt',
      'utf-8'
    )
    const parsedData: TestResults | null = parseTestResults(text)

    expect(parsedData).not.toBeNull()
    expect(parsedData.results[0].fixture).toBe('FwUtilsTests.dll')
    expect(parsedData.results[0].failures).toBe(2)
    expect(parsedData.results[0].ignored).toBe(7)
    expect(parsedData.results[0].passed).toBe(294)

    const expectedFailureDetails: FailureDetail[] = [
      {
        unitName: 'Equals_ExactlyTheSame',
        fileName:
          'C:\\Repositories\\fwroot\\fw\\Src\\Common\\FwUtils\\FwUtilsTests\\FwLinkArgsTests.cs',
        lineInfo: 30
      },
      {
        unitName: 'Equals_SameObject',
        fileName:
          'C:\\Repositories\\fwroot\\fw\\Src\\Common\\FwUtils\\FwUtilsTests\\FwLinkArgsTests.cs',
        lineInfo: 43
      }
    ]

    expect(parsedData.results[0].failureDetails).toEqual(expectedFailureDetails)
  })

  test('should parse log with c++ assertion failures', () => {
    const text = fs.readFileSync(
      './__tests__/cplusplus-failed-test-data.txt',
      'utf-8'
    )
    const parsedData: TestResults | null = parseTestResults(text)

    expect(parsedData).not.toBeNull()
    expect(parsedData.results[0].fixture).toBe('testViews')
    expect(parsedData.results[0].failures).toBe(3)
    expect(parsedData.results[0].ignored).toBe(0)
    expect(parsedData.results[0].passed).toBe(272)

    const expectedFailureDetails: FailureDetail[] = [
      {
        unitName: 'SuperscriptGraphite',
        fileName:
          'D:\\a\\FieldWorks\\FieldWorks\\Src\\Views\\Test\\TestVwGraphics.h',
        lineInfo: 72
      },
      {
        unitName: 'SubscriptGraphite',
        fileName:
          'D:\\a\\FieldWorks\\FieldWorks\\Src\\Views\\Test\\TestVwGraphics.h',
        lineInfo: 269
      },
      {
        unitName: 'BreakPointing',
        fileName:
          'D:\\a\\FieldWorks\\FieldWorks\\Src\\Views\\Test\\RenderEngineTestBase.h',
        lineInfo: 451
      }
    ]

    expect(parsedData.results[0].failureDetails).toEqual(expectedFailureDetails)
  })
})
