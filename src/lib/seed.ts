import type { Exercise } from './types';

export const SEED_EXERCISES: Exercise[] = [
  {
    id: 'wall-slides',
    name: 'Wall slides',
    category: 'activation',
    order: 1,
    defaultSets: 2,
    defaultReps: 10,
    cueText:
      'Shoulders pulling down away from ears as arms go up. Ribs down, low back flat. Traps quiet; serratus and lower trap active.',
    failureModes: [
      'Lower back arches off wall',
      'Shoulders shrug up at the top',
      'Forearms come off wall',
      'Ribs flare / chest puffs',
    ],
    progressionNotes:
      'Add foam roller between forearms and wall, or hold light band pulling outward.',
  },
  {
    id: 'prone-ytw',
    name: 'Prone Y-T-W',
    category: 'activation',
    order: 2,
    defaultSets: 2,
    defaultReps: '8 each',
    cueText: 'Lift from the back, not the arms. Movement should be tiny.',
    failureModes: [
      'Cranking arms up high using momentum',
      'Shrugging shoulders toward ears',
      'Hyperextending lower back',
    ],
    progressionNotes: 'Add 2–5 lb dumbbells once form is clean at bodyweight.',
  },
  {
    id: 'serratus-slide',
    name: 'Serratus wall slide',
    category: 'activation',
    order: 3,
    defaultSets: 2,
    defaultReps: 10,
    cueText:
      'Reach the wall (or floor) away from you. Feel muscles along the side of ribcage, below armpit.',
    failureModes: [
      'Hunching head forward',
      'Shrugging up',
      'Skipping the protraction (no scapular spread)',
    ],
    progressionNotes:
      'Wall version → incline push-up plus → floor push-up plus.',
  },
  {
    id: 'band-pull-aparts',
    name: 'Band pull-aparts',
    category: 'integration',
    order: 4,
    defaultSets: 2,
    defaultReps: 15,
    cueText:
      'Lead with pinkies (slight external rotation), squeeze mid-back, don’t shrug. Long neck.',
    failureModes: [
      'Shrugging up during pull',
      'Bending elbows',
      'Using a band so heavy form breaks down',
    ],
    progressionNotes: 'Heavier band, or 2-second hold at end position.',
  },
  {
    id: 'face-pulls',
    name: 'Face pulls with external rotation',
    category: 'integration',
    order: 5,
    defaultSets: 2,
    defaultReps: 12,
    cueText:
      'Elbows high, hands higher. Shoulder blades retract first, then elbows pull, then hands rotate up.',
    failureModes: [
      'Skipping the external rotation at end',
      'Shrugging during pull',
      'Pulling with arms only, scapula static',
    ],
    progressionNotes: 'Heavier band or cable, slower eccentric.',
  },
];
