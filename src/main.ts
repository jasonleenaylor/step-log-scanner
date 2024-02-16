import * as core from '@actions/core'
import { regexCheck } from './regex-check'
import { Octokit } from '@octokit/action'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.debug(`run-id${core.getInput('run-id')}`)
    const run_id = parseInt(core.getInput('run-id'))
    const octokit = new Octokit({
      auth: core.getInput('token')
    })

    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs/{run_id}',
      {
        owner: core.getInput('repo-owner'),
        repo: core.getInput('repo-name'),
        workflow_id: core.getInput('workflow-id'),
        run_id,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    ) // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(JSON.stringify(data))
    regexCheck(core.getInput('error-regex'), JSON.stringify(data))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
