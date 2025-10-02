# Git Flow Workflow

## Branch Structure

```
main (production)
  └── develop (integration)
       ├── feature/* (new features)
       ├── bugfix/* (bug fixes)
       ├── hotfix/* (production fixes)
       └── release/* (release preparation)
```

## Branch Descriptions

### Main Branches

- **main**: Production-ready code only. All commits are tagged releases.
- **develop**: Integration branch for features. Always reflects latest delivered development changes.

### Supporting Branches

- **feature/**: New features branching from `develop`
- **bugfix/**: Bug fixes for `develop`
- **hotfix/**: Critical production fixes from `main`
- **release/**: Release preparation from `develop`

## Workflow

### Starting a New Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Working on a Feature

```bash
# Make changes
git add .
git commit -m "feat: implement feature X"

# Push to remote
git push -u origin feature/your-feature-name
```

### Finishing a Feature

```bash
# Update develop
git checkout develop
git pull origin develop

# Merge feature
git merge --no-ff feature/your-feature-name -m "Merge feature/your-feature-name"

# Push
git push origin develop

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### Creating a Release

```bash
# Start release from develop
git checkout develop
git pull origin develop
git checkout -b release/v0.2.0

# Update version numbers, changelog, etc.
npm version minor  # or patch, major

# Commit version bump
git commit -am "chore: bump version to 0.2.0"

# Merge to main
git checkout main
git merge --no-ff release/v0.2.0 -m "Release v0.2.0"
git tag -a v0.2.0 -m "Release version 0.2.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v0.2.0 -m "Merge release v0.2.0 back to develop"

# Push everything
git push origin main --tags
git push origin develop

# Delete release branch
git branch -d release/v0.2.0
git push origin --delete release/v0.2.0
```

### Hotfix Workflow

```bash
# Start hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix and commit
git commit -am "fix: resolve critical production bug"

# Bump patch version
npm version patch

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v0.1.1 -m "Hotfix v0.1.1"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug

# Push
git push origin main --tags
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-bug
git push origin --delete hotfix/critical-bug
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Other changes (dependencies, etc.)

### Examples

```bash
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(executor): resolve statement execution bug"
git commit -m "test(mcp): add aggregator connection tests"
git commit -m "docs(readme): update installation instructions"
```

## Worktrees for Parallel Development

### Setting Up Worktrees

```bash
# Create worktree for feature development
git worktree add ../codemode-feature-auth feature/auth-improvements

# Work in the worktree
cd ../codemode-feature-auth
# Make changes, commit, etc.

# When done, remove worktree
git worktree remove ../codemode-feature-auth
```

### Benefits of Worktrees

- Work on multiple features simultaneously without switching branches
- Keep builds/node_modules separate per branch
- Test integration without stashing changes

### Common Worktree Commands

```bash
# List all worktrees
git worktree list

# Add new worktree
git worktree add <path> <branch>

# Remove worktree
git worktree remove <path>

# Prune deleted worktrees
git worktree prune
```

## CI/CD Integration

- **Pull Requests**: Must pass all tests before merging
- **Develop**: Continuous integration testing
- **Main**: Production deployment triggered on merge
- **Release Tags**: Automated deployment to production

## Branch Protection Rules

### Main Branch

- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- No force pushes
- No deletions

### Develop Branch

- Require status checks to pass
- Allow force pushes by administrators only

## Quick Reference

```bash
# Update all branches
git checkout main && git pull
git checkout develop && git pull

# Clean up merged branches
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d

# Sync develop with main
git checkout develop
git merge main
git push origin develop
```

## Current Project Status

- **Main**: Production-ready code with 170 unit tests
- **Develop**: Integration branch for new features
- **Active Features**: None currently
- **Latest Release**: v0.1.0 (initial test suite)
