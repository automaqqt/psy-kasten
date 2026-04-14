# Agent Instructions: PDF-to-Test Pipeline

You are an AI agent tasked with turning a **psychological test description (PDF)** into a working implementation inside the psyKasten platform. This document tells you exactly how to do that.

## Overview

psyKasten is a Next.js web app for cognitive assessments. Tests follow a standardized flow: welcome → tutorial → demo → practice → countdown → test → results. You will read a PDF describing a test, extract the key parameters, generate the scaffolding, then customize the generated files.

## Step-by-Step Workflow

### Phase 0: Pre-flight Check

Before starting, run `npm run build` to verify the project compiles. Fix any pre-existing lint errors (unescaped entities, missing imports) so they don't block your build later. This also confirms your environment is set up correctly.

### Phase 1: Analyze the PDF

Read the PDF thoroughly. Extract and write down:

1. **Test identity**
   - Full name (e.g., "Wisconsin Card Sorting Test")
   - Standard abbreviation (e.g., "wcst") — this becomes the test ID
   - What cognitive domain it measures (memory, attention, executive function, etc.)
   - Relevant tags from the existing set: `tag_memory`, `tag_attention`, `tag_concentration`, `tag_planning`, `tag_problem_solving`, `tag_executive_function`, `tag_visual_spatial`, `tag_sequential`, `tag_reaction_time`, `tag_inhibition`, `tag_processing_speed`, `tag_visual_search`, `tag_language`, `tag_working_memory`

2. **Stimuli**
   - What is shown to the participant? (shapes, colors, numbers, letters, images, sequences, grids, etc.)
   - Stimulus timing: how long is each shown? Is there an inter-stimulus interval (ISI)?
   - Is timing fixed or randomized? What are the min/max ranges?
   - Are there multiple stimulus types (go/no-go, target/distractor, etc.)?

3. **Response**
   - How does the participant respond? (click, keypress, drag, sequence recall, etc.)
   - Which keys? (spacebar, specific letter keys, mouse click, touch)
   - Is response time measured? Is accuracy measured? Both?
   - Is there a response deadline/window?

4. **Trial structure**
   - How many trials? Or is it time-based (e.g., 5 minutes)?
   - Are trials grouped into blocks or levels?
   - Does difficulty increase? How? (more items, shorter timing, added distractors)
   - Is there an adaptive/staircase procedure?

5. **Scoring**
   - What are the primary outcome measures? (mean RT, accuracy %, span, total score, error types)
   - Are there secondary measures? (false alarms, omissions, variability)
   - How is the "main score" summarized in one line? (this goes into `mainScoreFormatters.js`)

6. **Practice**
   - Is there a practice phase? How does it differ from the real test?
   - Fewer trials? Feedback shown? Easier parameters?

7. **Special mechanics**
   - Does the test need landscape mode? (set `landscapeHint: true` in the page)
   - Does it need a grid/board layout? (like Corsi blocks or TOL pegs)
   - Does it need audio? (beeps, tones)
   - Does it need images/SVGs beyond simple shapes?

### Phase 2: Generate the scaffold

Run the generator with extracted parameters:

```bash
npm run create-test -- \
  --id "{lowercase-abbreviation}" \
  --name "{Full Test Name}" \
  --color "{hex color}" \
  --icon "{emoji}" \
  --tags "{comma-separated tag keys}"
```

**Choosing a color**: Pick a hex color that doesn't conflict with existing tests:
- Corsi: `#4a6fa5` (blue)
- TOL: `#ff9800` (orange)
- AKT: `#20c997` (green)
- WTB: `#6f42c1` (purple)
- PVT: `#00bcd4` (cyan)
- GNG: `#e91e63` (pink)
- RPM: `#795548` (brown)
- WCST: `#d32f2f` (red)

**Choosing an icon**: Pick an emoji that visually suggests the test. Look at existing ones for reference (🧩 🗼 🎯 🔮 ⚡ 🎯 🔤 🃏).

This creates 9 files and patches 7 integration files. All generated code compiles and runs immediately — it renders a placeholder reaction-time test.

