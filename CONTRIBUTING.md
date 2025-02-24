# Contributing to HY Vue Gantt

Thank you for considering contributing to HY Vue Gantt! This document provides guidelines and instructions to help you contribute effectively to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
  - [Understanding the Project Structure](#understanding-the-project-structure)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Commit Guidelines](#commit-guidelines)
  - [Testing](#testing)
- [Style Guide](#style-guide)
  - [Code Style](#code-style)
  - [Documentation Style](#documentation-style)
- [Release Process](#release-process)

## Getting Started

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/Xeyos88/HyVueGantt.git
   cd hy-vue-gantt
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Understanding the Project Structure

The project is organized as follows:

```
/src
  /components       # Vue components
  /composables      # Vue composables (custom hooks)
  /provider         # Dependency injection providers
  /types            # TypeScript type definitions
  /color-schemes.ts # Color scheme definitions
```

## How to Contribute

### Reporting Bugs

If you find a bug, please report it by creating an issue using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md). Before creating a new issue, please check if the bug has already been reported.

When reporting a bug, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior and actual behavior
- Screenshots if applicable
- Any relevant code snippets or error messages

### Suggesting Features

We welcome suggestions for new features or enhancements! Please use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) to submit your ideas.

Feature requests should:

- Clearly describe the problem or need the feature addresses
- Explain how the feature would benefit users
- Include examples of how the feature might be used
- Consider potential implementation challenges

### Pull Requests

Follow these steps to submit a pull request:

1. Ensure your code follows our [Style Guide](#style-guide)
2. Update or add tests for your changes
3. Update documentation to reflect your changes
4. Make sure all tests pass
5. Create a pull request against the `main` branch
6. Use our [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) to provide context for your changes

## Development Workflow

### Branching Strategy

- `main` - Contains the stable version of the code
- `develop` - Integration branch for features
- `feature/*` - For new features or enhancements
- `bugfix/*` - For bug fixes
- `release/*` - For preparing releases

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This helps us generate changelogs and understand the purpose of each commit.

Format: `type(scope): description`

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:

- `feat(grid): add ability to customize grid line colors`
- `fix(timeaxis): resolve issue with incorrect date formatting`
- `docs(readme): update installation instructions`

### Testing

- Run tests before submitting a pull request:
  ```bash
  npm run test
  ```
- Add new tests for your changes when applicable
- We use [Vitest](https://vitest.dev/) for unit tests

## Style Guide

### Code Style

- We use ESLint and Prettier for code formatting
- Run linting before submitting a PR:
  ```bash
  npm run lint
  ```
- TypeScript is preferred for all new code
- Vue 3 Composition API is our standard for components
- Follow Vue style guide for component structure

### Documentation Style

- Use JSDoc comments for functions, classes, and methods
- Keep comments up-to-date with code changes
- Write clear, concise documentation that explains the "why" not just the "how"
- Include examples where helpful

## Release Process

1. We use semantic versioning (MAJOR.MINOR.PATCH)
2. Changes are documented in CHANGELOG.md
3. Release branches are created from develop for final testing
4. After testing, releases are merged to main and tagged

Thank you for contributing to HY Vue Gantt!
