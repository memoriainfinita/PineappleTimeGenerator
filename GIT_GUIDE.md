# Git Branch Guide for Pineapple Time Generator

This guide provides instructions on how to work with Git branches for the Pineapple Time Generator project.

## Current Branch Status

You have created a branch called `feature-experiments` from the `main` branch. This allows you to safely experiment with different implementations without affecting your main progress.

## Useful Git Commands

### Branch Operations

```bash
# Check which branch you're currently on
git branch

# Create a new branch and switch to it
git checkout -b branch-name

# Switch between branches
git checkout main           # Switch back to main branch
git checkout feature-experiments  # Switch to your experiment branch
```

### Working with Changes

```bash
# View changes in your working directory
git status

# Add all changes to staging
git add .

# Commit your changes
git commit -m "Description of your changes"

# Push your branch to remote repository (if needed)
git push origin feature-experiments
```

### Merging Changes

When you're satisfied with your experimental changes and want to incorporate them into the main branch:

```bash
# First switch to the main branch
git checkout main

# Merge your experimental branch into main
git merge feature-experiments

# If you no longer need the experimental branch, you can delete it
git branch -d feature-experiments
```

### Handling Conflicts

If you encounter merge conflicts:

1. Open the conflicted files and resolve the conflicts manually
2. After resolving, add the files with `git add <filename>`
3. Complete the merge with `git commit`

## Recommended Workflow

1. Always make experimental changes in the `feature-experiments` branch
2. Test thoroughly before merging back to `main`
3. Make regular commits with descriptive messages
4. If an experiment fails, you can abandon it and create a new branch from `main`

## Reverting to Previous State

If something goes wrong and you need to go back:

```bash
# Discard all local changes and return to last commit
git reset --hard

# Return to a specific previous commit (find commit hash with git log)
git reset --hard commit_hash
```

---

Remember: The main branch should always contain stable, working code. Use feature branches for all experiments and new development.