**Important**: The generated template is a **PVT-style simple reaction-time test** (wait → stimulus appears → press spacebar → measure RT). The amount of rewriting depends on how similar your test is to that paradigm:
- **Simple RT / Vigilance** (PVT-like): Minimal changes — mostly just tuning parameters and text.
- **Go/No-Go / Choice RT**: Moderate changes — replace single stimulus with multiple types, update response handler.
- **Card sorting / Grid / Sequence / Matrix**: Heavy rewrite — you'll keep the welcome/tutorial/demo/practiceComplete/countdown screens but replace the entire playing area, response logic, data model, results, and most locale keys.

For mouse-click tests (no keyboard), set `RESPONSE_KEY = null` in `data.js` and remove the keyboard event listener from `test.js`.

### Phase 3: Customize the generated files

Work through these files in order. The generated code has `// TODO:` markers showing exactly where to make changes.

#### 3.1 — `components/tests/{id}/data.js`

This is the smallest file. Define your test's configuration:

```javascript
export const DEFAULT_SETTINGS = {
  // For time-based tests:
  testDuration: 300,        // seconds
  // For trial-based tests:
  totalTrials: 60,
  // Timing:
  stimulusDuration: 500,    // ms — how long stimulus is shown
  minInterval: 1000,        // ms — min ISI
  maxInterval: 3000,        // ms — max ISI
  responseWindow: 2000,     // ms — max time to respond
  // Test-specific:
  // ... add whatever your test needs
};

export const PRACTICE_SETTINGS = {
  // Same keys as DEFAULT_SETTINGS but easier/shorter
  // Typically: fewer trials, longer response windows, shorter duration
};

export const THEME_COLOR = '#xxxxxx';
export const RESPONSE_KEY = ' '; // spacebar, or 'f', 'j', etc.
```

**Key decisions**:
- If the PDF specifies exact parameter values, use those
- If ranges are given, use the midpoint as default and make it configurable in settings
- Practice should be ~20-30% of the real test length

#### 3.2 — `components/tests/{id}/test.js` (the big one)

This is the main test component (~300 lines). The template uses `useTestEngine` hook which provides:
- `translate(key, params)` — i18n with fallback
- `gameAreaRef` — ref for the fullscreen container
- `requestFullscreen()` / `exitFullscreen` — fullscreen management
- `addTimer(id)` / `clearAllTimers()` — timer cleanup registry
- `startCountdown(onComplete)` — 3-2-1-GO! countdown, calls `onComplete` when done
- `showOverlayMessage(key, duration, type)` — feedback toast
- `showSettings` / `setShowSettings` — settings panel toggle
- `countdown` — current countdown value (for CountdownOverlay)

**What to customize (search for `// TODO:`):**

1. **State variables** — Replace/add state for your test's specific data:
   - For sequence recall: `sequence`, `userSequence`, `level`
   - For choice tasks: `stimulusType`, `correctResponse`
   - For matrix tasks: `currentProblem`, `userAnswers`

2. **Demo animation** (`demoStep` useEffect) — Show 4-6 steps that visually demonstrate the test. Each step shows a different phase (wait → stimulus appears → response → feedback).

3. **Stimulus scheduling** (`scheduleNextStimulus`) — Replace with your test's trial generation logic. This is where you:
   - Pick the next stimulus (random, sequential, adaptive)
   - Set timing
   - Record trial start data

4. **Response handling** (`handleResponse`) — This is the core game logic:
   - What happens when the user responds correctly?
   - What happens on errors/false starts?
   - Record reaction time, accuracy, etc.
   - Trigger next stimulus or end test

5. **Key/click handling** — Update the keypress listener if your test uses keys other than spacebar, or needs different keys for different responses (e.g., 'f' for left, 'j' for right).

6. **Stimulus rendering** (the JSX in the `playing`/`stimulus` game state) — Replace the placeholder red-box stimulus with your actual test UI. Common patterns:
   - **Simple RT**: colored box appears, click/press to respond
   - **Choice RT**: two+ options shown, press correct key
   - **Sequence recall**: grid of items, click in order
   - **Visual search**: grid with target among distractors, click target
   - **Matrix reasoning**: problem image + answer options, click answer

