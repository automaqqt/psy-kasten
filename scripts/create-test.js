#!/usr/bin/env node
/**
 * Test Generator Script
 * Creates a new cognitive test from templates and patches integration files.
 *
 * Usage:
 *   node scripts/create-test.js
 *   node scripts/create-test.js --id nbt --name "N-Back Test" --color "#9c27b0" --icon "🧠" --tags "tag_memory,tag_attention"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// ── Helpers ───────────────────────────────────────────────

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * percent));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * percent));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - percent)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - percent)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function isValidHex(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ── CLI Argument Parsing ──────────────────────────────────

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].replace('--', '');
      args[key] = argv[i + 1] || '';
      i++;
    }
  }
  return args;
}

async function prompt(rl, question, defaultValue) {
  return new Promise(resolve => {
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`${question}${suffix}: `, answer => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

// ── Validation ────────────────────────────────────────────

function validateTestId(id) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    return 'Test ID must be lowercase alphanumeric (may contain hyphens), starting with a letter.';
  }

  // Check if test already exists in testConfig.js
  const configPath = path.join(ROOT, 'lib', 'testConfig.js');
  const configContent = readFile(configPath);
  if (configContent.includes(`id: '${id}'`)) {
    return `Test ID '${id}' already exists in lib/testConfig.js.`;
  }

  // Check if page already exists
  const pagePath = path.join(ROOT, 'pages', `${id}.js`);
  if (fs.existsSync(pagePath)) {
    return `Page file already exists at pages/${id}.js.`;
  }

  return null;
}

// ── Template Processing ───────────────────────────────────

function processTemplate(templateContent, replacements) {
  let result = templateContent;
  for (const [placeholder, value] of Object.entries(replacements)) {
    // Use a regex that handles the placeholder globally
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// ── Integration File Patching ─────────────────────────────

function patchTestConfig(testId, replacements) {
  const filePath = path.join(ROOT, 'lib', 'testConfig.js');
  let content = readFile(filePath);

  const entry = `    {
      id: '${testId}',
      titleKey: '${testId.replace(/-/g, '_')}_title',
      descriptionKey: '${testId.replace(/-/g, '_')}_description',
      route: '/${testId}',
      color: '${replacements['{{THEME_COLOR}}']}',
      icon: '${replacements['{{ICON}}']}',
      tags: [${replacements['{{TAGS}}']}]
    }`;

  // Find the last real closing brace of an array entry (non-commented) before ];
  // and ensure it has a trailing comma, then insert the new entry before ];
  const lines = content.split('\n');
  let insertIndex = -1;
  let lastEntryClose = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '];') {
      insertIndex = i;
    }
    // Find the last non-commented closing brace/bracket of an object in the array
    if (lastEntryClose === -1 && insertIndex !== -1 && !trimmed.startsWith('//') && (trimmed === '}' || trimmed === '},')) {
      lastEntryClose = i;
      // Ensure trailing comma
      if (trimmed === '}') {
        lines[i] = lines[i].replace(/\}(\s*)$/, '},$1');
      }
      break;
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, entry);
    content = lines.join('\n');
  } else {
    // Fallback: simple regex
    content = content.replace(/(\s*)\];/, `,\n${entry}\n  ];`);
  }

  writeFile(filePath, content);
}

function patchResultAdapters(testId, pascal) {
  const filePath = path.join(ROOT, 'lib', 'resultAdapters.js');
  let content = readFile(filePath);

  // Add adapter function before the registry
  const adapterFn = `
/**
 * ${pascal} Test
 * TODO: Update stored data shape and component props mapping
 * Stored: { trials, ... }
 * Component: ${pascal}Results({ trials, falseStarts, t })
 */
export function adapt${pascal}Result(data) {
  if (!data) return null;

  let trials;
  if (data.trials && Array.isArray(data.trials)) {
    trials = data.trials;
  } else {
    trials = reconstructArray(data);
  }

  if (!trials || trials.length === 0) return null;

  const falseStarts = trials.filter(t => t.falseStart).length;
  return { trials, falseStarts };
}

`;

  content = content.replace(
    /\/\/ --- Adapter Registry ---/,
    `${adapterFn}// --- Adapter Registry ---`
  );

  // Add entry to ADAPTERS object
  content = content.replace(
    /(\n};\n\n\/\*\*\n \* Register a new result adapter)/,
    `\n  '${testId}': adapt${pascal}Result,$1`
  );

  writeFile(filePath, content);
}

function patchCsvExporters(testId, pascal, upper) {
  const filePath = path.join(ROOT, 'lib', 'csvExporters.js');
  let content = readFile(filePath);

  // Add exporter function before the registry
  const exporterFn = `
// ── ${upper} ────────────────────────────────────────────────
// TODO: Update CSV columns and data mapping for your test
export function export${pascal}CSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = ['Trial Number', 'Type', 'Reaction Time (ms)', 'Interval (ms)'];
  const rows = trials.map(trial => [
    trial.trialNumber,
    trial.falseStart ? 'False Start' : 'Valid',
    trial.reactionTime || '',
    trial.intervalTime || ''
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, \`${testId}-results-\${new Date().toISOString().split('T')[0]}.csv\`);
}

`;

  content = content.replace(
    /\/\/ --- Exporter Registry ---/,
    `${exporterFn}// --- Exporter Registry ---`
  );

  // Add entry to EXPORTERS object
  content = content.replace(
    /(\n};\n\n\/\*\*\n \* Register a new CSV exporter)/,
    `\n  '${testId}': export${pascal}CSV,$1`
  );

  writeFile(filePath, content);
}

