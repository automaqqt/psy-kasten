// generator/generateRPMProblems.js (Enhanced Version)
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const MATRIX_CELL_SIZE = 100; // Size of one cell in the 3x3 matrix SVG
const MATRIX_SIZE = MATRIX_CELL_SIZE * 3; // Size of the full 3x3 matrix SVG
const OPTION_SVG_SIZE = 100; // Size of individual option SVGs

// --- Enhanced SVG Helper Functions ---

function createSVGCanvas(width, height, id = '') {
    const idAttr = id ? ` id="${id}"` : '';
    return `<svg${idAttr} width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
}

function drawRect(x, y, w, h, fill = 'black', stroke = 'none', strokeWidth = 1, transform = '') {
    const transformAttr = transform ? ` transform="${transform}"` : '';
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transformAttr} />`;
}

function drawCircle(cx, cy, r, fill = 'black', stroke = 'none', strokeWidth = 1) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

function drawLine(x1, y1, x2, y2, stroke = 'black', strokeWidth = 2, transform = '') {
     const transformAttr = transform ? ` transform="${transform}"` : '';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"${transformAttr}/>`;
}

function drawTriangle(points = "50,15 85,85 15,85", fill = 'black', stroke = 'none', strokeWidth = 1, transform = '') {
    const transformAttr = transform ? ` transform="${transform}"` : '';
    return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transformAttr} />`;
}

function drawPolygon(points, fill = 'black', stroke = 'none', strokeWidth = 1, transform = '') {
    const transformAttr = transform ? ` transform="${transform}"` : '';
    return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${transformAttr} />`;
}


  
  function drawStripes(id, width=100, height=100, spacing=10, stroke='grey', strokeWidth=2) {
      let pattern = `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="${spacing}" height="${height}">`;
      pattern += `<path d="M 0 0 L 0 ${height}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      pattern += `</pattern></defs>`;
      pattern += drawRect(0, 0, width, height, `url(#${id})`);
      return pattern;
  }
  
  function drawGrid(id, width = 100, height = 100, spacing = 20, stroke = 'grey', strokeWidth = 1) {
      let pattern = `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="${spacing}" height="${spacing}">`;
      pattern += `<path d="M ${spacing} 0 L 0 0 0 ${spacing}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`; // Grid lines
      pattern += `</pattern></defs>`;
      pattern += drawRect(0, 0, width, height, `url(#${id})`);
      return pattern;
  }

// Basic patterns (can be expanded)
function drawFillPattern(id, type = 'stripes', width = 100, height = 100, color = 'grey', strokeWidth = 2, spacing = 10) {
    let patternDef = `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="${spacing}" height="${spacing}">`;
    if (type === 'stripesH') { // Horizontal Stripes
        patternDef += `<path d="M 0 0 L ${spacing} 0" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    } else if (type === 'stripesV') { // Vertical Stripes
        patternDef += `<path d="M 0 0 L 0 ${spacing}" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    } else if (type === 'grid') { // Grid
        patternDef += `<path d="M ${spacing} 0 L 0 0 0 ${spacing}" fill="none" stroke="${color}" stroke-width="${strokeWidth/2}"/>`;
    } else if (type === 'dots') { // Dots
        patternDef += `<circle cx="${spacing/2}" cy="${spacing/2}" r="${strokeWidth}" fill="${color}"/>`;
    }
    // Add more pattern types (diagonal stripes, checkers, etc.)
    patternDef += `</pattern></defs>`;
    return patternDef + drawRect(0, 0, width, height, `url(#${id})`);
}

function createGroup(content, transform = '') {
    const transformAttr = transform ? ` transform="${transform}"` : '';
    return `<g${transformAttr}>${content}</g>`;
}

// --- Matrix and Option Rendering ---

function renderMatrixSVG(cellsSVG) {
    let matrix = createSVGCanvas(MATRIX_SIZE, MATRIX_SIZE);
    matrix += drawRect(0, 0, MATRIX_SIZE, MATRIX_SIZE, 'white'); // Background
    for (let i = 0; i < 8; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * MATRIX_CELL_SIZE;
        const y = row * MATRIX_CELL_SIZE;
        matrix += createGroup(cellsSVG[i], `translate(${x}, ${y})`);
    }
    // Placeholder for the missing piece
    const placeholderX = 2 * MATRIX_CELL_SIZE;
    const placeholderY = 2 * MATRIX_CELL_SIZE;
    matrix += createGroup(
        drawRect(10, 10, MATRIX_CELL_SIZE - 20, MATRIX_CELL_SIZE - 20, '#e9ecef', '#adb5bd', 1) +
        `<text x="${MATRIX_CELL_SIZE / 2}" y="${MATRIX_CELL_SIZE / 2 + 5}" text-anchor="middle" font-size="20" fill="#6c757d">?</text>`,
        `translate(${placeholderX}, ${placeholderY})`
    );
    matrix += '</svg>';
    return matrix;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function finalizeProblem(baseData, correctSVG, distractorSVGs, numOptions) {
    const optionsRaw = [{ svg: correctSVG }, ...distractorSVGs.slice(0, numOptions - 1).map(svg => ({ svg }))];
    const shuffledOptionsRaw = shuffleArray([...optionsRaw]); // Shuffle a copy

    const correctOptionId = shuffledOptionsRaw.findIndex(opt => opt.svg === correctSVG) + 1;
    const options = shuffledOptionsRaw.map((opt, index) => ({ id: index + 1, svg: opt.svg }));

    if (correctOptionId === 0) {
        console.warn(`WARN: Correct option not found after shuffle for ${baseData.id}`);
        // Handle error or fallback if needed
    }


    return {
        ...baseData,
        options: options,
        correctOptionId: correctOptionId,
    };
}


// Example 1: Completion (Stripes) - Like A1
function generateCompletionStripes(problemId) {
    const patternId = `patt-${problemId}`;
    const spacing = 15;
    const strokeWidth = 4;
    const stroke = '#555';
    const bgColor = '#eee'; // Background for the matrix frame
  
    // Matrix: Full pattern minus a corner
    const matrixContent = [
        createSVGCanvas() + drawRect(0,0,100,100, bgColor) + drawStripes(patternId, 100, 100, spacing, stroke, strokeWidth) + '</svg>', // Cell 1 (Example)
        // ... Generate SVGs for cells 2-8 similarly ...
        // For simplicity, let's assume cells 1-8 show parts of the full pattern
        // We will represent the matrix conceptually here and focus on the answer/options
    ];
     // For display, the real matrix SVG would clip the bottom right corner
     const matrixDisplaySVG = createSVGCanvas(300, 300) +
          // Draw background grid visually
          drawRect(0, 0, 300, 300, 'white') +
          // Draw 8 cells conceptually showing pattern
          `<g transform="translate(0,0)">${createSVGCanvas()+drawStripes(patternId+'_m1', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(100,0)">${createSVGCanvas()+drawStripes(patternId+'_m2', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(200,0)">${createSVGCanvas()+drawStripes(patternId+'_m3', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(0,100)">${createSVGCanvas()+drawStripes(patternId+'_m4', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(100,100)">${createSVGCanvas()+drawStripes(patternId+'_m5', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(200,100)">${createSVGCanvas()+drawStripes(patternId+'_m6', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(0,200)">${createSVGCanvas()+drawStripes(patternId+'_m7', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          `<g transform="translate(100,200)">${createSVGCanvas()+drawStripes(patternId+'_m8', 100, 100, spacing, stroke, strokeWidth)+'</svg>'}</g>`+
          // Missing piece indicator
          drawRect(200, 200, 100, 100, '#ddd', 'grey', 1) + `<text x="250" y="255" text-anchor="middle">?</text>` +
          '</svg>';
  
  
    // Correct Option: Just the pattern
    const correctSVG = createSVGCanvas() + drawStripes(patternId+'_c', 100, 100, spacing, stroke, strokeWidth) + '</svg>';
  
    // Distractors
    const distractor1 = createSVGCanvas() + drawRect(0,0,100,100, 'white', stroke, strokeWidth) + '</svg>'; // Blank
    const distractor2 = createSVGCanvas() + drawStripes(patternId+'_d2', 100, 100, spacing / 2, stroke, strokeWidth) + '</svg>'; // Different spacing
    const distractor3 = createSVGCanvas() + drawStripes(patternId+'_d3', 100, 100, spacing, 'red', strokeWidth) + '</svg>'; // Different color
    const distractor4 = createSVGCanvas() + drawGrid(patternId+'_d4', 100, 100, 20, stroke, 1) + '</svg>'; // Different pattern
    const distractor5 = createSVGCanvas() + drawStripes(patternId+'_d5', 100, 100, spacing, stroke, strokeWidth) + drawCircle(50,50,20, 'blue') + '</svg>'; // Pattern + extra shape
  
  
    // Shuffle options and assign correct ID
    const optionsRaw = [
      { svg: correctSVG },
      { svg: distractor1 },
      { svg: distractor2 },
      { svg: distractor3 },
      { svg: distractor4 },
      { svg: distractor5 },
    ];
    optionsRaw.sort(() => Math.random() - 0.5); // Shuffle
    const correctOptionId = optionsRaw.findIndex(opt => opt.svg === correctSVG) + 1;
    const options = optionsRaw.map((opt, index) => ({ id: index + 1, svg: opt.svg }));
  
  
    return {
      id: problemId,
      set: 'A', // Example set
      number: 1, // Example number
      matrixSVG: matrixDisplaySVG, // Simplified representation for demo
      options: options,
      correctOptionId: correctOptionId,
      ruleDescription: "Completion: Missing piece completes a simple stripe pattern."
    };
  }
  
  // Example 2: Progression (Rotation)
  function generateRotationProgression(problemId) {
      const shape = (rotation) => drawRect(30, 30, 40, 10, 'navy', 'none', 0, `rotate(${rotation} 50 50)`); // Rotating bar
      const rotations = [0, 45, 90, 45, 90, 135, 90, 135]; // Rotations for cells 1-8
      const correctRotation = 180; // Rotation needed for cell 9 based on +45 deg rule
  
      // Generate Matrix SVGs (cells 1-8)
      const matrixCellsSVG = rotations.map(rot => createSVGCanvas() + shape(rot) + '</svg>');
      const matrixDisplaySVG = createSVGCanvas(300, 300) +
          drawRect(0, 0, 300, 300, 'white') +
          `<g transform="translate(0,0)">${matrixCellsSVG[0]}</g>`+
          `<g transform="translate(100,0)">${matrixCellsSVG[1]}</g>`+
          `<g transform="translate(200,0)">${matrixCellsSVG[2]}</g>`+
          `<g transform="translate(0,100)">${matrixCellsSVG[3]}</g>`+
          `<g transform="translate(100,100)">${matrixCellsSVG[4]}</g>`+
          `<g transform="translate(200,100)">${matrixCellsSVG[5]}</g>`+
          `<g transform="translate(0,200)">${matrixCellsSVG[6]}</g>`+
          `<g transform="translate(100,200)">${matrixCellsSVG[7]}</g>`+
           drawRect(200, 200, 100, 100, '#ddd', 'grey', 1) + `<text x="250" y="255" text-anchor="middle">?</text>` +
          '</svg>';
  
      // Correct Option
      const correctSVG = createSVGCanvas() + shape(correctRotation) + '</svg>';
  
      // Distractors
      const distractor1 = createSVGCanvas() + shape(135) + '</svg>'; // Previous rotation
      const distractor2 = createSVGCanvas() + shape(225) + '</svg>'; // Rotation +90
      const distractor3 = createSVGCanvas() + drawCircle(50, 50, 20, 'navy') + '</svg>'; // Wrong shape
      const distractor4 = createSVGCanvas() + shape(0) + '</svg>'; // Initial rotation
      const distractor5 = createSVGCanvas() + shape(correctRotation) + shape(correctRotation+90) + '</svg>'; // Extra shape
  
      // Shuffle and assign ID
      const optionsRaw = [ { svg: correctSVG }, { svg: distractor1 }, { svg: distractor2 }, { svg: distractor3 }, { svg: distractor4 }, { svg: distractor5 }];
      optionsRaw.sort(() => Math.random() - 0.5);
      const correctOptionId = optionsRaw.findIndex(opt => opt.svg === correctSVG) + 1;
      const options = optionsRaw.map((opt, index) => ({ id: index + 1, svg: opt.svg }));
  
      return {
          id: problemId,
          set: 'B',
          number: 1,
          matrixSVG: matrixDisplaySVG,
          options: options,
          correctOptionId: correctOptionId,
          ruleDescription: "Progression: Shape rotates +45 degrees across rows/columns."
      };
  }

// 2. Progression: Change in Count
function generateProgressionCount(problemId, setInfo) {
    const shapeFunc = (count, size = 10, fill = 'darkgreen') => {
        let shapes = '';
        // Simple placement logic - improve for more complex layouts
        for (let i = 0; i < count; i++) {
            const cx = 25 + (i % 3) * 25;
            const cy = 25 + Math.floor(i / 3) * 25;
            shapes += drawCircle(cx, cy, size, fill);
        }
        return shapes;
    };
    const startCount = 1;
    const step = 1; // Add 1 dot each step
    const counts = [startCount, startCount + step, startCount + 2 * step,
                   startCount + step, startCount + 2 * step, startCount + 3 * step,
                   startCount + 2 * step, startCount + 3 * step]; // Values for cells 1-8
    const correctCount = startCount + 4 * step;

    const matrixCellsSVG = counts.map(count => createSVGCanvas(MATRIX_CELL_SIZE, MATRIX_CELL_SIZE) + shapeFunc(count) + '</svg>');
    const correctSVG = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shapeFunc(correctCount) + '</svg>';

    // Distractors
    const distractor1 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shapeFunc(counts[7]) + '</svg>'; // Previous count
    const distractor2 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shapeFunc(correctCount + step) + '</svg>'; // Next count
    const distractor3 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shapeFunc(correctCount, 15) + '</svg>'; // Different size
    const distractor4 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shapeFunc(correctCount, 10, 'red') + '</svg>'; // Different color
    const distractor5 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + drawRect(10,10,80,80,'grey') + shapeFunc(correctCount) + '</svg>'; // Extra element
    const distractor6 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shapeFunc(counts[0]) + '</svg>'; // First count
    const distractor7 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + '</svg>'; // Blank

    const baseData = {
        id: problemId,
        set: setInfo.set,
        number: setInfo.number,
        matrixSVG: renderMatrixSVG(matrixCellsSVG),
        ruleDescription: "Progression: Number of elements increases by a fixed amount.",
    };

    return finalizeProblem(baseData, correctSVG, [distractor1, distractor2, distractor3, distractor4, distractor5, distractor6, distractor7], setInfo.numOptions);
}

// 3. Combination/Superposition
function generateCombinationOverlay(problemId, setInfo) {
    const shape1 = drawCircle(50, 50, 35, 'none', 'blue', 3); // Blue Circle outline
    const shape2 = drawLine(15, 50, 85, 50, 'red', 3);     // Red Horizontal Line
    const shape3 = drawLine(50, 15, 50, 85, 'green', 3); // Green Vertical Line

    // Matrix cells based on combining elements (Row1 + Row2 = Row3)
    const cellsContent = [
        shape1,                 // R1C1
        shape2,                 // R1C2
        shape1 + shape2,        // R1C3 = R1C1 + R1C2
        shape3,                 // R2C1
        shape1,                 // R2C2
        shape3 + shape1,        // R2C3 = R2C1 + R2C2
        shape1 + shape3,        // R3C1 = R1C1 + R2C1 (or R1C3+R2C3-R1C2-R2C2...)
        shape2 + shape1,        // R3C2 = R1C2 + R2C2
        // Cell 9 (R3C3) should be R1C3 + R2C3, or R3C1 + R3C2, etc.
        // R3C3 = (shape1+shape2) + (shape3+shape1) -> needs careful combination logic
        // Simplification: R3C3 = R1C3 + R2C3 = (shape1+shape2) + (shape3+shape1) = shape1+shape2+shape3
    ];
    const correctCombined = shape1 + shape2 + shape3;

    const matrixCellsSVG = cellsContent.map(content => createSVGCanvas(MATRIX_CELL_SIZE, MATRIX_CELL_SIZE) + content + '</svg>');
    const correctSVG = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + correctCombined + '</svg>';

    // Distractors
    const distractor1 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[0] + '</svg>'; // Element from R1C1
    const distractor2 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[1] + '</svg>'; // Element from R1C2
    const distractor3 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[3] + '</svg>'; // Element from R2C1
    const distractor4 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[2] + '</svg>'; // Element from R1C3 (incomplete)
    const distractor5 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[5] + '</svg>'; // Element from R2C3 (incomplete)
    const distractor6 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shape2 + shape3 + '</svg>'; // Missing shape1
    const distractor7 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + shape1 + '</svg>'; // Only one element

     const baseData = {
        id: problemId,
        set: setInfo.set,
        number: setInfo.number,
        matrixSVG: renderMatrixSVG(matrixCellsSVG),
        ruleDescription: "Combination: Elements from corresponding cells combine/overlay.",
    };
     return finalizeProblem(baseData, correctSVG, [distractor1, distractor2, distractor3, distractor4, distractor5, distractor6, distractor7], setInfo.numOptions);
}

// 4. Analogy (Transformation applied across)
function generateAnalogyTransform(problemId, setInfo) {
    // Transformation: Add a small black dot inside the main shape
    const mainShapeRect = (fill='lightblue') => drawRect(20, 20, 60, 60, fill, 'black', 1);
    const mainShapeCirc = (fill='lightgreen') => drawCircle(50, 50, 30, fill, 'black', 1);
    const addDot = drawCircle(50, 50, 5, 'black'); // The transformation element

    // Cell contents: Row 1 (Rect -> Rect+Dot), Row 2 (Circ -> Circ+Dot), Row 3 (Rect -> ?)
    const cellsContent = [
        mainShapeRect(),                // R1C1
        mainShapeRect(),                // R1C2 (Apply transform conceptually for R1C3)
        mainShapeRect() + addDot,       // R1C3 = Transform(R1C2)
        mainShapeCirc(),                // R2C1
        mainShapeCirc(),                // R2C2
        mainShapeCirc() + addDot,       // R2C3 = Transform(R2C2)
        mainShapeRect('lightcoral'),    // R3C1 (Different color Rect)
        mainShapeRect('lightcoral'),    // R3C2
        // Cell 9 (R3C3) should be Transform(R3C2)
    ];
     const correctTransformed = mainShapeRect('lightcoral') + addDot;

    const matrixCellsSVG = cellsContent.map(content => createSVGCanvas(MATRIX_CELL_SIZE, MATRIX_CELL_SIZE) + content + '</svg>');
    const correctSVG = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + correctTransformed + '</svg>';

    // Distractors
    const distractor1 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[6] + '</svg>'; // Untransformed shape (R3C1/R3C2)
    const distractor2 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[2] + '</svg>'; // Transformed shape from Row 1
    const distractor3 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + cellsContent[5] + '</svg>'; // Transformed shape from Row 2
    const distractor4 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + addDot + '</svg>'; // Just the dot
    const distractor5 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + mainShapeRect('lightcoral') + drawCircle(50, 50, 5, 'red') + '</svg>'; // Wrong color dot
    const distractor6 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + mainShapeCirc('lightcoral') + addDot + '</svg>'; // Wrong shape transformed
    const distractor7 = createSVGCanvas(OPTION_SVG_SIZE, OPTION_SVG_SIZE) + mainShapeRect() + '</svg>'; // Shape from R1

    const baseData = {
        id: problemId,
        set: setInfo.set,
        number: setInfo.number,
        matrixSVG: renderMatrixSVG(matrixCellsSVG),
        ruleDescription: "Analogy: Transformation (add dot) applied consistently across rows.",
    };
    return finalizeProblem(baseData, correctSVG, [distractor1, distractor2, distractor3, distractor4, distractor5, distractor6, distractor7], setInfo.numOptions);
}


// --- Generate Problems ---
const generatedProblems = [];
const setsConfig = [
    { set: 'A', items: 4, numOptions: 6, rules: [generateCompletionStripes, generateProgressionCount] }, // Example: 2 items for Set A
    { set: 'B', items: 4, numOptions: 6, rules: [generateRotationProgression, generateAnalogyTransform] }, // Example: 2 items for Set B
    { set: 'C', items: 4, numOptions: 6, rules: [generateCombinationOverlay, generateProgressionCount] }, // Example: 2 items for Set C
    { set: 'D', items: 4, numOptions: 6, rules: [generateAnalogyTransform, generateCombinationOverlay] }, // Example: 2 items for Set D
    { set: 'E', items: 4, numOptions: 6, rules: [generateProgressionCount, generateRotationProgression] }  // Example: 2 items for Set E
];

let itemCounter = 0;
for (const config of setsConfig) {
    for (let i = 1; i <= config.items; i++) {
        itemCounter++;
        const ruleGenerator = config.rules[(i - 1) % config.rules.length]; // Cycle through rules for the set
        const problemData = ruleGenerator(
            `GEN-${config.set}${i}`,
            { set: config.set, number: i, numOptions: config.numOptions }
        );
        generatedProblems.push(problemData);
    }
}


// --- Output to a JS file ---
const outputPath = path.join(__dirname, 'data.js'); // Adjust path

let outputString = `// Generated RPM Problem Data (Using SVG) - Enhanced\n\n`;
// Escape backticks potentially present in SVG strings for template literal safety
const problemsString = JSON.stringify(generatedProblems, null, 2)
                           .replace(/`/g, '\\`');
outputString += `export const PROBLEMS = ${problemsString};\n\n`;
outputString += `export const RPM_SETS = ${JSON.stringify(setsConfig.map(c => c.set))};\n`;
outputString += `export const ITEMS_PER_SET = ${JSON.stringify(setsConfig.reduce((acc, c) => { acc[c.set] = c.items; return acc; }, {}))};\n`; // Store items per set if needed

try {
    fs.writeFileSync(outputPath, outputString);
    console.log(`Successfully generated ${generatedProblems.length} RPM problems to: ${outputPath}`);
} catch (err) {
    console.error("Error writing RPM data file:", err);
}