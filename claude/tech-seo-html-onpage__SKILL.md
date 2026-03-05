---
name: tech-seo-html-onpage
description: >
  Apply this skill whenever a website is being built, reviewed, or optimized — even if the user doesn't explicitly say "SEO." Use it when generating or auditing HTML pages, writing or reviewing title tags, meta descriptions, heading structures (H1–H6), schema markup, structured data, JSON-LD, Open Graph tags, or HTML code quality. Also trigger when the user asks about rich results, freshness signals, date/year metadata, entity validation, Knowledge Graph, SameAs markup, or wants to check if their page is "Google-ready." Trigger even for partial tasks like "write a title tag," "add schema to my product page," or "fix my heading structure." This skill should be consulted any time on-page HTML or technical SEO best practices are relevant.
---

# Tech SEO: HTML & On-Page Best Practices

This skill covers the full spectrum of on-page and technical SEO for HTML pages. Apply these guidelines when generating, reviewing, or auditing any web page.

---

## 1. Title Tags

**Core rules:**
- Include the primary keyword, design for click appeal, keep under 60 characters, and make it unique per page.
- Never use "Home," "Untitled," or generic placeholders.
- Ensure the primary keyword appears in: Title Tag, Meta Description, H1, and the opening sentence.

**Formula:** `[Target Keyword] | [Benefit or Searcher's Goal] | [Brand Name]`

Use "Benefit without Pain" framing — present a desirable outcome while implying the avoidance of a pain point:
- "Home renovation ideas | Modern budget-friendly inspiration | Havenry"
- "Software to reduce patient no-shows | Automated reminders that work | Schedula Health"

**Spacing:** Ensure spaces exist around separators (pipes, hyphens, dashes). "eating-a guide" is treated by Google as "eating" and "a guide" — the hyphen splits the phrase.

**Branding Hack:** If the brand name contains a target keyword, merge it to avoid repetition:
- "Compare the Market" → "Comparethemarket" (for a page targeting "compare cheap car insurance")
- "Detailed" → "Detailed.com"

**Avoid over-optimization:** Don't repeat the same word or close variations. Watch for subtle cases:
- ❌ "Sales pipelines: A comprehensive guide for sales leaders and reps" (repeated "sales")
- ❌ "Gifts under $50 gifts" (repeated "gifts")
- ❌ "Blog SEO: How to Search Engine Optimize Your Blog Content" (repeated "SEO/blog")

Use `REGEXMATCH` in Google Sheets or Screaming Frog Regex to detect repeating words at scale. Do not modify titles that are already ranking well.

---

## 2. Meta Description & Open Graph Tags

**Meta Description:**
- Write click-focused copy matching user intent.
- Max 155 characters. Unique per page.
- Example: "Considering a personal injury claim but unsure what you're owed? [Brand] is here to help."

**Meta Viewport:** Always include in `<head>` for mobile scaling:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Core Open Graph tags** (controls social media appearance):
```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="website" />
<meta property="og:locale" content="en_US" />
```

---

## 3. Heading Structure (H1–H6)

**Rules:**
- Use exactly **one H1** per page. Place it at the top. It must clearly describe the overall page topic.
- Use **H2s** for main sections or chapters.
- Use **H3–H6** for sub-points directly under the parent heading. Never skip levels (e.g., H2 → H4).
- 68.8% of screen reader users navigate via headings — structure matters for accessibility too.

**Exception:** HTML5 allows multiple H1s when placed inside separate `<section>` elements.

**Common pitfalls to avoid:**
- Wrapping logos or navigation in heading tags (e.g., site name in H1)
- Nearly identical text across different heading levels
- Generic H1s reused across pages (e.g., "News" on every article)
- H1 on desktop downgraded to H2 on mobile — verify both

**Compare Title Tag vs H1:** If one was updated for 2024 but the other still says 2023, fix both simultaneously.

---

## 4. Freshness Signals & Year-Specific Metadata

- Include the current year in title tags and visible body text for time-sensitive content.
- Update both the article H1 and the SEO title tag at the same time — mismatches (one says 2024, one says 2025) are a common technical SEO error.
- Use advanced search to find mismatches: Google `intitle:[previous year] -intitle:[current year]` with Tools > Date Range.

**Google's Associated Date:** Google may scrape a date from visible text rather than schema. If old years appear prominently in body copy, Google may associate the old date with the page — causing ranking drops. Mitigate by:
1. Writing the current published/updated date clearly in visible text.
2. Using `schema.org/CreativeWork` with `dateModified`.
3. Removing old `datePublished` and only providing `dateModified` if the content has been significantly refreshed.

---

## 5. HTML Efficiency & Code Quality

