---
name: serp-outline-research
description: >
  Use this skill whenever the user wants to research a keyword or topic by scraping Google SERPs
  to gather data for content creation or outline generation. Triggers when the user asks to
  "research a keyword", "scrape the SERP", "check what's ranking", "gather competitor outlines",
  "analyze top results", "prepare for an outline", or anything involving collecting PAA questions,
  related searches, or competitor article structures. Always use this skill before generating
  any content outline — it is the required research step that feeds the outline generator.
---

# SERP Outline Research Skill

A structured workflow for scraping and analyzing Google SERPs to extract data that will power
an outline generator. This skill is specifically tuned for the German insurance comparison market.

---

## What This Skill Collects

1. **PAA Questions** — "People Also Ask" questions from the SERP
2. **Related Searches** — The related search terms at the bottom of the SERP
3. **Competitor Outlines** — H1/H2/H3 heading structure from the top 3 *qualifying* articles

---

## Step-by-Step Workflow

### Step 1 — Search the SERP

Use `web_search` with the target keyword. Inspect the top 10 results and note:
- All URLs and their domains
- PAA questions (found via search snippets or a secondary search like `"People also ask" + keyword`)
- Related searches (run a second search and extract the bottom suggestions, or infer from Google's autocomplete patterns)

### Step 2 — Filter the Results (Critical)

Before fetching any article, apply the filters below **in order**. You are looking for the first
**3 qualifying URLs** — not necessarily positions 1, 2, and 3.

#### 2a — Hard Exclusions (always skip these)

| Rule | Examples |
|------|---------|
| **Wikipedia** | wikipedia.org (any language) |
| **Insurance Providers / Carriers** | See full blocklist below |
| **Product / Quote Pages** | Any URL path containing `/tarif`, `/angebot`, `/rechner`, `/antrag`, `/produkt` |

#### 2b — Known Insurance Provider Blocklist

Skip any result from these domains regardless of how high they rank:

- axa.de / axa.com
- arag.de / arag.com
- allianz.de / allianz.com
- vhv.de
- huk.de / huk-coburg.de
- ergo.de
- generali.de
- zurich.de / zurich.com
- signal-iduna.de
- debeka.de
- provinzial.de
- gothaer.de
- barmenia.de
- nurnberger.de
- dkv.com
- bdv.de
- devk.de
- r-v.de
- wgv.de
- continentale.de

> ⚠️ This list is not exhaustive. Apply the **content quality test** in Step 2c for any domain
> that looks like a carrier, broker, or insurer — even if not listed here.

#### 2c — Content Quality Test (for all remaining URLs)

For any URL that passes the hard exclusions, ask yourself:

> *"Would this page rank if it weren't for the brand's name recognition or domain authority?"*

Check for these **red flags** that indicate the page ranks on DA/brand, not content:

- The article is thin (likely < 500 words of real editorial content)
- It's primarily a landing page, product page, or lead-gen form
- The "article" is really just a short intro paragraph followed by a quote/comparison widget
- There is no real structure (no H2s, no depth, no explanatory sections)
- The brand is a well-known insurance carrier or large financial portal where domain authority
  likely overwhelms content quality signals

If **2 or more red flags apply**, skip this URL and move to the next result.

#### 2d — Preferred Competitor Domains (prioritize these)

If these domains appear in the top 10, they are almost always qualified. Treat them as trusted
comparison/content sites and include them first when selecting your 3 qualifying articles:

- finanzchef24.de
- finanzchecks.de
- insify.de
- check24.de
- versicherung-rechner.de

---

### Step 3 — Fetch and Extract Outlines

For each of the 3 qualifying URLs, use `web_fetch` to retrieve the page content. Then extract:

- The **H1** (page title / main heading)
- All **H2s** (main sections)
- All **H3s** (subsections under each H2, if present)

Present this as a clean outline tree. Label each source clearly (Source 1, Source 2, Source 3)
along with the domain and URL.

**If a page fails to load or is paywalled**, note it and move to the next qualifying URL.

---

### Step 4 — Collect PAA Questions

Work through these approaches in order, stopping once you have at least 5 questions:

**Primary — Direct SERP extraction:**
- Run a `web_search` for the keyword and look for PAA boxes surfaced in the snippets
- Try a secondary search phrased as a question, e.g. `Was ist [keyword]?` or `[keyword] Fragen` — Google often surfaces more PAA boxes for question-style queries

**Secondary — FAQ schema and question headings from fetched articles:**
If the direct search doesn't yield enough PAA questions, scan the 3 competitor articles you already fetched in Step 3 for:
- Any `<section>` or `<div>` marked as FAQ (often visible as "Häufige Fragen", "FAQ", "Häufig gestellte Fragen")
- H2s or H3s phrased as questions (starting with Was, Wie, Wann, Warum, Welche, Kann, Muss, Gibt es, etc.)
- Accordion or toggle elements that typically contain Q&A content
- Any `FAQPage` structured data patterns in the page source

Extract each question verbatim if found. These are real questions the articles are already answering, which means Google likely shows them (or similar formulations) as PAA.

**Tertiary — Synthesis fallback:**
If you still have fewer than 5 questions after the above, synthesize the most likely PAA questions based on:
- Recurring topics and subtopics across the 3 competitor outlines
- Gaps or pain points that multiple articles seem to address
- Common comparison angles (price, coverage scope, exclusions, claims process)

When using synthesized questions, mark them clearly in the output: *(synthesized from content analysis)* — so the outline generator knows these are inferred rather than directly observed on the SERP.

Collect at least **5 PAA questions**, ideally 8–10. Present them as a clean numbered list.

---

### Step 5 — Collect Related Searches

Run a secondary `web_search` for the keyword and look for related/suggested search terms.
Alternatively, check what keyword variations appear repeatedly across the 3 competitor articles
— these signal what Google associates with the topic.

Collect at least **5 related searches**, ideally 8–10. Present them as a clean numbered list.

---

### Step 6 — Extract SEO Entities

Using the full content of the 3 fetched competitor articles, extract all meaningful SEO entities.
Every entity must pass through the three filters below **before** it is included in the output.

#### Filter 1 — The "Ad Copy" Filter → DELETE

Completely discard anything transactional or promotional. Do not include:
- CTAs and UI copy: "Jetzt vergleichen," "Kostenlos anfragen," "Angebot erhalten," "Zum Anbieter"
- Pricing signals: specific prices, discount claims, "günstig," "ab X €/Monat," promo codes
- Lead-gen language: "Jetzt berechnen," "Anmelden," "Gratis testen"
- Navigation/boilerplate text: breadcrumbs, cookie banners, footer links, header menus

If it reads like it belongs on a button or a banner — delete it.

#### Filter 2 — The "Commercial" Filter → SEGREGATE into [Brands & Products]

Identify specific named companies, insurance brands, and specific product/tariff names.

For this skill, apply an **extra-strict version** of this filter:
- All insurance carriers (Allianz, AXA, ARAG, VHV, HUK, Ergo, etc.) → [Brands & Products]
- All named tariff/product lines (e.g., "Comfort-Schutz," "Premium-Tarif XYZ") → [Brands & Products]
- All comparison portals and fintech brands (Check24, finanzchef24, etc.) → [Brands & Products]
- General legal/regulatory bodies that are named entities (e.g., "BaFin," "GDV") → [Brands & Products]

**Do not use anything from [Brands & Products] in the outline or content** — this list is
extracted purely for transparency/auditing. The outline generator should ignore it entirely.

#### Filter 3 — The "Informational" Filter → KEEP into [Relevant Concepts]

Keep distinct concepts, topics, processes, legal terms, coverage types, risk categories,
professions, and general informational nouns. These are the entities that signal topical
authority to Google and should inform the outline structure.

Examples of what to keep:
- Insurance concepts: "Deckungssumme," "Selbstbeteiligung," "Haftpflichtschaden," "Obliegenheiten"
- Legal/regulatory concepts: "Pflichtversicherung," "AVB," "Versicherungspflicht"
- Risk/coverage types: "Personenschäden," "Sachschäden," "Vermögensschäden," "Betriebsunterbrechung"
- Processes: "Schadensregulierung," "Kündigung," "Versicherungsvergleich," "Antragstellung"
- Professions / business types relevant to the article topic
- General descriptive concepts: "Leistungsumfang," "Ausschlüsse," "Nachhaftung"

Aim for **20–40 relevant concepts** per research session. Deduplicate across the 3 sources —
if the same concept appears in all 3 articles, that is a strong signal it belongs in the outline.
Mark high-frequency entities (appearing in 2+ sources) with a star [★] so the outline generator
knows to prioritize them.

---

## Output Format

Structure your final output exactly like this so it can be directly fed into an outline generator:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERP RESEARCH REPORT — [KEYWORD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PAA Questions
1. ...
2. ...
3. ...
(etc.)

## Related Searches
1. ...
2. ...
3. ...
(etc.)

## Competitor Outlines

### Source 1 — [domain] | [full URL]
[Ranking position and qualification note, e.g. "Ranked #1, qualified: comparison site"]
H1: ...
  H2: ...
    H3: ...
    H3: ...
  H2: ...
    H3: ...

### Source 2 — [domain] | [full URL]
[Ranking position and qualification note]
H1: ...
  H2: ...
  ...

### Source 3 — [domain] | [full URL]
[Ranking position and qualification note]
H1: ...
  H2: ...
  ...

## SEO Entities

### Relevant Concepts
[★ = appears in 2+ sources]
- ★ Deckungssumme
- ★ Selbstbeteiligung
- Nachhaftung
- ...
(20–40 entries)

### Brands & Products [excluded from outline use]
- Allianz (carrier)
- Check24 (comparison portal)
- Comfort-Schutz Plus (tariff name)
- ...

## Skipped Results
- [URL] — Reason: [Insurance provider / Wikipedia / Failed content quality test / Page not loading]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Important Guardrails

- **Never use fewer than 3 sources** unless the entire top 10 fails qualification. If fewer than 3
  qualify in the top 10, go to positions 11–20 before giving up.
- **Always log skipped URLs** in the "Skipped Results" section with a clear reason. This provides
  transparency and helps calibrate the filter over time.
- **Don't be too aggressive with the content quality filter.** A large portal like check24.de or
  finanzchef24.de may have thin-looking intro sections but rich content below the fold — fetch
  the full page before judging.
- **Be strict with pure insurance carriers.** A page on allianz.de about "Betriebshaftpflicht"
  almost certainly ranks because of Allianz's domain, not because it is the best informational
  article on the topic.
- **Language**: This skill is designed for German-language SERPs. Keep all extracted content in
  German. Labels and structure in this output format can remain in English for readability.
