# JSHS Deployment Rule

For this project, every website change must follow this release path:

1. Change the local files in this repository.
2. Run the relevant local verification before release.
3. Commit the local changes.
4. Push `main` to GitHub remote `github`.
5. Let GitHub Actions deploy `jshs.cc` from GitHub.
6. Verify the production URLs after the GitHub deployment finishes.

Do not use the Cloudflare direct deploy script as the normal release path unless the user explicitly asks for an emergency direct deployment.
