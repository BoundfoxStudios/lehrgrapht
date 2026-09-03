# General Conventions

Stack-independent rules for this project. If the repo defines a different
convention elsewhere (CLAUDE.md, more specific skills), that one takes
precedence.

## Way of Working

- Alignment before action: For non-trivial tasks, before implementing,
  summarize in a few sentences (1) your understanding, (2) the planned
  approach and (3) trade-offs or risks, and wait for confirmation. For tasks
  spanning 3+ files or involving architecture decisions, enter plan mode.
  Exception: If the assignment expressly calls for autonomous execution or
  the session runs unattended, state assumptions explicitly and keep working
  instead of blocking.
- If the user suggests a different approach after an implementation, compare
  old and new with concrete pros and cons before switching – name significant
  drawbacks clearly so the choice is an informed one.
- If an approach hits a wall (repeated failures, disproven assumptions), stop
  and re-plan instead of pushing on.
- Offload codebase exploration and research to subagents – the main context
  holds decisions and results, not the search process.
- All programming work runs in a subagent, never in the main context –
  even for small changes. The main context researches, decides and scopes
  the assignments; multi-step work is split into separate subagent steps
  (implementation, tests, review fixes).
- The assignment to such a subagent is strict and self-contained: the files to
  change with paths, the desired target behavior, the results of the upfront
  research (API signatures, existing patterns in the repo, documentation
  excerpts), the applicable conventions, and the acceptance criteria along
  with the commands that verify them. Whatever is not in the assignment is
  not touched.
- These subagents do no further research – exploration and research have
  happened beforehand and are part of the assignment. If something is missing
  or the specification contradicts the code, the subagent reports that back
  instead of searching, deciding or guessing on its own.
- Before changing concurrent code, identify: shared mutable state, ordering
  guarantees when operations interleave, existing synchronization boundaries;
  for async code, also cancellation propagation, backpressure and atomicity.
- Self-review before reporting completion: re-read the changed files (not
  from memory), check for unused variables, missing null checks, inconsistent
  naming and unhandled edge cases; build and run the affected tests.
- Simplicity check before reporting completion: every new variable, wrapper,
  intermediate collection and parameter must pull its weight – inline values
  that are used once and immediately; if something looks over-engineered,
  simplify first.

## Code Style

- The default is zero comments. A comment is written only if it states
  something the reader cannot see from the code: a non-obvious algorithm, a
  handled edge case, a workaround or a deliberate decision against the
  obvious choice – when in doubt, leave it out. Even then, only the essence,
  as short as possible, e.g.
  `// Safari fires pagehide twice; the guard drops the second call`.
- If code looks unclear without a comment, first improve names or extract a
  function – a comment is only allowed if neither can carry the information.
- Forbidden comment patterns – never write them, not even in variations;
  the list is illustrative, not exhaustive:
  - Paraphrasing code or names: no `// enables the cooking mode` on
    `isCookingModeEnabled`, no `// save the user` above
    `repository.save(user)`.
  - Step and section narration: no `// Validate input`, `// Setup`,
    `// Main logic`, `// --- Helpers ---`; in tests no `// Arrange` /
    `// Act` / `// Assert`.
  - Change narration: no `// now uses the new API`,
    `// changed to async`, `// as requested` – the diff and the commit
    message tell the story of the change, not the code.
  - Signature echo: no JSDoc/XML doc/docstring that merely rephrases name,
    parameters and return type. Doc comments only where the project or the
    task requires them – and then without parameter/return echoes, only with
    content beyond the signature (units, error behavior, side effects).
- Machine directives (`// eslint-disable-next-line`, `# type: ignore`,
  pragmas, license headers) do not count as comments under this rule.
- The rule applies to comments you write yourself – existing comments in
  other people's code stay untouched.
- No abbreviations in identifiers – always spell words out: `index` instead
  of `i` in loops, `template` instead of `tpl`. Spelled-out names are easier
  to read.
- All code is production code: clean, complete and maintainable – no
  stopgaps, no commented-out leftovers, no "TODO later" solutions. The only
  exception is when prototype or throwaway code is explicitly requested.
- Never hand-edit generated artifacts – change the generator, template or
  source and regenerate. If generated files are committed, commit the
  regenerated result together with the triggering change. Make generator
  failures visible (error artifact or hard abort), never swallow them
  silently.
- In time-dependent logic whose behavior must be controllable from tests, do
  not read the system time directly – use a clock that tests can control
  (the injected abstraction where the stack provides one).
- If the project uses structured logging, always log the same concept under
  the same property name so logs remain reliably queryable.

## Testing

