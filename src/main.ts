import * as core from '@actions/core'
import { regexCheck } from './regex-check'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    regexCheck(core.getInput('error-regex'), core.getInput('log-text'))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
