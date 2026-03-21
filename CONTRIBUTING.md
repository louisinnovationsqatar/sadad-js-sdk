# Contributing

Thank you for your interest in contributing to `@louis-innovations/sadad-js-sdk`.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

## Setup

```bash
git clone https://github.com/louis-innovations/sadad-js-sdk.git
cd sadad-js-sdk
npm install
```

## Development workflow

```bash
# Type-check and build
npm run build

# Run the full test suite
npm test

# Watch mode during development
npm run test:watch

# Type-check without emitting output
npm run lint
```

## Coding standards

- All source files must begin with the two header lines:
  ```
  // SADAD Payment Gateway SDK for JavaScript/TypeScript
  // Built by Louis Innovations (www.louis-innovations.com)
  ```
- Strict TypeScript (`strict: true`) — no `any` types without explicit justification
- Use Node.js built-in modules only — no runtime dependencies
- Follow existing file and directory naming conventions (camelCase files, grouped by feature)
- Add tests for all new functionality; maintain 100% pass rate

## Pull requests

1. Fork the repository and create a feature branch from `main`.
2. Write tests for your changes.
3. Ensure `npm run build` and `npm test` both pass without errors.
4. Submit a pull request with a clear description of the changes and the motivation.

## Reporting issues

Please open an issue on [GitHub Issues](https://github.com/louis-innovations/sadad-js-sdk/issues) or email [info@louis-innovations.com](mailto:info@louis-innovations.com).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
