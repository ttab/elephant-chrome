# Repository Socket Decorators

Decorators provide a clean way to enrich document data with additional information fetched from external sources (APIs, computations, etc.). They run automatically when documents are loaded or updated via WebSocket.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Creating a Decorator](#creating-a-decorator)
- [Type Flow](#type-flow)
- [Usage](#usage)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

### What are Decorators?

Decorators are plugins that:

- Fetch additional data for documents (metrics, statuses, assignments, etc.)
- Run automatically on initial load and updates
- Store data under namespaced keys to avoid conflicts
- Handle errors gracefully without blocking the main flow

### Key Concepts

```typescript
// Decorator returns data per UUID
Map<string, EnrichmentData>

// Applied under namespace
decoratorData[namespace][uuid] = EnrichmentData

// Access pattern
docState.decoratorData.metrics[deliverableUuid]

// Base type for all decorator data structures
type DecoratorDataBase = Record<string, Record<string, object>>
// Structure: namespace → UUID → enrichment data
```

## Architecture

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Decorator Returns (from onInitialData/onUpdate)            │
├─────────────────────────────────────────────────────────────┤
│ Map<string, MetricsData>                                    │
│ ┌─────────────┬────────────────────────────────┐          │
│ │ 'uuid-123'  │ { charCount: 1000, ... }       │          │
│ │ 'uuid-456'  │ { charCount: 1500, ... }       │          │
│ └─────────────┴────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         ↓
         ┌───────────────────────────────┐
         │  Decorator Runner Applies     │
         │  Under namespace: "metrics"   │
         └───────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Final Structure in decoratorData                            │
├─────────────────────────────────────────────────────────────┤
│ DocumentStateWithDecorators {                               │
│   document: { uuid: 'planning-1', ... }                     │
│   includedDocuments: [...]                                  │
│   decoratorData: {                                          │
│     metrics: {                        ← namespace           │
│       'uuid-123': { charCount: 1000 },← per UUID            │
│       'uuid-456': { charCount: 1500 }                       │
│     }                                                       │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Decorator Interface

```typescript
interface Decorator<TEnrichment> {
  /**
   * Namespace for this decorator's data.
   * Data will be nested under decoratorData[namespace][uuid]
   */
  namespace: string

  /**
   * Called once after initial document batch is received.
   * Should return a Map of UUID -> enrichment data.
   */
  onInitialData?: (
    documents: DocumentStateWithIncludes[]
  ) => Promise<Map<string, TEnrichment>>

  /**
   * Called when a document update is received.
   * Can return either a single enrichment or Map for batch updates.
   */
  onUpdate?: (
    update: DocumentUpdate
  ) => Promise<TEnrichment | Map<string, TEnrichment> | undefined>
}
```

## Creating a Decorator

### Step 1: Define Types

```typescript
// Individual enrichment data for ONE UUID
export interface MetricsData extends Record<string, number | undefined> {
  charCount?: number
  wordCount?: number
}

// Full structure after decorator is applied
// DecoratorDataBase is Record<string, Record<string, object>>
export interface MetricsDecorator extends DecoratorDataBase {
  metrics: Record<string, MetricsData>
}
```

### Step 2: Implement the Decorator

```typescript
export function createMetricsDecorator(options: {
  kinds?: string[]
  repository: Repository
}): Decorator<MetricsData> {
  const { repository, kinds = ['char_count', 'word_count'] } = options

  return {
    namespace: 'metrics',

    async onInitialData(documents: DocumentStateWithIncludes[]) {
      // Extract UUIDs from included documents
      const uuids = documents
        .flatMap((d) => d.includedDocuments)
        .map((doc) => doc?.uuid)
        .filter((uuid): uuid is string => !!uuid)

      if (!uuids.length) {
        return new Map()
      }

      // Fetch data from API
      return await fetchMetricsForUuids(uuids, repository, kinds)
    },

    async onUpdate(update: DocumentUpdate) {
      // Only process inclusion updates
      if (!isInclusionUpdate(update)) {
        return undefined
      }

      const uuid = update.document?.uuid
      if (!uuid) {
        return new Map()
      }

      // Fetch data for updated document
      return await fetchMetricsForUuids([uuid], repository, kinds)
    }
  }
}
```

## Type Flow

### Complete Type Hierarchy

```
Decorator<MetricsData>
    └─ namespace: 'metrics'
    └─ onInitialData() → Map<string, MetricsData>
    └─ onUpdate() → Map<string, MetricsData>

MetricsData (per UUID)
    └─ charCount?: number
    └─ wordCount?: number

MetricsDecorator (full structure)
    └─ metrics: Record<string, MetricsData>
        └─ [uuid]: MetricsData

DocumentStateWithDecorators<MetricsDecorator>
    └─ document: Document
    └─ includedDocuments: Document[]
    └─ decoratorData?: MetricsDecorator
        └─ metrics: Record<string, MetricsData>
            └─ [uuid]: MetricsData
```

### Data Flow Example

```typescript
// 1. Decorator returns Map
onInitialData() returns:
Map<string, MetricsData> {
  'uuid-123' => { charCount: 1000, wordCount: 200 },
  'uuid-456' => { charCount: 1500, wordCount: 300 }
}

// 2. Runner applies under namespace
for (const [uuid, data] of decoratorDataMap) {
  doc.decoratorData['metrics'][uuid] = data
}

// 3. Final structure
{
  document: { uuid: 'planning-1', ... },
  decoratorData: {
    metrics: {
      'uuid-123': { charCount: 1000, wordCount: 200 },
      'uuid-456': { charCount: 1500, wordCount: 300 }
    }
  }
}

// 4. Access in component
const metrics = docState.decoratorData?.metrics?.[deliverableUuid]
// Type: MetricsData | undefined
// Value: { charCount: 1000, wordCount: 200 }
```

### Type Relationships

```typescript
// Base type for all decorator data
type DecoratorDataBase = Record<string, Record<string, object>>
// Structure: namespace → UUID → enrichment data

// Decorator generic = enrichment for ONE uuid
Decorator<MetricsData>

// Your decorator data interface extends the base
interface MetricsDecorator extends DecoratorDataBase {
  metrics: Record<string, MetricsData>
}

// Runner accepts array of any decorators
decorators: Decorator<object>[]

// Runner output = documents with namespaced structure
DocumentStateWithDecorators<TDecoratorData>[]

// Hook generic = complete decoratorData shape
useRepositorySocket<MetricsDecorator>

// Access chain types:
decoratorData                         → MetricsDecorator | undefined
decoratorData.metrics                 → Record<string, MetricsData>
decoratorData.metrics[uuid]           → MetricsData | undefined
decoratorData.metrics[uuid].charCount → number | undefined
```

**Why DecoratorDataBase?**

- Provides type safety for the nested namespace → UUID → data structure
- Single source of truth for decorator data shape
- Makes function signatures cleaner and more maintainable
- Previously was verbose `Record<string, Record<string, object>>` everywhere

## Usage

### Basic Usage

```typescript
import { createMetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import type { MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'

function MyComponent() {
  const { data, error, isLoading } = useRepositorySocket<MetricsDecorator>({
    type: 'core/planning-item',
    include: ['assignments.*.assignment.document'],
    decorators: [
      createMetricsDecorator({
        kinds: ['char_count', 'word_count'],
        repository
      })
    ]
  })

  // Access decorator data
  const planningDoc = data[0]
  const deliverableUuid = planningDoc.includedDocuments?.[0]?.uuid
  const metrics = deliverableUuid
    ? planningDoc.decoratorData?.metrics?.[deliverableUuid]
    : undefined

  return (
    <div>
      <p>Characters: {metrics?.charCount}</p>
      <p>Words: {metrics?.wordCount}</p>
    </div>
  )
}
```

### Multiple Decorators

```typescript
const { data } = useRepositorySocket<MyDecoratorData>({
  type: 'core/planning-item',
  decorators: [
    createMetricsDecorator({ repository }),
    createStatusesDecorator({ repository })
  ]
})

// Access different namespaces
const metrics = docState.decoratorData?.metrics?.[uuid]
const status = docState.decoratorData?.statuses?.[uuid]
```

### Type-Safe Access Helper

```typescript
function getDeliverableMetrics(
  docState: DocumentStateWithDecorators<MetricsDecorator>,
  deliverableUuid: string
): MetricsData | undefined {
  return docState.decoratorData?.metrics?.[deliverableUuid]
}

// Usage
const metrics = getDeliverableMetrics(planningDoc, deliverableUuid)
const charCount = metrics?.charCount ?? 0
```
