# AI Coding Agent Instructions

## Project Overview

**MVP_AI** is a Next.js 16 application with TypeScript, React 19, and Tailwind CSS v4. This is an early-stage MVP project bootstrapped with `create-next-app`, currently with minimal custom components and primarily template boilerplate.

## Technology Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **UI**: React 19.2.0
- **Styling**: Tailwind CSS 4.1.17 with PostCSS
- **Language**: TypeScript 5
- **Compiler**: React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- **Linting**: ESLint 9 with TypeScript support and Prettier 3.6.2 for formatting

## Project Structure

```
src/
  app/
    layout.tsx        # Root layout with Geist fonts (both sans and mono)
    page.tsx          # Home page component (currently template boilerplate)
    globals.css       # Global styles + Tailwind import
    tailwind.config.ts # Tailwind configuration
  TestComponent.tsx   # Shared test component (renders "hello world" in div)
test.tsx              # Another test component file (renders with Tailwind text-red-500)
```

**Path Alias**: Use `@/*` to reference files in `src/` (e.g., `import Component from '@/TestComponent'`)

## Key Architectural Decisions

### 1. React Compiler Enabled

The project has React Compiler enabled in `next.config.ts`. This means:

- Components are automatically memoized and optimized
- Avoid relying on manual memoization patterns (React.memo, useMemo)
- Keep component logic pure and deterministic

### 2. Tailwind CSS v4 with Inline Theme

`globals.css` uses `@import "tailwindcss"` and `@theme inline` to define custom CSS variables:

- `--background`, `--foreground` for light mode
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Font variables: `--font-geist-sans`, `--font-geist-mono`

When styling, reference these variables in Tailwind classes.

### 3. TypeScript Strict Mode

`tsconfig.json` has `"strict": true`. Ensure:

- All function parameters are explicitly typed
- All props interfaces are properly defined
- Avoid `any` types

## Development Workflows

### Build & Run Commands

```bash
npm run dev      # Start development server at http://localhost:3000 (hot reload)
npm run build    # Production build
npm start        # Run production build
npm run lint     # Run ESLint
```

### Development Patterns

- **Client Components**: Add `'use client'` directive only when needed (e.g., for interactivity)
- **Server Components**: Default in App Router; use for data fetching
- **Layout Structure**: Root layout in `src/app/layout.tsx` wraps all pages with metadata and font setup

### Testing

Currently no test framework configured. Test files (`test.tsx`, `TestComponent.tsx`) are exploratory. If adding tests:

- Consider Jest + React Testing Library (standard for Next.js)
- Place test files in `src/__tests__/` or use `.test.ts(x)` suffix

## Styling & Component Conventions

### Tailwind Usage

- Use utility-first approach exclusively
- Reference custom theme variables in `globals.css` for consistent spacing/colors
- Support dark mode: classes automatically respect system preference via `@media (prefers-color-scheme: dark)`

### Component Example

```tsx
// Use TypeScript interfaces for props
interface TestComponentProps {
  label: string;
  variant?: 'default' | 'primary';
}

export default function TestComponent({
  label,
  variant = 'default',
}: TestComponentProps) {
  return (
    <div className="flex items-center justify-center">
      <span
        className={
          variant === 'primary' ? 'font-bold text-blue-600' : 'text-gray-600'
        }
      >
        {label}
      </span>
    </div>
  );
}
```

## Build & Deployment

- **Build Output**: Next.js generates optimized build in `.next/` directory
- **Target Environment**: Compatible with Vercel (referenced in README and template)
- **Environment Variables**: None configured yet; add to `.env.local` if needed

## Common Tasks

| Task                 | Command/Pattern                                                             |
| -------------------- | --------------------------------------------------------------------------- |
| Add new page         | Create `src/app/[route]/page.tsx`                                           |
| Add shared component | Create `src/components/[Name].tsx`                                          |
| Style component      | Use Tailwind utility classes; reference CSS variables for theme consistency |
| Check types          | `npm run lint` (includes TypeScript checking via ESLint)                    |
| Format code          | Prettier configured in `prettier.config.cjs`                                |

## Important Notes for AI Agents

1. **Minimal Codebase**: This is an MVP with mostly boilerplate. Be prepared for sparse existing patterns.
2. **React Compiler Active**: Component optimization is automatic; focus on correctness over manual performance tuning.
3. **Path Resolution**: Always use `@/` alias when importing from `src/`.
4. **No Database/Backend Yet**: Currently frontend-only; clarify architecture if adding backend logic.
5. **Font System**: Geist fonts are pre-configured; use font variables in Tailwind for consistency.

## Next Steps for Growth

- Add `src/components/` directory for reusable UI components
- Set up testing framework (Jest + React Testing Library)
- Define shared types in `src/types/` or `src/models/`
- Consider adding API routes in `src/app/api/` when backend logic is needed
