# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/unstructured-api-demo`
- Branch: `dev`
- Work mode: `full`
- Run folder: `agent-runs/2026-06-20-codebase-pass`
- Verifiable gates: `npm run lint`, `npm run build`, `git diff --check`, Git remote read, dry-run push, branch sync checks, source search evidence.
- Human-decision blockers: broad product direction, external Unstructured API behavior requiring live credentials, risky major dependency migrations, legal/license decisions.
- Resume policy: resume from `run-state.md`, `task-queue.md`, latest phase report, and Git sync state; push any validated local phase commit before new edits.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | `npm run lint` and `npm run build` pass or failures are classified | Baseline report pushed |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Task done-check, targeted verification, and quality gate pass | Fix batch pushed or blocked with evidence |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Dependency/dead-code evidence and quality gates pass | Safe cleanup pushed or deferred |
| Review | Judge Loop | PASS or FAIL converted into bounded tasks | Review report pushed |
| Stabilization | Stabilization Loop, Judge Loop | Completion criteria pass | Stabilization report pushed |
| Integrator | Quality Gate Selection Loop, Commit-Push Checkpoint Loop | Final completion gate passes | Final report pushed and clean branch sync |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `agent-runs/2026-06-20-codebase-pass/00-orchestration-plan.md`, `run-state.md`, `task-queue.md`, `01-preflight-and-repo-docs.md`, `skill-improvement-log.md`, `AGENTS.md`, `SPEC.md`, `README.md` | Startup planning, docs sweep, and resume state |
| T-002 | `agent-runs/2026-06-20-codebase-pass/02-baseline-validation.md`, `run-state.md`, `task-queue.md` | Baseline lint/build classification |
| T-003 | `agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md`, `task-queue.md`, `run-state.md` | Evidence-backed backlog and architecture scorecard |
| T-004 | Source files named by backlog tasks plus `04-execute-fixes-and-improvements.md`, `task-queue.md`, `run-state.md` | Focused bug/lean-code fixes only |
| T-005 | `package.json`, `package-lock.json`, cleanup-owned files, `05-package-and-dead-code-cleanup.md`, `task-queue.md`, `run-state.md` | Safe dependency/dead-code cleanup |
| T-006 | `06-review.md`, `07-stabilization-loop.md`, `08-integrator.md`, `final-report.md`, `run-state.md`, `task-queue.md` | Review, stabilization, and final gate |
