# Bobill Project Guidelines

## Workflow & Analysis
- **Read Guidelines First**: Always read `.agents/AGENTS.md`, `doc/Into.md`, and `doc/system_architecture.md` before making any code modifications.
- **Explore Before Modify**: Read all related files before making changes. Never assume implementation details from file names or memory.
- **Requirement Clarification**: If requirements are unclear or ambiguous, ask clarifying questions before writing any code. Do not guess.
- **Change Impact Review**: Before modifying shared utilities, types, or base components, identify all files that import or depend on them. Address all affected layers.
- **Root Cause Analysis**: When fixing bugs, identify and fix the root cause, not just the symptom.
- **Incremental Development**: Make small, testable changes. Do not rewrite large sections unless explicitly required.
- **Architecture Protection**: Do not introduce new architectural patterns, libraries, or paradigms without discussion and approval.
- **Documentation-Driven Development**: Update `doc/system_architecture.md` and `doc/Into.md` before or immediately after implementing new features.
- **Think End-To-End Before Coding**: Always trace the full flow (UI → API Route → Backend → DB → Response) before writing code.
- **Do Not Invent APIs, Fields, or Variables**: Never call a backend endpoint that does not exist in `doc/system_architecture.md` without verifying it in the source. Never use a database field not in `schema.prisma`. Never reference an environment variable not in `.env.example`.
- **Verify Before Modifying or Deleting**: Confirm a file, function, or variable is truly unused (using global search) before deleting it. Verify its current function works as expected before modifying it.
- **Explain Reasoning For Major Changes**: For any architectural change or significant refactor, explain the rationale before writing code.
- **Minimize Risky Refactors**: Avoid large-scale refactors in a single step. Break them into small, verifiable increments.
- **Complete All Affected Layers**: When changing an API, update the backend route, frontend API client, TypeScript types, and documentation in the same task.
- **Preserve Existing Business Logic**: When refactoring, ensure all existing behavior is preserved. Do not silently drop edge case handling.