function patchValidations(testId, pascal) {
  const filePath = path.join(ROOT, 'lib', 'validations', 'testResults.js');
  let content = readFile(filePath);

  // Add validator function before the registry
  const validatorFn = `
/**
 * Validate ${pascal} test results
 * TODO: Update validation rules for your test's data structure
 */
function validate${pascal}Data(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(\`trials[\${index}] must be an object\`);
        return;
      }
      if (!isPositiveNumber(trial.reactionTime)) {
        errors.push(\`trials[\${index}].reactionTime must be a positive number\`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

`;

  content = content.replace(
    /\/\/ --- Validator Registry ---/,
    `${validatorFn}// --- Validator Registry ---`
  );

  // Add entry to VALIDATORS object
  content = content.replace(
    /(\n};\n\n\/\*\*\n \* Register a new test result validator)/,
    `\n  '${testId}': validate${pascal}Data,$1`
  );

  // Add to module.exports
  content = content.replace(
    /(  validateWtbData,\n\};)/,
    `  validateWtbData,\n  validate${pascal}Data,\n};`
  );

  writeFile(filePath, content);
}

function patchResultComponents(testId, pascal) {
  const filePath = path.join(ROOT, 'lib', 'resultComponents.js');
  let content = readFile(filePath);

  // Add import
  const importLine = `import ${pascal}Results from '../components/results/${testId}';`;
  content = content.replace(
    /(import CPTResults from [^\n]+\n)/,
    `$1${importLine}\n`
  );

  // Add to COMPONENT_MAP object
  content = content.replace(
    /(\s+'cpt': CPTResults,\n)/,
    `$1  '${testId}': ${pascal}Results,\n`
  );

  writeFile(filePath, content);
}

function patchMainScoreFormatters(testId) {
  const filePath = path.join(ROOT, 'lib', 'mainScoreFormatters.js');
  let content = readFile(filePath);

  // Add entry to FORMATTERS object
  content = content.replace(
    /(\n};\n\n\/\*\*\n \* Register a new main score formatter)/,
    `\n  '${testId}': (d) => d.totalScore !== undefined ? \`Score: \${d.totalScore}\` : 'N/A',$1`
  );

  writeFile(filePath, content);
}

