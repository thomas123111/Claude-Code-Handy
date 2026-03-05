---
name: tech-seo-performance
description: >
  Best practices for technical SEO performance optimization when building or improving a website.
  Use this skill whenever the user is working on page speed, Core Web Vitals (LCP, CLS, INP, FCP),
  image optimization, JavaScript rendering strategies, HTTPS/SSL setup, mixed content issues,
  mobile-first design, web accessibility (WCAG), or edge/serverless SEO optimizations.
  Trigger this skill even if the user doesn't say "SEO" — if they're making decisions about
  rendering methods (SSR, CSR, prerendering), image formats, caching, CDN setup, security certificates,
  or mobile responsiveness that will affect how search engines crawl and rank the site, this skill applies.
---

# Tech SEO Performance

Best practices for optimizing website performance, security, and rendering for both users and search engines. Apply these during build and before launch to avoid costly rework.

---

## Image Formatting, Compression, and Sizing

- **Target file sizes:** 100 KB for standard images. 200–300 KB for large hero images or visual-heavy sites.
- **Audit with Screaming Frog:**
  1. Enable crawling of images and external URLs.
  2. Use the "Images over 100 KB" filter.
  3. Adjust threshold: `Configuration > Preferences > Max Image Size (KB)`.
  4. Export "Image Link From" data to locate unoptimized images.
- **Choose the right format:**
  - **WebP:** Best for aggressive compression with no perceptible quality loss. Example: transparent PNG (42 KB) → WebP (13 KB) = 69% reduction.
  - **JPEG (lossy):** Use for photos and photorealistic content. Example: PNG at 244 KB → compressed JPEG at 29 KB.
  - **SVG (lossless vector):** Use for logos, line art, and animations.
  - **PNG (lossless):** Use for screenshots and logos requiring transparency.
- **Crop to display dimensions:** The image file should match the size it's displayed on screen. Don't serve a rectangular image that the browser crops to a square — the extra pixels are downloaded and discarded.
- **Resize to exact pixel dimensions:** Use the browser's element selector to find the HTML display size, then resize using a tool like Squoosh. Example: resizing to a 282px display width reduced a file from 349 KB to 13.2 KB.
- **Multiply by 2 for Retina displays:** Multiply the HTML display width/height by 2 when targeting high-density screens.

---

## Alt Text, File Naming, and Visual Semantics

- **Write concise, accurate alt text:** Under 100 characters. Describes the image accurately for screen readers and search engines.
  - Good: "Side view of young brown and white cow."
  - Avoid: vague ("Cow"), keyword-stuffed, overly long, or irrelevant descriptions.
- **Optimize alt text for search:** Use keyword variations that describe the image's context.
  - `german-language-schools` → `"German language and education schools"`
  - `germany-climate` → `"Germany climate and vegetation"`
- **Leave alt text blank for decorative images:** Use `alt=""` to tell screen readers to skip the image.
- **Name image files with target keywords before uploading:**
  - `blue-adidas-trainers.jpg` not `IMG_4823.jpg`
  - `hvac-los-angeles.png` not `552.png`
- **Embed visual semantics:** Every optimized image should contain three elements:
  1. The brand logo.
  2. Text describing the landing page intent.
  3. A visual that communicates the end goal clearly.
- **Update images for AI Overviews (SGE):** Use images that visually represent query intent — this affects which image Google surfaces in AI-generated snippets. A well-chosen image let one brand stand out against larger competitors in AI Overviews.
- **Ensure crawlability:** Images and videos must be crawlable by search and AI bots. Serve via clean HTML — avoid JS-only lazy loading since AI crawlers don't render client-side JS.
- **Add captions:** Place descriptive captions directly below or beside images and videos.

---

## Advanced Asset Management (Lazy Loading, EXIF, Source Sets)

- **Implement lazy loading:** Defer loading of below-the-fold images until they enter the viewport. Use the Google-released "Native Lazyload" plugin or CMS-native support. The BBC loads images dynamically as users scroll.
- **Use `srcset` (source sets):** Serve multiple image sizes in HTML so the browser picks the best one for the device viewport.
  - Example: a 480px JPEG and an 800px JPEG in `srcset`. Viewports under 600px get the 480px version; above 600px get the 800px version.
