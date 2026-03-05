---
name: tech-seo-crawl-indexation
description: >
  Best practices for technical SEO related to crawling, indexation, and server configuration
  when building or auditing a website. Use this skill whenever the task involves robots.txt,
  meta robots tags, X-Robots-Tag headers, XML or HTML sitemaps, internal search result
  indexation, crawl budget management, log file analysis, 3XX redirects and redirect chains,
  4XX error handling and 404 page design, or 5XX server errors. Trigger this skill any time
  the user writes, audits, configures, or troubleshoots these topics — even if they phrase it
  as "how do I block Google from crawling X", "my sitemap has errors", "set up redirects",
  "users are hitting 404s", or "Google isn't indexing my pages".
---

# Tech SEO: Crawl & Indexation

## Robots.txt, Meta Robots, and X-Robots-Tag

### robots.txt File
- Name the file `robots.txt` (lowercase) and place it in the root directory: `example.com/robots.txt`
- Each subdomain needs its own separate robots.txt file
- Always include a direct link to the XML sitemap inside robots.txt
- Remove all staging crawl blocks before going live
- Use robots.txt to manage AI bot access: `GPTBot`, `ClaudeBot`, `CCBot`
- **Do not use `noindex` in robots.txt** — Google no longer supports it

**Standard directives:**
- `User-agent` — identifies the bot (`*` for all, or specific bot like `Googlebot`)
- `Disallow` — folders to block
- `Allow` — permits a subfolder within a disallowed parent
- `Crawl-delay` — slows specific bots (ignored by Google; useful for e.g. SemrushBot)

**Critical: The Noindex Trap**
Blocking a directory via robots.txt prevents Google from reading a `noindex` tag inside it. If the page has external links, it will stay indexed. Example: Freepik blocked `index.php` in robots.txt — despite having `noindex` tags, 3,300+ pages remained indexed because Google couldn't read the tag.

**Audit strategy for "secret" pages:**
1. Check robots.txt for blocked directories
2. Run `site:example.com/blocked-path` to check what's indexed
3. Real-world cases: Shopify blocked `/search` (preventing `noindex` usage), Wired blocked `/registration/` and `/user/` (pages stayed indexed), Business Insider blocks `/documents/` (sensitive files may be exposed)

### Meta Robots Tags
Add to the HTML `<head>`. Common values:
- `index` / `all` — allow indexing
- `noindex` — exclude from index
- `follow` / `nofollow` — link signals
- `none` — equivalent to `noindex, nofollow`
- `noarchive` — prevent cached link display
- `nosnippet` — no text or video preview
- `noimageindex` — exclude images
- `unavailable_after: [date]` — removes page after a date (useful for time-sensitive content like job listings)
- `max-snippet: [n]` — character limit for snippet
- `max-image-preview: [standard|large|none]`
- `notranslate` — disables Google's translation prompt

### X-Robots-Tag Headers
Set via `.htaccess` or a PHP header to control non-HTML resources (e.g., prevent `.doc` or PDF files from being indexed).

---

## XML and HTML Sitemap Configuration

### Rules
- Max 50,000 URLs and 50MB (uncompressed) per sitemap file
- Use a **Sitemap Index file** for large sites — group by content type (products, categories, blog, news)
- Segmenting sitemaps allows tracking metrics per page type in Google Search Console (GSC)
- Use absolute URLs with full HTTPS protocol
- Include **only 200 OK pages**
- **Exclude:** 3xx, 4xx, 5xx, non-canonical URLs, noindexed pages, paginated pages, filtered pages, internal search results
- Reference the sitemap in `robots.txt` and submit to GSC
- Name a single sitemap `sitemap.xml`

### News Sitemaps
- Create a dedicated sitemap for news articles — include only items published within the **last 2 days**