- Tests verify only the application's own behavior: business logic, edge
  cases, error paths. Never test the underlying framework – e.g. do not test
  whether a variable is properly bound to the UI, whether a getter returns
  the value that was set or whether a framework feature works; the framework
  itself covers that.
- Guiding question before every test: Which behavior of the application
  breaks if this test turns red? If there is no concrete answer, do not write
  the test.
- No test-only code in production: no members, constructors or factories
  whose only caller is a test (no `CreateForTesting`, no seed/reset methods
  only for test setups) – such helpers belong in the test code (test project
  or test directory).
- Never widen visibility for tests: a member does not become `public` or
  `internal` (or the stack's equivalent) just to be testable – test through
  the existing public surface or extract the logic into its own type whose
  visibility is justified by production needs.
- Before every mock or fake, look at the real implementation: use the real
  type if it is cheap to construct (no I/O, no global state, no DI graph) or
  carries notable logic – a diverging stub masks bugs or invents failures
  that never occur in production. Mock only if the real type pulls in heavy
  dependencies (database, network, external services); when in doubt, ask the
  user instead of inventing a stub.
- "No side effects" assertions must not be tautologically true by
  construction: if the input type structurally cannot carry the data for the
  side effect at all, the test verifies nothing – leave it out if a real
  contrast test (mixed success and failure case) exists.
- Organization: first look for an existing test file or suite for the same
  member or the same feature and add the test there; a new file only for a
  genuinely new concern. Shared setup infrastructure (base class, fixture,
  shared hook) only once 2+ places duplicate setup – never speculatively.
- Shared setup goes into the framework's setup mechanisms (constructor, setup
  hooks, fixtures, helpers) – the arrange part of a test contains only
  scenario-specific values.
- Exactly one assertion library and exactly one mocking library per repo.
  Legacy patterns (old assertion library, old naming style) must not gain new
  usages – use the canonical style even when adding to legacy files.
- Test names state the tested behavior, the scenario and the expected result
  (e.g. `AddRow_EmptyTable_AddsRow` – adapted to each test framework).

## Branches & Commit Messages

- When creating branches, use only the prefixes `feature/`, `fix/` and
  `release/`, always spelled out (`feature/abc`, not `feat/abc`); other
  prefixes only on explicit instruction.
- If the branch belongs to a GitHub issue, its number goes directly after the
  prefix, before the descriptive name: `feature/123-add-retry-logic`. Never
  guess numbers – use them only if the issue was named in the task or looked
  up beforehand.
- Commit messages consist solely of the title (one line) and are always in
  English – the only exception is the issue reference below.
- Commit messages follow Conventional Commits – unless the repo describes its
  own convention, in which case that applies. The default is
  `type: description`; use a scope (`type(scope): description`) only if the
  repo defines scopes.
- Allowed types – exactly these, no others:
  - `build`: changes to the build system or to external dependencies
  - `ci`: changes to CI configuration and scripts
  - `docs`: documentation-only changes
  - `feat`: a new feature
  - `fix`: a bug fix
  - `perf`: a code change that improves performance
  - `refactor`: a code change that neither fixes a bug nor adds a feature
  - `style`: changes that do not affect the meaning of the code (whitespace,
    formatting, missing semicolons, …)
  - `test`: adding missing tests or correcting existing tests
- Never write a commit body – no footers/trailers either, such as
  `Co-Authored-By` or "Generated with" lines.
- Exception: If a commit belongs to a GitHub issue, the body consists of
  exactly one line `Refs #123`; multiple issues each get their own line. No
  closing keyword in the commit – that belongs in the PR description (see
  below). Never guess numbers: reference only if the issue was named in the
  task or looked up beforehand.

## GitHub Issues

- Issues describe the problem or requirement purely from a domain
  perspective: what, for whom, why, expected behavior, acceptance criteria.
  No proposed solution and no implementation sketch – unless the approach
  was explicitly worked out together beforehand, in which case exactly that
  agreed approach goes in.
- No references to files, classes or other code locations: issues are often
  created long before implementation, the code moves on and the references
  go stale. Use domain terms instead of code symbols.
- Write prose without hard line breaks – one paragraph is one line, GitHub
  wraps on its own when rendering. Line breaks only where Markdown needs
  them (paragraph breaks, lists, code blocks).
- Before creating an issue, refine the domain concept in conversation:
  actively raise and clarify ambiguities, edge cases and open decisions – an
  issue is created only once no questions remain open.
- If a parent issue has children (an epic with subtasks), link the children
  as GitHub sub-issues – not as a Markdown list or task list with `#123`
  links in the body: `gh issue create --parent <parent-number>` when
  creating, or `gh issue edit <parent-number> --add-sub-issue <number>`
  afterwards.

## Pull Requests

