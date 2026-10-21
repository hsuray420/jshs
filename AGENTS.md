# JSHS Deployment Rule

For this project, every website change must follow this release path:

1. Change the local files in this repository.
2. Run the relevant local verification before release.
3. Commit the local changes.
4. Push `main` to GitHub remote `github`.
5. Let GitHub Actions deploy `jshs.cc` from GitHub.
6. Verify the production URLs after the GitHub deployment finishes.

Do not use the Cloudflare direct deploy script as the normal release path unless the user explicitly asks for an emergency direct deployment.

## UI & Design System Rule

For all UI, styling, and animation tasks:

1. Read `site/DESIGN_SYSTEM.md` before making any layout or visual modifications.
2. Adhere to Apple-inspired design principles: clean layout, generous whitespace, unified typography, and restrained physics-based micro-interactions.
3. All colors, borders, shadows, radii, and typography must reference design tokens from `public/design-tokens.css`. Do not introduce ad-hoc hardcoded values.
4. Verify responsive viewports (Desktop 1280px, Mobile 390px) and preserve accessibility (`prefers-reduced-motion` compliance).
5. Execute the 3-phase quality acceptance loop (Visual, Functional, Code) defined in `.agents/rules/frontend-quality-workflow.md`.