7. **`finishTest` data submission** — The object passed to `onComplete()` is what gets stored in the database. Include all raw trial data plus summary scores.

#### 3.3 — `components/results/{id}.js`

The generated results component has three tabs (Overview, Distribution, Raw Data) and CSV export. Customize:

1. **Metric cards** — Show 4-6 key metrics (mean RT, accuracy, span, etc.)
2. **Chart** — Usually a bar chart or line chart of performance across trials/blocks
3. **Distribution** — Histogram of reaction times or scores
4. **Raw data table** — One row per trial with all recorded data
5. **CSV export** — Column headers and row data mapping

#### 3.4 — `components/settings/{id}.js`

Add a control for each configurable parameter in `DEFAULT_SETTINGS`. Use the appropriate input type:
- Duration/count → number input or range slider
- Timing (ms) → range slider with min/max labels
- Color → color picker (`type="color"`)
- On/off toggle → checkbox
- Choice from options → select dropdown

#### 3.5 — Translations (`locales/{en,de,es}/{id}.json`)

The generated file has ~70 keys with TODO placeholders. Fill in real text for all game states:
- Welcome screen: explain what the test measures and how long it takes
- Tutorial steps: clear numbered instructions (4 steps)
- Demo descriptions: what's happening in each demo animation step
- Feedback messages: correct, incorrect, too slow, false start, etc.
- Results labels: metric names, chart labels
- Settings labels: what each setting controls

**Write English first**, then translate to German and Spanish. All three locale files must have matching keys.

**German umlauts**: Make sure German translations include proper umlauts (ä, ö, ü, ß) — e.g., "Übung" not "Ubung", "Rückmeldung" not "Ruckmeldung", "Flexibilität" not "Flexibilitat". Double-check every German string for missing diacritics before moving on.

Also update `locales/*/common.json` — the generator adds `{id}_title` and `{id}_description` keys with TODO values. Replace them with the real test name and a one-sentence description in each language.

#### 3.6 — Integration stubs

The generator creates placeholder stubs in the integration files. Update:

- **`lib/resultAdapters.js`** — The `adapt{Id}Result(data)` function maps stored database data to the props your results component expects. The generated stub assumes `{ trials, falseStarts }` (PVT shape) — update to match your actual `onComplete()` data.

- **`lib/csvExporters.js`** — The `export{Id}CSV(data)` function defines the CSV columns. The generated stub has 4 RT columns — replace with your test's actual trial fields.

- **`lib/validations/testResults.js`** — The `validate{Id}Data(data)` function validates incoming test data before storage. The generated stub only checks `trials[].reactionTime` — add checks for your test-specific fields (e.g., `correct`, `rule`, `selectedCard`).

- **`lib/mainScoreFormatters.js`** — The formatter function returns a one-line score summary for the results list. The generated stub shows `Score: totalScore` — update to show the most meaningful metric (e.g., `Cat: X | PE: Y` for WCST).

### Phase 4: Verify

Run through this checklist:

```bash
# 1. Build compiles
npm run build

# 2. Dev server works
npm run dev
# Navigate to /{id} — should load without errors

# 3. Full flow test
# - Click through welcome → tutorial → demo → practice → test → results
# - Verify the practice stats screen shows correct data
# - Verify the results screen displays metrics and chart
# - Test CSV export downloads a valid file
# - Open settings, change values, reset to defaults

# 4. Dashboard integration
# Submit a test with an assignmentId query param
# View the result in /dashboard/results — verify it renders
```

## Common Test Paradigms → Implementation Patterns

### Simple Reaction Time (e.g., PVT)
- Time-based (runs for N minutes)
- Single stimulus type, single response key
- Measures: RT, false starts, lapses (RT > 500ms)
- Reference: `components/tests/pvt/test.js`

### Go/No-Go or Stop Signal (e.g., GNG-SST)
- Trial-based (N trials)
- Multiple stimulus types: go → respond, no-go → inhibit
- Optional stop signal with staircase SSD
- Measures: accuracy, commission/omission errors, SSRT
- Reference: `components/tests/gng/test.js`

