# Contributing to HyVue Gantt

We love your input! We want to make contributing to HyVue Gantt as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. If you have any concerns, please contact the maintainers.

## Report bugs using GitHub's [issue tracker](https://github.com/Xeyos88/HyVueGantt/issues)

We use GitHub issues to track public bugs. Report a bug by opening a new issue. Write bug reports with detail, background, and sample code.

**Great Bug Reports** should include:

- A quick summary and/or background
- Steps to reproduce
  - Be specific
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

1. Clone your fork of the repo

   ```sh
   git clone https://github.com/Xeyos88/HyVueGantt.git
   ```

2. Install dependencies

   ```sh
   npm install
   ```

3. Start development server

   ```sh
   npm run dev
   ```

4. Create a branch for your feature
   ```sh
   git checkout -b feature/my-new-feature
   ```

## Testing

We use Vitest for unit testing. All tests should pass before submitting a pull request.

```sh
npm run test
```

## Code Style and Linting

We use ESLint and Prettier to maintain code quality and consistency.

- Follow TypeScript best practices
- Use Vue 3 Composition API
- Follow the existing code style
- Write descriptive commit messages

Run linting:

```sh
npm run lint
```

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update documentation in the `/docs` folder for new features or changes.
3. The PR will be merged once you have the sign-off of at least one maintainer.

## Documentation Guidelines

When adding new features, please include:

- TypeScript interfaces and types
- Description of the feature
- Example usage code
- Note any breaking changes
- Update relevant sections in `/docs`

## Versioning

We use [SemVer](http://semver.org/) for versioning. For new releases:

- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

## Community and Behavioral Expectations

This project adheres to the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) code of conduct. By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Questions or Need Help?

Feel free to:

- Open an issue with the question label
- Contact the maintainers
- Join our discussions on GitHub

Thank you for contributing to HyVue Gantt!
