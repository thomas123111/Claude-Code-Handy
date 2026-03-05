# SEO Internal Linking Knowledge Base

This is the canonical reference for all decisions made by the SEO Internal Linker skill. All linking choices must be grounded in the principles below.

---

## Table of Contents

1. [Link Equity and Topical Authority](#1-link-equity-and-topical-authority)
2. [Link Density and Impact](#2-link-density-and-impact)
3. [Site Architecture and Click Depth](#3-site-architecture-and-click-depth)
4. [Hub Pages and URL Hierarchies](#4-hub-pages-and-url-hierarchies)
5. [Topical Mapping and Link Routing](#5-topical-mapping-and-link-routing)
6. [Connecting Supporting Articles to Core Services](#6-connecting-supporting-articles-to-core-services)
7. [Anchor Text Best Practices](#7-anchor-text-best-practices)
8. [Data-Driven Anchor Selection](#8-data-driven-anchor-selection)
9. [Contextual Language Optimization](#9-contextual-language-optimization)
10. [Technical Link Health](#10-technical-link-health)
11. [Topical Flow Scoring](#11-topical-flow-scoring)
12. [Anchor Text Intent Mix](#12-anchor-text-intent-mix)
13. [Semantic Content Network Principles](#13-semantic-content-network-principles)
14. [Strategic Placement and Positional Weight](#14-strategic-placement-and-positional-weight)
15. [Link Weight and Heading Hierarchy](#15-link-weight-and-heading-hierarchy)

---

## 1. Link Equity and Topical Authority

- **Topical Authority** = a search engine's assessment of a website's authority within a specific knowledge area, based on consistency of topic coverage and reinforcing signals.
- **PageRank** remains central to shaping topical authority. It measures page importance based on link volume and quality.
- **Link Equity Distribution:** The homepage holds the most equity. It divides that equity among all pages it links to. If a homepage links to three internal pages, each gets ~33% of the power.
- **Direct equity carefully.** Do not waste link equity on irrelevant pages. Prioritize pages that generate leads or sales.
- **Internal links distribute authority, relevance, and intent signals** across a site. Backlinks bring authority *in*; internal links disperse it.
- Pages with more internal links are deemed more important by search engines.
- Link topically relevant pages together to strengthen authority.
- Do NOT link to a destination page from many topically irrelevant pages — this dilutes authority.

---

## 2. Link Density and Impact

- **Historical approach** (outdated): 30–50 internal links per page.
- **Evolving theory (use this):** Each link contributes equally to link equity. Too many links dilute the equity passed to each destination.
- **Maximum 3 internal links per article.** Use fewer, more impactful links.
- A limited number of links (e.g., 2) in a subsection increases the PageRank and relevance weight passed per link.

---

## 3. Site Architecture and Click Depth

- **Click depth** = number of clicks required to reach a page from the homepage.
- **Place primary service pages** exactly 1 click from the homepage.
- **Place supporting articles** exactly 2 clicks from the homepage.
- Pages 4+ clicks away are deemed unimportant by search engines and rarely rank.
- **Two-Click Rule:** All keyword variations and subpages should be accessible within 2 clicks of the homepage.
- Use tools like Sitebulb or Screaming Frog to audit click depth visually.

---

## 4. Hub Pages and URL Hierarchies

- The homepage must link directly to core service pages.
- Use a high-level hub page (e.g., "Uses" or "Features") to categorize topics. Each category links to specific sub-variations.
- **Authority flow:** Homepage → Hub → Category page → Individual subpages.
- Build backlinks to a specific subfolder to strengthen authority of every page nested within it.
- **Hub consolidation:** Instead of 30 individual links, create one hub page with 30 anchors. This directs link equity to the hub, which cascades to subpages.
- Benefits: improved topical authority, better analytics, enhanced UX, clearer site structure for crawlers.

---

## 5. Topical Mapping and Link Routing

- **Root, Seed, Node hierarchy:** Every page should link at least once to its root, once to its seed, and once to its node.
- **Use contextual internal links** within the body content, not just navigation bars, footers, or sidebars.
- Internal links are the explicit connections that form a semantic content network. Every sentence, paragraph, heading, and page should be related.
- The flow of PageRank and authority is strategically directed toward the root or the most important, harder-to-rank sections.

---

## 6. Connecting Supporting Articles to Core Services

- The homepage links to service pages; service pages are supported by relevant blog articles.
- **Create content clusters:** A group of blog posts around a seed service keyword builds topical authority.
  - Example: For "Family Law Services," create supporting articles like "Navigating child arrangements during school holidays."
- **Every supporting article should contain an internal link back to the main service page.** This transfers authority from supporting content to core pages.
- **Double supporting articles:** A single article can link to multiple related services if the content has natural overlap.
  - Example: "Local SEO vs. Global SEO" should link to both the "Local SEO" service page and the "International SEO" service page.

---

## 7. Anchor Text Best Practices

- Anchor text is a critical signal establishing a "contextual connection" — it tells search engines what the linked page is about.
- **All anchor text must be descriptive and specific.**
- **Specificity standard:** A human must be able to identify the destination page just from reading the anchor text, without additional context. If they can't, it's not specific enough.
- **Relevance protocol:** Before using an internal link, justify its relevance by incorporating the anchor terms into the surrounding content 1–5 times.
- **Target matching:** Anchor text should match (or closely reflect) the target page's title or H1.
- **Source heading matching:** The anchor phrase should ideally also appear in the source page's heading for a strong, consistent signal.
- **Avoid repeating the same anchor text more than 3 times across the site.**
- **Diversify anchors:** Using identical anchor text for every link to a page limits its ability to rank for secondary keyword variations. Use LSI keywords and GSC query variations.
  - Example: Instead of always using "benefits of spinal adjustments for athletes," vary with "athletic spinal adjustments" or "chiropractor and spinal adjustments."
- **Never use generic anchor text** like "click here," "read more," or "page 2" when more relevant options exist.
- **Grammar overrides exact match.** Adjust phrasing (pluralization, tenses, prepositions) so the sentence flows naturally. Never force an awkward title into a sentence.

### Anchor Formatting Options
- To increase weight of an anchor and help search engines recognize a phrase, enclose it in quotation marks.
- For longer anchor texts, a rhetorical question format can be used.
- The text surrounding an anchor ("annotation text") must provide additional context: related words, studies, evidence, or specific measurements.

---

## 8. Data-Driven Anchor Selection

- **Google Search Console method:** Filter GSC by the target URL to see all queries driving impressions. Find queries with high impressions but low rankings. Use those specific queries as anchor text when linking to that page.
- **AI-generation method:** If no GSC data is available, generate anchor text variations based on the page title using an AI prompt.

---

## 9. Contextual Language Optimization

- The surrounding contextual language influences topical authority, even when anchor text is restricted to a brand name.
- **Vary the placement of keywords and locations** to strengthen multiple search terms.
  - Example: "Bob's Plumbing is a Denver and Austin-based company" vs. "Bob's Plumbing is a plumbing company based out of Denver and Austin."
- **Build service-level authority** by mentioning overarching services in descriptions — this helps rank for specific sub-services.
  - Example: Mentioning "drain cleaning services" provides topical relevance needed to rank for "emergency drain cleaning."

---

## 10. Technical Link Health

- Links must use `dofollow` status to pass authority. Tags like `rel="nofollow"` or `rel="sponsored"` prevent authority transfer.
- Both source and destination URLs must be crawlable. Pages disallowed in `robots.txt` do not pass authority.
- **Prioritize main content placement.** Content in the main body is weighted more heavily than footer or sidebar for determining a page's topic.
- **Anchor text and image alt-text** provide relevancy signals to search engines for the destination page.
- Links from topically similar source pages reinforce the authority of the destination page.

---

## 11. Topical Flow Scoring

- **Formula:** (Links from same topical family / Total internal links) × 100
- **Benchmark:**
  - ≥ 75% = Strong topical authority structure ✓
  - ≤ 74% = Dilution; restructuring needed ✗
- Example: If an embroidery guide has 100 total links and 60 come from "craft" category pages → score = 60% → needs improvement.

---

## 12. Anchor Text Intent Mix

Classify all anchor texts pointing to a page into:
- **Topically Relevant** — High alignment with destination subject.
- **Topically Irrelevant** — No reinforcement of the topic.
- **Generic** — "click here," "page 2," etc.

- High link volume from relevant pages is still ineffective if anchor text is generic.
- **Avoid dilution of intent:** A wide spread of different intents (informational + transactional) pointing at the same page confuses search engines about the page's purpose.
- **Maintain high topical relevance and a low intent mix.** Keep consistency in the type of action or information signaled.
  - Example: Mixing "learn about embroidery" (informational) with "buy embroidery tools" (transactional) for the same URL = sub-optimal.

---

## 13. Semantic Content Network Principles

- A semantic content network is defined by the **interconnectedness** of all its elements. Internal links are the explicit manifestation of these connections.
- The alignment of information between linked pages defines network quality — not just the presence of links.
- **PageRank flows strategically** toward the root of the network (most important, harder-to-rank pages) to build and consolidate topical authority.
- **Outer topical map sections** (broad, informational content) primarily link to the core section (monetized, transactional). This creates a contextual funnel.
- Internal linking is not an afterthought — it is engineered during content creation, based on the topical map.
- A change to anchor text has a cascading effect: it impacts the H1, which alters the contextual vector, which can affect other anchors or titles.

---

## 14. Strategic Placement and Positional Weight

- **Main content > Supplementary > Boilerplate.** Links in main body carry the most weight.
- **The first link in the main content** carries the most weight for relevance and PageRank. Place the highest-priority Root link as early as possible.
- Linking from the **top part of an article** is reserved for the highest-priority targets only.
- As you move deeper into the content hierarchy, more links appear with less distance between them.
- **Links to less important pages** can be placed at the bottom of an article or omitted entirely.
- Use lower heading levels (H3, H4) to decrease the prominence of less important links, allowing more PageRank to flow to higher-priority ones.

---

## 15. Link Weight and Heading Hierarchy

- A link under an **H2** carries more weight than one under an **H3, H4, or H5**.
- Use lower heading levels strategically to de-prioritize links without removing them.
- **Reciprocal links** are not always necessary. Focus on calculating PageRank flow, not achieving balance.
- **Multiple links to the same page from the same article:**
  - The first link passes both relevance AND PageRank.
  - Subsequent links to the same URL from the same page pass relevance signals only — no additional PageRank.
  - Therefore, a root article can be linked to multiple times with different anchors to reinforce importance, but PageRank transfer only happens once.
- Use **jump links** (hash identifiers) to link to specific subsections of the same URL when appropriate.
