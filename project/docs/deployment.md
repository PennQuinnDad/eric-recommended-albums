# Deployment: AWS Amplify + GitHub

## Setup checklist

- [x] GitHub repo created and pushed
- [ ] App scaffolded in `dev/` and builds locally (`npm run build`)
- [ ] `amplify.yml` build commands and `baseDirectory` match the app
- [ ] Amplify app created: Amplify console → **Create new app** → GitHub → pick this repo and the `main` branch
- [ ] Monorepo setting: tick "My app is a monorepo" and set the root to `dev` (this sets `AMPLIFY_MONOREPO_APP_ROOT=dev`)
- [ ] First deploy succeeded; live URL added to the README
- [ ] Custom domain (optional)

## Notes

- Every push to `main` deploys to production. Use a branch and a pull request for anything risky; Amplify can build a preview for each pull request.
- Environment variables and secrets go in the Amplify console (App settings → Environment variables), never in the repo.
