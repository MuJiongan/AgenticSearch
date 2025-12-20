# Citation Mode ("Basis" System) - Implementation Plan

> **Goal**: Replace simple inline citations with a rich "Basis" system that provides confidence scores, reasoning, and lazy-loaded source highlights.

## Table of Contents

1. [Overview](#overview)
2. [Design Decisions](#design-decisions)
3. [Data Structures](#data-structures)
4. [Architecture](#architecture)
5. [Implementation Phases](#implementation-phases)
6. [UI/UX Specifications](#uiux-specifications)
7. [LLM Prompts](#llm-prompts)
8. [API Considerations](#api-considerations)

---

## Overview

### Current State

The app generates responses with simple inline citations:
```
"The iPhone 15 has a 48MP camera[1] and USB-C[2]..."
```

These are matched to sources and rendered as superscript badges, but lack:
- Quality/confidence indicators
- Reasoning for why a source was chosen
- Highlighted excerpts from sources
- Ability to improve or replace weak citations

### Proposed State: Basis System

Citation Mode completely replaces original citations with rich "Basis" objects:

```
"The iPhone 15 has a 48MP camera⟨●⟩ and USB-C⟨●⟩..."
                                🔵           🔵
```

Each basis provides:
- **Confidence**: low (🔴) / medium (🟡) / high (🔵)
- **Reasoning**: 1-3 sentences explaining why this source supports the claim
- **Multiple sources**: One claim can have multiple supporting sources
- **Lazy-loaded highlights**: Excerpts fetched on demand when user clicks

### Inspiration

- **Google Gemini**: Source highlights with excerpts
- **Test-Time Diffusion**: Repair/refine existing text instead of regenerating from scratch

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multiple sources per citation | ✅ Yes | Stronger claims have multiple supporting sources |
| Highlight storage | Lazy load | Store positions, fetch excerpts on demand to reduce API calls |
| Existing citations | Complete replacement | All original `[1][2]` citations removed, replaced with Basis system |
| Confidence levels | 3 levels | Low/Medium/High is sufficient granularity |
| Badge colors | Color-coded | 🔴 Low, 🟡 Medium, 🔵 High for instant visual feedback |

---

## Data Structures

### Core Types

```typescript
// Position reference for lazy-loading highlights
interface SourcePosition {
  url: string;
  title: string;
  domain: string;

  // Positions to fetch excerpt on demand
  startPos: number;
  endPos: number;

  // Cached after first fetch
  excerpt?: string;
  fetchedAt?: number;
  isLoading?: boolean;
}

// The "Basis" - a rich citation object
interface Basis {
  id: string;

  // What this basis supports
  claimText: string;
  claimRange: {
    start: number;
    end: number;
  };

  // Quality metadata
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;  // 1-3 sentences

  // Supporting sources (multiple allowed)
  sources: SourcePosition[];

  // State
  isExpanded?: boolean;
  isRemoved?: boolean;
}

// Citation mode state
interface CitationModeState {
  isEnabled: boolean;
  isProcessing: boolean;

  // Original response preserved
  originalResponse: string;
  originalCitations: ExtractedCitation[];

  // Processed response with basis annotations
  strippedResponse: string;  // Text with [1][2] removed
  bases: Basis[];

  // Processing progress
  progress: {
    phase: 'stripping' | 'analyzing' | 'researching' | 'complete';
    current: number;
    total: number;
  };

  error?: string;
}

// Extracted from original response
interface ExtractedCitation {
  index: number;        // The [1], [2] number
  url: string;
  title?: string;
  position: number;     // Character position in original text
}
```

### Confidence Scoring Criteria

```typescript
const CONFIDENCE_CRITERIA = {
  high: {
    color: '#3B82F6',  // Blue
    label: 'High',
    criteria: [
      'Primary source (official announcement, research paper)',
      'Direct quote or data from the source',
      'Multiple corroborating sources',
      'Recent and authoritative domain'
    ]
  },
  medium: {
    color: '#F59E0B',  // Yellow/Amber
    label: 'Medium',
    criteria: [
      'Secondary source (news article, review)',
      'Paraphrased information',
      'Single source without corroboration',
      'Reputable but not primary'
    ]
  },
  low: {
    color: '#EF4444',  // Red
    label: 'Low',
    criteria: [
      'Tangentially related source',
      'Outdated information',
      'Source doesn\'t directly support claim',
      'Unverified or user-generated content'
    ]
  }
};
```

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Citation Mode Flow                           │
└─────────────────────────────────────────────────────────────────┘

User clicks "Enhance Citations"
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Strip Original Citations                               │
│  ────────────────────────────────                                │
│  Input:  "iPhone 15 has 48MP camera[1] and USB-C[2]"            │
│  Output: "iPhone 15 has 48MP camera and USB-C"                   │
│          + extractedCitations: [{index: 1, url, pos}, ...]      │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: Identify Claims (LLM Call)                             │
│  ───────────────────────────────────                             │
│  Prompt: Analyze text, identify all factual claims               │
│  Output: [                                                       │
│    { text: "48MP camera", range: {start: 20, end: 30} },        │
│    { text: "USB-C", range: {start: 35, end: 40} },              │
│    { text: "A17 chip", range: {start: 55, end: 63} }  ← new!    │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Research & Build Bases (LLM + Tools)                   │
│  ─────────────────────────────────────────────                   │
│  For each claim:                                                 │
│    1. Check if existing sources support it                       │
│    2. search_web for additional/better sources                   │
│    3. Evaluate confidence based on source quality                │
│    4. Generate reasoning (1-3 sentences)                         │
│    5. Store source positions for lazy excerpt loading            │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: Render Enhanced Response                               │
│  ─────────────────────────────────                               │
│  Display stripped text with Basis badges at claim positions      │
│  User can click badges to see details + lazy-load excerpts       │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── components/
│   ├── citation-mode/
│   │   ├── CitationModeToggle.tsx    # Button to activate citation mode
│   │   ├── CitationModeProgress.tsx  # Progress indicator during processing
│   │   ├── BasisBadge.tsx            # The ⟨●⟩ clickable badge (colored)
│   │   ├── BasisPopover.tsx          # Expanded view with details
│   │   ├── SourceCard.tsx            # Individual source in popover
│   │   ├── SourceExcerpt.tsx         # Lazy-loaded highlight display
│   │   ├── ConfidenceIndicator.tsx   # Visual confidence display (●●●○○)
│   │   └── index.ts                  # Barrel export
│   │
│   ├── StreamingResponse.tsx         # Modified to support basis rendering
│   └── ResearchAgent.tsx             # Add citation mode toggle
│
├── hooks/
│   ├── useCitationMode.ts            # Main state management hook
│   └── useExcerptLoader.ts           # Lazy loading hook for excerpts
│
├── lib/
│   └── citation-mode/
│       ├── types.ts                  # TypeScript interfaces
│       ├── strip-citations.ts        # Remove [1][2] from text
│       ├── claim-extractor.ts        # LLM call to identify claims
│       ├── basis-builder.ts          # Build basis objects with research
│       ├── confidence-scorer.ts      # Evaluate source quality
│       ├── excerpt-fetcher.ts        # Lazy load highlights from sources
│       └── prompts.ts                # LLM prompt templates
│
└── styles/
    └── citation-mode.css             # Styles for basis badges/popovers
```

### State Management

```typescript
// Reducer actions
type CitationModeAction =
  | { type: 'ENABLE_CITATION_MODE' }
  | { type: 'DISABLE_CITATION_MODE' }
  | { type: 'START_PROCESSING'; payload: { originalResponse: string } }
  | { type: 'CITATIONS_STRIPPED'; payload: { stripped: string; extracted: ExtractedCitation[] } }
  | { type: 'CLAIMS_IDENTIFIED'; payload: { claims: Claim[] } }
  | { type: 'BASIS_CREATED'; payload: { basis: Basis } }
  | { type: 'PROCESSING_COMPLETE'; payload: { bases: Basis[] } }
  | { type: 'PROCESSING_ERROR'; payload: { error: string } }
  | { type: 'TOGGLE_BASIS_EXPANDED'; payload: { basisId: string } }
  | { type: 'REMOVE_BASIS'; payload: { basisId: string } }
  | { type: 'EXCERPT_LOADING'; payload: { basisId: string; sourceUrl: string } }
  | { type: 'EXCERPT_LOADED'; payload: { basisId: string; sourceUrl: string; excerpt: string } };
```

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Files to create:**
- [ ] `src/lib/citation-mode/types.ts` - All TypeScript interfaces
- [ ] `src/lib/citation-mode/strip-citations.ts` - Parse and remove `[1]` citations
- [ ] `src/hooks/useCitationMode.ts` - State management reducer

**Deliverable:** Can strip citations from response text and manage state

---

### Phase 2: Claim Analysis (LLM Integration)

**Files to create:**
- [ ] `src/lib/citation-mode/prompts.ts` - LLM prompt templates
- [ ] `src/lib/citation-mode/claim-extractor.ts` - Identify claims in text

**Deliverable:** Can identify factual claims that need citations

---

### Phase 3: Basis Building (Research & Scoring)

**Files to create:**
- [ ] `src/lib/citation-mode/basis-builder.ts` - Orchestrate basis creation
- [ ] `src/lib/citation-mode/confidence-scorer.ts` - Evaluate source quality

**Deliverable:** Can create Basis objects with confidence and reasoning

---

### Phase 4: UI Components (Display Layer)

**Files to create:**
- [ ] `src/components/citation-mode/BasisBadge.tsx`
- [ ] `src/components/citation-mode/BasisPopover.tsx`
- [ ] `src/components/citation-mode/ConfidenceIndicator.tsx`
- [ ] `src/components/citation-mode/SourceCard.tsx`
- [ ] `src/components/citation-mode/CitationModeToggle.tsx`
- [ ] `src/components/citation-mode/CitationModeProgress.tsx`
- [ ] `src/styles/citation-mode.css`

**Deliverable:** Full UI for viewing and interacting with bases

---

### Phase 5: Lazy Loading (Excerpt Fetching)

**Files to create:**
- [ ] `src/lib/citation-mode/excerpt-fetcher.ts`
- [ ] `src/hooks/useExcerptLoader.ts`
- [ ] `src/components/citation-mode/SourceExcerpt.tsx`

**Deliverable:** Click on source to load highlighted excerpt

---

### Phase 6: Integration (Putting It Together)

**Files to modify:**
- [ ] `src/components/StreamingResponse.tsx` - Render with basis support
- [ ] `src/components/ResearchAgent.tsx` - Add citation mode toggle
- [ ] `src/hooks/useResearchAgent.ts` - Integrate citation mode state

**Deliverable:** Fully functional citation mode in the app

---

## UI/UX Specifications

### Basis Badge

```
Default state:     ⟨●⟩  (colored by confidence)
Hover state:       ⟨●⟩  (slightly enlarged, tooltip with confidence)
Expanded state:    ⟨●⟩  (popover visible)

Colors:
- High:   #3B82F6 (blue)
- Medium: #F59E0B (amber)
- Low:    #EF4444 (red)

Size: 14px × 14px, inline with text
```

### Basis Popover

```
┌─────────────────────────────────────────────────┐
│  Claim: "48MP camera"                           │
│  ───────────────────────────────────            │
│                                                 │
│  Confidence  ●●●○○  HIGH                        │
│              🔵🔵🔵                              │
│                                                 │
│  WHY THIS SOURCE                                │
│  ┌───────────────────────────────────────┐      │
│  │ "Apple's official press release       │      │
│  │ directly confirms the camera specs,   │      │
│  │ making this a primary source."        │      │
│  └───────────────────────────────────────┘      │
│                                                 │
│  SOURCES (2)                                    │
│  ┌───────────────────────────────────────┐      │
│  │ 🌐 apple.com                          │      │
│  │ iPhone 15 Press Release               │      │
│  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │      │
│  │ [Click to load excerpt]         ⟳    │      │
│  └───────────────────────────────────────┘      │
│  ┌───────────────────────────────────────┐      │
│  │ 🌐 theverge.com                       │      │
│  │ iPhone 15 Review                      │      │
│  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │      │
│  │ "The 48-megapixel sensor captures..." │      │
│  └───────────────────────────────────────┘      │
│                                                 │
│  ─────────────────────────────────────          │
│  [🗑️ Remove]                                    │
└─────────────────────────────────────────────────┘

Width: 320px
Position: Below badge, centered
Animation: Fade in 150ms
```

### Progress Indicator

```
┌─────────────────────────────────────────────────┐
│  ✨ Enhancing Citations...                       │
│                                                 │
│  ████████████░░░░░░░░  Phase 2/4                │
│  Analyzing claims...                            │
│                                                 │
│  Found: 8 claims to verify                      │
└─────────────────────────────────────────────────┘
```

---

## LLM Prompts

### Claim Extraction Prompt

```markdown
You are a citation analyst. Given a response text, identify all factual claims that require citation support.

A factual claim is:
- A specific statistic, number, or measurement
- A statement about events, features, or capabilities
- A comparison or ranking
- A quote or paraphrase from a source
- Any assertion that could be verified with a source

DO NOT include:
- Subjective opinions
- General knowledge (e.g., "water is wet")
- Logical conclusions drawn from cited facts

For each claim, provide:
1. The exact text of the claim
2. The character positions (start, end) in the original text

Response text:
---
{response_text}
---

Return JSON:
{
  "claims": [
    {
      "text": "exact claim text",
      "start": 0,
      "end": 10
    }
  ]
}
```

### Basis Building Prompt

```markdown
You are building a citation basis for a factual claim. Analyze the available sources and create a comprehensive basis.

Claim to support: "{claim_text}"

Available sources from original research:
{sources_json}

Your task:
1. Evaluate how well each source supports this specific claim
2. Determine confidence level:
   - HIGH: Primary source, direct evidence, multiple corroborating sources
   - MEDIUM: Secondary source, indirect evidence, single source
   - LOW: Tangential relation, outdated, weak support
3. Write reasoning (1-3 sentences) explaining WHY these sources support the claim
4. For each relevant source, identify the approximate position of supporting text

If existing sources are insufficient, indicate that additional research is needed.

Return JSON:
{
  "confidence": "high" | "medium" | "low",
  "reasoning": "1-3 sentence explanation",
  "sources": [
    {
      "url": "...",
      "title": "...",
      "relevance": "high" | "medium" | "low",
      "startPos": 0,
      "endPos": 100
    }
  ],
  "needsMoreResearch": false,
  "suggestedQuery": null
}
```

### Excerpt Extraction Prompt

```markdown
Given webpage content and a specific claim, extract the exact excerpt that supports the claim.

Claim: "{claim_text}"

Content from {url}:
---
{content}
---

Find the most relevant passage (1-3 sentences) that directly supports the claim.
Return the exact text as it appears in the content.

Return JSON:
{
  "excerpt": "exact text from content",
  "startPos": 0,
  "endPos": 100
}
```

---

## API Considerations

### Rate Limiting

Citation mode makes multiple API calls:
1. Claim extraction (1 LLM call)
2. Basis building (1 LLM call per claim, or batched)
3. Excerpt fetching (1 extract_url call per source, on demand)

**Mitigations:**
- Batch claims in groups of 5 for basis building
- Lazy load excerpts only when user clicks
- Cache excerpts in state to avoid re-fetching
- Show estimated token cost before running

### Cost Estimation

```typescript
function estimateCitationModeCost(response: string, sources: Source[]): number {
  const avgClaimsPerKChar = 3;
  const estimatedClaims = Math.ceil(response.length / 1000) * avgClaimsPerKChar;

  const tokensPerClaim = 500;  // Basis building
  const tokensForExtraction = 300;  // Claim extraction

  const totalTokens = tokensForExtraction + (estimatedClaims * tokensPerClaim);

  // Using current model pricing
  return calculateCost(totalTokens);
}
```

### Error Handling

```typescript
interface CitationModeError {
  phase: 'stripping' | 'analyzing' | 'researching' | 'excerpt';
  message: string;
  recoverable: boolean;
  retryAction?: () => Promise<void>;
}

// Graceful degradation
// If basis building fails for a claim, show it without basis
// If excerpt loading fails, show "Unable to load excerpt" with retry button
```

---

## Future Enhancements

### User Text Selection & Editing (Phase 2)

After MVP, add ability for user to:
1. Select text in the response
2. Add a comment/question
3. Trigger targeted research
4. See diff of proposed changes
5. Accept/reject edits

### Citation Quality Report

Aggregate view showing:
- Overall confidence distribution
- Weak citations that need attention
- Uncited claims detected
- Suggested improvements

### Export Options

- Export response with academic-style citations
- Generate bibliography
- Copy with inline references

---

## Success Metrics

1. **Accuracy**: % of bases with HIGH confidence that users don't remove
2. **Usefulness**: % of users who click to expand basis details
3. **Performance**: Time to complete citation mode processing
4. **Engagement**: % of responses where users activate citation mode
