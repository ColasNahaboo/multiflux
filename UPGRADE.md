# Upgrade Process

How to absorb a new upstream release of Miniflux Companion into Multiflux.

## Remote Setup

```bash
# Already configured:
git remote add upstream https://codeberg.org/gbcox/miniflux-companion.git
git fetch upstream --tags
```

## Branch Structure

```
main              — FireFox-ported version (current HEAD)
upstream/main     — tracks upstream HEAD, never modified locally
release/x.y.z     — temporary branch per upgrade, merged into main then deleted
vX.Y.Z            — upstream release tags
vX.Y.Z            — our tags (Multiflux semver, not correlated with upstream)
```

## Step-by-step Upgrade (per upstream release)

### 1. Identify the new tag

```bash
git fetch upstream --tags
git tag -l 'v*' | sort -V
```

Assume the new tag is `v2.8.0`. Check what's new:

```bash
git diff v2.7.1..v2.8.0 --stat
```

### 2. Create a release branch from the upstream tag

```bash
git checkout v2.8.0 -b release/2.8.0
```

### 3. Apply automated Firefox conversions

These steps are deterministic — run them on every file:

```bash
# Replace chrome.* with browser.* in all relevant files
find . -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.test.js' \) \
  ! -path './node_modules/*' ! -path './dist/*' \
  -exec sed -i 's/chrome\./browser./g' {} +
```

If `package.json` has a `prettier` or format script, run it after the sed:

```bash
npx prettier --write '**/*.{js,jsx}' --ignore-unknown
```

### 4. Simplify Promise wrappers removed by upstream

Check if upstream added new files with callback-based `chrome.storage` wrappers. Grep for patterns that need simplification:

```bash
rg 'chrome\.runtime\.lastError' -l    # should return nothing — if not, remove those patterns
rg 'new Promise.*browser\.storage' -l # should return nothing — if not, simplify to direct await
rg 'storageGet\|storageSet' -l        # check for old-style wrapper function names
```

If found, apply the same simplifications used in the v2.7.1 port:
- Remove `chrome.runtime.lastError` handling (browser throws on rejection)
- Replace `storageGet('local', keys)` → `browser.storage.local.get(keys)`
- Replace `storageSet('local', values)` → `browser.storage.local.set(values)`
- Replace Promise-wrapped `getSettings()` with direct `browser.storage.local.get([...])`

### 5. Apply the manual Firefox manifest patch

Upstream `manifest.json` needs these changes. Instead of editing manually, apply this standard diff:

**Changes to apply to upstream manifest.json:**
1. Rename `"name"` → `"Multiflux"`
2. Replace the entire `"background"` block:
   ```json
   "background": {
     "scripts": ["background.js"],
     "service_worker": "background.js",
     "type": "module"
   }
   ```
3. Add under `"version"`:
   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "multiflux@example.com",
       "data_collection_permissions": {
         "required": ["none"]
       }
     }
   },
   ```
4. Update `"action"` → `"default_title": "Multiflux"`

### 6. Review upstream diff for new Firefox-sensitive changes

Check if the upstream release introduces anything that needs special Firefox handling:

```bash
# New permissions or manifest keys
git diff v2.7.1..v2.8.0 -- manifest.json

# New extension API usage (check for Firefox incompatibilities)
git diff v2.7.1..v2.8.0 -- '*.js' | rg '^\+.*chrome\.'
```

Known Firefox differences to verify:
- `chrome.sessions.*` — not available in Firefox, use `browser.sessions.*` (same API)
- `chrome.tabGroups.*` — not available in Firefox
- `chrome.declarativeNetRequest.*` — partially supported
- `chrome.sidePanel.*` — use `browser.sidebarAction.*` instead
- `chrome.offscreen.*` — not available in Firefox

### 7. Update tests

If upstream added or modified test files, they need the same `chrome.` → `browser.` replacement (step 3 handles this). Then verify all tests pass:

```bash
npm test
```

If new tests mock the Chrome API, update them to use the Promise-based `browser.*` pattern (see current `test/storage-utils.test.js` as a reference).

### 8. Verify the port

```bash
# Zero errors expected, one warning is OK (service_worker ignored)
npx web-ext lint --source-dir=.

# All tests pass
npm test
```

### 9. Merge and tag

```bash
git add -A
git commit -m "multiflux: port upstream v2.8.0"
git checkout main
git merge release/2.8.0
git branch -d release/2.8.0
```

## Quick Reference Card

For a typical upstream release, the port is:

```bash
UPSTREAM=v2.8.0
PREV=v2.7.1

# Fetch, branch, convert
git fetch upstream --tags
git checkout $UPSTREAM -b release/${UPSTREAM#v}
find . -type f \( -name '*.js' -o -name '*.jsx' \) ! -path './node_modules/*' ! -path './dist/*' \
  -exec sed -i 's/chrome\./browser./g' {} +

# Manual: update manifest.json with Firefox keys (see section 5)
# Manual: simplify any new callback wrappers (see section 4)

# Verify
npm test && npx web-ext lint --source-dir=.

# Merge
git add -A && git commit -m "multiflux: port upstream $UPSTREAM"
git checkout main && git merge release/${UPSTREAM#v}
# Then tag with the new Multiflux version per AGENTS.md versioning
```
