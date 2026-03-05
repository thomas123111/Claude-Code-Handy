---
name: tech-seo-architecture
description: >
  Best practices for technical SEO site architecture when planning or building a website. 
  Use this skill whenever the user is building a new website, setting up site structure, planning URL hierarchies, 
  choosing domain strategy, designing internal linking systems, setting up navigation, breadcrumbs, content silos, 
  or any structural decision that affects how search engines crawl and rank a site. 
  Trigger this skill even if the user doesn't say "SEO" explicitly — if they're making structural or architectural 
  website decisions (subdomains, slugs, filters, international versions, page depth, navigation), this skill applies.
---

# Tech SEO Architecture

Best practices for structuring a website for maximum search engine crawlability, authority flow, and ranking potential. Apply these principles at the start of a project to avoid costly technical debt.

---

## Domain Setup, Subdomains, and Reverse Proxies

- **Diversify domain assets:** Deploy multiple domains to occupy more SERP positions. Single-domain reliance is high-risk.
- **Avoid guilt by association:** Never group multiple domains in one Google Search Console account — a penalty on one can deindex all. Even HTML holding pages with no content are at risk.
- **Separate app from marketing site:** Host the main site on the root (`brand.com`) and the SaaS app on a subdomain (`platform.brand.com`) from day one to avoid SEO debt later.
- **Link subdomains back to root:** Use footers, nav, ToS, and contact forms on the app subdomain to link extensively back to the main domain and consolidate authority.
- **Use reverse proxies for CMS limitations:** Use Cloudflare reverse proxies to serve app content on the main domain when the CMS doesn't natively support it (e.g., Webflow limitations).

### Expired Domain / 301 Method

- **Bypass the sandbox phase:** Acquire expired domains with existing backlink profiles to skip the 6–12 month new-site sandbox period.
- **Implement the 301 Method:** 301 redirect the expired domain to the target site to transfer authority.
  - Transferwise → Wise.com: 4.1M visitors in week one.
  - Puppyfind → Puppies.com: 192,000 keywords ranked in week one.
  - Plantronics → new domain: 240,000 traffic in week one.
- **Reconstruct high-value URLs:** Use Ahrefs "Best by links" report to find pages with the most do-follow backlinks. Recreate those pages on the new domain and redirect old URLs to matching new pages to retain specific link equity.
- **Redirect remaining pages to homepage:** For URLs not being recreated, redirect to the homepage to capture residual authority.
- **Maintain brand identity continuity:** Keep the original name, logo, colors, and layout. Align new content with old anchor text (e.g., if NYT linked to a URL about "athletic performance," the resurrected page must be topically relevant).
- **Signal ownership continuity:** Use the original registrar and namespaces where possible.
- **Execute subdirectory integration:** Redirect the acquired domain to a specific subdirectory (not the homepage) to mimic an M&A event. Example: "Laurel and Wolf" redirected to a subdirectory on "Faraway.co."
- **Link from the subdirectory to money pages:** Publish a press release in the new subdirectory and link outward to high-conversion pages.

---

## URL Structuring: Hierarchical vs. Flat

- **Flat structure:** `example.com/subfolder/full-keyword-with-modifier`. Risk: keyword-heavy slugs flagged as doorway pages or scaled content farming. Avoid slugs that differ only by a modifier (e.g., "with-tracking" vs. "with-privacy") — causes ranking cannibalization.
- **Hierarchical structure (preferred):** `example.com/subfolder/parent-topic/modifier`. Signals expertise and depth. Reduces internal competition. Concentrates authority within a subfolder. Mirrors documentation/knowledge base structure.
  - Affiliate example (NapLab): `/best-mattress/` as a hub; `/best-mattress/memory-foam`, `/best-mattress/side-sleepers`, `/best-mattress/hybrid` as children. Ranks #1 for "side sleeper mattress."
  - Local SEO example: `/chicago-car-accident-lawyer/` → `/hit-and-run`, `/rear-end-accident`, `/t-bone`.
