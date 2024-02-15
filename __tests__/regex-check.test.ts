import { regexCheck } from '../src/regex-check'
import { expect, test } from '@jest/globals'

test('check ERROR log; find error', async () => {
  const checkString = 'ERROR'
  const log = 'A string with an ERROR'
  expect(regexCheck(checkString, log)).toBe(true)
})

test('check ERROR log; find no error', async () => {
  const checkString = 'ERROR not found'
  const log = 'A string with an ERROR, but not matching the check string'
  expect(regexCheck(checkString, log)).toBe(false)
})
