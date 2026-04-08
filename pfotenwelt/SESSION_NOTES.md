# Pfotenwelt v3.0.0 — Session-Zusammenfassung

## Projekt
Pfotenwelt ist ein Kawaii-Tierpflege-Mobilspiel (Phaser 3.80, Vite, JavaScript).
- Canvas: **414x736** (9:16, skaliert ~30% größer auf mobilen Geräten)
- Deployment: GitHub Pages auf thomas123111.github.io
- Branch: `claude/optimize-pfotenwelt-game-mH05r`

## Was in dieser Session gemacht wurde

### 1. Spritesheet-Richtungen — ENDGÜLTIG GELÖST
**Alle Sprites (Charaktere + Tiere) nutzen die gleiche Reihenfolge: RULD**
- Right(0-5), Up(6-11), Left(12-17), Down(18-23)
- Gilt für Characters (walkRow=2), Dogs (walkRow=4), Small/Tiny Animals (walkRow=2)
- Datei: `BootScene.js:119-137` — `createAnims(key, walkRow, order)` Funktion
- **NICHT MEHR ÄNDERN** — user-verifiziert, funktioniert korrekt!

### 2. Canvas-Skalierung (540x960 → 414x736)
- main.js: `width: 414, height: 736`
- Alles ~30% größer auf mobilen Geräten (scale factor 2.95x statt 2.26x)
- Overflow-Fixes in: ShelterScene (Grid), MergeBoardScene (CELL_SIZE 68→52), SchoolScene (dynamic button width), TimingPuzzle (bar width), SwipePuzzle (bar width), SortPuzzle (pet spacing), AdoptionScene (card height)

### 3. Onboarding-System (2 neue Scenes)
- **OnboardingScene** — 4-Step-Wizard: Name → Geschlecht → Land → Vorliebe (Hund/Katze/Beides)
- **CompanionSelectScene** — Begleiter-Tier wählen + benennen
- Profil gespeichert in `save.profile` (vertrieblich nutzbar)
- Begleiter in `save.companions[]`
- Boot-Flow: BootScene prüft `save.onboardingDone`, leitet zu Onboarding oder Town

### 4. Tag/Nacht-Zyklus
- 30 Min Echtzeit = 1 In-Game-Tag
- 4 Phasen: morning(0-25%), afternoon(25-50%), evening(50-75%), night(75-100%)
- Visual: Gras-Farbe ändert sich, Overlays für Abend/Nacht
- SaveManager: `updateDayCycle()`, `getDayProgress()`, `getTimeOfDay()`
- Events alle 2 In-Game-Tage (`shouldTriggerEvent()`)

### 5. Gebäude-Freischaltung (sequenziell, im Uhrzeigersinn)
**Unlock-Reihenfolge (BUILDING_UNLOCK_ORDER in SaveManager.js):**
1. 🏠 Tierheim (frei, Lv.1) — top center (900,180)
2. 🧩 Werkstatt (frei, Lv.1) — right top (1650,400)
3. 🏥 Tierarzt (150❤, Lv.3) — right mid (1650,800)
4. ✂️ Salon (300❤, Lv.5) — right bottom (1650,1150)
5. 🛒 Futterladen (400❤, Lv.7) — bottom center (900,1250)
6. 🎓 Schule (600❤, Lv.10) — left bottom (150,1150)
7. 🏨 Hotel (900❤, Lv.13) — left mid (150,800)
8. 🌳 Spielplatz (1200❤, Lv.16) — left top (150,400)
9. ☕ Café (1500❤, Lv.20) — top left (500,180)
10. 🤝 Gilde (2000❤, Lv.25) — top right (1300,180)
11. 🌾 Bauernhof (3000❤, Lv.30) — Farm-Portal unten

**Fog of War:** Sektorbasiert (rechts/unten/links), weicht im Uhrzeigersinn zurück.
Nebel mit animierten Mist-Kreisen + grünen Sparkle-Partikeln.

### 6. Progressive Farm-Freischaltung
**FARM_UNLOCK_ORDER in SaveManager.js:**
1. Scheune (frei, Farm-Lv.1)
2. Kuhstall (500❤, Farm-Lv.2)
3. Hühnerstall (800❤, Farm-Lv.3)
4. Futterstation (1000❤, Farm-Lv.5)
5. Silo & Lieferung (1500❤, Farm-Lv.7)