### Span / Sequence Recall (e.g., Corsi, WTB)
- Level-based (increasing difficulty)
- Show sequence → recall sequence
- Difficulty = sequence length (2 → 9+)
- 2-3 attempts per level, advance on success
- Measures: span (max level), total score, error types
- Reference: `components/tests/corsi/test.js`

### Visual Search / Cancellation (e.g., AKT)
- Grid of items, find and click targets
- May be timed
- Measures: correct hits, misses, false alarms, time
- Reference: `components/tests/AktTest.js`

### Matrix Reasoning (e.g., RPM)
- Series of problems with multiple-choice answers
- May be timed or untimed
- Scored as correct/incorrect per item
- Measures: total correct, accuracy by set/difficulty
- Reference: `components/tests/rpm/test.js`

### Planning / Tower Tasks (e.g., TOL)
- Goal state shown, move pieces to match
- Drag-and-drop or click-based moves
- Measures: moves used vs. optimal, planning time, execution time
- Reference: `components/tests/tol/test.js`

### Continuous Performance (e.g., CPT)
- Rapid serial stimulus presentation
- Respond to targets, inhibit for non-targets
- Long sustained attention task
- Measures: hits, misses, false alarms, d-prime
- Similar to Go/No-Go but faster paced and longer

### Card Sorting / Set-Shifting (e.g., WCST)
- Classify cards by a hidden rule (color, shape, number)
- Rule changes after N consecutive correct — participant must adapt
- Mouse-click responses on reference cards, no keyboard
- Measures: categories completed, perseveration errors, non-perseveration errors, accuracy
- Heavy template rewrite: custom card rendering, rule engine, perseveration tracking
- Reference: `components/tests/wcst/test.js`

### N-Back
- Serial stimuli, respond if current matches N items back
- Difficulty = N value (1-back, 2-back, 3-back)
- Measures: accuracy, d-prime, RT
- Combine Go/No-Go pattern with a memory buffer

## Architecture Rules

These are non-negotiable. Violating them will break the app.

1. **CSS variables for colors** — Never use hardcoded hex in CSS modules. Use `var(--bg-primary)`, `var(--text-primary)`, etc. Inline styles for dynamic stimulus colors are fine.

2. **Timer refs** — Always use `addTimer()` from useTestEngine or manage refs manually. Always clean up in unmount. Never use bare `setTimeout` without cleanup.

3. **Translation fallback** — The `translate` function from `useTestEngine` handles the fallback. Never call `t()` directly — always use `translate()`.

4. **Three locales** — Every key must exist in `en`, `de`, and `es` JSON files. Missing keys render as the raw key string.

5. **No hardcoded text in JSX** — All user-visible strings go through `translate()`.

6. **CSRF for dashboard** — If you add any API routes, state-changing endpoints need `withCsrfProtection`. Frontend calls use `fetchWithCsrf`. But test pages (participant-facing) use plain `fetch`.

7. **Data submission format** — The object passed to `onComplete()` gets JSON-stringified and stored in the database. Keep it flat or one level deep. Include raw trial data and summary scores.

8. **Page wrapper** — Test pages use `TestPageWrapper`. Don't add assignment detection, submission logic, or SeoHead to the test component — the wrapper handles all of that.

## File Reference

```
templates/                          # Template files (don't edit these for specific tests)
scripts/create-test.js              # Generator script
components/TestPageWrapper.js       # Shared page wrapper (assignment, submission, SEO)
hooks/useTestEngine.js              # Shared hook (translate, fullscreen, timers, countdown, overlay)
components/ui/CountdownOverlay.js   # 3-2-1-GO! component
components/ui/MessageOverlay.js     # Feedback toast component
components/ui/TestHeader.js         # Logo + metrics header
lib/getStaticProps.js               # createGetStaticProps helper
lib/testConfig.js                   # Test registry (id, route, color, icon, tags)
lib/resultAdapters.js               # DB data → component props mapping
lib/csvExporters.js                 # CSV export functions
lib/resultComponents.js             # Test type → results component mapping
lib/mainScoreFormatters.js          # One-line score display for results list
lib/validations/testResults.js      # Input validation for submitted data
```
