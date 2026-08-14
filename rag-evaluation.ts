import {
  RegressionError,
  type Evaluation,
  type EvaluatorParams,
  type ExperimentTaskParams,
  type RunEvaluatorParams,
  type RunnerContext,
} from "@langfuse/client";

type RagInput = { question: string };
type RagExpected = { answer: string };
type RagMetadata = { requiredEvidence: string[] };
type RagOutput = { answer: string; retrievedContext: string[] };

const MIN_RAG_QUALITY = Number(process.env.MIN_RAG_QUALITY ?? "0.8");

export async function experiment(
  context: RunnerContext<RagInput, RagExpected, RagMetadata>,
) {
  const result = await context.runExperiment({
    name: "PR gate: RAG quality",
    task: runCandidate,
    evaluators: [answerCorrectness, retrievedContextCoverage],
    runEvaluators: [averageRagQuality],
  });

  const quality = result.runEvaluations.find(
    (evaluation) => evaluation.name === "average_rag_quality",
  )?.value;

  if (typeof quality !== "number" || quality < MIN_RAG_QUALITY) {
    throw new RegressionError({
      result,
      metric: "average_rag_quality",
      value: typeof quality === "number" ? quality : 0,
      threshold: MIN_RAG_QUALITY,
    });
  }

  return result;
}

async function runCandidate(
  item: ExperimentTaskParams<RagInput, RagExpected, RagMetadata>,
): Promise<RagOutput> {
  const endpoint = process.env.CANDIDATE_ENDPOINT;
  if (!endpoint) throw new Error("CANDIDATE_ENDPOINT is required");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(item.input),
  });
  if (!response.ok) throw new Error(`Candidate endpoint failed: ${response.status}`);

  const body = (await response.json()) as Partial<RagOutput>;
  if (typeof body.answer !== "string" || !Array.isArray(body.retrievedContext)) {
    throw new Error(
      "Candidate endpoint must return { answer: string, retrievedContext: string[] }",
    );
  }
  return { answer: body.answer, retrievedContext: body.retrievedContext };
}

async function answerCorrectness({
  output,
  expectedOutput,
}: EvaluatorParams<RagInput, RagExpected, RagMetadata>): Promise<Evaluation> {
  const actual = (output as RagOutput).answer.toLowerCase();
  const expected = expectedOutput?.answer.trim().toLowerCase();
  const passed = Boolean(expected && actual.includes(expected));
  return {
    name: "answer_correctness",
    value: passed ? 1 : 0,
    comment: passed ? "expected answer found" : "expected answer missing",
  };
}

async function retrievedContextCoverage({
  output,
  metadata,
}: EvaluatorParams<RagInput, RagExpected, RagMetadata>): Promise<Evaluation> {
  const context = (output as RagOutput).retrievedContext.join(" ").toLowerCase();
  const required = metadata?.requiredEvidence ?? [];
  const covered = required.filter((item) => context.includes(item.toLowerCase())).length;
  return {
    name: "retrieved_context_coverage",
    value: required.length ? covered / required.length : 0,
    comment: `${covered}/${required.length} required evidence items retrieved`,
  };
}

async function averageRagQuality({
  itemResults,
}: RunEvaluatorParams<RagInput, RagExpected, RagMetadata>): Promise<Evaluation> {
  const scores = itemResults.flatMap((item) => item.evaluations).map((item) => Number(item.value));
  const validScores = scores.filter(Number.isFinite);
  return {
    name: "average_rag_quality",
    value: validScores.length
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : 0,
  };
}