### 7. Zwei neue Gebäude
- **FutterladenScene** (`super('Futterladen')`) — 3 Futtersorten (Basic/Premium/Bio), Tagesangebote, Vorrats-System
- **HundespielplatzScene** (`super('Spielplatz')`) — 3 Aktivitäten (Frisbee/Agility/Freies Spielen)

### 8. Story (14 Kapitel)
- Backstory: Oma Helga vermacht Tierheim in Pfotendorf
- Jede Gebäude-Freischaltung triggert ein Story-Kapitel
- StoryScene akzeptiert `{ chapter: <objekt> }` UND `{ chapterId: <string> }`
- Trigger-Typen: `onboarding`, `level`, `pets`, `adopted`, `collection`, `legendary`, `station_unlock`

### 9. HUD
- **HTML-basiert** (nicht Phaser!) — `<div id="hud">` in index.html
- `position: fixed; top: 0` — immer am oberen Browserrand
- Aktualisiert per DOM aus TownScene: `document.getElementById('hud-hearts').textContent = ...`
- Gradient-Hintergrund, text-shadow für Lesbarkeit

### 10. Sonstige Fixes
- ShelterScene: Herz-Buttons immer tappbar + "Nicht genug ❤️!" Feedback
- StoryScene Crash gefixt (akzeptiert jetzt chapterId + chapter)
- Auto-Reset alter Saves für v3.0 Onboarding
- Companion-Follow Feature erstellt und wieder entfernt (war zu jumpy)
- Debug-Labels entfernt

## Wichtige Dateien
| Datei | Zweck |
|-------|-------|
| `src/main.js` | Game config (414x736), Scene-Registrierung |
| `index.html` | HTML-HUD (`div#hud`), CSS |
| `src/scenes/BootScene.js` | Asset-Loading, Animation-Setup (RULD!), Boot-Routing |
| `src/scenes/OnboardingScene.js` | Spieler-Profil Setup |
| `src/scenes/CompanionSelectScene.js` | Begleiter-Wahl |
| `src/scenes/TownScene.js` | Overworld, Buildings, Fog, Day/Night, Walkers |
| `src/scenes/FarmScene.js` | Farm mit progressivem Unlock |
| `src/scenes/FutterladenScene.js` | Pet Food Store (NEU) |
| `src/scenes/HundespielplatzScene.js` | Dog Park (NEU) |
| `src/data/SaveManager.js` | Save-System, Unlock-Orders, Day/Night-Utils |
| `src/data/StoryData.js` | 14 Story-Kapitel, Event-System |
| `src/ui/Theme.js` | UI-Helpers (drawHeader, drawButton, etc.) |

## Bekannte offene Punkte
- Companion-Pet wird im Onboarding gewählt aber nicht in der Overworld angezeigt (Feature entfernt wegen Jumpiness — könnte als statischer NPC am Tierheim stehen)
- Puzzles werden ohne difficulty-Parameter aufgerufen (immer default 1)
- Puzzle-Themes werden nicht aus dem Kontext übergeben
- MergeBoard, Guild, Collection, DailyReward, Adoption, Event, Story Scenes haben KEINE Hintergründe
- Breed-Portraits (breed_*.png) könnten verbessert werden
- Kein Sound/Musik implementiert (MusicManager existiert aber keine Audio-Dateien)
- MenuScene wird übersprungen (Boot → direkt Town), könnte als Hauptmenü dienen

## Spritesheet-Referenz (NICHT ÄNDERN!)
```
Alle LimeZu-Spritesheets: RULD = Right(0-5), Up(6-11), Left(12-17), Down(18-23)
Characters: walkRow = 2, frameSize = 16x32
Dogs:       walkRow = 4, frameSize = 48x32
Small:      walkRow = 2, frameSize = 32x32
Tiny:       walkRow = 2, frameSize = 16x16
```

## OpenRouter API (für Bildgenerierung)
```bash
# API Key in pfotenwelt/.env (gitignored): OPENROUTER_API_KEY=sk-or-v1-...
# Modell: google/gemini-3.1-flash-image-preview ("Nano Banana 2")
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemini-3.1-flash-image-preview","messages":[{"role":"user","content":"prompt"}]}'
# Bild: response.choices[0].message.images[0].image_url.url (base64 data URI)
```