- **Design contextual crawl paths:** Core sections stay flat; author/informational sections go deeper.
  - Core: `germany/visa/visit` or `germany/immigrant`
  - Deep: `germany/life/culture/religion`
  - Google assumes quality flows left to right in the URL. Always have multiple nodes under a seed and multiple seeds under a root.

---

## URL Design, Formatting, and Slug Optimization

- **Include the primary keyword** in the URL path; match the page title.
- **Keep slugs short:** ~3 words. Remove unnecessary folders like `/blog/` where possible.
- **No dates:** Avoid date-based URLs unless content is strictly time-bound (news). Use `domain.com/personal-injury-compensation` not `/2024/01/article`.
- **Evergreen URLs for seasonal content:** Use `/black-friday/` or `/christmas/` — not `/black-friday-2024/`. Update content annually.
- **Communicate intent clearly:** `/medical-malpractice-lawyer` not `/med-malpractice`.
- **Local SEO:** Include state and city in the slug: `/medical-malpractice-lawyer-st-louis-mo`.
- **Formatting rules:**
  - Hyphens (`-`) to separate words — no underscores, no spaces.
  - Lowercase only. `Page.html` and `page.html` are treated as different URLs.
  - Set permalinks to "Post name" in WordPress.
- **Republishing technique:** If a page is stalled, move it to a slightly altered slug and 301 redirect the old URL. One case study saw a page jump to #1 within two weeks after doing this.
- **Modify slugs to trigger ranking shifts:** Adding one word to a slug can force a re-evaluation for high-authority pages lacking topical relevance.
- **Forum slug priority:** Claim URL slugs on forums like Reddit early for permanent ranking advantages.
- **AI citation optimization:** Keep slugs 17–40 characters. Slugs of 21–25 characters received ~87,000 citations in AI testing — extremely short or long slugs underperform.

---

## Managing Trailing Slashes and Homepage Duplication

- **Trailing slashes create distinct URLs:** `example.com/fish` ≠ `example.com/fish/`. Exception: root domains are treated identically.
- **Enforce absolute consistency:**
  - 301 redirect the non-preferred version to the preferred version.
  - Canonical tag must match the preferred version.
  - All internal links must point to the preferred version directly (no redirect chains).
- **Audit manually:** Add/remove a trailing slash in the browser — verify 301 redirect fires and canonical matches.
- **Common issues to look for:**
  - Missing redirect on trailing slash (results in 404).
  - Canonical specifies trailing slash, internal links don't (or vice versa).
  - Complex redirect chains (301 + 302 + geo-redirect).
- **Screaming Frog RegEx audit:**
  - Find URLs with trailing slash: `[\/]$`
  - Find URLs without trailing slash: `[^/]$`
- **Homepage duplication:** Prevent `index.php` or `index.html` from loading as a separate URL.
  - Detect: Google `site:domain.com inurl:index` or `site:domain.com inurl:index.php`.
  - Check GSC for which version gets traffic; check which version receives internal links; check robots.txt.
  - If clean URL ranks: 301 `index.php` to clean version and update all internal links.
  - If ugly URL ranks: Don't redirect immediately — first update all internal links to point to `index.php`.

---

## Faceted Navigation, Filters, and Parameter Control

- **Risk:** Dynamic filters create near-infinite URL variations → duplicate content, wasted crawl budget, diluted link equity.
- **Enforce parameter ordering:** Always use the same order (e.g., "color" before "size") to prevent multiple URL versions of the same filter combination.
- **Sorting facets:** Use URL parameters for sort-only features (`?sortBy=priceAsc`) — these have no SEO value; keep them controlled.
- **Crawl control via robots.txt:** `Disallow: /*?sort=` to free up crawl budget.
- **Noindex:** Apply `noindex` to low-priority faceted variations.
- **Canonicalization:** Every parameterized URL from a faceted filter should canonical back to the master category page.
- **High-value facets → static URLs:** Filters with strong ranking potential need unique, static URLs with unique content. Example: `/red-shoes` as a dedicated page rather than `?color=red`.
- **Breadcrumbs on filtered pages:** Add breadcrumbs to all filtered pages.
- **Pagination strategy:**
  - Classic numbered pagination: Best for SEO control, crawlability, deep product discovery.
  - "Load More" button: OK for mobile UX if implemented to remain crawlable.
  - Infinite scroll: Avoid — hinders deep product indexing and authority distribution.
