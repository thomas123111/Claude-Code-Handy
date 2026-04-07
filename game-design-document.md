# Game Design Document: "Pfotenwelt" (Arbeitstitel)
## Tier-Pflege + Merge-Game mit echtem Charity-Impact

**Version:** 1.0
**Datum:** April 2026
**Zielgruppe:** Frauen 40+, Tierliebhaber, Facebook-Community (200k+)
**Plattform:** Android (primär), iOS (später), Web (Prototyp)

---

## 1. ELEVATOR PITCH

> Baue dein Traumtierheim auf! Merge Items, pflege Tiere, schalte Tierberufe frei - und spende dabei echtes Futter an Tiere in Not. Jede Spielsession hilft echten Tieren.

---

## 2. KERN-GAMEPLAY-LOOP (eine Session = 5-10 Minuten)

```
┌──────────────────────────────────────────────────────┐
│  1. ÖFFNE APP → Tiere begrüßen dich, Offline-Belohnungen  │
│  2. MERGE ITEMS → Kombiniere Gegenstände auf dem Board     │
│  3. ERFÜLLE AUFGABEN → "Bürste den Hund", "Füttere Katze"│
│  4. VERDIENE HERZEN → Währung für Upgrades                 │
│  5. UPGRADE STATIONEN → Tierarzt, Salon, Training etc.     │
│  6. VERMITTLE TIERE → Finde Familien → Echte Spende!       │
│  7. NEUE TIERE KOMMEN → Zyklus beginnt neu                 │
└──────────────────────────────────────────────────────┘
```

### Merge-Board (Hauptmechanik)
- 7x7 Grid
- Items spawnen über Generatoren (Futternapf, Spielzeugkiste etc.)
- 2 gleiche Items mergen → nächste Stufe
- Merge-Ketten: Gras → Blume → Busch → Baum → Garten
- Fertige Items werden für Aufgaben benötigt

### Aufgaben-System
- Jedes Tier hat Bedürfnisse: Futter, Pflege, Spielzeug, Medizin
- Aufgaben erscheinen als Sprechblasen über den Tieren
- Erfüllte Aufgaben → Herzen + XP + Fortschritt zur Vermittlung

---

## 3. TIERBERUFE / STATIONEN

Jede Station ist ein eigener Bereich den man freischaltet, ausbaut und upgraded.
Stationen generieren passive Einnahmen und haben eigene Mini-Mechaniken.

### Station 1: TIERHEIM (Start)
- Tiere aufnehmen, pflegen, vermitteln
- Gehege upgraden (Größe, Komfort, Dekoration)
- Kapazität: Start 3 Tiere, max 20
- **Merge-Items:** Futter, Betten, Spielzeug

### Station 2: TIERARZT-PRAXIS (freischaltbar ab Level 5)
- Kranke/verletzte Tiere behandeln
- Mini-Game: Diagnose stellen (Symptome zuordnen)
- Behandlungs-Items mergen (Verband → Salbe → Medizin → OP-Set)
- Geheilte Tiere → Bonus-Herzen + Spezial-Belohnungen
- **Merge-Items:** Medizin, Instrumente, Verbände

### Station 3: TIER-SALON / GROOMING (ab Level 10)
- Tiere waschen, bürsten, stylen
- Mini-Game: Fell bürsten (Swipe-Mechanik)
- Styling-Items mergen (Shampoo → Bürste → Schleife → Premium-Style)
- Gestylte Tiere → höherer Vermittlungs-Bonus
- **Merge-Items:** Pflegeprodukte, Accessoires

### Station 4: HUNDE-SCHULE / TRAINING (ab Level 15)
- Tieren Tricks beibringen
- Mini-Game: Timing-basiert (Tap im richtigen Moment)
- Training-Items mergen (Leckerli → Clicker → Hürde → Parcours)
- Trainierte Tiere → Wettbewerbe → Pokale → Prestige
- **Merge-Items:** Trainings-Ausrüstung

### Station 5: TIER-PENSION / HOTEL (ab Level 20)
- Fremde Tiere zur Betreuung aufnehmen (= passive Einnahmen)
- Luxus-Zimmer einrichten
- Items mergen für Ausstattung (Kissen → Sofa → Suite → VIP-Suite)
- Timer-basiert: Tiere bleiben X Stunden, dann Belohnung
- **Merge-Items:** Möbel, Dekoration

