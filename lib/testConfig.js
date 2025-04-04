export const TEST_TYPES = [
    {
      id: 'corsi',
      title: 'Corsi Block-Tapping Test',
      description: 'Measures your visuo-spatial short-term working memory. Remember and repeat sequences of blocks.',
      route: '/corsi',
      color: '#4a6fa5',
      icon: '🧩',
      tags: ['Memory', 'Visual-Spatial', 'Sequential']
    },
    {
      id: 'pvt',
      title: 'Psychomotor Vigilance Test',
      description: 'Measures reaction time and vigilance. Respond as quickly as possible to visual stimuli.',
      route: '/pvt',
      color: '#e91e63',
      icon: '⏱️',
      tags: ['Reaction Time', 'Alertness', 'Vigilance']
    },
    {
      id: 'tol',
      title: 'Tower of London Test (TOL)',
      description: 'Assesses planning and problem-solving ability by rearranging colored balls on pegs.',
      route: '/tol',
      color: '#ff9800', // Choose a color (e.g., orange)
      icon: '🗼', // Or '🧠' or '🎯'
      tags: ['Planning', 'Problem-Solving', 'Executive Function']
    },
    {
      id: 'rpm', // Changed from cpm
      title: "Raven's Progressive Matrices", // Updated title
      description: 'Measures non-verbal reasoning and abstract thinking ability using visual patterns.', // Updated description
      route: '/rpm', // Updated route
      color: '#4caf50', // Green color (example)
      icon: '🧩', // Or use '📊' or '🧠'
      tags: ['Reasoning', 'Non-Verbal', 'Intelligence'] // Updated tags
    },{
      id: 'gng-sst', // Give it a unique ID
      title: 'Go/NoGo Stop-Signal Task',
      description: 'Measures reaction time, response inhibition, and ability to stop an initiated response.',
      route: '/gng', // Use the page route you created
      color: '#6f42c1', // Purple example
      icon: '🚦', // Or '✋'
      tags: ['Inhibition', 'Reaction Time', 'Executive Function', 'Attention']
    }/* ,
    {
      id: 'corsi-backward',
      title: 'Backward Corsi Block Test',
      description: 'Tests your ability to manipulate spatial information in working memory by repeating sequences in reverse order.',
      route: '/backward',
      color: '#3b5998',
      icon: '🔄',
      tags: ['Memory', 'Visual-Spatial', 'Executive Function']
    },
    {
      id: 'cpt',
      title: 'Continuous Performance Test',
      description: 'Assesses sustained attention and response inhibition. Respond to non-target letters while inhibiting responses to target letters.',
      route: '/cpt',
      color: '#9c27b0',
      icon: '🔤',
      tags: ['Attention', 'Inhibition', 'Vigilance']
    } */
  ]