- PR titles are always in English and do not follow Conventional Commits –
  no `feat:`/`fix:` prefix, just a normal descriptive title (e.g. "Add retry
  logic to the sync job" instead of "feat: add retry logic to the sync
  job").
- For PR descriptions, the same applies as for issues: prose without hard
  line breaks – GitHub wraps on its own when rendering.
- If a PR belongs to a GitHub issue, the closing keyword goes in the PR
  description – `Fixes #123` for bugs, otherwise `Closes #123`; multiple
  issues each get their own line.
- The default is an empty PR description. The only things that go in are the
  closing keyword (above) and, where the title, linked issue and diff do not
  already cover it, one to a few sentences on what and why, plus reviewer
  knowledge that cannot be seen from the diff: breaking changes, migration or
  deploy steps, behavior to verify manually, deliberate decisions against the
  obvious choice. Guiding question before every sentence: Does the title,
  issue or diff already say it? If yes, leave it out – even if the
  description then consists only of the closing keyword or stays empty.
- Forbidden patterns in PR descriptions – never write them, not even in
  variations; the list is illustrative, not exhaustive: boilerplate headings
  (`## Summary`, `## Changes`, `## Test plan`), retelling the changes as
  bullets or prose, lists of changed files, repetition of PR title or issue
  text, a log of your own process or testing, checklists, emojis,
  "Generated with" footers.
- If the referenced issues are attached to a milestone, assign the PR to the
  same milestone (`gh pr edit <number> --milestone <title>`). GitHub allows
  only one milestone per PR – if the issues are spread across several, ask
  instead of guessing.
- If follow-up remarks that belong to the same topic as a PR arrive after it
  was created, first check whether the PR is already under review:
  `gh pr view <number> --json reviewRequests,reviews`. If both are empty,
  update the existing PR (push to the same branch) instead of opening a new
  one. If a reviewer is assigned or a review has been submitted, leave the
  PR alone; make the change as a new PR instead.

## Dependencies & Versions

- When adding or updating dependencies (npm, NuGet, pip, …), never take
  versions from training knowledge – always determine the current latest
  version first (e.g. `npm view <package> version`, `dotnet package search`,
  PyPI/registry query) and use that.
- The same applies to GitHub Actions (`uses:` references), base images in
  Dockerfiles and tool versions in CI configurations: before writing, look up
  the latest major version or the latest release (e.g. via
  `gh api repos/<owner>/<repo>/releases/latest`), do not guess.
- The same goes for API surfaces: when unsure about signatures, parameters
  or framework behavior, never guess – look up current documentation and
  read existing usages in the repo.

## Agent Documentation

Rules for CLAUDE.md and other agent instruction files in the repo.

- The instructions are part of the deliverable: If a task changes
  architecture, conventions, data structures or behavior described there,
  update the affected section in the same pass – documentation and code
  never drift apart.
- The documentation describes the current state of the code, never the
  target state. Explicitly mark anything decided but not yet built as such –
  including the condition under which the note goes away.
- Curated map, not a code mirror: A fact visible only in the code goes in
  only if several criteria apply – needed repeatedly, cross-cutting or
  load-bearing (contract/invariant), non-obvious (footgun), stable, expensive
  to derive. Local, easily discoverable mechanics stay in the code; never
  copy signatures just in case.
- Net-zero discipline: Every addition has a named target location. First
  check whether an existing entry already carries the knowledge, and sharpen
  it there instead of adding next to it; remove redundant or outdated
  content in the same pass.
- After a user correction to a project-wide pattern, update the affected
  spot as a concrete rule – rather than tacking a vague lesson on somewhere.
- Document decisions where a future reader would propose them again:
  discarded alternatives with the reason, deliberate deviations from the
  obvious approach marked as intentional, disproven (optimization) hypotheses
  with date, measurement and the note not to try them again.
- Record negative knowledge: explicitly document plausible-sounding APIs
  that do not (or no longer) exist as "X does not exist – use Y", exactly
  where an agent would look for them.
- Project management content (deadlines, meeting notes, organizational
  questions) stays out – the instructions are about the code.
- If the documentation grows, separate files pay off: a glossary (one short,
  linkable definition per domain term, anchored to the code symbol, added
  immediately when unknown terms are encountered) and an invariants register
  (load-bearing contracts with statement, rationale, enforcement location –
  code, or merely convention – and symptom of a violation; after a bug fix
  whose cause was an unenforced contract, an entry is added).

## Memory

- Machine-local project knowledge is of no use to the team – never claim
  to have remembered something if it is only stored locally.
- Repo-related insights belong in the repo (e.g. in its CLAUDE.md) and are
  committed.
- Communicate global insights (way of working, preferences, environment) to
  the user instead, so they can anchor them in their personal configuration.
