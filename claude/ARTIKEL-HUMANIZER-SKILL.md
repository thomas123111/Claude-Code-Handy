---
name: artikel-humanizer
description: >
  Rewrites AI-generated or corporate text into natural, human-sounding content using a strict
  Anti-AI, Entity-Centric, and Everyday Language protocol. Use this skill whenever the user
  wants to humanize text, remove AI patterns from an article, make writing sound more natural,
  rewrite content to pass AI detectors, apply anti-AI writing rules, humanize a blog post or
  article, or clean up corporate/academic stiffness. Trigger this skill even if the user just
  says "rewrite this," "make this sound human," "clean this up," or pastes a block of text
  asking for a rewrite. Always use this skill when entity-centric SEO writing or semantic
  triple structure is requested.
---

# Artikel Humanizer Skill

## What This Skill Does

This skill rewrites text using a strict humanization protocol. The output must read like a
knowledgeable human wrote it - not an AI, not a corporate copywriter, and not an academic.

**Output rule:** Return ONLY the rewritten text. No preamble, no meta-commentary, no
"Here is the rewritten version." Just the text.

---

## Core Execution Protocol

Before writing a single word, read the full rules in `references/HUMANIZER-RULES.md`.
Then apply every rule to the rewrite.

After writing, run through the **Final Execution Checklist** at the bottom of
`references/HUMANIZER-RULES.md` before outputting anything.

---

## Quick-Reference: The 5 Non-Negotiables

These are the most commonly violated rules. Check these first:

1. **No banned words** - See the full blacklist in the rules file. Key ones: "delve," "leverage,"
   "enhance," "crucial," "robust," "landscape" (metaphorical), "testament," "vibrant," "boasts."
2. **No em-dashes (—)** - Replace every em-dash with " - " (space, hyphen, space).
3. **Answer-first after every heading** - The first sentence after any heading is the direct answer.
4. **No inline-header bullet lists** - Never use `- **Header:** Description` format.
5. **No speculation** - Remove all "could," "might," "should," "would." State facts directly.

---

## Output Format Rules

- Output **only** the rewritten text
- Keep all original headings exactly as they are - do not change or replace them
- Use straight quotes (`"`) and straight apostrophes (`'`) - never curly/smart quotes
- Use numeric digits ("5" not "five")
- No semicolons, no emojis, no hashtags, no asterisks (except markdown bold)
- Bold only the direct answer or key entity - never bold the query term itself

---

## When to Read the Full Rules File

Always read `references/HUMANIZER-RULES.md` before starting any rewrite. It contains:

- Complete banned vocabulary blacklist (Part 4)
- All structural and formatting rules with examples (Parts 1-3)
- The final execution checklist (Part 5)
- Full examples of correct vs. incorrect output (Part 6)