- **Case study (Boden):** Added high-value faceted pages to XML sitemap + sub-menu filtering + breadcrumbs → 87% more clicks to faceted pages, 14% more indexed pages, ranked for "women's long sleeve dresses."

---

## International SEO and Hreflang

- **Hreflang tag format:** `hreflang="language-country"` e.g., `en-GB`, `es-MX`.
- **Placement:** HTML `<head>`, HTTP headers, or XML sitemap.
- **Reciprocity rule:** If Page A declares Page B as an alternate, Page B must also declare Page A.
- **Check sitemap implementation:** If foreign-language pages are indexed but lack `hreflang` in source code, check if it's implemented via XML sitemap.
- **URL structure options:**
  - ccTLDs (`.fr`, `.de`): Strongest geo-targeting signal, but expensive and splits domain authority.
  - Subdomains (`de.example.com`): Weak geo-targeting — treated as a separate site by Google.
  - Subdirectories (`example.com/de/`): Recommended — flexible, easy to scale, consolidates link authority.

---

## Click Depth and Page Proximity

- **Crawl depth:** Number of clicks from homepage (Level 0) to reach a page.
- **Keep all pages within 3 clicks** of the homepage. Google treats proximity to homepage as a signal of importance.
- **Click depth hierarchy:**
  - 1 click: Highest importance
  - 2 clicks: High importance
  - 3 clicks: Moderate importance
  - 4+ clicks: Low importance — avoid for core pages
- **Avoid deep burying:** A crawl depth of 6+ clicks signals low page importance. Core service and revenue pages must never be buried.
- **Agency benchmarks:** Max 4 clicks (Distilled), max 5 clicks (Detailed).
- **Screaming Frog audit:**
  1. Internal tab → filter by HTML → export.
  2. Sort Crawl Depth column descending (A→Z).
  3. Isolate all pages at depth 5+.
- **Horizontal linking:** Connect same-level pages via "Related Posts" or "Similar Products" to reduce click distance.
- **Direct homepage links:** Link to high-level categories directly from the homepage body (not just the dropdown) to reduce crawl depth of all pages below.

---

## Content Silos, Hub Pages, and Topical Flow

- **Build content silos:** Group articles to cover a subject completely. Example fitness silo: home workouts, supplements, muscle building, weight management, treadmill reviews.
- **Pages vs. Posts (WordPress):** Use Pages for core services and locations. Use Posts for blog articles organized into silos.
- **Supporting silos:** 3–10 supporting articles per main service page. Example: "Bookkeeping Silo" = main bookkeeping page + 7–10 blog posts on bookkeeping tools and errors.
- **Pillar/Hub pages:** Consolidate many individual links into one hub with anchor links. Example: 30 unique links for resume examples consolidated to one "resume examples" hub page with 30 anchors → link equity flows to hub, then cascades to subpages.
- **Two-Click Rule:** All keyword variations and subpages should be reachable within 2 clicks of the homepage.
- **Authority flow:** Homepage → Hub page → Nested category page → Individual subpages.
- **Topical flow calculation:**
  1. Crawl the site and sample URLs.
  2. Export internal links pointing to those URLs.
  3. Group URLs into topical themes (e.g., "knitting" + "crochet" → "textile arts" → "crafts").
  4. Calculate: `(Links from same topic / Total internal links) × 100`.
  5. Benchmark: **75%+** = solidified authority. **≤74%** = dilution. Example: 60 craft-family links out of 100 total = 60% (diluted).

