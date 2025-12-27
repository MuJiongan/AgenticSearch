/**
 * LLM Prompts for Citation Mode
 *
 * These prompts are used for:
 * 1. Extracting factual claims from the response
 * 2. Building basis objects with confidence and reasoning
 * 3. Finding relevant excerpts from sources
 */

/**
 * System prompt for claim extraction
 */
export const CLAIM_EXTRACTION_SYSTEM_PROMPT = `You are a citation analyst. Your task is to identify all factual claims in a text that require citation support.

A factual claim is:
- A specific statistic, number, measurement, or date
- A statement about events, features, capabilities, or specifications
- A comparison or ranking between items
- A quote or paraphrase attributed to a source
- Any assertion that could be verified with external evidence

DO NOT flag as claims:
- Subjective opinions or preferences
- General knowledge that is universally accepted
- Logical conclusions drawn directly from already-cited facts
- Transition phrases or structural text
- Hedged statements that explicitly express uncertainty

For each claim, provide:
1. The exact text of the claim (verbatim from the source)
2. The character positions (start, end) in the original text

Be precise with positions - they must exactly match where the claim appears.`

/**
 * User prompt template for claim extraction
 */
export function getClaimExtractionPrompt(responseText: string): string {
  return `Analyze the following response text and identify all factual claims that need citation support.

Response text:
---
${responseText}
---

Return a JSON object with the following structure:
{
  "claims": [
    {
      "id": "claim_1",
      "text": "exact claim text from the response",
      "start": 0,
      "end": 50
    }
  ]
}

Important:
- The "text" field must be the EXACT text as it appears in the response
- The "start" and "end" positions must be accurate character indices
- Include ALL factual claims, even if they seem minor
- Each claim should be a complete, meaningful unit (not fragments)

Return ONLY the JSON object, no additional text.`
}

/**
 * System prompt for basis building
 */
export const BASIS_BUILDING_SYSTEM_PROMPT = `You are a citation quality analyst. Your task is to evaluate how well available sources support a specific factual claim and build a "basis" - a rich citation object.

Confidence Levels:
- HIGH: Primary source (official announcement, research paper, documentation), direct quote/data, or multiple corroborating sources
- MEDIUM: Secondary source (news article, review), paraphrased information, single source without corroboration
- LOW: Tangentially related source, outdated information, source doesn't directly support claim, or unverified content

Your reasoning should be 1-3 sentences explaining:
1. Why the source(s) support (or don't support) this claim
2. The nature of the evidence (direct quote, indirect reference, etc.)
3. Any caveats about the source quality`

/**
 * User prompt template for basis building
 */
export function getBasisBuildingPrompt(
  claimText: string,
  availableSources: Array<{ url: string; title: string; excerpt?: string }>
): string {
  const sourcesJson = JSON.stringify(availableSources, null, 2)

  return `Build a citation basis for the following claim.

Claim: "${claimText}"

Available sources from the research:
${sourcesJson}

Evaluate how well these sources support the claim and create a basis object.

Return a JSON object with the following structure:
{
  "confidence": "high" | "medium" | "low",
  "reasoning": "1-3 sentence explanation of why these sources support (or don't support) the claim",
  "sources": [
    {
      "url": "source URL",
      "title": "source title",
      "relevance": "high" | "medium" | "low",
      "startText": "beginning of the relevant excerpt (first ~50 chars)",
      "endText": "end of the relevant excerpt (last ~50 chars)"
    }
  ],
  "needsMoreResearch": false,
  "suggestedQuery": null
}

Guidelines:
- Only include sources that actually support this specific claim
- Set needsMoreResearch to true if existing sources are insufficient
- Provide suggestedQuery if more research would help
- Order sources by relevance (most relevant first)
- startText and endText help locate the relevant passage for later excerpt extraction

Return ONLY the JSON object, no additional text.`
}

/**
 * System prompt for excerpt extraction
 */
export const EXCERPT_EXTRACTION_SYSTEM_PROMPT = `You are a document analyst. Your task is to find the exact passage in a source document that supports a specific claim.

The excerpt should:
- Be 1-4 sentences that directly support the claim
- Be quoted exactly as it appears in the source
- Include enough context to be meaningful
- Be the most relevant passage from the document`

/**
 * User prompt template for excerpt extraction
 */
export function getExcerptExtractionPrompt(
  claimText: string,
  sourceUrl: string,
  sourceContent: string
): string {
  // Truncate content if too long
  const maxContentLength = 15000
  const truncatedContent = sourceContent.length > maxContentLength
    ? sourceContent.slice(0, maxContentLength) + '\n\n[Content truncated...]'
    : sourceContent

  return `Find the most relevant excerpt from this source that supports the claim.

Claim: "${claimText}"

Source URL: ${sourceUrl}

Source content:
---
${truncatedContent}
---

Return a JSON object with the following structure:
{
  "excerpt": "exact text from the source that supports the claim",
  "confidence": "high" | "medium" | "low",
  "note": "optional note about the excerpt quality or relevance"
}

Guidelines:
- The excerpt must be EXACT text from the source (copy-paste, not paraphrased)
- Choose the 1-4 most relevant sentences
- If no relevant excerpt exists, return an empty excerpt with low confidence
- Include the "note" field only if there's something important to mention

Return ONLY the JSON object, no additional text.`
}

/**
 * System prompt for batch claim analysis
 * More efficient than individual claim processing
 */
export const BATCH_ANALYSIS_SYSTEM_PROMPT = `You are a citation quality analyst. You will receive multiple claims and available sources, and must evaluate each claim's citation support.

For each claim, determine:
1. Which sources support it and how strongly
2. The confidence level (high/medium/low)
3. A brief reasoning explanation`

/**
 * User prompt for batch claim analysis
 */
export function getBatchAnalysisPrompt(
  claims: Array<{ id: string; text: string }>,
  sources: Array<{ url: string; title: string; excerpt?: string }>
): string {
  const claimsJson = JSON.stringify(claims, null, 2)
  const sourcesJson = JSON.stringify(sources, null, 2)

  return `Analyze how well the available sources support each of the following claims.

Claims to analyze:
${claimsJson}

Available sources:
${sourcesJson}

For each claim, provide a basis analysis.

Return a JSON object with the following structure:
{
  "analyses": [
    {
      "claimId": "claim_1",
      "confidence": "high" | "medium" | "low",
      "reasoning": "1-3 sentence explanation",
      "supportingSources": [
        {
          "url": "source URL",
          "relevance": "high" | "medium" | "low",
          "startText": "beginning of relevant passage",
          "endText": "end of relevant passage"
        }
      ]
    }
  ]
}

Guidelines:
- Analyze each claim independently
- A claim may have multiple supporting sources
- Some claims may have no good support (low confidence, empty supportingSources)
- Be honest about confidence - don't inflate scores

Return ONLY the JSON object, no additional text.`
}
