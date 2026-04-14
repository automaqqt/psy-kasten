# Adding a New Cognitive Test

## Quick Start

```bash
npm run create-test
```

Or non-interactive:

```bash
npm run create-test -- --id nbt --name "N-Back Test" --color "#9c27b0" --icon "🧠" --tags "tag_memory,tag_attention"
```

## What Gets Created

| File | Purpose |
|------|---------|
| `components/tests/{id}/test.js` | Main test component with full game state flow |
| `components/tests/{id}/data.js` | DEFAULT_SETTINGS, PRACTICE_SETTINGS, THEME_COLOR |
| `components/results/{id}.js` | Results display with chart, distribution, raw data tabs |
| `components/settings/{id}.js` | Settings modal with slider/color/number inputs |
| `pages/{id}.js` | Page wrapper with i18n and assignment handling |
| `styles/{Id}Test.module.css` | CSS module with dark mode and responsive design |
| `locales/{en,de,es}/{id}.json` | Translation keys for all game states |

## What Gets Patched

| File | Change |
|------|--------|
| `lib/testConfig.js` | New entry in TEST_TYPES array |
| `lib/resultAdapters.js` | Adapter function + switch case |
| `lib/csvExporters.js` | CSV export function + switch case |
| `lib/validations/testResults.js` | Validator function + switch case |
| `pages/dashboard/results/[resultId].js` | Import + COMPONENT_MAP entry |
| `pages/dashboard/results/index.js` | mainScore display branch |
| `locales/*/common.json` | Title and description keys |

## Post-Generation Checklist

### 1. Data Configuration (`components/tests/{id}/data.js`)
- [ ] Define DEFAULT_SETTINGS with all parameters your test needs
- [ ] Define PRACTICE_SETTINGS (shorter/easier version)
- [ ] Set RESPONSE_KEY if not spacebar
- [ ] Add any test-specific constants (stimulus types, trial definitions, etc.)

### 2. Main Test Component (`components/tests/{id}/test.js`)
- [ ] Replace placeholder stimulus logic with your test's actual stimuli
- [ ] Define trial structure (what data each trial records)
- [ ] Implement test-specific response handling
- [ ] Customize demo animation steps (update demoStep useEffect)
- [ ] Update practice statistics calculation
- [ ] Implement onComplete data submission format
- [ ] Test the full flow: welcome -> tutorial -> demo -> practice -> test -> results

### 3. Results Component (`components/results/{id}.js`)
- [ ] Define props interface matching what test.js passes
- [ ] Implement metric calculations (mean, median, SD, etc.)
- [ ] Create chart visualization (Chart.js dynamic import included)
- [ ] Define CSV export columns and data mapping
- [ ] Test with both standalone and dashboard result viewer

### 4. Settings Component (`components/settings/{id}.js`)
- [ ] Add controls matching each key in DEFAULT_SETTINGS
- [ ] Use appropriate input types (slider, number, checkbox, color, select)
- [ ] Add descriptive labels and range labels
- [ ] Verify reset-to-defaults works

### 5. Translations (`locales/{en,de,es}/{id}.json`)
- [ ] Replace all TODO placeholders with actual text
- [ ] Write tutorial steps that accurately describe your test
- [ ] Write demo step descriptions
- [ ] Translate de and es files (initially copies of English)
- [ ] Update locales/*/common.json title and description

### 6. Styles (`styles/{Id}Test.module.css`)
- [ ] Add any test-specific CSS classes
- [ ] Verify dark mode looks correct
- [ ] Test responsive layout at mobile breakpoints

### 7. Integration Files (auto-generated stubs)
- [ ] `lib/resultAdapters.js` — correctly maps stored data to component props
- [ ] `lib/csvExporters.js` — exports the right columns
- [ ] `lib/validations/testResults.js` — validates the data your test submits
- [ ] `pages/dashboard/results/index.js` — shows meaningful mainScore

### 8. Final Verification
- [ ] `npm run dev` — navigate to /{id}, no errors
- [ ] Complete a full test run in standalone mode
- [ ] Verify results display correctly
- [ ] Verify CSV export works
- [ ] Verify settings modal opens, changes persist, reset works
- [ ] Test with an assignment (non-standalone) to verify submission
- [ ] Check dashboard result viewer shows your test results
- [ ] `npm run build` — no compilation errors
