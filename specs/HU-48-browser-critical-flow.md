# HU-48: Verify the Critical Browser Flow

- **Status:** Draft
- **Priority:** P0
- **Epic:** EP-08
- **Dependencies:** HU-12, HU-36, HU-40

## Goal

Verify the real user path from authentication to an evidence-backed Insights answer.

## Acceptance criteria

- Browser flow covers login, workspace load, subscription data and one Insights question.
- Second account cannot see first account data.
- Loading, empty and controlled error states are checked where relevant.
- No unexpected console errors or failed requests occur.
- Setup and synthetic account instructions are reproducible.

## Data/API changes

None.

## Tests

Browser smoke flow against deployed or reproducible local stack; capture checkpoints for the demo checklist.

## Tasks

- [ ] frontend: authenticated browser smoke flow.
- [ ] tracker: document evidence and provider limitations.
