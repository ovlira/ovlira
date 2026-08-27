# 004 — Search, then inspect

## Question

How should an agent receive progressive disclosure rather than the entire catalogue?

## Experiment

Kept search output to compact result cards, made inspect return one descriptor, and made add return only the files and IDs it changed.

## Result

Stable IDs and bounded result counts preserve a small context window while leaving a deterministic path to deeper information.

## Decision

Use the sequence `search → inspect → add → check`; JSON output is versioned and stable at every agent-facing command.

## Consequence for Ovlira

The CLI becomes the context router. The full catalogue is available with `list`, but is never the default response.