- **Strip EXIF data:** Remove non-visual metadata (device make, lens type, GPS coordinates, timestamps) to reduce file size without affecting image quality.
  - A JPEG from Trader Joe's contained Canon camera metadata — stripping it reduces file size.
  - Use third-party apps, command-line tools, or manual file property editing.

---

## Core Web Vitals (LCP, CLS, INP, FCP)

Core Web Vitals were introduced in 2021 as UX-based ranking factors.

- **Largest Contentful Paint (LCP):** Time to show the main visible element (image, video, or text block). Target: **under 2.5 seconds**.
- **Interaction to Next Paint (INP) / First Input Delay (FID):** Responsiveness to user actions. Target: **under 100ms**. Fix by reducing unused CSS and JS occupying the browser's main thread.
- **Cumulative Layout Shift (CLS):** Page layout stability during load. Target: **0.1 or less**.
  - Set explicit `width` and `height` attributes on all images in HTML. Using `auto` or percentage dimensions without defined aspect ratios causes text to shift as images load.
  - Example of bad CLS: an ad loads late and pushes a "Cancel" button down — user accidentally clicks "Submit."
- **First Contentful Paint (FCP):** Target: **1.8 seconds or less**. Eliminate render-blocking CSS and JS files.
- **Fix at scale:** Identify global resources causing slowdowns across page templates rather than fixing individual pages. Replacing a heavy third-party JS library in a page template speeds up an entire site segment.
- **Passive event listeners:** Use GTmetrix to identify touch/wheel listeners; mark them passive to improve scroll performance.
- **Caching policies:**
  - HTML: No cache
  - CSS and JS: 30 days
  - Images and fonts: 1 year (BBC caches images for 1 year as they rarely change)
- **CDN:** Cache content on globally distributed servers to reduce latency (e.g., Cloudflare).
- **Reduce HTTP requests:** Combine files where possible. Remove unused CSS and JS.

---

## JavaScript SEO and Rendering Strategies

Understanding rendering is critical — Googlebot indexes the DOM after JS execution, which is resource-intensive and can lead to timeouts or partial indexing.

- **Server-Side Rendering (SSR):** Server executes JS and sends fully rendered HTML to the bot. Best for complex e-commerce sites. Ensures bots can always read content.
- **Selective SSR:** Full server-rendering is costly — only SSR the specific page sections intended for ranking.
- **Prerendering:** Generate static HTML at build time. Highly recommended for stable content. Maximizes crawlability.
- **Client-Side Rendering (CSR):** Avoid for SEO-critical content. Relies on the browser to render — bots may not execute it fully.
- **Dynamic rendering:** Server detects the user agent — sends standard JS to humans, pre-rendered static HTML to bots.
- **Hydration:** Add interactivity to SSR or static content by having client-side JS take over a server-rendered page.
- **Verify rendering methods:** Don't assume a JS framework is server-rendered — many developers make this mistake. Confirm explicitly.
- **Inspect the DOM:** Use the browser Inspect tool (not "View Page Source") when analyzing Angular/React sites. The DOM reflects the post-render state; page source does not.
- **Graceful degradation:** Pages should show meaningful content even if JS fails or is disabled.
- **Compare rendered source:** Use the "View Rendered Source" Chrome extension to compare pre-render vs. post-render HTML.
- **Manual code inspection:** Disable CSS and JS using the "Web Developer" extension to inspect high-value pages.
  - Example: Disabling CSS/JS on Sunglass Hut reveals a hidden headline not visible in the rendered view.
  - Example: ASOS navigation becomes highly prominent when unstyled, revealing a heavy internal link focus.
- **Provide alt text on all images and GIFs:** Search engines may fail to interpret visual content without text assistance.

---

## Enforcing HTTPS and Resolving Mixed Content

- **Enforce HTTPS sitewide:** A confirmed Google ranking signal. Encrypts communications to prevent interception.
- **Use TLS over SSL:** Always use the latest TLS version (currently TLS 1.3).
- **SSL certificate validation levels:**
  - **DV (Domain Validation):** Quick, confirms domain rights only.
  - **OV (Organization Validated):** Validates company info; more trustworthy.
  - **EV (Extended Validation):** Full vetting of legal, physical, and operational existence.
- **SSL certificate coverage types:**
  - **Single Domain:** One specific domain.
  - **Wildcard:** One domain and all its subdomains. (`*.bluray.co.uk` covers `www.bluray.co.uk`, `mail.bluray.co.uk`.)
  - **Multi-Domain (UCC):** Up to 100 different domains/subdomains on one certificate.
