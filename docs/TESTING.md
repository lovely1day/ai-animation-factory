# Testing Guide

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Running Tests for Specific Apps

```bash
# API tests only
pnpm --filter api test

# Web tests only
pnpm --filter web test
```

## Test Structure

```
apps/
├── api/
│   └── src/
│       ├── test/
│       │   └── setup.ts          # Global mocks for API
│       └── services/
│           └── *.test.ts         # Service tests
└── web/
    └── src/
        ├── test/
        │   └── setup.ts          # Global mocks for Web
        └── lib/
            └── *.test.ts         # Utility tests
```

## Writing Tests

### API Tests Example
```typescript
import { describe, it, expect } from 'vitest'
import { QueueService } from './queue.service'

describe('QueueService', () => {
  it('should create episode and dispatch job', async () => {
    const service = new QueueService()
    const jobId = await service.dispatchEpisodeGeneration({ genre: 'comedy' })
    expect(jobId).toBeDefined()
  })
})
```

### Web Tests Example
```typescript
import { describe, it, expect } from 'vitest'
import { cn, formatNumber } from './utils'

describe('utils', () => {
  it('should format numbers correctly', () => {
    expect(formatNumber(1500)).toBe('1.5K')
  })
})
```

## Coverage Reports

Coverage reports are generated in `coverage/` directory after running `pnpm test:coverage`.
