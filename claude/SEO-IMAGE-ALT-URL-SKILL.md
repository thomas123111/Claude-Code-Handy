---
name: seo-image-alt-url
description: >
  Generates one SEO-optimized alt tag and one SEO-optimized image URL (filename) for a featured image, based on the article title (H1). 
  Use this skill immediately after a featured image has been generated or selected, or whenever the user needs an alt tag and/or image filename for a blog post, article, or landing page image. 
  Trigger on phrases like "generate alt tag", "create image URL", "rename image", "SEO for image", "alt text for featured image", "image filename", "what should I name this image", or any request combining images and SEO. 
  Output is always in German. Produces exactly one alt tag and one image URL — no image prompts are generated here.
---

# SEO Image Alt Tag & URL Generator

## Purpose

This skill is used **after** a featured image has been created. It takes the article's H1 title (and optionally a brief description of the image) and outputs:

1. **One optimized Alt Tag** — for accessibility and on-page SEO
2. **One optimized Image URL** — the SEO-friendly filename (kebab-case `.png`)

No image prompts are generated here. That is handled by a separate skill.

---

## Inputs

| Input | Required | Notes |
|---|---|---|
| Article H1 title | ✅ Yes | The main headline of the article |
| Image description / concept | ⚪ Optional | Brief description of what the image shows; improves specificity |

If the image description is not provided, derive the alt tag and URL purely from the H1.

---

## Instructions

### Step 1 — Analyze the H1

- Identify the **primary keyword** (usually the main topic: the thing, action, or concept being described).
- Identify any **secondary modifiers** (e.g., "Kosten", "Vergleich", "Anleitung", "Gefahr", "Wahl").
- Note: the primary keyword should lead in both the alt tag and the URL.

### Step 2 — Write the Alt Tag

Rules:
- **Not a full sentence.** Use noun phrases connected with "und", "mit", or "bei".
- **Lead with the primary keyword.** The most important SEO term comes first.
- **Include the specific angle** of the article (e.g., cost, comparison, guide, danger).
- **Maximum ~10 words.** Concise but descriptive.
- **No filler words** like "ein", "eine", "der", "die", "das" at the start.
- If an image concept is provided, it should inform what's described — the alt tag verbalizes what someone would *see* in the image.

✅ Good: `Hundekrankenversicherung Selbstbeteiligung Funktion und Kostenkalkulation`  
❌ Bad: `Ein Hund sitzt auf dem Boden während sein Besitzer einen Vertrag liest`

### Step 3 — Write the Image URL

Rules:
- Derive **directly from the Alt Tag** — same core terms, same order priority.
- Remove stop words: `und`, `mit`, `bei`, `von`, `für`, `in`, `der`, `die`, `das`, `ein`, `eine`, `oder`, `zu` — unless their removal creates ambiguity.
- **Strictly lowercase kebab-case.**
- End with `.png`.
- Keep it **concise**: aim for 4–7 meaningful words (hyphenated).
- The primary keyword must appear **first**.

✅ Good: `hundekrankenversicherung-selbstbeteiligung-funktion-kosten.png`  
❌ Bad: `ein-hund-und-sein-besitzer-beim-tierarzt.png`

---

## Output Format

Always output exactly this structure, nothing more:

---

**Alt Tag:**
[The optimized alt text phrase]

**Image URL:**
`[the-optimized-kebab-case-filename.png]`

---

## Examples

**Input:**
- H1: `Hundekrankenversicherung Selbstbeteiligung: Funktion, Arten und richtige Wahl`
- Image concept: Person reviewing insurance documents, calculator on table, dog in background

**Output:**

---

**Alt Tag:**
Hundekrankenversicherung Selbstbeteiligung Funktion und Kostenkalkulation

**Image URL:**
`hundekrankenversicherung-selbstbeteiligung-funktion-kosten.png`

---

**Input:**
- H1: `Katzenfutter im Vergleich: Nass vs. Trocken`
- Image concept: Two food bowls side by side, one with wet food, one with dry kibble

**Output:**

---

**Alt Tag:**
Katzenfutter Vergleich Nassfutter und Trockenfutter Unterschied

**Image URL:**
`katzenfutter-vergleich-nassfutter-trockenfutter.png`

---

## Language

All output must be in **German**, regardless of the input language.

---

## Notes

- This skill outputs **exactly one** alt tag and **one** image URL per call. If the user wants multiple variations, they should invoke the skill multiple times or explicitly request variants.
- Do not generate image prompts — that is out of scope for this skill.
- Do not include explanations or commentary in the output unless the user asks for them.
