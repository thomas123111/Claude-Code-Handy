# CLAUDE.md — SEO Content Engine für Gewerbeversicherungs-Websites

> **Zweck:** Dieses Repository enthält ein modulares System aus Skills, Knowledge Bases und Konfigurationsdateien, mit dem Claude Code vollständige, SEO-optimierte Versicherungswebsites für verschiedene Zielgruppen (Gewerbe-Branchen) erstellt.

---

## 1. PROJEKT-ÜBERSICHT

### Was ist das?
Ein **SEO Content Generation & Optimization System** für eine Marketing-Agentur, die branchenspezifische Gewerbeversicherungs-Websites baut. Jede Zielgruppe (z.B. Handywerkstätten, Friseursalons, Gastro-Betriebe etc.) bekommt eine **eigenständige Website** mit eigenem Branding, Logo und Domain.

### Geschäftsmodell
- **Betreiber:** Marketing-Agentur mit Versicherungsmakler-Lizenz (§34d GewO)
- **Produkt:** Branchenspezifischer Tarifrechner + Beratung über Versicherungsmakler
- **Vertrieb:** Cold Outreach via E-Mail → Sales-Landingpage (Startseite) → Tarifrechner
- **Kontakt:** Nur E-Mail (info@fixversichert.de), kein Telefonservice
- **Impressum:** https://unserkunde.de/impressum/
- **Datenschutz:** https://unserkunde.de/datenschutz/

### Seitenstruktur pro Website
Jede Website hat ca. **10 Unterseiten**:
1. **Startseite** — Sales-Landingpage mit Trust-Aufbau (für Cold Outreach)
2. **Produkt-Seiten** (2) — Betriebshaftpflicht, Inhaltsversicherung
3. **SEO-Content-Seiten** (4–5) — Thematisch auf Zielgruppe abgestimmte Ratgeber-Artikel
4. **Über Uns** — Vertrauensaufbau, Makler-Lizenz, Team
5. **Kontakt** — E-Mail-Formular (info@fixversichert.de)
6. Impressum → Link zu https://unserkunde.de/impressum/
7. Datenschutz → Link zu https://unserkunde.de/datenschutz/

---

## 2. ARCHITEKTUR & DATEISTRUKTUR

```
Claude-Code-Handy/
├── CLAUDE.md                          ← Dieses Dokument (Projekt-Übersicht)
├── claude.zip                         ← Archiv der Skill- & Knowledge-Dateien
└── claude/                            ← Extrahierter Inhalt
    ├── CLAUDE.md                      ← Agent Instructions (3-Layer-Architektur)
    │
    ├── ── KONFIGURATION & KONTEXT ──
    ├── brand-context.md               ← Marken-Guide (Farben, Voice, CTAs, Produkte)
    ├── ICP.md                         ← Ideal Customer Profile (Zielgruppen-Dokument)
    │
    ├── ── CONTENT-PIPELINE (in Reihenfolge) ──
    ├── topical-map-generator-SKILL.md ← Phase 0: Topical Authority Map erstellen
    ├── topical-map-generator.skill    ← (Executable Version)
    ├── topical-map-phases.md          ← Phasen-Referenz für Topical Maps
    ├── QUERY-FANOUT-GENERATOR.md      ← Phase 1: Keyword → Research Queries expandieren
    ├── SERP_OUTLINE_RESEARCH.md       ← Phase 2: SERP-Analyse (PAAs, Wettbewerber, Entities)
    ├── seo-outline-generator.md       ← Phase 3: Hierarchische Artikel-Outline erstellen
    ├── seo-briefing-generator.md      ← Phase 4: Detailliertes Writing-Briefing erstellen
    ├── SEO-GEO-WRITER.md             ← Phase 5a: GEO-optimierten Artikel schreiben
    ├── ARTIKEL-HUMANIZER-SKILL.md     ← Phase 5b: KI-Text humanisieren
    ├── HUMANIZER-RULES.md             ← Referenz-Regeln für Humanizer
    ├── seo-intro-writer_SKILL.md      ← Phase 6a: Intro schreiben
    ├── seo-intro-writer.skill         ← (Executable Version)
    ├── seo-conclusion-writer.md       ← Phase 6b: Conclusion schreiben
    ├── seo-conclusion-writer.skill    ← (Executable Version)
    ├── article-proofreader.skill      ← Phase 7: Artikel-Korrektur
    │
    ├── ── SEO-OPTIMIERUNG ──
    ├── seo-meta-generator.md          ← Title Tags & Meta Descriptions generieren
    ├── seo-meta-generator.skill       ← (Executable Version)
    ├── SEO-IMAGE-ALT-URL-SKILL.md     ← Alt-Tags & Bild-Dateinamen generieren
    ├── featured-image-generator.skill ← Featured Images generieren
    ├── seo-internal-linker-SKILL.md   ← Interne Verlinkungsstrategie
    ├── seo-internal-linker.skill      ← (Executable Version)
    ├── seo-linking-knowledge-base.md  ← 15 Linking-Prinzipien (Referenz)
    │
    └── ── TECHNISCHES SEO ──
        ├── tech-seo-architecture_SKILL.md      ← Site-Architektur & URL-Struktur
        ├── tech-seo-crawl-indexation_SKILL.md   ← Crawling, Indexierung, robots.txt
        ├── tech-seo-html-onpage__SKILL.md       ← HTML On-Page SEO (Schema, Headings)
        ├── tech-seo-html-onpage.skill           ← (Executable Version)
        └── tech-seo-performance_SKILL.md        ← Core Web Vitals, Page Speed
```

