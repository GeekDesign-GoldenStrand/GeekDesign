# Pull Request

## Description
<!--
  What does this PR do and why?
  Provide enough context for a reviewer who has no background on this task.
  Link to any relevant design docs, Figma, or prior discussion.
-->

Closes <!-- #issue or ticket URL -->

---

## Type of change
<!-- Check all that apply -->
- [ ] `feat` — new feature or functionality
- [ ] `fix` — bug fix
- [ ] `refactor` — code change that neither fixes a bug nor adds a feature
- [ ] `chore` — build process, config, or dependency update
- [ ] `docs` — documentation only
- [ ] `test` — adding or updating tests
- [ ] `perf` — performance improvement
- [ ] `style` — formatting, linting, no logic change

---

## Breaking changes
- [ ] This PR introduces breaking changes

<!-- If checked, describe what breaks and the migration/rollback path: -->

---

## How to test
<!--
  Step-by-step instructions to verify this works as expected.
  Include any required env vars, seed data, feature flags, or setup steps.
  Should be reproducible by someone unfamiliar with the change.
-->

1.
2.

**Expected result:**

---

## Screenshots / recordings
<!-- Required for any UI changes. Delete section if not applicable. -->

| Before | After |
|--------|-------|
|        |       |

---

## Checklist
<!-- Every item must be checked before requesting review. -->

**Code quality**
- [ ] Self-reviewed — read every line of the diff before opening this PR
- [ ] No new lint errors or warnings introduced
- [ ] No hardcoded secrets, credentials, or environment-specific values
- [ ] No dead code, debug statements, or commented-out blocks left in

**Testing**
- [ ] New behavior is covered by tests (unit / integration / e2e as appropriate)
- [ ] All existing tests pass locally

**Documentation & communication**
- [ ] PR title follows `type(scope): short description` convention
- [ ] Inline comments added where the *why* is non-obvious
- [ ] README, API docs, or relevant documentation updated if behavior changed

**Review**
- [ ] At least one peer has been assigned as reviewer
- [ ] Any dependent PRs or migrations are linked above
