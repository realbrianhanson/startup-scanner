

## Fix: `startupCost.match is not a function` in edge function

**Root cause**: In `calculateValidationScore()` inside `generate-validation-report/index.ts`, the code calls `startupCost.match(...)` assuming it's a string. The AI model sometimes returns a number or object for this field, causing the crash.

**Fix** (single change in the edge function):
1. In `calculateValidationScore()`, wrap `startupCost` with `String()` before calling `.match()`, or add a type guard. Apply the same defensive pattern to any other field that uses `.match()` or other string methods, since AI-generated JSON fields can return unexpected types.

2. Something like:
   ```typescript
   const costStr = String(startupCost || '');
   const match = costStr.match(...);
   ```

3. Audit nearby code in `calculateValidationScore` for similar assumptions (e.g., other fields using `.split()`, `.match()`, `.replace()` on potentially non-string values).

**After the fix**: You'll need to re-trigger the report generation for this project (either from the UI or by resetting the project status to `draft`).

