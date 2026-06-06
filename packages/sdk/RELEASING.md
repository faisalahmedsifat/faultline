# Releasing the SDK

How to publish a new version of `@xyph3r/faultline`.

## Prerequisites

- npm account with access to the `@xyph3r` scope
- Authenticated locally: `npm login`

## Release Checklist

### 1. Update the version

Edit `packages/sdk/package.json` and bump the version:

```
"version": "0.1.1" → "0.2.0"
```

Follow [semver](https://semver.org/):
- **Patch** (`0.1.1` → `0.1.2`): bug fixes, internal improvements
- **Minor** (`0.1.1` → `0.2.0`): new features, new options, new hooks
- **Major** (`0.1.1` → `1.0.0`): breaking changes, stable API

### 2. Update the changelog

Add a new section to `packages/sdk/CHANGELOG.md`:

```md
## [0.2.0] — 2026-06-XX

### Added
- New feature description

### Changed
- What changed (backward-compatible)

### Breaking
- Any breaking changes with migration notes
```

### 3. Verify the build

```bash
cd packages/sdk
bun run build          # compiles TypeScript
ls dist/               # ensure index.js, index.d.ts, cli.js, etc.
bun run typecheck      # no errors
```

### 4. Dry-run publish

```bash
cd packages/sdk
bun run release:dry
```

Check that:
- Only `dist/` and `README.md` are included (not `src/`, `tsconfig.json`, etc.)
- The version matches what you set in step 1

### 5. Test locally

```bash
# In a test project
cd /tmp
mkdir test-faultline && cd test-faultline
npm init -y
npm install /path/to/faultline/packages/sdk

# Test the import
node -e "
const { Faultline } = require('@xyph3r/faultline');
console.log('Import OK');
"
```

Or use `npm link`:
```bash
cd packages/sdk
npm link
cd /tmp/test-project
npm link @xyph3r/faultline
```

### 6. Commit and tag

```bash
git add packages/sdk/
git commit -m "chore: release @xyph3r/faultline v0.2.0"
git tag v0.2.0-sdk
git push origin main --tags
```

### 7. Publish to npm

```bash
cd packages/sdk
bun run release
# or: npm publish
```

### 8. Verify on npm

```bash
npm view @xyph3r/faultline
npm install @xyph3r/faultline
```

Visit `https://www.npmjs.com/package/@xyph3r/faultline`.

### 9. Create GitHub Release (optional)

Go to [Releases](https://github.com/faisalahmedsifat/faultline/releases) → Draft a new release:
- Tag: `v0.2.0-sdk`
- Title: `@xyph3r/faultline v0.2.0`
- Body: Copy from CHANGELOG.md

## Post-Release

- Update the examples in `examples/node-faultline/` if APIs changed
- Update the root `README.md` if significant new features were added
- Announce on relevant channels