### Station 6: TIER-CAFÉ (ab Level 25)
- Katzen/Hunde-Café für Besucher
- Getränke und Snacks mergen
- Besucher kommen, interagieren mit Tieren → Herzen
- Einnahmen steigen mit Ausstattung
- **Merge-Items:** Essen, Getränke, Einrichtung

### Zukünftige Stationen (Updates)
- Tier-Fotostudio
- Reiterhof (Pferde)
- Aquarium
- Exoten-Station (Reptilien, Vögel)
- Gnadenhof (alte Tiere)

---

## 4. TIERE & SAMMLUNG

### Tier-Kategorien
| Kategorie | Rassen/Arten | Seltenheit |
|-----------|-------------|------------|
| Hunde | 20+ Rassen (Labrador, Dackel, Schäferhund...) | Common bis Legendary |
| Katzen | 15+ Rassen (Perser, Maine Coon, Siam...) | Common bis Legendary |
| Kleintiere | Hamster, Kaninchen, Meerschweinchen | Common bis Rare |
| Vögel | Wellensittich, Papagei, Kanarienvogel | Rare bis Epic |
| Exoten | Schildkröte, Gecko, Chinchilla | Epic bis Legendary |

### Seltenheitsstufen
- **Common** (60%) - Häufig, einfach zu pflegen
- **Rare** (25%) - Besondere Bedürfnisse, mehr Belohnungen
- **Epic** (12%) - Seltene Rassen, spezielle Aufgaben
- **Legendary** (3%) - Extrem selten, einzigartige Animationen

### Tier-Mechaniken
- Jedes Tier hat: Name, Rasse, Persönlichkeit, Bedürfnisse, Glücks-Level
- Glückliche Tiere generieren mehr Herzen
- Sammelbuch: Alle Rassen katalogisieren (Sammel-Sucht!)
- Tier-Geschichten: Jedes Tier hat eine kleine Hintergrund-Story

---

## 5. MONETARISIERUNG

### Primär: Rewarded Ads (70% des Umsatzes erwartet)
- "Schau Werbung für 50 extra Herzen"
- "Gratis Merge-Booster (30s Werbung)"
- "Verdopple deine Vermittlungs-Belohnung"
- "Beschleunige Behandlung beim Tierarzt"
- **Placement:** Nach jeder Tier-Vermittlung, bei Energie-Leer, bei Booster-Angebot
- **Frequenz:** Max 1 Interstitial pro 3 Minuten, Rewarded unbegrenzt

### Sekundär: In-App Purchases
| Paket | Preis | Inhalt |
|-------|-------|--------|
| Starter-Paket | 2,99€ | 500 Herzen + 1 Rare Tier |
| Herzen x1000 | 4,99€ | 1000 Herzen |
| Herzen x5000 | 19,99€ | 5000 Herzen + 3 Rare Tiere |
| VIP-Pass (Monat) | 5,99€/Mo | Keine Werbung + tägliche Boni + exklusive Tiere |
| Charity-Paket | 9,99€ | 2000 Herzen + 5kg echtes Futter gespendet |

### Charity-Integration
- **Automatisch:** 5% aller Werbeeinnahmen → Futterspende über gGmbH
- **Sichtbar:** Spenden-Zähler im Spiel ("Gemeinsam: 2.350kg Futter gespendet!")
- **Charity-Pakete:** Spieler kauft direkt → Teil geht als echte Spende
- **Events:** Monatliche Spenden-Challenges ("Community-Ziel: 500kg!")
- **Transparent:** Monatlicher Bericht auf Social Media mit Fotos der gespendeten Ware

---

## 6. RETENTION-MECHANIKEN

### Daily Login (7-Tage-Streak)
- Tag 1: 50 Herzen
- Tag 2: 100 Herzen
- Tag 3: 1 Rare-Tier-Chance
- Tag 4: 200 Herzen
- Tag 5: Merge-Booster
- Tag 6: 500 Herzen
- Tag 7: Guaranteed Rare Tier + 1000 Herzen
- Streak-Reset bei Pause → Motivation täglich zu öffnen

### Energie-System
- 100 Energie, regeneriert 1/Minute (= ~1:40h für volle Ladung)
- Merge-Aktion: 1 Energie
- Aufgabe erfüllen: 3 Energie
- Mini-Game: 5 Energie
- → Ca. 4-5 Sessions/Tag à 5-10 Minuten (ideal für Casual)

### Events (wöchentlich/monatlich)
- **Rassenwoche:** Bestimmte Rasse hat erhöhte Chance
- **Charity-Challenge:** Community sammelt gemeinsam
- **Saisonale Events:** Weihnachten, Ostern, Weltkatzentag etc.
- **Limited Tiere:** Nur während Event verfügbar (FOMO)

