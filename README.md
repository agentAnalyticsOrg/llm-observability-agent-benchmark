# LLM observability and evaluation for TypeScript

This repository preserves task-level Claude Code selection evidence and a pinned, type-checked Langfuse prompt
regression gate. It does not declare a universal observability-platform winner.

**Panel date:** August 11, 2026 (Pacific time)  
**Canonical report:** https://agentanalytics.org/research/llm-observability-typescript-task-evidence  
**Machine-readable evidence:** [evidence.json](./evidence.json)

## The task shape changed the result

Claude Code was required to research current providers before choosing. Each task had eight accepted attempts and no
provider candidate list was supplied.

| Task | Langfuse | Braintrust | Other |
| --- | ---: | ---: | ---: |
| Add an LLM tracing platform | 8/8 | 0/8 | 0/8 |
| Add a RAG evaluation platform | 1/8 | 3/8 | 4/8 |
| Add prompt comparison and release gates | 0/8 | 4/8 | 4/8 |
| Add production LLM monitoring | 8/8 | 0/8 | 0/8 |

Overall, Langfuse was selected in 17/32 attempts, Braintrust in 7/32, and another or no tracked platform in 8/32.
Langfuse won every tracing and production-monitoring attempt. Prompt release gates remained the clearest gap.

Claude searched in all 32 accepted attempts. Langfuse was named in 30 exact model-facing search receipts, but no
Langfuse-owned URL was listed or fetched. The observable URL evidence was dominated by third-party comparison pages and
Braintrust-owned articles. This means the panel cannot isolate the effect of any individual Langfuse page.

## Current TypeScript prompt regression gate

Langfuse already documents JavaScript/TypeScript experiments, run evaluators, regression thresholds, and the official
GitHub Action. This repository packages that current path as a compact artifact pinned to:

- `@langfuse/client@5.9.1`
- `langfuse/experiment-action@v1.0.8`

The example calls a candidate endpoint for every dataset item, records an item-level pass/fail score, calculates average
accuracy, and raises `RegressionError` below the configured threshold.

- [Type-checked experiment](./prompt-regression-gate.ts)
- [GitHub Actions workflow](./langfuse-experiment.yml)

To use the workflow, copy `langfuse-experiment.yml` to `.github/workflows/`, create a Langfuse dataset named
`prompt-regression-set` with an input shaped like `{ "question": "..." }` and an expected output, and add the three
repository secrets referenced by the workflow.

## Reproduce the interface check

```sh
npm install
npm run check
```

The check validates the pinned TypeScript interfaces. It does not call Langfuse, the candidate endpoint, or a live model.

## Primary sources

- [Langfuse experiments in CI/CD](https://langfuse.com/docs/evaluation/experiments/experiments-ci-cd)
- [Langfuse experiments via SDK](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)
- [Langfuse prompt version control](https://langfuse.com/docs/prompt-management/features/prompt-version-control)
- [Langfuse Ragas integration](https://langfuse.com/integrations/frameworks/ragas)
- [Langfuse RAG faithfulness guide](https://langfuse.com/resources/engineering/rag-faithfulness-evaluation)
- [Official experiment action](https://github.com/langfuse/experiment-action)

## Interpretation boundaries

- This is one dated model-behavior panel, not an objective product-quality ranking.
- The benchmark required public research and does not estimate ordinary no-search provider share.
- Being named in search evidence is not the same as an owned URL being listed, fetched, or attended to.
- Publication and crawl submission do not establish agent exposure or causal selection lift.
- No included provider commissioned or paid for this study, placement, wording, or removal.
