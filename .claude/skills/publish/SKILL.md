---
name: publish
description: Publish Eric's Recommended Albums site. Builds it, shows what is unpushed, asks before pushing, pushes to main, and watches the Amplify site until the new version is live. Use when the user says "publish", "deploy the site", "push to Amplify", "ship it", or runs /publish in this project. This is not the Budget Tracker /deploy skill.
---

# Publish the albums site

Publishing here means pushing `main` to GitHub. AWS Amplify watches that branch and rebuilds the live site at https://main.d14l4xii94mt7b.amplifyapp.com/ within about two minutes. **A push is a production deploy**, so it only happens after a clear yes from Eric in this conversation. Earlier approvals don't carry over.

Project root: `~/dev/eric-recommended-albums`. Run everything from there.

## Steps

### 1. Check the starting point

```bash
git branch --show-current          # must be main
git remote get-url origin          # must be https://github.com/PennQuinnDad/eric-recommended-albums.git
git fetch origin -q
git status --porcelain             # uncommitted changes?
git rev-list --left-right --count origin/main...HEAD    # behind  ahead
```

- **Not on `main`:** stop and say so. Publishing only ships `main`.
- **Remote isn't the PennQuinnDad repo:** stop and say so. Don't change the remote.
- **Behind GitHub (first number above 0):** stop. Something new is on GitHub that isn't here yet. Say what, and ask how to proceed. Never force-push.
- **Uncommitted changes:** they will not be published, since only commits are pushed. List the files and ask whether to commit them first (propose a short message) or leave them out.
- **Nothing ahead and nothing uncommitted:** tell Eric the live site is already up to date, and stop.

### 2. Build

```bash
npm --prefix dev run build
```

This is what Amplify runs, and it includes the check that every album has both a Spotify and an Apple Music link. If it fails, show the actual error (it names the album or file) and stop. Don't push a build that fails.

### 3. Show what would go live

```bash
git log origin/main..HEAD --format='%h %s'        # the commits that will be pushed
git diff --stat origin/main..HEAD | tail -n 20    # the files they touch
git diff --name-only origin/main..HEAD -- dev amplify.yml    # does this change the site itself?
```

Summarize in plain language: how many commits, and what Eric would notice on the site. If the last command prints nothing, only notes or docs changed. Say that Amplify may rebuild but nothing will look different, so there is nothing to watch for later.

### 4. Ask before pushing

Ask one question: push these commits to `main` so Amplify deploys them? If AskUserQuestion is available, use it. Wait for an explicit yes. A "no", "not yet" or silence means stop, and nothing is pushed.

### 5. Take a snapshot, then push

Only when the site itself changed (step 3), take a fingerprint of the live page first:

```bash
bash .claude/skills/publish/live-check.sh snapshot
```

Then push:

```bash
git push -q && git status -sb | head -1
```

Pushing uses the repo's pinned PennQuinnDad sign-in. If it fails with an auth error, report it as is. Don't switch GitHub accounts or change any config. Eric can push from his own terminal.

### 6. Watch until it's live

Only when the site itself changed. Pass the fingerprint from step 5. Run it in the background so Eric can keep talking, and give up after 10 minutes:

```bash
bash .claude/skills/publish/live-check.sh wait <fingerprint>
```

It prints `LIVE after ~Ns ...` with the number of albums the live site carries, or `NOT LIVE after Ns` (about 600 seconds) and exits with an error. Tell Eric when it's up, with the time and the album count, and check the count against `dev/src/albums.json`. If it never goes live, don't retry the push. Say so, and suggest the Amplify console's build log for the app (a failing build leaves the old site up). The usual cause is the monorepo setting: "My app is a monorepo" must be ticked with the root set to `dev`.

## Never

- Never push without a yes in this conversation.
- Never force-push, rewrite history, or change the remote or git config.
- Never commit on Eric's behalf without asking. Commit messages end with the Co-Authored-By line from the session's attribution instructions.
- Never use the account-level `/deploy` skill for this site. It rebuilds the Budget Tracker.