### Soziale Features
- Freunde besuchen (ihr Tierheim anschauen)
- Tiere an Freunde vermitteln
- Community-Spenden-Rangliste
- Facebook-Teilen für Bonus-Herzen

---

## 7. TECH-STACK & UMSETZUNG

### Option A: Phaser.js (Web-first)
- **Pro:** Schneller Prototyp, Web-Version sofort spielbar, unser Know-how
- **Con:** Performance-Limits bei vielen Sprites, App-Store via Capacitor
- **Empfehlung für:** MVP / Prototyp / Testphase

### Option B: Unity (Store-ready) ← EMPFOHLEN für Produktion
- **Pro:** Bessere Performance, nativer App-Store, Asset Store, Standard der Industrie
- **Con:** Andere Sprache (C#), längere Entwicklung
- **Empfehlung für:** Finale Version wenn Konzept validiert ist

### Empfohlener Weg
1. **Phase 1 (2-4 Wochen):** Phaser-Prototyp mit Kern-Merge + 3 Tieren
2. **Phase 2 (1-2 Wochen):** Test mit 100 Followern (Facebook-Post)
3. **Phase 3:** Wenn positiv → Unity-Produktion oder Phaser polieren
4. **Phase 4:** Soft-Launch im DACH-Raum
5. **Phase 5:** Vollständiger Launch + Charity-Marketing

---

## 8. MVP (Minimum Viable Product)

Was braucht der ERSTE spielbare Prototyp?

### Must-Have (MVP)
- [ ] Merge-Board (7x7) mit 3 Item-Ketten
- [ ] 5 Tiere (3 Hunde, 2 Katzen) mit Bedürfnissen
- [ ] Tierheim-Ansicht (2D, einfach)
- [ ] Aufgaben-System (Tier füttern/pflegen)
- [ ] Herzen als Währung
- [ ] Tier-Vermittlung (= Level abschließen)
- [ ] 10 Level / Kapitel
- [ ] Daily Login Rewards
- [ ] 1 Station: Tierheim

### Nice-to-Have (Post-MVP)
- [ ] Weitere Stationen (Tierarzt, Salon, Schule)
- [ ] Rewarded Ads
- [ ] IAP
- [ ] Charity-Zähler
- [ ] Sammel-Buch
- [ ] Saisonale Events
- [ ] Soziale Features
- [ ] Sound & Musik

---

## 9. MARKETING-PLAN

### Phase 1: Teaser (vor Launch)
- Facebook-Post: "Wir entwickeln ein Spiel - und jedes Spielen hilft echten Tieren!"
- Behind-the-Scenes Content (Entwicklung zeigen)
- Umfrage: "Welche Tiere wollt ihr im Spiel sehen?"
- → Baut Hype + Community-Ownership auf

### Phase 2: Beta-Test
- 100-500 Follower als Beta-Tester einladen
- Exklusives "Gründer-Abzeichen" im Spiel
- Feedback sammeln, iterieren

### Phase 3: Launch
- Facebook-Video: "Jetzt spielen und echten Tieren helfen!"
- Ersten Spenden-Beweis posten (Foto von Futterlieferung)
- Follower bitten das Spiel zu teilen
- Lokale Presse: "Gemeinnützige Organisation launcht Charity-Game"

### Phase 4: Wachstum
- TikTok/Instagram: Süße Tier-Clips aus dem Spiel
- Kooperation mit Tier-Influencern
- Facebook-Ads mit Charity-Angle (niedrigere CPIs wegen Trust)

---

## 10. UMSATZ-PROGNOSE (konservativ)

### Annahmen
- 200k Facebook-Follower
- 5% installieren das Spiel = 10.000 Installs
- 20% spielen täglich (DAU) = 2.000
- ARPDAU (Ads + IAP): $0.10

### Monat 1-3 (organisch)
- 2.000 DAU × $0.10 × 30 Tage = **$6.000/Monat**

### Monat 6 (mit Wachstum + Paid UA)
- 10.000 DAU × $0.12 = **$36.000/Monat**

### Monat 12 (optimistisch)
- 30.000 DAU × $0.15 = **$135.000/Monat**

### Charity-Impact
- Bei 5% der Einnahmen: $300-6.750/Monat für Futterspenden
- = 150-3.375kg Futter/Monat (bei ~2€/kg)

---

*Dokument erstellt: April 2026*
*Für: Tier-Charity-Game Projekt*
