import {
  RegressionError,
  type Evaluation,
  type ExperimentTaskParams,
  type RunnerContext,
} from "@langfuse/client";

const THRESHOLD = Number(process.env.MIN_PROMPT_ACCURACY ?? "0.9");

export async function experiment(context: RunnerContext) {
  const result = await context.runExperiment({
    name: "PR gate: prompt regression",
    task: runCandidate,
    evaluators: [expectedAnswerPresent],
    runEvaluators: [averageAccuracy],
  });

  const accuracy = result.runEvaluations.find(
    (evaluation) => evaluation.name === "average_accuracy",
  )?.value;

  if (typeof accuracy !== "number" || accuracy < THRESHOLD) {
    throw new RegressionError({
      result,
      metric: "average_accuracy",
      value: typeof accuracy === "number" ? accuracy : 0,
      threshold: THRESHOLD,
    });
  }

  return result;
}

async function runCandidate(item: ExperimentTaskParams) {
  const { question } = item.input as { question: string };
  const endpoint = process.env.CANDIDATE_ENDPOINT;
  if (!endpoint) throw new Error("CANDIDATE_ENDPOINT is required");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    throw new Error(`Candidate endpoint failed: ${response.status}`);
  }

  const body = (await response.json()) as { output?: unknown };
  if (typeof body.output !== "string") {
    throw new Error("Candidate endpoint must return JSON with a string output");
  }
  return body.output;
}

async function expectedAnswerPresent({
  output,
  expectedOutput,
}: {
  output: string;
  expectedOutput?: string;
}): Promise<Evaluation> {
  const expected = expectedOutput?.trim().toLowerCase();
  const passed = Boolean(expected && output.toLowerCase().includes(expected));
  return {
    name: "expected_answer_present",
    value: passed ? 1 : 0,
    comment: passed ? "expected answer found" : "expected answer missing",
  };
}

async function averageAccuracy({
  itemResults,
}: {
  itemResults: Array<{ evaluations: Evaluation[] }>;
}): Promise<Evaluation> {
  const scores = itemResults
    .flatMap((item) => item.evaluations)
    .filter((evaluation) => evaluation.name === "expected_answer_present")
    .map((evaluation) => Number(evaluation.value))
    .filter(Number.isFinite);

  return {
    name: "average_accuracy",
    value: scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0,
  };
}
