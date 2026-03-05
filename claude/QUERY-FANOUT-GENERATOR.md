---
name: query-fanout-generator
description: >
  SEO research skill that generates a query fan-out for a given keyword. Use this skill
  whenever the user wants to research a topic using query fan-out, generate AI-mode style
  subqueries for SEO, run parallel Gemini searches on a keyword, or create a condensed
  research brief from multiple AI search perspectives. Trigger this skill when the user
  provides a keyword or topic and wants a comprehensive AI-search-style breakdown,
  even if they don't use the words "query fanout" explicitly.
---

# Query Fan-Out Generator

A three-stage SEO research pipeline that expands a single keyword into a comprehensive
research brief using Gemini Flash as parallel research agents.

---

## What This Skill Does

1. **Generate 3 search queries** from one keyword (using search psychology principles)
2. **Dispatch** those queries to 3 parallel Gemini Flash instances via the Gemini API
3. **Consolidate** all returned `webSearchQueries` into one deduplicated list
4. **Produce** a structured information document from the aggregated AI responses

---

## Prerequisites

- A **Gemini API key** (Google AI Studio). Ask the user for this if not provided.
- The user provides a **single keyword or topic string** (any language).

---

## Stage 1 — Generate 3 Search Queries

Use the prompt below to generate exactly **3** natural-language queries from the keyword.
The queries span 3 research phases:

| Phase | Intent |
|-------|--------|
| 1 | Discovery / What do I need? |
| 2 | Evaluation / What is the best option? |
| 3 | Specifics / What exactly is covered/included? |

### Prompt 1 — Query Generator (3-phase version)

````
### Role
You are a Senior Search Psychology Researcher and Prompt Linguist. Your expertise lies
in analyzing "Conversational Search Behavior"—the specific way humans phrase queries
when interacting with AI agents compared to traditional keyword search engines.

### Context (Input)
You will be provided with a single keyword or topic string. Your task is to simulate a
user's research journey and generate **three (3) distinct natural language queries**.

### Knowledge Base: Human-AI Search Behavior
1. AI prompts average 15–25 words. Users describe scenarios, not keywords.
2. Queries often follow: [Context/Persona] + [Specific Constraint] + [Question].
3. Users treat AIs as consultants — they ask for comparisons and recommendations.
4. Use complete sentences, filler words, and natural connectors.

### Three Search Phases
- Phase 1 (Discovery/Need): Basics, what is required, just starting out.
- Phase 2 (Evaluation/Best Option): Comparisons, recommendations.
- Phase 3 (Specifics/Coverage): Technical details, what's included/excluded.

### Instructions
Generate exactly one (1) natural query per phase.
Language: same language as the input keyword.
Tone: Conversational, inquisitive, specific.

### Output Format
Valid JSON only. No commentary.

{
  "topic_1": "Natural query for Phase 1",
  "topic_2": "Natural query for Phase 2",
  "topic_3": "Natural query for Phase 3"
}

### Keyword
{{KEYWORD}}
````

Run this prompt yourself (as Claude) and output the JSON. Parse the 3 queries.

---

## Stage 2 — Dispatch to 3 Gemini Flash Instances

For each of the 3 queries, make an API call to Gemini with Google Search grounding enabled.

### API Call (repeat for each query)

**Model to use:**
Always attempt `gemini-2.5-flash-lite-latest` first — this alias automatically tracks the newest Flash-Lite release.
If that returns a 404 or model-not-found error, fall back to the current stable: `gemini-2.5-flash-lite`.

**Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-latest:generateContent?key={API_KEY}
```
*(swap `gemini-2.5-flash-lite-latest` for `gemini-2.5-flash-lite` on fallback)*

**Request body:**
```json
{
  "contents": [
    {
      "parts": [{ "text": "{{QUERY}}" }]
    }
  ],
  "tools": [{ "google_search": {} }],
  "generationConfig": {
    "temperature": 0.7
  }
}
```

**What to collect from the response:**
- `candidates[0].content.parts[*].text` → the AI-generated answer text
- `candidates[0].groundingMetadata.webSearchQueries` → the actual search queries Gemini used

Store both for each of the 3 calls.

> **Note:** If the user's environment doesn't support direct HTTP calls (e.g., Claude.ai),
> generate the curl commands and ask the user to run them, or use the bash tool to execute
> them if available. See the **Execution Notes** section below.

---

## Stage 3 — Consolidate webSearchQueries

Collect all `webSearchQueries` arrays from the 3 API responses into one raw text block,
then apply the following cleaning prompt:

### Prompt 2 — Query Consolidator

````
### Role
Data Cleaning and Formatting Specialist

### Context (Input)
Raw search queries from multiple AI responses, mixed delimiters (commas, newlines).
Content may be in any language.

### Task
1. Split on both commas and newlines.
2. Trim whitespace from each item. Remove empty strings or punctuation-only items.
3. Deduplicate case-insensitively; preserve first-occurrence capitalization.
4. Output as a hyphen-bullet list.

### Constraints
- No intro/outro text.
- Do not alter wording or spelling.

### Output Format
- [Unique Query 1]
- [Unique Query 2]
...

### Input
{{ALL_WEB_SEARCH_QUERIES}}
````

The resulting bullet list is the final **`webSearchQueries`** output for the user.

---

## Stage 4 — Produce the Information Document

Combine all AI answer texts from Stage 2 into one block and apply this prompt:

### Prompt 3 — Information Condenser

````
You are an **Information Condenser**. Take long, messy text and turn it into a short,
clear structured document.

### Task
1. Remove all links, citations, brackets, chat filler (intros, outros, "Hey guys").
2. Delete sentences that add no new information.
3. Identify every unique fact/idea. Rewrite in simple language (8th-grade level).
4. Group related facts under simple headers.
5. Use bullet points for almost everything. Short phrases over full sentences.

### Constraints
- Language: same language as the source content
- Keep ALL facts — nothing from the input may be lost.
- Zero links or bracketed sources.
- Zero fluff or filler text.
- Output must be easy to scan.

### Output Format
Clean structured Markdown with headers and bullet points.

### Input Text
{{ALL_AI_ANSWERS}}
````

This produces the final **Research Brief** document.

---

## Final Output to User

Present results in this order:

1. **The 3 generated search queries** (from Stage 1)
2. **Consolidated `webSearchQueries`** bullet list (from Stage 3)
3. **Research Brief** document (from Stage 4)

If creating a file, save as `research-brief-{{KEYWORD}}.md`.

---

## Execution Notes

### If bash tool is available (Claude Code / computer use)
Use `curl` to call the Gemini API directly. Example:

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-latest:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "YOUR QUERY HERE"}]}],
    "tools": [{"google_search": {}}]
  }'
```

Run all 3 in parallel using `&` and `wait` for efficiency.

### If no bash tool (Claude.ai chat)
1. Tell the user you'll generate the curl commands for all 3 queries.
2. Ask them to run each and paste back the JSON responses.
3. Proceed to Stage 3 and 4 once responses are in.

Alternatively, offer to simulate the research using your own web search tool if available.

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing API key | Ask the user before proceeding |
| API rate limit (429) | Retry after 5s; inform user if persistent |
| Empty `webSearchQueries` | Note in output; still condense answer text |
| Non-JSON response from Stage 1 | Re-run Stage 1 once |