---

## Link Equity Distribution and PageRank Allocation

- **Homepage holds 60–70%** of a site's total backlink authority. It divides equally among all pages it links to.
- **Link directly to core pages from homepage body:** Don't rely solely on dropdown menus. A law firm with 6 services should link to each from the homepage content.
- **E-commerce:** Link directly from homepage to the most profitable category/collection pages.
- **Don't waste link equity** on irrelevant or low-conversion pages.
- **Minimum internal link floor:** Aim for at least 5 unique internal links per page.
- **Audit with Screaming Frog:** Identify core pages with low internal link counts. One audit found 48% of live pages had only one internal link.
- **Boost orphaned content:** Move pages with crawl depth 5+ or zero internal links into the main architecture or relevant topic clusters.
- **Fix broken internal links:** Prevent link rot. Broken internal links leak authority.
- **80/20 backlink rule:** Allocate 80% of external link building to the homepage, 20% to specific subdirectories or deep pages.

---

## Contextual Linking and Anchor Text Strategy

- **Links in main body content** carry more weight than footer or sidebar links.
- **Minimalist linking:** Max ~3 internal links per page (in body) increases prominence of each anchor.
- **Root → Seed → Node:** Every page should link at least once to the root, once to the seed, and once to the node in its hierarchy.
- **Contextual anchor placement:** Link keywords within explanatory sentences, not in isolation. Example: "At XYZ Accountants, we offer professional bookkeeping services for businesses..."
- **Anchor text categories:**
  - Topically Relevant: High alignment — "Learn the tools needed for embroidery."
  - Topically Irrelevant: No reinforcement — "Try something new."
  - Generic: "Click here," "Page 2" — replace with entity-rich descriptive text.
- **Avoid intent mixing:** Don't mix informational ("learn about embroidery") and transactional ("buy embroidery tools") anchors pointing to the same URL — creates a high, sub-optimal intent mix.
- **Diversify anchors:** No more than 3 instances of the exact same anchor text sitewide for a given URL.
- **Use LSI and secondary keyword variations:**
  - Instead of only "Lawyers Miami": use "Law firm Miami," "Best law firm Miami," "Lawyers in Miami."
  - Use GSC queries with high impressions/low ranking as anchor text targets.
- **Rank easy keywords first,** then use those ranking pages to internally link to competitive "money" pages.
- **Turn H2 subheadings into links:** Makes subheadings clickable anchors to relevant internal pages — can generate sitelinks in SERPs.

---

## Navigation Menus and Breadcrumb Architecture

- **Plan URL structure before building** — retrofitting architecture is expensive.
- **Build topic clusters (content spiderweb):** Cover a niche A to Z. Example: "Dog Feeding Basics" cluster with "Energy Requirement Calculation," "Portion Sizes," "Nutrient Needs."
- **E-commerce taxonomy types:**
  - By Topic: Product type (e.g., Sports store categories).
  - By Target User: Demographics (Men's vs. Women's).
  - By Attributes/Facets: Size, color, etc.
  - By Location: Store locators.
  - By Date/Time: Blog archives, seasonal launches.
- **Navigation types:**
  - Global: Fixed main menu for top-level categories.
  - Local: Footer menus for specific sections.
  - Contextual: In-body links based on page theme.
  - Supplementary: HTML sitemaps and page indexes.
- **Breadcrumbs:**
  - Implement `BreadcrumbList` schema markup.
  - Every level must be clickable except the current page.
  - Use descriptive anchors: "Home > Women's Dresses > V-neck Dress" — not "Home > Navigation > Page."
  - Supplement (do not replace) the main navigation.
  - Breadcrumbs reduce click depth — add them to all filtered and deep pages.
- **Use descriptive keywords in primary nav:** Keyword-rich nav labels send topical signals. Example: Boden uses descriptive category names in their main navigation.
- **Tag content with descriptive keywords** to improve categorization and internal search.
