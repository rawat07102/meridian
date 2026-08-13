# Meridian

A collaborative task management platform for teams — workspaces, projects, and tasks with real-time updates.

Meridian is a full-stack task management application built for teams to organize work across workspaces and projects. It features role-based permissions, real-time notifications, guest access via invite links, and a flexible task system with subtasks, labels, and file attachments.

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9.x

### Setup

```bash
# Clone the repo
git clone https://github.com/rawat07102/meridian.git
cd meridian

# Install dependencies
pnpm install

# Set the commit message template (recommended)
git config commit.template .gitmessage

# Set up environment variables (see .env.example in each app)
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Run both apps in development
pnpm turbo dev
```

### Common Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm turbo dev`    | Run all apps in development mode |
| `pnpm turbo build`  | Build all apps and packages      |
| `pnpm turbo test`   | Run tests across the monorepo    |
| `pnpm lint`         | Lint all apps and packages       |
| `pnpm lint:fix`     | Lint and auto-fix                |
| `pnpm format`       | Format all files with oxfmt      |
| `pnpm format:check` | Check formatting without writing |

## Contributing (Solo Dev Workflow)

This project follows a feature-branch + PR workflow, even for solo development, as practice for team-based collaboration:

1. Create a branch: `feature/`, `fix/`, `chore/`, or `refactor/` prefix
2. Commit early and often (commits within a branch don't need to be clean)
3. Open a Draft PR early to get CI checks and preview deployments as you work
4. Mark "Ready for review" when done, review your own diff
5. Squash-merge into `main` with a clean [Conventional Commits](https://www.conventionalcommits.org/) message

See `.github/PULL_REQUEST_TEMPLATE.md` for the PR description format.

## License

ISC
