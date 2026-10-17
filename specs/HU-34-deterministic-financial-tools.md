# HU-34: Expose Deterministic Financial Tools

- **Status:** Draft
- **Priority:** P1
- **Epic:** EP-05
- **Dependencies:** HU-12

## Goal

Give Insights typed tools for summary, upcoming charges, cost per use and savings simulation without duplicating financial rules.

## Acceptance criteria

- Each tool requires authenticated owner context.
- Tools reuse existing handlers and domain calculators.
- Results expose currency, assumptions and declared/estimated status.
- Invalid IDs and other-owner IDs cannot escape the owner scope.

## API and data changes

Internal application contracts only; no new public route or table.

## Tests

`SummaryTool_MixedCurrencies_ReturnsGroupedResults`, `UpcomingTool_ReturnsOwnerRowsOnly`, `CostPerUseTool_ZeroUsage_ReturnsNonCalculable`, `SimulationTool_NonOwnerId_DoesNotLeakData`.

## Tasks

- [ ] backend: typed tool contracts and wrappers.
- [ ] backend: deterministic and owner-scope tests.
