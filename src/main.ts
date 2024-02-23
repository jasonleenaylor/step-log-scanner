import * as core from "@actions/core";
import * as fs from "fs";
import * as github from "@actions/github";
import parseTestResults, { TestResults } from "./test-results-parser";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const octokit = github.getOctokit(core.getInput("token"));
    const head_sha = getHeadForCheck();
    const createCheckResponse = await octokit.rest.checks.create({
      head_sha,
      name: "Unit Test Results",
      status: "in_progress",
      output: { title: "Unit Test Results", summary: "" },
      ...github.context.repo,
    });
    const testResultsText = fs.readFileSync(
      core.getInput("log-path"),
      // BufferEncoding is global so the no-undef lint error is bogus
      // eslint-disable-next-line no-undef
      core.getInput("encoding") as BufferEncoding,
    );
    const testResults = parseTestResults(testResultsText);
    console.debug(JSON.stringify(testResults));
    await octokit.rest.checks.update({
      check_run_id: createCheckResponse.data.id,
      conclusion: testResults.results.every((t) => t.failures === 0)
        ? "success"
        : "failure",
      status: "completed",
      output: {
        title: generateShortSummaryFromResults(testResults),
        summary: generateSummaryFromResults(testResults),
        annotations: generateAnnotationsFromResults(testResults),
      },
      ...github.context.repo,
    });
    if (testResults.results.every((t) => t.failures === 0)) {
      core.info("All tests passed!");
    } else {
      core.setFailed("Some unit tests failed.");
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function getHeadForCheck(): string {
  if (github.context.eventName === "workflow_run") {
    const workflowRun = github.context.payload.workflow_run;
    if (!workflowRun) {
      throw new Error("Unexpected event contents, workflow_run missing?");
    }
    return workflowRun.head_commit.id;
  }

  // Assume pull request context if it isn't a workflow run
  const pr = github.context.payload.pull_request;
  return pr?.head.sha ?? github.context.sha;
}

export function generateShortSummaryFromResults(
  testResults: TestResults,
): string {
  const summaryResults = testResults.results.reduce<{
    passed: number;
    ignored: number;
    failed: number;
  }>(
    (summary, result) => {
      summary.passed += result.passed;
      summary.ignored += result.ignored;
      summary.failed += result.failures;
      return summary;
    },
    { passed: 0, ignored: 0, failed: 0 },
  );
  return `Unit Test Results (${summaryResults.passed} passed, ${summaryResults.failed} failed, ${summaryResults.ignored} ignored)`;
}

export function generateSummaryFromResults(testResults: TestResults): string {
  return testResults.results
    .map(
      (tr) =>
        `${tr.fixture}: ${tr.passed} Passed, ${tr.failures} Failed, ${tr.ignored} Ignored`,
    )
    .join("\n");
}

type GithubAnnotation = {
  path: string;
  start_line: number;
  end_line: number;
  start_column?: number;
  end_column?: number;
  annotation_level: "failure" | "notice" | "warning";
  message: string;
  title?: string;
  raw_details?: string;
};

export function generateAnnotationsFromResults(
  testResults: TestResults,
): GithubAnnotation[] | undefined {
  const annotations: GithubAnnotation[] = [];
  for (const result of testResults.results) {
    if (result.failures > 0) {
      for (const failure of result.failureDetails) {
        annotations.push({
          path: trimWorkspaceDirFromPath(failure.fileName),
          start_line: failure.lineInfo,
          end_line: failure.lineInfo,
          message: `${result.fixture}: ${failure.unitName} failed.`,
          annotation_level: "failure",
        });
      }
    }
  }
  return annotations;
}

function trimWorkspaceDirFromPath(path: string): string {
  if (path.includes("\\Src\\"))
    return path.substring(path.indexOf("\\Src\\") + 1);
  if (path.includes("\\Lib\\"))
    return path.substring(path.indexOf("\\Lib\\") + 1);
  return path;
}