### Common Sitemap Errors to Fix
- Redirected URLs in the sitemap dilute crawl efficiency — e.g., Examine.com had 50 redirect errors (10%) in an 855-URL sitemap
- Audit with Screaming Frog: download sitemap in List Mode → crawl → sort by Status Code
- Audit via Google Sheets: use `=sitemap("URL")` to extract URLs, `=getstatuscode(A1)` to check status

### HTML Sitemaps
- Use for small sites — place in footer to distribute authority and provide context to crawlers

---

## Managing Internal Search Results (ISR) Indexation

Internal search results must **not** be indexed — they create infinite crawl loops and poor UX.

**Identify the URL pattern:** eBay uses `/sch`, Pinterest uses `/search/pins`, Business Insider uses `/s?q=[query]`

**Check current handling:** Look for `noindex` tags, canonical tags pointing to clean URLs, or robots.txt blocks. Pinterest disallows `/search` in robots.txt. Etsy uses canonicals to point search results to preferred ranking pages.

**Correct implementation order:**
1. Verify if ISRs generate any search traffic
2. Apply `noindex` tag to all internal search result pages
3. Only add a robots.txt block **after** pages have dropped from the index

**Case studies:**
- Giphy suffered a major ranking drop when Google deindexed their search results pages
- Amazon uses directory structure and self-referencing canonicals rather than `noindex`
- BBC main site blocks search via robots.txt — but `genome.ch.bbc.co.uk` has thousands of search pages indexed due to missing both `noindex` and robots.txt coverage

---

## Crawl Budget Optimization and Log File Analysis

### Improving Crawl Efficiency
- Fix 404s and 301s — wasted crawl budget on non-indexable pages
- Improve page load speed to increase crawl capacity
- Build a logical site hierarchy

### Log File Analysis
Log files reveal exactly how search engines perceive a site. Match crawl data against log data.

- Search engines may continue crawling 404 pages or old PDFs years after content is removed — identify legacy assets
- Refresh old, frequently crawled PDFs by adding links to current content

### KPIs to Track
- Ratio of valid vs. excluded URLs
- Monthly evolution of discovered-but-unindexed pages
- Ratio of crawled non-indexable URLs
- Crawl Ratio: high-value pages crawled vs. low-value pages
- Indexability Rate: time-to-index for new content
- Average Crawl Depth: accessibility of key commercial pages over time

### Diagnosing Indexation Issues
- **"Crawled – currently not indexed"**: URL was processed but rejected. Likely cause: low domain or topical authority, not content quality. Content from a low-authority site moved to a high-authority site will index immediately.
- Even major sites (Amazon, eBay) can have indexing rates as low as 42% due to pages lacking third-party links
- Sitemaps help track indexing percentage — a site with 200 real pages may show 1,000 in GSC due to URL parameters; the sitemap identifies the 200 intended pages

### Indexing Tactics
- Use "Request Indexing" sparingly — for critical new content or snippet updates only, not bulk indexing
- Update the **published date** (not just "last modified") to force reindexing via GSC
- Reverting a year in a slug (e.g., 2026 → 2025) can restore traffic if search volume favors the older year
- For temporary programmatic content: recycle category-level URLs rather than indexing individual listings (e.g., recycle `/accountant-jobs-new-york` instead of per-job posts)
- Ensure lowest-level category pages are indexed to act as hubs for child pages on large sites

---

## 3XX Redirects and Resolving Redirect Chains

### When to Use Each Redirect Type
| Code | Use Case |
|------|----------|
| 301 Moved Permanently | Consolidate ranking signals and Link Equity. Browsers cache for speed. |
| 302 Found (Temporary) | Resource temporarily moved. Original URL retains ranking. |
| 307 Temporary Redirect | Internal redirect preserving HTTP method (e.g., POST stays POST). Used with HSTS. |
| 303 See Other | After form submission to prevent accidental resubmission via back button. |
| 304 Not Modified | Instructs client to use cached version (no change detected). |

### What to Avoid
- **JavaScript redirects** (`window.location.replace`) — requires full render, slow, bad UX
- **308 Permanent Redirects** — authority passing is less proven; use 301 instead
- **Redirects on site-wide links** (footer, sidebar) — Business Insider and NYT both did this incorrectly

