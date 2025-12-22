// Base activity library - shared across all varieties
// Stage-based activities that apply universally

export interface Activity {
  action: string;
  condition?: string;
  timing?: string;
  frequency?: string;
  type: 'required' | 'conditional' | 'advisory';
}

// Pre-planting activities for transplant method (negative days before transplanting)
export interface PrePlantingActivity {
  day: number; // Negative days before transplant (e.g., -21, -14, -7, -1)
  action: string;
  water?: string;
  fertilizer?: string;
  notes?: string;
  type: 'required' | 'conditional' | 'advisory';
}

export const PRE_PLANTING_ACTIVITIES: PrePlantingActivity[] = [
  {
    day: -21,
    action: 'Prepare seedbed area',
    notes: 'Select well-drained area, 1/10 of main field size',
    type: 'required'
  },
  {
    day: -21,
    action: 'Level and prepare seedbed',
    notes: 'Ensure proper leveling for uniform water distribution',
    type: 'required'
  },
  {
    day: -18,
    action: 'Apply organic matter to seedbed',
    fertilizer: 'Apply compost or well-decomposed manure',
    type: 'advisory'
  },
  {
    day: -14,
    action: 'Soak seeds for 24 hours',
    water: 'Soak in clean water',
    notes: 'Pre-germination treatment',
    type: 'required'
  },
  {
    day: -13,
    action: 'Incubate seeds for 24-48 hours',
    notes: 'Keep moist until radicle emerges (1-2mm)',
    type: 'required'
  },
  {
    day: -11,
    action: 'Sow pre-germinated seeds in seedbed',
    water: 'Maintain moist seedbed',
    notes: 'Broadcast or drill seeds evenly',
    type: 'required'
  },
  {
    day: -7,
    action: 'Monitor seedbed moisture',
    water: 'Keep seedbed moist, avoid flooding',
    type: 'required'
  },
  {
    day: -7,
    action: 'Apply seedbed fertilizer',
    fertilizer: 'Apply 14-14-14 or similar compound fertilizer',
    type: 'advisory'
  },
  {
    day: -3,
    action: 'Prepare main field for transplanting',
    notes: 'Plow, harrow, and level the main field',
    type: 'required'
  },
  {
    day: -3,
    action: 'Apply basal fertilizer to main field',
    fertilizer: 'Apply 14-14-14 or recommended basal fertilizer',
    notes: 'Based on soil test results',
    type: 'required'
  },
  {
    day: -1,
    action: 'Final field preparation',
    water: 'Saturate soil, maintain shallow water (2-3 cm)',
    notes: 'Ensure field is ready for transplanting',
    type: 'required'
  },
  {
    day: -1,
    action: 'Check seedling age and health',
    notes: 'Seedlings should be 15-21 days old, healthy and ready',
    type: 'required'
  }
];

export interface StageActivities {
  [key: string]: Activity[];
}

export const ACTIVITIES: StageActivities = {
  'Germination/Seedling': [
    {
      action: 'Prepare seedbed with proper leveling',
      type: 'required'
    },
    {
      action: 'Maintain shallow water in seedbed',
      condition: 'if dry season',
      type: 'conditional'
    }
  ],
  
  'Vegetative (Tillering)': [
    {
      action: 'Apply first N split fertilizer',
      timing: '20-25 days after transplanting',
      type: 'required'
    },
    {
      action: 'Maintain shallow flooding (2-5 cm)',
      condition: 'if soil surface cracks or leaves roll',
      type: 'conditional'
    },
    {
      action: 'Scout for pests and diseases',
      frequency: 'weekly',
      type: 'advisory'
    },
    {
      action: 'Check leaf color with LCC',
      frequency: 'every 10 days',
      type: 'advisory'
    }
  ],
  
  'Maximum Tillering / Stem Elongation': [
    {
      action: 'Monitor tiller development',
      frequency: 'weekly',
      type: 'advisory'
    },
    {
      action: 'Maintain water level at 5 cm',
      type: 'required'
    },
    {
      action: 'Scout for stem borer and leaf folder',
      frequency: 'twice weekly',
      type: 'advisory'
    }
  ],
  
  'Panicle Initiation': [
    {
      action: 'Apply second N split fertilizer',
      timing: 'at panicle initiation',
      type: 'required'
    },
    {
      action: 'Maintain continuous shallow flooding',
      type: 'required'
    },
    {
      action: 'Scout for blast disease',
      frequency: 'every 3 days',
      type: 'advisory'
    }
  ],
  
  'Heading': [
    {
      action: 'Maintain standing water',
      condition: 'critical for grain formation',
      type: 'required'
    },
    {
      action: 'Monitor for brown planthopper',
      frequency: 'daily',
      type: 'advisory'
    }
  ],
  
  'Flowering': [
    {
      action: 'Maintain continuous shallow flooding',
      condition: 'avoid any water stress',
      type: 'required'
    },
    {
      action: 'Monitor for neck blast',
      frequency: 'daily',
      type: 'advisory'
    }
  ],
  
  'Grain Filling': [
    {
      action: 'Maintain shallow flooding',
      timing: 'until 7-10 days before harvest',
      type: 'required'
    },
    {
      action: 'Scout for grain discoloration',
      frequency: 'weekly',
      type: 'advisory'
    }
  ],
  
  'Harvest Mature': [
    {
      action: 'Drain field',
      timing: '7-10 days before harvest',
      type: 'required'
    },
    {
      action: 'Check grain moisture',
      condition: 'harvest at 20-25% moisture',
      type: 'advisory'
    },
    {
      action: 'Prepare harvesting equipment',
      type: 'required'
    }
  ]
};