function patchCommonLocales(testId, displayName) {
  const titleKey = `${testId.replace(/-/g, '_')}_title`;
  const descKey = `${testId.replace(/-/g, '_')}_description`;

  for (const locale of ['en', 'de', 'es']) {
    const filePath = path.join(ROOT, 'locales', locale, 'common.json');
    if (!fs.existsSync(filePath)) continue;

    let content = readFile(filePath);
    const json = JSON.parse(content);

    // Only add if not already present
    if (!json[titleKey]) {
      json[titleKey] = displayName;
    }
    if (!json[descKey]) {
      json[descKey] = `TODO: Add ${displayName} description`;
    }

    writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
  }
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  let testId, displayName, color, icon, description, tags;

  if (args.id) {
    // Non-interactive mode
    testId = args.id;
    displayName = args.name || toPascalCase(testId) + ' Test';
    color = args.color || '#4a6fa5';
    icon = args.icon || '🧪';
    description = args.description || `TODO: Add ${displayName} description`;
    tags = args.tags || 'tag_attention';
  } else {
    // Interactive mode
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log('\n🧪 psyKasten — New Test Generator\n');

    testId = await prompt(rl, 'Test ID (lowercase, e.g. "nbt")');
    displayName = await prompt(rl, 'Display name', toPascalCase(testId) + ' Test');
    color = await prompt(rl, 'Theme color (hex)', '#4a6fa5');
    icon = await prompt(rl, 'Icon (emoji)', '🧪');
    description = await prompt(rl, 'Short description', `TODO: Add ${displayName} description`);
    tags = await prompt(rl, 'Tags (comma-separated i18n keys)', 'tag_attention');

    rl.close();
  }

  // Validate
  if (!testId) {
    console.error('Error: Test ID is required.');
    process.exit(1);
  }

  const validationError = validateTestId(testId);
  if (validationError) {
    console.error(`Error: ${validationError}`);
    process.exit(1);
  }

  if (!isValidHex(color)) {
    console.error(`Error: Invalid hex color '${color}'. Use format #rrggbb.`);
    process.exit(1);
  }

  // Derive values
  const pascal = toPascalCase(testId);
  const upper = testId.toUpperCase().replace(/-/g, '_');
  const colorLight = lightenColor(color, 0.3);
  const colorDark = darkenColor(color, 0.15);
  const tagsArray = tags.split(',').map(t => `'${t.trim()}'`).join(', ');

  const replacements = {
    '{{TEST_ID}}': testId,
    '{{TEST_ID_PASCAL}}': pascal,
    '{{TEST_ID_UPPER}}': upper,
    '{{TEST_ID_CAMEL}}': testId.charAt(0).toLowerCase() + pascal.slice(1),
    '{{DISPLAY_NAME}}': displayName,
    '{{THEME_COLOR}}': color,
    '{{THEME_COLOR_LIGHT}}': colorLight,
    '{{THEME_COLOR_DARK}}': colorDark,
    '{{ICON}}': icon,
    '{{DESCRIPTION}}': description,
    '{{TAGS}}': tagsArray,
  };

  console.log(`\nGenerating test: ${displayName} (${testId})\n`);

  // ── Step 1: Process templates ─────────────────────────

  const templateMap = [
    ['test.js.template', `components/tests/${testId}/test.js`],
    ['data.js.template', `components/tests/${testId}/data.js`],
    ['results.js.template', `components/results/${testId}.js`],
    ['settings.js.template', `components/settings/${testId}.js`],
    ['page.js.template', `pages/${testId}.js`],
    ['styles.module.css.template', `styles/${pascal}Test.module.css`],
    ['locale.json.template', `locales/en/${testId}.json`],
  ];

  const createdFiles = [];

  for (const [templateFile, outputPath] of templateMap) {
    const templatePath = path.join(TEMPLATES_DIR, templateFile);
    if (!fs.existsSync(templatePath)) {
      console.error(`  Missing template: ${templateFile}`);
      continue;
    }

    const template = readFile(templatePath);
    const output = processTemplate(template, replacements);
    const fullPath = path.join(ROOT, outputPath);
    writeFile(fullPath, output);
    createdFiles.push(outputPath);
    console.log(`  Created: ${outputPath}`);
  }

  // Copy locale to de and es (same content, with TODO note)
  for (const locale of ['de', 'es']) {
    const srcPath = path.join(ROOT, `locales/en/${testId}.json`);
    const destPath = path.join(ROOT, `locales/${locale}/${testId}.json`);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      createdFiles.push(`locales/${locale}/${testId}.json`);
      console.log(`  Created: locales/${locale}/${testId}.json (copy — translate later)`);
    }
  }

  // ── Step 2: Patch integration files ───────────────────

  console.log('');
  const patchedFiles = [];

  try {
    patchTestConfig(testId, replacements);
    patchedFiles.push('lib/testConfig.js');
    console.log('  Patched: lib/testConfig.js');
  } catch (e) { console.error(`  Failed to patch testConfig.js: ${e.message}`); }

  try {
    patchResultAdapters(testId, pascal);
    patchedFiles.push('lib/resultAdapters.js');
    console.log('  Patched: lib/resultAdapters.js');
  } catch (e) { console.error(`  Failed to patch resultAdapters.js: ${e.message}`); }

  try {
    patchCsvExporters(testId, pascal, upper);
    patchedFiles.push('lib/csvExporters.js');
    console.log('  Patched: lib/csvExporters.js');
  } catch (e) { console.error(`  Failed to patch csvExporters.js: ${e.message}`); }

  try {
    patchValidations(testId, pascal);
    patchedFiles.push('lib/validations/testResults.js');
    console.log('  Patched: lib/validations/testResults.js');
  } catch (e) { console.error(`  Failed to patch testResults.js: ${e.message}`); }

  try {
    patchResultComponents(testId, pascal);
    patchedFiles.push('lib/resultComponents.js');
    console.log('  Patched: lib/resultComponents.js');
  } catch (e) { console.error(`  Failed to patch resultComponents.js: ${e.message}`); }

  try {
    patchMainScoreFormatters(testId);
    patchedFiles.push('lib/mainScoreFormatters.js');
    console.log('  Patched: lib/mainScoreFormatters.js');
  } catch (e) { console.error(`  Failed to patch mainScoreFormatters.js: ${e.message}`); }

  try {
    patchCommonLocales(testId, displayName);
    patchedFiles.push('locales/*/common.json');
    console.log('  Patched: locales/{en,de,es}/common.json');
  } catch (e) { console.error(`  Failed to patch common.json: ${e.message}`); }

  // ── Step 3: Print summary ─────────────────────────────

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Done! Created ${createdFiles.length} files, patched ${patchedFiles.length} files.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Next steps:
  1. npm run dev — navigate to /${testId} to verify it loads
  2. Customize components/tests/${testId}/data.js — define your settings
  3. Customize components/tests/${testId}/test.js — implement your test logic
     (search for TODO comments to find what needs changing)
  4. Customize components/results/${testId}.js — display your results
  5. Customize components/settings/${testId}.js — match your settings
  6. Update locales/{en,de,es}/${testId}.json — write real text
  7. Update lib/resultAdapters.js — map stored data to component props
  8. Update lib/csvExporters.js — define CSV export columns
  9. Update lib/validations/testResults.js — validate your data structure

  See templates/README.md for the full checklist.
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
