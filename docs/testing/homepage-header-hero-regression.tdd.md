# Homepage Hero and Header Regression TDD

## Contract

- The existing `/images/hero-students-production.png` asset must render inside the homepage Hero at every supported viewport.
- The public site name is exactly `全國國中升學資訊網`.
- Desktop navigation uses a collision-safe three-zone grid at 1180px and wider; narrower layouts keep the existing mobile navigation.
- Desktop controls use 14px labels, a 20px menu gap, 38px menu buttons, 12px chevrons, and 40px search/account controls.

## RED

`node --test tests/homepage-header-hero-regression.test.mjs`

The initial three tests failed because the Hero image layer used a negative stacking level, the calibrated desktop header contract was absent, and the former public name remained in user-visible sources.

## GREEN

The implementation keeps the verified Hero asset above the page background, scopes the desktop header rules to the homepage's real DOM specificity, and normalizes the formal public name.

Verified with:

- `node --test tests/homepage-header-hero-regression.test.mjs` — 3/3 pass
- `pnpm run test:unit` — 270/270 pass
- `pnpm run typecheck` — pass
- `pnpm run lint` — 0 errors; 22 pre-existing warnings
- `pnpm run build` — pass
- Browser checks at 1536, 1440, 1366, 1280, 1200, 1100, 1024, 768, 390, and 375 CSS pixels — no horizontal overflow or desktop-zone collision
