// RPM Problem Data - Educational Implementation
// Note: These are educational examples inspired by Raven's Progressive Matrices principles

export const PROBLEMS = [
  // Problem 1: Simple Pattern Completion (Horizontal Lines)
  {
    id: "EDU-1",
    set: "A",
    number: 1,
    matrixSVG: `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <!-- Grid lines -->
      <line x1="100" y1="0" x2="100" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="200" y1="0" x2="200" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="100" x2="300" y2="100" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="200" x2="300" y2="200" stroke="#ddd" stroke-width="2"/>

      <!-- Row 1: 1, 2, 3 lines -->
      <line x1="45" y1="50" x2="55" y2="50" stroke="#333" stroke-width="3"/>

      <line x1="140" y1="50" x2="150" y2="50" stroke="#333" stroke-width="3"/>
      <line x1="150" y1="50" x2="160" y2="50" stroke="#333" stroke-width="3"/>

      <line x1="235" y1="50" x2="245" y2="50" stroke="#333" stroke-width="3"/>
      <line x1="245" y1="50" x2="255" y2="50" stroke="#333" stroke-width="3"/>
      <line x1="255" y1="50" x2="265" y2="50" stroke="#333" stroke-width="3"/>

      <!-- Row 2: 2, 3, 4 lines -->
      <line x1="40" y1="150" x2="50" y2="150" stroke="#333" stroke-width="3"/>
      <line x1="50" y1="150" x2="60" y2="150" stroke="#333" stroke-width="3"/>

      <line x1="135" y1="150" x2="145" y2="150" stroke="#333" stroke-width="3"/>
      <line x1="145" y1="150" x2="155" y2="150" stroke="#333" stroke-width="3"/>
      <line x1="155" y1="150" x2="165" y2="150" stroke="#333" stroke-width="3"/>

      <line x1="230" y1="150" x2="240" y2="150" stroke="#333" stroke-width="3"/>
      <line x1="240" y1="150" x2="250" y2="150" stroke="#333" stroke-width="3"/>
      <line x1="250" y1="150" x2="260" y2="150" stroke="#333" stroke-width="3"/>
      <line x1="260" y1="150" x2="270" y2="150" stroke="#333" stroke-width="3"/>

      <!-- Row 3: 3, 4, ? -->
      <line x1="35" y1="250" x2="45" y2="250" stroke="#333" stroke-width="3"/>
      <line x1="45" y1="250" x2="55" y2="250" stroke="#333" stroke-width="3"/>
      <line x1="55" y1="250" x2="65" y2="250" stroke="#333" stroke-width="3"/>

      <line x1="130" y1="250" x2="140" y2="250" stroke="#333" stroke-width="3"/>
      <line x1="140" y1="250" x2="150" y2="250" stroke="#333" stroke-width="3"/>
      <line x1="150" y1="250" x2="160" y2="250" stroke="#333" stroke-width="3"/>
      <line x1="160" y1="250" x2="170" y2="250" stroke="#333" stroke-width="3"/>

      <!-- Missing piece -->
      <rect x="200" y="200" width="100" height="100" fill="#f0f0f0" stroke="#999" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="32" fill="#999">?</text>
    </svg>`,
    options: [
      {
        id: 1,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="25" y1="50" x2="35" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="35" y1="50" x2="45" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="45" y1="50" x2="55" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="55" y1="50" x2="65" y2="50" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 2,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="20" y1="50" x2="30" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="30" y1="50" x2="40" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="40" y1="50" x2="50" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="50" y1="50" x2="60" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="60" y1="50" x2="70" y2="50" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 3,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="30" y1="50" x2="40" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="40" y1="50" x2="50" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="50" y1="50" x2="60" y2="50" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 4,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="25" y1="50" x2="35" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="40" y1="50" x2="50" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="55" y1="50" x2="65" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="70" y1="50" x2="80" y2="50" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 5,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="45" y1="30" x2="55" y2="30" stroke="#333" stroke-width="3"/>
          <line x1="45" y1="40" x2="55" y2="40" stroke="#333" stroke-width="3"/>
          <line x1="45" y1="50" x2="55" y2="50" stroke="#333" stroke-width="3"/>
          <line x1="45" y1="60" x2="55" y2="60" stroke="#333" stroke-width="3"/>
          <line x1="45" y1="70" x2="55" y2="70" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 6,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="35" cy="50" r="3" fill="#333"/>
          <circle cx="45" cy="50" r="3" fill="#333"/>
          <circle cx="55" cy="50" r="3" fill="#333"/>
          <circle cx="65" cy="50" r="3" fill="#333"/>
          <circle cx="75" cy="50" r="3" fill="#333"/>
        </svg>`
      }
    ],
    correctOptionId: 2,
    ruleDescription: "Progressive increase: Each row and column adds one more line"
  },

  // Problem 2: Shape Size Progression
  {
    id: "EDU-2",
    set: "A",
    number: 2,
    matrixSVG: `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <line x1="100" y1="0" x2="100" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="200" y1="0" x2="200" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="100" x2="300" y2="100" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="200" x2="300" y2="200" stroke="#ddd" stroke-width="2"/>

      <!-- Row 1: Small, Medium, Large circles -->
      <circle cx="50" cy="50" r="15" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="150" cy="50" r="25" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="250" cy="50" r="35" fill="none" stroke="#333" stroke-width="2"/>

      <!-- Row 2: Small, Medium, Large squares -->
      <rect x="35" y="135" width="30" height="30" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="125" y="125" width="50" height="50" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="215" y="115" width="70" height="70" fill="none" stroke="#333" stroke-width="2"/>

      <!-- Row 3: Small, Medium, ? triangles -->
      <polygon points="50,175 35,195 65,195" fill="none" stroke="#333" stroke-width="2"/>
      <polygon points="150,155 125,195 175,195" fill="none" stroke="#333" stroke-width="2"/>

      <rect x="200" y="200" width="100" height="100" fill="#f0f0f0" stroke="#999" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="32" fill="#999">?</text>
    </svg>`,
    options: [
      {
        id: 1,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 15,85 85,85" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 2,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,35 25,75 75,75" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 3,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 4,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,15 5,95 95,95" fill="#333"/>
        </svg>`
      },
      {
        id: 5,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <rect x="15" y="15" width="70" height="70" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 6,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,45 35,65 65,65" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      }
    ],
    correctOptionId: 1,
    ruleDescription: "Size progression: Each shape increases in size across columns"
  },

  // Problem 3: Rotation Pattern
  {
    id: "EDU-3",
    set: "A",
    number: 3,
    matrixSVG: `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <line x1="100" y1="0" x2="100" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="200" y1="0" x2="200" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="100" x2="300" y2="100" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="200" x2="300" y2="200" stroke="#ddd" stroke-width="2"/>

      <!-- Row 1: Line rotates 0°, 45°, 90° -->
      <line x1="30" y1="50" x2="70" y2="50" stroke="#333" stroke-width="3"/>
      <line x1="130" y1="70" x2="170" y2="30" stroke="#333" stroke-width="3"/>
      <line x1="250" y1="30" x2="250" y2="70" stroke="#333" stroke-width="3"/>

      <!-- Row 2: 45°, 90°, 135° -->
      <line x1="30" y1="170" x2="70" y2="130" stroke="#333" stroke-width="3"/>
      <line x1="150" y1="130" x2="150" y2="170" stroke="#333" stroke-width="3"/>
      <line x1="230" y1="130" x2="270" y2="170" stroke="#333" stroke-width="3"/>

      <!-- Row 3: 90°, 135°, ? -->
      <line x1="50" y1="230" x2="50" y2="270" stroke="#333" stroke-width="3"/>
      <line x1="130" y1="230" x2="170" y2="270" stroke="#333" stroke-width="3"/>

      <rect x="200" y="200" width="100" height="100" fill="#f0f0f0" stroke="#999" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="32" fill="#999">?</text>
    </svg>`,
    options: [
      {
        id: 1,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="30" y1="50" x2="70" y2="50" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 2,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="30" y1="70" x2="70" y2="30" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 3,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="50" y1="30" x2="50" y2="70" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 4,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="70" y1="30" x2="30" y2="70" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 5,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="50" cy="50" r="20" fill="none" stroke="#333" stroke-width="3"/>
        </svg>`
      },
      {
        id: 6,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <line x1="30" y1="30" x2="70" y2="70" stroke="#333" stroke-width="3"/>
          <line x1="70" y1="30" x2="30" y2="70" stroke="#333" stroke-width="3"/>
        </svg>`
      }
    ],
    correctOptionId: 1,
    ruleDescription: "Rotation: Line rotates 45° clockwise in each step"
  },

  // Problem 4: Addition Pattern (Shapes)
  {
    id: "EDU-4",
    set: "B",
    number: 1,
    matrixSVG: `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <line x1="100" y1="0" x2="100" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="200" y1="0" x2="200" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="100" x2="300" y2="100" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="200" x2="300" y2="200" stroke="#ddd" stroke-width="2"/>

      <!-- Row 1: Circle, Square, Circle+Square -->
      <circle cx="50" cy="50" r="20" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="130" y="30" width="40" height="40" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="235" cy="50" r="20" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="235" y="30" width="40" height="40" fill="none" stroke="#333" stroke-width="2"/>

      <!-- Row 2: Triangle, Circle, Triangle+Circle -->
      <polygon points="50,75 30,95 70,95" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="150" cy="150" r="20" fill="none" stroke="#333" stroke-width="2"/>
      <polygon points="250,175 230,195 270,195" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="250" cy="150" r="20" fill="none" stroke="#333" stroke-width="2"/>

      <!-- Row 3: Square, Triangle, ? -->
      <rect x="30" y="230" width="40" height="40" fill="none" stroke="#333" stroke-width="2"/>
      <polygon points="150,225 130,295 170,295" fill="none" stroke="#333" stroke-width="2"/>

      <rect x="200" y="200" width="100" height="100" fill="#f0f0f0" stroke="#999" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="32" fill="#999">?</text>
    </svg>`,
    options: [
      {
        id: 1,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <rect x="30" y="30" width="40" height="40" fill="none" stroke="#333" stroke-width="2"/>
          <polygon points="50,25 30,95 70,95" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 2,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 3,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 30,75 70,75" fill="none" stroke="#333" stroke-width="2"/>
          <circle cx="50" cy="55" r="20" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 4,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <rect x="30" y="30" width="40" height="40" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 5,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="35" cy="50" r="15" fill="none" stroke="#333" stroke-width="2"/>
          <circle cx="65" cy="50" r="15" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 6,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 30,75 70,75" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      }
    ],
    correctOptionId: 1,
    ruleDescription: "Addition: Third column combines shapes from first two columns"
  },

  // Problem 5: Subtraction Pattern
  {
    id: "EDU-5",
    set: "B",
    number: 2,
    matrixSVG: `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <line x1="100" y1="0" x2="100" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="200" y1="0" x2="200" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="100" x2="300" y2="100" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="200" x2="300" y2="200" stroke="#ddd" stroke-width="2"/>

      <!-- Row 1: 4 dots, 2 dots, 2 dots (4-2=2) -->
      <circle cx="35" cy="35" r="4" fill="#333"/>
      <circle cx="65" cy="35" r="4" fill="#333"/>
      <circle cx="35" cy="65" r="4" fill="#333"/>
      <circle cx="65" cy="65" r="4" fill="#333"/>

      <circle cx="135" cy="40" r="4" fill="#333"/>
      <circle cx="165" cy="40" r="4" fill="#333"/>

      <circle cx="235" cy="40" r="4" fill="#333"/>
      <circle cx="265" cy="40" r="4" fill="#333"/>

      <!-- Row 2: 5 dots, 3 dots, 2 dots (5-3=2) -->
      <circle cx="30" cy="130" r="4" fill="#333"/>
      <circle cx="50" cy="130" r="4" fill="#333"/>
      <circle cx="70" cy="130" r="4" fill="#333"/>
      <circle cx="40" cy="160" r="4" fill="#333"/>
      <circle cx="60" cy="160" r="4" fill="#333"/>

      <circle cx="135" cy="135" r="4" fill="#333"/>
      <circle cx="165" cy="135" r="4" fill="#333"/>
      <circle cx="150" cy="165" r="4" fill="#333"/>

      <circle cx="235" cy="140" r="4" fill="#333"/>
      <circle cx="265" cy="140" r="4" fill="#333"/>

      <!-- Row 3: 6 dots, 4 dots, ? (6-4=2) -->
      <circle cx="25" cy="225" r="4" fill="#333"/>
      <circle cx="45" cy="225" r="4" fill="#333"/>
      <circle cx="65" cy="225" r="4" fill="#333"/>
      <circle cx="35" cy="255" r="4" fill="#333"/>
      <circle cx="55" cy="255" r="4" fill="#333"/>
      <circle cx="75" cy="255" r="4" fill="#333"/>

      <circle cx="125" cy="230" r="4" fill="#333"/>
      <circle cx="155" cy="230" r="4" fill="#333"/>
      <circle cx="140" cy="260" r="4" fill="#333"/>
      <circle cx="170" cy="260" r="4" fill="#333"/>

      <rect x="200" y="200" width="100" height="100" fill="#f0f0f0" stroke="#999" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="32" fill="#999">?</text>
    </svg>`,
    options: [
      {
        id: 1,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="35" cy="45" r="4" fill="#333"/>
          <circle cx="65" cy="45" r="4" fill="#333"/>
        </svg>`
      },
      {
        id: 2,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="40" cy="40" r="4" fill="#333"/>
          <circle cx="60" cy="40" r="4" fill="#333"/>
          <circle cx="40" cy="60" r="4" fill="#333"/>
          <circle cx="60" cy="60" r="4" fill="#333"/>
        </svg>`
      },
      {
        id: 3,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="50" cy="45" r="4" fill="#333"/>
        </svg>`
      },
      {
        id: 4,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="35" cy="40" r="4" fill="#333"/>
          <circle cx="65" cy="40" r="4" fill="#333"/>
          <circle cx="50" cy="60" r="4" fill="#333"/>
        </svg>`
      },
      {
        id: 5,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="30" cy="35" r="4" fill="#333"/>
          <circle cx="50" cy="35" r="4" fill="#333"/>
          <circle cx="70" cy="35" r="4" fill="#333"/>
          <circle cx="40" cy="55" r="4" fill="#333"/>
          <circle cx="60" cy="55" r="4" fill="#333"/>
          <circle cx="50" cy="70" r="4" fill="#333"/>
        </svg>`
      },
      {
        id: 6,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
        </svg>`
      }
    ],
    correctOptionId: 1,
    ruleDescription: "Subtraction: Third column = First column minus Second column"
  },

  // Problem 6: Pattern with Shading
  {
    id: "EDU-6",
    set: "B",
    number: 3,
    matrixSVG: `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <line x1="100" y1="0" x2="100" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="200" y1="0" x2="200" y2="300" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="100" x2="300" y2="100" stroke="#ddd" stroke-width="2"/>
      <line x1="0" y1="200" x2="300" y2="200" stroke="#ddd" stroke-width="2"/>

      <!-- Row 1: Empty, Half, Full -->
      <circle cx="50" cy="50" r="25" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="150" cy="50" r="25" fill="none" stroke="#333" stroke-width="2"/>
      <path d="M 150 25 A 25 25 0 0 1 150 75 Z" fill="#333"/>
      <circle cx="250" cy="50" r="25" fill="#333"/>

      <!-- Row 2: Empty, Half, Full -->
      <rect x="25" y="125" width="50" height="50" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="125" y="125" width="50" height="50" fill="none" stroke="#333" stroke-width="2"/>
      <rect x="125" y="125" width="25" height="50" fill="#333"/>
      <rect x="225" y="125" width="50" height="50" fill="#333"/>

      <!-- Row 3: Empty, Half, ? -->
      <polygon points="50,225 25,275 75,275" fill="none" stroke="#333" stroke-width="2"/>
      <polygon points="150,225 125,275 175,275" fill="none" stroke="#333" stroke-width="2"/>
      <path d="M 150 225 L 125 275 L 150 275 Z" fill="#333"/>

      <rect x="200" y="200" width="100" height="100" fill="#f0f0f0" stroke="#999" stroke-width="2"/>
      <text x="250" y="260" text-anchor="middle" font-size="32" fill="#999">?</text>
    </svg>`,
    options: [
      {
        id: 1,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 25,75 75,75" fill="#333"/>
        </svg>`
      },
      {
        id: 2,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 25,75 75,75" fill="none" stroke="#333" stroke-width="2"/>
          <path d="M 50 25 L 25 75 L 50 75 Z" fill="#333"/>
        </svg>`
      },
      {
        id: 3,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 25,75 75,75" fill="none" stroke="#333" stroke-width="2"/>
        </svg>`
      },
      {
        id: 4,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <circle cx="50" cy="50" r="25" fill="#333"/>
        </svg>`
      },
      {
        id: 5,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <rect x="25" y="25" width="50" height="50" fill="#333"/>
        </svg>`
      },
      {
        id: 6,
        svg: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <polygon points="50,25 25,75 75,75" fill="none" stroke="#333" stroke-width="2"/>
          <polygon points="50,40 37.5,65 62.5,65" fill="#333"/>
        </svg>`
      }
    ],
    correctOptionId: 1,
    ruleDescription: "Shading progression: Empty → Half-filled → Fully-filled"
  }
];

export const RPM_SETS = ["A", "B"];
export const ITEMS_PER_SET = { "A": 3, "B": 3 };