- **Minimize code distance:** Place answers directly below their corresponding questions in the HTML. Reduce pixel and DOM distance between Q&A pairs.
- **Vary measurement units:** Use diverse units for contextual richness (e.g., "calories" and "joules," "milligrams" and "liters").
- **Keep DOM size low:** Fewer nodes = less machine learning noise. Prefer plain, semantic HTML.
- **Framework preference:** Astro over heavy JS frameworks for better AI/search retrievability. Enforce a 2-second page load target.
- **Allow CSS crawling:** Ensure Google can access your CSS (layout signals matter).
- **Use HTML tables** instead of images of tables — tables are machine-readable and support tokenization.
- **Validate HTML:** Use the W3C Validator. Never place `<img>` or `<div>` tags inside `<head>` — this breaks Hreflang and canonical tags.
- **Interactive tools signal utility:** Embedded calculators (calorie, weight, cost) in native HTML/CSS/JS increase perceived content value.
- **Plugin elimination:** Replace multi-purpose plugins with purpose-built AI-generated code snippets. Example: a shortcode for an automatic footer copyright year, or redirect logic built directly into the app.

**Functional prominence:** Move the primary functional component (calculator, converter, tool) to the top of the page. Example: Moving a unit converter above the fold increased daily traffic from 2,000 to 30,000 clicks.

**Tabs for fold density:** Place 3–4 key section headings in the upper fold using a tabbed structure to increase impressions per scroll depth.

---

## 6. JSON-LD Schema Markup

**Implementation:**
- Use JSON-LD format. Place a single `<script type="application/ld+json">` block in `<head>` or `<body>`.
- Prioritize pages already ranking highly — schema increases rich result likelihood on pages with existing traction.
- Only implement schema types that appear on competing SERP pages (match SERP consensus).

**Note on LLMs and schema:** LLMs treat schema as regular text — they don't use it in the structured, designed-for-machines sense. LLMs prioritize body text ~95% of the time. Schema still matters for Google's structured rendering, but don't rely on it alone for AI visibility.

**Schema types by page type:**

| Page Type | Schema Types |
|---|---|
| Ecommerce Home | Organization, WebSite, SearchAction |
| Product Listings | ItemList, Product, Offer, AggregateRating |
| Blog/Articles | Article or BlogPosting |
| FAQ Sections | FAQPage |
| Store Locators | LocalBusiness (with geolocation + sameAs links) |
| Video Pages | VideoObject (title, description, duration, URL) |
| Events | Event (date, location, name, duration, address) |
| Reviews | Review (rating, stars, author) |
| Recipes | Recipe (ratings, cook time, prep time, nutrition); GuidedRecipe for step-by-step |
| Job Postings | JobPosting (logo, reviews, ratings, location, title) |
| Breadcrumbs | BreadcrumbList |

**Google Structured Data Markup Helper workflow:**
1. Paste the target URL into the tool.
2. Highlight page elements and assign schema attributes (e.g., highlight a name → assign "Name").
3. Click "Create HTML" → copy the generated JSON-LD.
4. Add to `<head>`.

**CMS Plugins:** Yoast SEO (site name, logo, profiles), Yoast WooCommerce SEO (product pages), Schema App.

---

## 7. SameAs Schema & Entity Validation

**Purpose:** Links your organization or person entity to external profiles, helping Google recognize and validate the entity — especially important for new sites and YMYL sectors.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brand",
  "url": "https://yourdomain.com",
  "sameAs": [
    "https://twitter.com/yourbrand",
    "https://linkedin.com/company/yourbrand",
    "https://youtube.com/c/yourbrand"
  ]
}
```

**Best practices:**
- 30–40 indexed and associated profiles are considered sufficient for full entity validation.
- Don't overstuff with 50–60 URLs — prioritize the most authoritative.
- Build an "About" or "About Us" hub page: list secondary profiles as visible text on the page (so Google can discover them without cluttering the schema).
- Ensure schema data also appears as readable visible text on the page.

**For personal brands:** Generate JSON-LD "Person" schema listing all authoritative URLs (Amazon Author, Crunchbase, Yahoo Finance). Embed in the homepage or About page.

**Knowledge Graph / Entity SEO:**
- Move from "Strings" (keywords) to "Things" (entities) in Google's Knowledge Graph.
- Connect all digital markers (social, website, WikiData) to a single Knowledge Graph Machine ID (KGM ID).
- Disambiguation: provide granular attributes (Founder, Author, Date of Birth) to build confidence score.
- To trigger a Knowledge Panel: ensure an About page, detailed bio, `sameAs` markup, and a WikiData entry.

---

## 8. Schema Testing & Validation

| Tool | Use |
|---|---|
| Google Rich Results Test | Validate eligibility for rich results; preview SERP appearance |
| Schema Markup Validator | Validate all schema.org structured data; identify syntax errors and missing fields |
| Classy Schema | Fetch URLs and visually explore schema markup |

**Workflow for Schema Markup Validator:**
1. Submit a URL or paste raw code.
2. Review errors, missing values, and incorrect syntax.
3. Use the live editor to fix issues (e.g., missing commas) and retest immediately.


