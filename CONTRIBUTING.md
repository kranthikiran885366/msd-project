# Contributing to Deployer

Thank you for your interest in contributing to Deployer! We welcome contributions from the community and are grateful for any improvements you can make to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@deployer.dev.

## Getting Started

### Prerequisites

- **Node.js**: 18+ ([Download](https://nodejs.org/))
- **npm/pnpm**: Package manager
- **Git**: 2.0+ ([Download](https://git-scm.com/))
- **Docker**: Optional but recommended ([Download](https://www.docker.com/))

### Setup Development Environment

1. **Fork the repository**
   ```bash
   Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/deployer.git
   cd deployer
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/kranthikiran885366/deployer.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

5. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   cp server/.env.example server/.env.local
   ```

6. **Start development servers**
   ```bash
   npm run dev              # Frontend (port 3000)
   # In another terminal:
   npm run dev:server       # Backend (port 5000)
   ```

## Development Process

### 1. Create a Feature Branch

```bash
# Update main branch
git fetch upstream
git checkout main
git reset --hard upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### 2. Make Your Changes

- Follow code style guidelines (see [Code Standards](#code-standards))
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Run type checking
npm run type-check

# Build for production
npm run build
```

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

## Pull Request Process

### Creating a Pull Request

1. **Before creating PR**: Ensure all tests pass and code is linted
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create PR on GitHub**
   - Click "New Pull Request"
   - Ensure base is `kranthikiran885366/deployer:main`
   - Ensure compare is `YOUR-USERNAME/deployer:feature/your-feature-name`
   - Fill out the PR template completely

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### PR Review Process

1. **Automated checks** must pass:
   - Linting
   - Type checking
   - Build verification
   - Test coverage

2. **Code review** by maintainers:
   - Code quality
   - Design patterns
   - Performance impact
   - Security considerations

3. **Approval and merge**:
   - At least 1 approval required
   - All checks must pass
   - Maintainer merges when ready

## Reporting Bugs

### Before Reporting

- Check existing issues to avoid duplicates
- Try to reproduce with latest code
- Check documentation and FAQs

### Bug Report Template

**Title**: `[BUG] Brief description`

**Description**:
```
## Describe the bug
Clear description of what the bug is

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: (e.g., Windows 11, macOS 12)
- Node.js version: (e.g., 18.0.0)
- npm/pnpm version: (e.g., 8.0.0)
- Browser: (if relevant)

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

## Suggesting Enhancements

### Feature Request Template

**Title**: `[FEATURE] Brief description`

**Description**:
```
## Feature Description
Clear description of the proposed feature

## Use Cases
Why would this be useful?

## Proposed Solution
How should this feature work?

## Alternatives
Any alternative approaches?

## Additional Context
Any other relevant information
```

## Project Structure

```
deployer/
├── app/                    # Next.js frontend
├── components/            # React components
├── server/               # Express backend
├── lib/                  # Utility libraries
├── hooks/                # React hooks
├── store/                # State management
├── styles/               # CSS stylesheets
├── public/               # Static assets
├── docs/                 # Documentation
└── tests/                # Test files
```

## Code Standards

### TypeScript/JavaScript

```javascript
// Good: Descriptive names, proper typing
interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}

function getUserById(id: string): Promise<UserProfile | null> {
  // Implementation
}

// Bad: Vague names, no typing
function get(x) {
  // Implementation
}
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Functions**: camelCase (e.g., `getUserById()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Files**: kebab-case (e.g., `user-profile.jsx`)

### Code Quality

- **No console logs** in production code
- **Error handling**: Always handle errors gracefully
- **Comments**: Explain "why", not "what"
- **DRY**: Don't repeat yourself
- **SOLID**: Follow solid principles

### Formatting

```bash
# Format with Prettier
npm run format

# Fix ESLint issues
npm run lint:fix
```

## Testing Requirements

### Unit Tests

```javascript
// Example test structure
describe('getUserById', () => {
  it('should return user with valid id', async () => {
    const user = await getUserById('123');
    expect(user.id).toBe('123');
  });

  it('should return null for invalid id', async () => {
    const user = await getUserById('invalid');
    expect(user).toBeNull();
  });
});
```

### Coverage Requirements

- Minimum 80% code coverage
- All public APIs tested
- Edge cases covered
- Error paths tested

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Commit Guidelines

### Conventional Commits

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that refactors without feature/fix
- `perf`: Code change that improves performance
- `test`: Adding missing tests
- `chore`: Changes to build process or dependencies

### Examples

```bash
# Feature
git commit -m "feat: add user authentication module"

# Bug fix
git commit -m "fix: resolve memory leak in deployment service"

# Documentation
git commit -m "docs: update API reference for billing endpoints"

# With scope
git commit -m "feat(auth): add two-factor authentication"

# With body
git commit -m "feat: implement OAuth2 flow

Integrate GitHub and Google OAuth providers
with proper error handling and user feedback"
```

## Performance Guidelines

- Keep component render time < 50ms
- API responses < 200ms
- Bundle size < 500KB (gzipped)
- Lighthouse score > 90

## Security Guidelines

- Never commit secrets or API keys
- Validate all user inputs
- Use HTTPS for all external requests
- Follow OWASP security guidelines
- Report security issues to security@deployer.dev (not public issues)

## Documentation Guidelines

- Update README for user-facing changes
- Update API docs for new endpoints
- Add JSDoc comments to functions
- Include examples in documentation
- Keep docs in sync with code

## Getting Help

- **Questions**: Create a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Security**: Email security@deployer.dev
- **General**: Join our Discord community

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Monthly newsletter
- GitHub contributors page
- Release notes (for significant contributions)

## License

By contributing to Deployer, you agree that your contributions will be licensed under its MIT License.

## Questions or Need Help?

- Open a GitHub Discussion
- Email: hello@deployer.dev
- Discord: [Join our community](https://discord.gg/deployer)

---

**Thank you for contributing to Deployer! 🎉**

We appreciate your effort to make this project better for everyone.