### Redirect Chain Rules
- Every domain should resolve from HTTP to HTTPS in **a single redirect hop**
- Google stops following after **5 hops**
- Audit chains with `httpstatus.io` — check both non-secure and www/non-www versions

**Common chain patterns to fix:**
- Multiple hops: HubSpot redirects non-secure → secure → adds "www" (2 hops). Salesforce and Statista both have 2-hop chains.
- Extreme chains: `HTTP → HTTPS → HTTPS+WWW → /home subfolder`
- Multiple final destinations: Detailed.com resolved on both secure and secure+www simultaneously

### Technical Fix Workflow (Screaming Frog)
1. Export Canonical Chain report → isolate unique destination URLs
2. Integrate GSC data → sort by Clicks/Impressions to prioritize
3. Find pages linking to redirecting URLs → update source code to final destination
   - Example: Update `http://entrepreneur.com/tech` links directly to `https://www.entrepreneur.com/tech`

**Prioritize by business value** — fix redirects on revenue-driving pages first (e.g., a ranking product guide over an old blog post).

---

## 4XX Errors and 404 Page Design

### Status Code Reference
| Code | When to Use |
|------|-------------|
| 401 Unauthorized | Authentication required (e.g., blocking crawlers from staging) |
| 403 Forbidden | Stop rogue crawlers requesting too many URLs |
| 404 Not Found | URL does not exist. Consistent 404s lead to deindexing. |
| 410 Gone | Explicitly and permanently removed. Deindexed faster than 404. |
| 429 Too Many Requests | Rate limit exceeded |

### 404 Rules
- Non-existent pages must return a **literal 404 status code**
- **Do not redirect all 404s to the homepage**
  - Exception: if a high-authority external site links to a typo URL, redirect that specific URL
- Fix **Soft 404s**: pages returning 200 OK visually but showing "not found" content are treated as thin content by Google

### Diagnosis and Prioritization
- Perform root cause analysis using aggregate patterns — one 404 is a data point; a directory of 404s indicates a CMS issue
- Map errors to revenue — a 404 on a 2013 blog post is low priority; a 404 on a top-5 product page is an emergency
- Frame technical debt financially: "If we don't fix this, our product pages may be deindexed, risking $Y of revenue"
- Audit 404 status codes with `httpstatus.io` using a random string: `example.com/random-text-here`
- Monitor 404s in Google Analytics to track user impact

### Strategic 404 Page Design
Transform a 404 into a useful interaction that matches your site's design and voice.

**Good examples:**
- Dribbble: lets users change the 404 page's color scheme to see related visual assets
- IMDb: rotating famous movie quotes about being "lost"
- Lego: branded characters with a "someone pulled the plug" caption
- News BTC: displays current trending cryptocurrency rates
- Elle: humorous imagery + links to popular articles

**Avoid:**
- Raw Apache warning pages
- Generic "Page Not Found" text with no navigation

### Out-of-Stock Product Pages
| Situation | Action |
|-----------|--------|
| Temporarily out of stock | Keep page live, show status, retain photos, use availability schema |
| Long-term unavailability | 302 redirect to relevant category |
| Permanently discontinued | 301 redirect |
| No remaining value | 404 or 410, update internal links to remove references |

---

## 5XX Server Errors

**Priority:** Fix 5XX errors immediately. Persistent 5XX errors cause crawlers to pause crawling for up to **30 days**, leading to demotion or removal from the index.

| Code | Cause & Fix |
|------|-------------|
| 500 Internal Server Error | Check broken third-party PHP plugins or database connections |
| 502 Bad Gateway | Improperly configured proxy, poor IP communication, overloaded server, malfunctioning firewall |
| 503 Service Unavailable | Temporary overload or maintenance — always include a `Retry-After` header |
| 504 Gateway Timeout | Upstream server timeout through gateway proxy — check upstream server |
