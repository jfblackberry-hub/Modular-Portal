# Staging Branch Strategy

This repo uses a lightweight branch promotion model to keep the AWS portal closer to local development without manually syncing files to EC2.

## Branch roles

- `staging`: integration branch for cloud validation
- `main`: validated branch for the default shared environment

## Environment mapping

- push to `staging` -> GitHub Actions deploys to `qa`
- push to `main` -> GitHub Actions deploys to `dev`

## Recommended day-to-day flow

1. build and test locally
2. when a change is ready for AWS verification, push it to `staging`
3. confirm the behavior in the `qa` AWS environment
4. merge the approved change from `staging` into `main`
5. let the normal `main` deploy update `dev`

## Why this helps

- AWS stays close to the current state of active work
- local-only fixes do not require manual EC2 changes
- risky login, branding, and tenant-behavior changes can be validated before promotion
- `main` stays cleaner because it receives already-tested changes

## Guardrails

- do not use `staging` as a long-lived scratch branch
- keep unfinished work on short-lived feature branches until it is ready for QA
- if `staging` breaks, fix forward quickly so it remains a trustworthy integration branch
- avoid direct edits on AWS instances; treat Git as the source of truth

## Suggested Git commands

Create the branch once:

```bash
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

Keep `staging` current:

```bash
git checkout staging
git pull
git merge <feature-branch>
git push
```

Promote to `main` after QA:

```bash
git checkout main
git pull
git merge staging
git push
```
