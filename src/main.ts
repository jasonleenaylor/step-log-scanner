import * as core from '@actions/core'
import { regexCheck } from './regex-check'
import { Octokit } from '@octokit/action'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const octokit = new Octokit({ auth: core.getInput('gh-token') })
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    const { data } = await octokit.rest.actions.downloadWorkflowRunLogs({
      owner: core.getInput('repo-owner'),
      repo: core.getInput('repo-name'),
      run_id: parseInt(core.getInput('run-id'))
    })
    core.debug(JSON.stringify(data))

    if (regexCheck(core.getInput('error-regex'), data as string)) {
      core.setFailed('Found error in build log')
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