- **Use Let's Encrypt:** Free, automatic, secure SSL certificates from a non-profit Certificate Authority.

### Mixed Content

Mixed content = HTTPS page loading assets over HTTP. This breaks the secure connection.

- **Active mixed content (high risk):** JS files, iFrames, stylesheets. Attackers can intercept an HTTP JS file, modify functions to exfiltrate DOM data, or redirect payment form submissions. Fix immediately.
- **Passive mixed content (lower risk):** Images, audio, video. Attackers can replace UI elements or inject malicious downloads. Fix promptly.
- **Diagnose:**
  - Screaming Frog Protocol Report and Insecure Content Report.
  - Jitbit SSL Check (crawls up to 400 pages).
  - Manual browser inspection on pages without a padlock icon.
- **Remediate:**
  - Update insecure asset URLs in theme files (once, globally).
  - Implement a Content Security Policy (CSP) for large sites.
  - Use `.htaccess` or Nginx config to rewrite all HTTP → HTTPS at server level.
  - Search code for `://` and confirm it's always preceded by `https`.
  - Don't use protocol-relative URLs like `//example.com/script.js`.
  - Verify fixes in the browser's JS console (`Ctrl/Cmd + Shift + J`).

### Secure external links

- Add `rel="noopener noreferrer"` to all external links with `target="_blank"` to prevent Tab Napping.
- `rel="noopener"`: Use for all external links (unless a callback is required).
- `rel="noreferrer"`: Use to hide site info from the destination (e.g., UGC, forum posts, sponsored links).
- **HSTS (HTTP Strict Transport Security):** Forces browsers to only use secure connections.

---

## Mobile-First Design and WCAG Accessibility

Google primarily uses the mobile version of content for indexing and ranking. Mobile is the primary build, not an afterthought.

- **Use responsive design:** Use standard HTML/CSS with a meta viewport tag. Never set viewport to a fixed width.
- **Don't strip features for mobile:** If content is hidden on mobile, it may not be indexed. Adapt the mobile build for desktop — not the reverse.
- **Monitor GSC Mobile Usability report:** Fix template-level errors first (they affect many pages). Prioritize high-value pages.
- **Common mobile errors to fix:**
  - Incompatible plugins (e.g., Flash).
  - Fixed viewport width.
  - Content wider than the viewport (causes horizontal scroll).
  - Text too small to read.
  - Clickable elements too close together ("fat finger" issues).
- **Validate fixes:** Use "Validate Fix" in GSC to trigger recrawl.
- **Test mobile usability:** Chrome DevTools Device Toolbar, physical devices, or emulators. Check for: links jumping to footer, elements triggering without input, broken navigation.

### WCAG Accessibility (target Level AA)

Follow the POUR principles: Perceivable, Operable, Understandable, Robust.

Key implementation points:
- High contrast ratios for text/backgrounds.
- Full keyboard navigation support.
- No content that triggers seizures.
- Autocomplete support and proper labels on forms. Offer email/phone contact alternatives.
- Minimize iframes — content inside loses value and is hard for screen readers.
- All JS must comply with accessibility standards.

**Testing tools:**
- Built-in OS screen readers (manual testing).
- Firefox Accessibility Inspector (visual simulations of color blindness/contrast loss).
- Google Chrome Lighthouse (dedicated accessibility audit).
- Axe DevTools Chrome extension.
- WAVE Evaluation Tool extension.
- Sitebulb at scale (enable accessibility auditing).

---

## Edge SEO and Serverless Optimizations

Edge SEO uses service workers running on CDN edge servers (e.g., Cloudflare Workers) to execute JS and modify pages before they reach the user — bypassing slow dev cycles or rigid CMS limitations.

- **Inject technical SEO elements at the edge:** Schema markup, Hreflang tags, security headers (HSTS, CSP), log file collection.
- **Execute redirects at the edge:** Bypasses IT backlogs and avoids server round-trip latency.
- **Override robots.txt:** Intercept and modify the robots.txt file when the CMS doesn't allow editing (e.g., Shopify). Control which sections bots can or cannot access.
- **Inject on-page content:** Modify meta titles, meta descriptions, images, and body content directly at the edge without a CMS deployment.