## Code Quality
- **Clean Code**: Write self-documenting code. Use meaningful variable, function, and component names that reveal intent.
- **Single Responsibility Principle**: Each function, class, and component should do one thing and do it well.
- **DRY (Don't Repeat Yourself)**: Never duplicate logic. Extract repeated code into shared utilities, hooks, or components.
- **KISS (Keep It Simple, Stupid)**: Prefer the simplest solution that solves the problem. Avoid over-engineering.
- **YAGNI (You Aren't Gonna Need It)**: Do not add features or abstractions that are not currently required.
- **Refactor While Touching Code**: When modifying existing code, leave it cleaner than you found it.
- **Consistent Naming Conventions**: Follow existing naming patterns in the codebase (camelCase for variables/functions, PascalCase for components/types, kebab-case for file names).
- **No Dead Code**: Remove all unused imports, variables, functions, and commented-out code blocks before committing.
- **No Commented-Out Code**: Delete unused code entirely. Use version control (git) to recover old code if needed.
- **No Magic Values**: Extract all hardcoded strings, numbers, and status values into named constants or enums.
- **Avoid Deep Nesting**: Limit function/conditional nesting to 3 levels. Use early returns to flatten logic.
- **Small Focused Functions**: Keep functions under 40 lines. If longer, extract sub-functions.
- **Maintain Existing Coding Style**: Match the style of surrounding code (quotes, spacing, import order) even if you prefer a different style.
- **TypeScript**: Always run `npx tsc --noEmit` in both `frontend/` and `backend/` directories after any code change. Zero TypeScript errors are required before committing.
- **ESLint**: Always run `npm run lint` in `frontend/` to check for lint violations. Zero warnings or errors are required.
- **No `any` Types**: Avoid using TypeScript `any` type. Use explicit types, interfaces, or `unknown` with proper type guards instead.
- **Explicit Types Preferred**: Always annotate function parameters, return types, and exported interfaces explicitly.

## Reusability & Architecture
- **Reuse Before Create**: Before writing a new utility, hook, or component, search the codebase for an existing solution first.
- **Shared Components First**: Check `frontend/components/ui/` before creating a new UI element.
- **Shared Utilities First**: Check `frontend/lib/` and `backend/src/config/` for existing helpers before duplicating logic.
- **Follow Existing Project Patterns**: Use the same patterns already established (e.g., service layer in backend, proxy pattern in frontend).
- **Component Extraction**: When building features, identify UI controls or widgets (such as pagination, dropdowns, status badges, date pickers) used across multiple views. Always extract them into `frontend/components/ui/` to maintain DRY.
- **Centralized Business Logic**: Business logic belongs in the service layer (`*.service.ts`). Never put it in controllers or routes.
- **Separation of Concerns**: Keep controllers thin — they only parse requests and call services. Keep services focused — they contain business logic. Keep routes as declarations only.
- **Avoid Duplicate Implementations**: If two files solve the same problem differently, consolidate them.
- **New Dependency Justification Required**: Do not add new npm packages without explicit justification and team review.
- **System Specification Update**: Keep `doc/system_architecture.md` updated at all times. Any time a new route, API endpoint, component, or workflow is modified, added, or deleted, update the documentation immediately.

## Frontend Rules
- **Loading State Required**: Every component that fetches data must display a loading skeleton or spinner while waiting.
- **Error State Required**: Every data-fetching component must display a user-friendly error message when the request fails. Never expose raw error objects to the UI.
- **Empty State Required**: Every list or table must handle the empty data case with a descriptive message (e.g., "ไม่พบข้อมูล").
- **Responsive Design Required**: All UI must be usable on mobile, tablet, and desktop screen sizes.
- **UI Consistency**: Use only predefined classes from the design system (`appCardClass`, `appBtnPrimaryClass`, etc. from `app-page-shell.tsx`). Do not introduce one-off inline styles.
- **Client-Side Validation**: Validate all user inputs before submitting forms (required fields, formats, ranges).
- **Avoid Unnecessary Re-renders**: Use `useMemo`, `useCallback`, and stable references appropriately to prevent performance regressions.
- **Server Components Preferred (Next.js)**: Default to React Server Components. Only add `"use client"` when the component requires interactivity (state, effects, browser APIs).
- **Reusable UI Components Only**: Inline JSX logic that is used more than once must be extracted into a component.
- **Theme Configuration**: In Tailwind v4, do not use `tailwind.config.js`. Specify custom theme styles in `globals.css` under `@theme`.
- **List Actions Placement**: In data tables or item listings, keep primary actions (such as Edit, View Details, Download) visible as inline icon buttons for immediate accessibility. Use dropdown/options menus only for secondary, less frequent, or state-altering actions (such as Issue, Cancel, Delete).
- **React State Updates on Route/Path Change**: To handle responsive layouts or reset states on route change (e.g., closing a mobile navigation sidebar), do not schedule state updates synchronously inside `useEffect`. Instead, use the render-phase state adjustment pattern (comparing current pathname with `prevPathname` during render and updating states inline) to prevent rendering warnings and hydration mismatches.
- **Error Handling & State Consistency**: Use the same error display pattern (`<AuthAlertError />`) across all pages. Do not create one-off inline error displays.

## Backend Rules
- **File Extensions in Imports**: Always include the `.js` extension when importing local modules (e.g., `import { foo } from "./bar.js"`). The backend uses ESM (`"type": "module"`).
- **Consistent Error Response Shape**: All Express route handlers must return `{ message: string }` with an appropriate HTTP status code (400, 401, 403, 404, 500).
- **Request Validation Required**: Validate all incoming request body, query, and param data before processing. Reject invalid input early with a 400 response.
- **Defensive Programming**: Assume all external input is potentially malicious or malformed. Guard against nulls, type mismatches, and unexpected values.
- **API Contract Consistency**: Do not change the shape of an existing API response without reviewing all consumers of that endpoint.
- **Backward Compatibility Review**: When modifying existing endpoints, check if the change is breaking for frontend consumers. Add a version prefix (`/v2/`) if breaking.
- **Centralized Error Handling**: Use the shared error-handling middleware in `app.ts` for unhandled errors. Do not scatter `try/catch` with `res.status(500)` everywhere.

## Database Rules
- **Migration Required For Schema Changes**: Always run `npx prisma migrate dev --name <name>` and `npx prisma generate` whenever `schema.prisma` is modified. Never use `prisma db push` in production.
- **Client Output**: Prisma client output is configured to `../src/generated/prisma`. Ensure import paths resolve correctly to this path.
- **Database Safety First**: Never run destructive schema changes (DROP TABLE, DROP COLUMN) without a backup and explicit approval.
- **No Direct Schema Push In Production**: Use `prisma migrate deploy` in production. Never use `prisma db push`.
- **Use Transactions For Critical Operations**: Wrap multi-step database operation sets (e.g., creating an invoice + line items) in a Prisma transaction to ensure atomicity.
- **Foreign Key Integrity Awareness**: Before deleting a record, check for related records that may cascade or be orphaned.
- **Avoid N+1 Queries**: Use Prisma `include` or `select` to fetch related data in a single query. Never loop over results and query inside the loop.
- **Select Only Required Columns**: Use `select` to return only the fields the caller needs. Avoid returning full model objects when only a subset is needed.
- **Index Frequently Queried Fields**: Add `@@index` to fields used in `where`, `orderBy`, or `join` conditions for large tables.
- **Soft Delete Preferred**: For financial data (Invoices), mark records as `CANCELLED` instead of deleting them to preserve the audit trail.

## Security Rules
- **Authentication Verification Required**: Any Next.js page or API Route requiring a logged-in user must verify the session token using `verifySessionToken` before processing.
- **Authorization Verification Required**: After authentication, verify that the user has the required role for the operation. Admin-only endpoints must check `session.roles.includes("ADMIN")`.
- **Never Trust Client Input**: All data from the request body, query string, and URL params must be validated and sanitized server-side, regardless of client-side validation.
- **Input Sanitization Required**: Sanitize all string inputs to prevent injection attacks (SQL injection is mitigated by Prisma, but validate types and lengths).
- **Sensitive Data Protection**: Never return password hashes, full session tokens, or internal system details in API responses.
- **Secrets & Environment Variables Management**: 
  - `AUTH_SECRET`, `DATABASE_URL`, `POSTGRES_PASSWORD`, and `NGROK_AUTHTOKEN` must always be read from environment variables. Never hardcode them.
  - When adding a new environment variable, add a placeholder entry in `.env.example` with a descriptive comment and update `doc/Into.md` with its description and usage.
- **No Sensitive Logging**: Never log passwords, tokens, full user objects, or financial details to the console or log files.
- **Session Cookie**: Authentication uses a signed HMAC-SHA256 cookie named `bobill_session` (see `frontend/lib/auth.ts`). Do NOT change the signing mechanism or cookie name.
- **Session Expiry**: Sessions expire after 7 days (`SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7`). Do not extend this without a security review.
- **Role Validation Required**: For admin-only operations, always verify roles server-side. Never trust `role` data submitted from the client body.
- **Principle of Least Privilege**: Grant users and services only the minimum permissions they need to perform their function.
- **Security Review Before Completion**: Before marking any auth, payment, or data-access task complete, explicitly review it against the security rules above.

## Performance Rules
- **Pagination Required For Large Datasets**: All list endpoints must support `page` and `pageSize` query parameters. Never return unbounded result sets.
- **Server-Side Filtering Preferred**: Apply `where` filters in the database query, not in JavaScript after fetching all rows.
- **Server-Side Sorting Preferred**: Apply `orderBy` in the database query instead of sorting arrays in memory.
- **Avoid N+1 Queries**: Always fetch related data in a single query via `include` or `select` (see Database Rules).
- **Avoid Duplicate API Calls**: Do not call the same API endpoint more than once per component render cycle. Cache or share results via state or context.
- **Avoid Unnecessary Database Queries**: Check if the required data is already available in the current scope before issuing another query.
- **Lazy Load When Appropriate**: Defer loading of non-critical data (e.g., tabs not yet visible) until the user requests it.
- **Performance Impact Review**: Before adding a new query or computation to a hot path (e.g., every page render), estimate its cost and consider caching or batching.

## API Proxy Pattern (Frontend ↔ Backend Communication)
- **Use proxyBackendJson for JSON APIs**: All Next.js API Route handlers communicating with the backend MUST use `proxyBackendJson` from `@/lib/backend-proxy`. Never call the backend URL directly from browser code.
- **Use proxyBackendPdf for PDF downloads**: For PDF-streaming endpoints, use `proxyBackendPdf` and pass a fallback filename.
- **Use proxyBackendBinaryGet for file streams**: For binary assets (e.g., uploaded signatures), use `proxyBackendBinaryGet`.
- **Never expose backend URL to browser**: `BACKEND_URL` must only be referenced in `frontend/lib/backend-api.ts` and used in server-side API Route handlers only.
- **API Contract Validation**: Before calling any backend endpoint, verify the expected request/response contract matches `doc/system_architecture.md`.
- **Frontend-Backend Synchronization**: When modifying a backend API response shape, update the corresponding TypeScript type in `frontend/lib/invoices/types.ts` (or equivalent) immediately.

## Testing Rules
- **Manual Verification Required**: After implementing any feature, manually test the full user workflow in the browser before marking the task complete.
- **End-to-End Flow Verification**: Trace the full flow from UI action → API call → backend processing → database change → UI update.
- **Happy Path Validation**: Verify that the primary success scenario works correctly.
- **Error Path Validation**: Verify that error cases (invalid input, network failure, auth failure) display appropriate messages and do not crash.
- **Edge Case Validation**: Test boundary conditions (empty lists, maximum values, special characters in inputs).
- **Regression Test For Bug Fixes**: After fixing a bug, verify that the specific scenario that caused it now works correctly.

## Logging & Monitoring
- **Error Logging Required**: All caught exceptions in backend route handlers must be logged to the console with context (e.g., route path, relevant IDs).
- **No Sensitive Data In Logs**: Never log passwords, tokens, full request bodies containing sensitive data, or financial amounts in plain text.
- **Authentication Logging**: Log successful logins and failed login attempts (with username only, not password).
- **Audit Trail Required**: For financial operations (create invoice, issue invoice, cancel invoice), log the operation, the acting user ID, and the timestamp.
- **Structured Logging**: Log in a consistent format: `[LEVEL] [MODULE] message { context }` (e.g., `[INFO] [InvoiceService] Invoice #INV-001 issued { userId: 5 }`).

## PDF Generation (Thai Language)
- **Use pdfkit with Thai fonts**: PDF rendering uses `pdfkit` in `backend/src/modules/invoices/invoice.pdf.ts`. Always use a registered Thai font (`Sarabun`, `THSarabunNew`, `Fahkwang`) for all text to ensure correct Thai character rendering.
- **Never switch PDF libraries**: Do not introduce `puppeteer`, `jsPDF`, or any other PDF library. All generation goes through the existing `pdfkit` pipeline.
- **Stream, don't buffer**: Stream PDF responses directly to the HTTP response via `res.pipe()`. Do not buffer the full PDF in memory.

## ERP / Invoice / Financial System Rules
- **Audit Trail Required**: Every create, update, issue, and cancel operation on an Invoice must be traceable to a user and timestamp. Never silently modify financial records.
- **Financial Data Integrity First**: Invoice totals must always equal the sum of their line items. Validate this before saving.
- **Invoice Number Integrity**: Invoice numbers (`invoiceNumber`) are unique and immutable. Never allow modification after creation.
- **No Silent Data Modification**: Never modify financial fields (amounts, quantities, status) as a side effect of an unrelated operation.
- **Approval Flow Integrity**: Only allow status transitions in the defined direction: `DRAFT` → `ISSUED` → `CANCELLED`. Validate state transitions server-side.
- **Permission Validation For Financial Operations**: Verify user role before allowing issue or cancel operations. Users without `ADMIN` role must not be able to issue or cancel invoices belonging to other users.

## Git & Commit Convention
- **Commit Message Format**: Use Conventional Commits: `<type>: <short description>` (e.g., `feat: add pagination component`, `fix: correct invoice sort query`, `docs: update system architecture`).
- **Common Types**: `feat` (new feature), `fix` (bug fix), `refactor` (code restructure), `docs` (documentation only), `chore` (tooling/config), `test` (tests), `perf` (performance).
- **Branch Naming**: Use kebab-case with type prefix (e.g., `feat/invoice-sort`, `fix/auth-cookie`, `refactor/pagination-component`).
- **Atomic Commits**: One logical change per commit. Do not bundle unrelated changes.
- **No Unrelated Changes In Same Commit**: If you discover an unrelated bug while working, fix it in a separate commit.
- **Verify Build Before Commit**: Ensure the application builds without errors before committing.
- **Verify Lint Before Commit**: Run `npm run lint` in `frontend/`. Zero warnings or errors.
- **Verify TypeScript Before Commit**: Run `npx tsc --noEmit` in `frontend/` and `backend/`. Zero errors.

## Completion Checklist
Before marking any task as complete, verify:
- **Requirement Satisfied**: The implementation matches what was asked for.
- **Related Files Reviewed**: All files affected by the change have been read and updated.
- **Existing Patterns Followed**: The code matches the style and architecture of the surrounding codebase.
- **No Duplicate Code**: No logic is repeated that could be extracted into a shared utility or component.
- **No Dead Code**: No unused imports, variables, or functions remain.
- **No TypeScript Errors**: `npx tsc --noEmit` passes in both `frontend/` and `backend/`.
- **No Lint Errors**: `npm run lint` passes in `frontend/`.
- **Documentation Updated**: `doc/system_architecture.md` and `doc/Into.md` reflect any changes made.
- **Security Reviewed**: Auth, input validation, and sensitive data handling have been verified.
- **Performance Reviewed**: No N+1 queries, unbounded result sets, or unnecessary re-renders introduced.
- **API Contract Verified**: Frontend types match backend response shapes.
- **Database Changes Verified**: Migrations ran, Prisma client regenerated if schema changed.
- **User Workflow Verified**: The end-to-end user flow was manually tested in the browser.
