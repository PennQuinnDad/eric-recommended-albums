# Eric's Recommended Albums

Here's a list of some of the albums I would absolutely recommend. Things that are really bedrock to me, things that I go back to again and again over the years. The kind of albums I recommend to family and friends.

## How this project is organized

- `project/` holds planning and reference material — no code.
  - Read `project/backgrounder/` first for context on what this is and why.
  - Put research findings in `project/research/`, specs and decisions in `project/docs/`, meeting notes and logs in `project/notes/`.
  - Media goes in `project/assets/`; it is git-ignored, so don't rely on it being in the repo.
  - Move superseded material to `project/archive/` instead of deleting it.
- `dev/` holds all code. Keep any app, package manifest, and build config inside `dev/`, not at the project root.
- One git repository covers the whole project from this root.

## Deployment: AWS Amplify + GitHub

- The app in `dev/` deploys through AWS Amplify, which builds from the GitHub repo's `main` branch.
- `amplify.yml` at the root sets `appRoot: dev`. When the app's framework or build output changes, update its build commands and `baseDirectory` to match.
- Setup status and remaining steps are in `project/docs/deployment.md`. Update it and the README's Deployment section as steps are done.
- Don't push to `main` or change the Amplify app without the user's go-ahead. A push to `main` is a production deploy.