### Datei-Konventionen
- **`*.md`** — Knowledge Base / Skill-Dokumentation (lesbar, Referenz)
- **`*.skill`** — Executable Skill-Dateien (für Claude Code Skill-System)
- **`*_SKILL.md` / `*-SKILL.md`** — Ausführliche Markdown-Version eines Skills
- Dateien existieren teilweise in beiden Formaten (.md + .skill)

---

## 3. CONTENT-PIPELINE — WORKFLOW

Die Skills bilden eine **sequenzielle Pipeline** zur Erstellung von SEO-optimiertem Content:

```
┌─────────────────────────────────────────────────────────────────┐
│  PLANUNG & RESEARCH                                             │
│                                                                 │
│  topical-map-generator  →  Gesamtstrategie & Seitenstruktur    │
│  QUERY-FANOUT-GENERATOR →  Keyword-Expansion via Gemini API    │
│  SERP_OUTLINE_RESEARCH  →  SERP-Scraping: PAAs, Outlines      │
└────────────────────────────────┬────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  OUTLINE & BRIEFING                                             │
│                                                                 │
│  seo-outline-generator  →  Hierarchische H1-H4 Outline         │
│  seo-briefing-generator →  Detaillierte Schreibanweisungen     │
└────────────────────────────────┬────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT-ERSTELLUNG                                             │
│                                                                 │
│  SEO-GEO-WRITER         →  Maschinen-lesbarer GEO-Artikel     │
│  ARTIKEL-HUMANIZER      →  Natürliche Sprache (Humanisierung)  │
│  seo-intro-writer       →  Optimiertes Intro                    │
│  seo-conclusion-writer  →  Optimiertes Fazit                    │
│  article-proofreader    →  Qualitätskontrolle                   │
└────────────────────────────────┬────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  OPTIMIERUNG & FINISHING                                        │
│                                                                 │
│  seo-meta-generator     →  5 Title/Meta-Description-Varianten  │
│  SEO-IMAGE-ALT-URL      →  Alt-Tags & Bild-URLs (Deutsch)     │
│  featured-image-generator→  Bild-Generierung                   │
│  seo-internal-linker    →  Max. 3 interne Links pro Artikel    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. ZENTRALE KONTEXTDATEIEN

### `brand-context.md` — Marken-Guide
Enthält **alles** zur Marke der jeweiligen Website:
- Brand Name, Legal Operator, Lizenzen
- Zielgruppe & Persona
- Brand Voice & Tone (Du-Form, direkt, Anti-Jargon)
- CTAs (primär & sekundär)
- Value Propositions & USPs
- Pain Points & Problem-Agitate-Solve Narrative
- Produktkatalog mit Preisen und Deckungen
- Social Proof & Testimonials
- Navigation & URL-Struktur
- Visual Identity (Farben, Typo, Bilder)
- FAQ-Bank
- Competitive Positioning

**WICHTIG:** Dieses Dokument muss **pro Zielgruppe angepasst** werden. Es ist das Herz jeder neuen Website.

### `ICP.md` — Ideal Customer Profile
Detailliertes Profil der Zielgruppe:
- Demografik & visuelles Profil (für Bildauswahl)
- Markt-Diagnose & Wissensstand
- Schmerzpunkte & Ängste (mit Original-Zitaten)
- Einwände & Gegenargumente
- Sprachliches Lexikon (Begriffe die funktionieren / vermeiden)
- Customer Journey (Trigger → Suche → Evaluierung → Abschluss)
- Versicherungs-Kontext (branchenspezifische Risiken)
- Website-Strategie (Was funktioniert / Was nicht)
- Design-Richtlinien & empfohlene Seitenstruktur
- SEO-Keywords

**WICHTIG:** Dieses Dokument muss **pro Zielgruppe komplett neu geschrieben** werden.

---

## 5. ANPASSUNG AUF NEUE ZIELGRUPPEN

### Schritt-für-Schritt: Neue Branche aufsetzen

1. **ICP.md anpassen** — Komplett für die neue Zielgruppe neu schreiben:
   - Persona (Demografie, Arbeitsumgebung, Psychografie)
   - Branchenspezifische Risiken & Versicherungsbedarf
   - Schmerzpunkte & Ängste mit konkreten Szenarien
   - Sprachliches Lexikon der Branche
   - Relevante Keywords

2. **brand-context.md anpassen** — Für die neue Marke/Domain:
   - Brand Name & Domain aktualisieren
   - Zielgruppe & Persona aktualisieren
   - Produkte & Preise branchenspezifisch anpassen
   - CTAs & Headlines anpassen
   - FAQ-Bank branchenspezifisch erstellen
   - URL-Struktur definieren
   - E-Mail: `info@fixversichert.de`
   - Telefonnummern entfernen (kein Telefonservice)
   - Impressum: https://unserkunde.de/impressum/
   - Datenschutz: https://unserkunde.de/datenschutz/

3. **Topical Map generieren** — `topical-map-generator` ausführen für ca. 10 Seiten

4. **Content-Pipeline durchlaufen** — Pro Seite:
   - SERP Research → Outline → Briefing → Artikel → Intro/Conclusion → Meta → Bilder → Links

### Konstanten (gelten für ALLE Zielgruppen)
- Impressum: https://unserkunde.de/impressum/
- Datenschutz: https://unserkunde.de/datenschutz/
- E-Mail: info@fixversichert.de
- Kein Telefonservice — Telefonnummern nie anzeigen
- Sales-Landingpage als Startseite (Cold Outreach optimiert)
- Trust-Aufbau steht im Vordergrund
- Eigener Tarifrechner pro Zielgruppe
- Versicherungsmakler-Abwicklung

---

## 6. OPERATING PRINCIPLES (aus `claude/CLAUDE.md`)

### 3-Layer-Architektur
1. **Directive (Was tun)** — Die `.md` Skill-Beschreibungen und Knowledge Bases
2. **Orchestration (Entscheidung)** — Claude Code als intelligenter Router
3. **Execution (Ausführung)** — Deterministische Scripts in `execution/`

### Kernprinzipien
- **Tools first** — Bevor du ein Script schreibst, prüfe ob eines in `execution/` existiert
- **Self-anneal** — Bei Fehlern: Fix → Test → Directive updaten → System wird stärker
- **Directives sind lebende Dokumente** — Lerne und aktualisiere, aber überschreibe nicht ohne zu fragen

### Verzeichnisse
- `.tmp/` — Temporäre Dateien (nie committen)
- `execution/` — Python Scripts
- `directives/` — SOPs in Markdown
- `.env` — API Keys und Umgebungsvariablen

---

## 7. SKILL-REFERENZ (Kurzübersicht)

| Skill | Zweck | Input | Output |
|-------|-------|-------|--------|
| **topical-map-generator** | Topical Authority Map & Seitenstruktur | Central Entity, USP, CSI | Master Map (Root→Seed→Node) |
| **QUERY-FANOUT-GENERATOR** | Keyword → Research Queries | Einzelnes Keyword | 3+ Queries, Research Brief |
| **SERP_OUTLINE_RESEARCH** | SERP-Analyse | Target Keyword | PAAs, Related Searches, Competitor Outlines |
| **seo-outline-generator** | Artikel-Outline | Keyword + SERP-Daten | H1-H4 Outline |
| **seo-briefing-generator** | Schreibanweisung | Outline + Persona + Brand | Detailliertes Briefing |
| **SEO-GEO-WRITER** | GEO-Artikel | Briefing + Research | Entity-zentrierter Artikel |
| **ARTIKEL-HUMANIZER** | Text humanisieren | KI-generierter Text | Natürlich klingender Text |
| **seo-intro-writer** | Intro schreiben | Fertiger Artikel | Optimiertes Intro |
| **seo-conclusion-writer** | Fazit schreiben | Fertiger Artikel | Strukturiertes Fazit |
| **article-proofreader** | Korrektur | Artikel | Korrigierter Artikel |
| **seo-meta-generator** | Meta Tags | Artikel + Keyword | 5 Title/Description-Varianten |
| **SEO-IMAGE-ALT-URL** | Bild-SEO | H1 Titel | Alt-Tag + Dateiname (DE) |
| **featured-image-generator** | Bilder | Titel + Konzept | KI-generiertes Bild |
| **seo-internal-linker** | Interne Links | Artikel + Zielseiten-Liste | Max 3 Link-Empfehlungen |

---

## 8. TECHNISCHES SEO — REFERENZ-SKILLS

| Skill | Themen |
|-------|--------|
| **tech-seo-architecture** | Domain-Setup, URL-Struktur, Silos, Click Depth, Breadcrumbs |
| **tech-seo-crawl-indexation** | robots.txt, Sitemaps, Redirects, 4XX/5XX Errors |
| **tech-seo-html-onpage** | Title Tags, Headings, Schema/JSON-LD, Open Graph |
| **tech-seo-performance** | Core Web Vitals, Image Optimization, Lazy Loading, HTTPS |

---

## 9. SPRACH- & CONTENT-REGELN

### Allgemein (alle Zielgruppen)
- **Sprache:** Deutsch
- **Anrede:** Du-Form (informal) — niemals Sie
- **Ton:** Direkt, empathisch, anti-Jargon, confident
- **Sätze:** Kurz und prägnant, besonders in Hero-Sections
- **CTAs:** Verb-first, Imperativ, mit Urgency ("Jetzt", "Heute")
- **Preise:** Immer Monatsrate UND Jahrespreis, mit "ab ca." / "startet ab"
- **Banned Words** (aus HUMANIZER-RULES): delve, landscape, crucial, robust, leverage, innovative, transformative, comprehensive, cutting-edge, utilize, etc.

### Humanizer-Regeln (Kurzfassung)
- Entity-zentrisch schreiben (Subjekt → Prädikat → Objekt)
- Answer-First-Protokoll (Kernaussage vor Erklärung)
- Keine Em-Dashes (—), stattdessen Kommata oder neue Sätze
- Keine Spekulationen oder Hedging-Sprache
- Sentence Case für alle Headings
- Radikale Einfachheit: Schulabschluss-Niveau, keine Fachsprache ohne Erklärung

---

## 10. WICHTIGE HINWEISE

### Was NICHT auf die Websites gehört
- Telefonnummern (kein Telefonservice)
- "Kostenloser Sofortvergleich"-CTAs die nach E-Mail fragen
- Lead-Generierungs-Sprache
- Generische Stockfotos (Anzüge, Handshakes, Co-Working)
- Corporate-Speak oder Versicherungsdeutsch

### Was IMMER auf die Websites gehört
- E-Mail: info@fixversichert.de (prominent)
- Link zu Impressum: https://unserkunde.de/impressum/
- Link zu Datenschutz: https://unserkunde.de/datenschutz/
- ProvenExpert / Bewertungen als Trust-Signal
- Konkreter Schadensablauf (transparent, BEVOR Abschluss)
- Mobile-First Design
- Branchenspezifische Schadensbeispiele mit Euro-Beträgen

---

*Dokument erstellt: März 2026 — Für Claude Code bei der Erstellung von Gewerbeversicherungs-Websites*
