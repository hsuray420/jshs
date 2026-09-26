# Homepage Hero and Header Regression TDD

## Contract

- The existing `/images/hero-students-production.png` asset must render inside the homepage Hero at every supported viewport.
- The public site name is exactly `全國國中升學資訊網`.
- Desktop navigation uses a collision-safe three-zone grid at 1200px and wider; narrower layouts retain a visible full-navigation trigger.
- Desktop controls use 13–16px labels, 12–28px fluid menu gaps, 44px menu buttons, 16px chevrons, and 44px search/account controls.
- The frame is centred at a 1680px maximum width, with eight primary groups including `官方資訊`.

## RED

`node --test tests/homepage-header-hero-regression.test.mjs`

The initial three tests failed because the Hero image layer used a negative stacking level, the calibrated desktop header contract was absent, and the former public name remained in user-visible sources.

## GREEN

The implementation keeps the verified Hero asset above the page background, uses one shared desktop Header frame across public routes, and normalizes the formal public name.

Verified with:

- `node --test tests/homepage-header-hero-regression.test.mjs`
- Full unit, typecheck, lint, build, and production browser checks are required before release.
