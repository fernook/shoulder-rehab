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
    setup:
      'Stand with your back against a wall, heels 4–6 inches out. Tailbone, lower back, upper back, and head all touching the wall. Arms in a "goalpost" — elbows bent 90°, backs of hands and forearms pressed flat against the wall at roughly shoulder height.',
    execution: [
      'Slide both arms slowly up the wall, like reaching overhead, keeping wrists, elbows, and the back of your hands in contact with the wall the whole time.',
      'Stop the moment any contact point lifts off the wall, your shoulders shrug toward your ears, or your low back arches away. This is likely well short of full extension at first — that is fine.',
      'Pause briefly, then slide back down to the goalpost start, actively pulling your elbows toward your back pockets at the bottom.',
    ],
    tempo: '~2 seconds up, brief pause, ~2 seconds down. No bouncing.',
    feelsLike:
      'A working sensation along the inner border of your shoulder blades and on the side of your ribs under the armpit. The tops of your shoulders / upper traps should stay quiet — if they are firing hard, you are shrugging.',
    failureModes: [
      'Lower back arches off wall',
      'Shoulders shrug up at the top',
      'Forearms come off wall',
      'Ribs flare / chest puffs',
    ],
    progressionNotes:
      'Add a foam roller between forearms and wall, or hold a light band pulling outward to add load.',
  },
  {
    id: 'prone-ytw',
    name: 'Prone Y-T-W',
    category: 'activation',
    order: 2,
    defaultSets: 2,
    defaultReps: '8 each',
    cueText: 'Lift from the back, not the arms. Movement should be tiny.',
    setup:
      'Lie face down on the floor (or a bench), forehead on a rolled towel so your neck stays neutral. Squeeze your glutes lightly to keep your low back flat — do not arch.',
    execution: [
      'Y: Arms extended overhead at roughly a 30° angle from your body, thumbs pointing up. Lift your hands 1–2 inches off the floor by squeezing your shoulder blades down and back. Hold 1–2 seconds, lower with control.',
      'T: Arms straight out to your sides at 90°, thumbs up. Lift hands by squeezing shoulder blades together — not by yanking the arms. Hold, lower.',
      'W: Bend elbows by your sides, forearms pointing forward (like the letter W). Lift the hands by retracting your shoulder blades, keeping elbows tucked close to your ribs. Hold, lower.',
      'That is one rep through all three positions. Reset between reps — no momentum.',
    ],
    tempo:
      'Slow lifts with a 1–2 second hold at the top of each position. Bigger pause is better than bigger range.',
    feelsLike:
      'Deep mid-back muscles working. Range of motion is small — the lift might only be an inch or two. If it feels easy, you are using momentum or arching your low back.',
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
    setup:
      'Face the wall, feet about 12 inches away. Place forearms vertically against the wall, elbows at roughly shoulder height, hands directly above elbows. Long neck, ribs down.',
    execution: [
      'Press your forearms firmly into the wall and "reach" your shoulder blades forward — your upper back should round slightly. This protraction is the whole point of the exercise.',
      'Maintaining that forward press, slide your forearms slowly up the wall as far as you can without losing the protraction or shrugging your shoulders up.',
      'Slide back down to start, keeping continuous pressure into the wall the entire time. Do not let the elbows or wrists peel off.',
    ],
    tempo: '~3 seconds up, ~3 seconds down. Continuous tension throughout.',
    feelsLike:
      'Muscles along the side of your ribcage just below the armpit (serratus anterior). It will likely fatigue fast. You should NOT feel this in your traps or upper neck.',
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
      'Lead with pinkies (slight external rotation), squeeze mid-back, do not shrug. Long neck.',
    setup:
      'Stand tall, feet hip-width. Hold a light resistance band with both hands, palms down, arms straight out in front at shoulder height. Hands shoulder-width apart on the band so there is light tension at the start.',
    execution: [
      'Without bending your elbows, pull the band apart by drawing your shoulder blades together and slightly down.',
      'As you pull, rotate your pinkies upward (light external rotation) so your thumbs end up pointing slightly back behind you.',
      'End with arms straight out to the sides, band touching your chest or stopping just short. Pause for 1 second at the end position.',
      'Return slowly with control — do NOT let the band snap back.',
    ],
    tempo: '~1 second out, 1 second hold at end, 2 seconds back.',
    feelsLike:
      'A squeeze between your shoulder blades and a working sensation in the rear of your shoulders. If you feel it in the tops of your shoulders or your neck, the band is too heavy or you are shrugging.',
    failureModes: [
      'Shrugging up during pull',
      'Bending elbows',
      'Using a band so heavy form breaks down',
    ],
    progressionNotes: 'Heavier band, or a 2-second hold at the end position.',
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
    setup:
      'Anchor a band at slightly above head height (door anchor, pull-up bar, etc.). Grab the band with both hands, palms down. Step back so there is light tension with arms straight forward at face level. Stand tall, ribs down.',
    execution: [
      'Initiate by squeezing your shoulder blades together — do not let the arms move yet.',
      'Pull the band toward your face, leading with your elbows, keeping elbows at or slightly above shoulder height.',
      'As your hands approach your face, rotate your forearms up so your knuckles end up pointing at the ceiling (external rotation). Final position looks like a double biceps pose: elbows high, hands higher than elbows.',
      'Reverse the motion slowly with control — undo the rotation, then let the elbows extend forward, then let the shoulder blades release.',
    ],
    tempo: '~2 seconds pull, 1 second hold, ~3 seconds return.',
    feelsLike:
      'Rear delts, mid-back, and the small rotator cuff muscles deep in the shoulder. This is NOT a biceps pull — if your biceps are doing the work, your elbows have dropped or you are pulling with your arms instead of your back.',
    failureModes: [
      'Skipping the external rotation at end',
      'Shrugging during pull',
      'Pulling with arms only, scapula static',
    ],
    progressionNotes: 'Heavier band or cable, slower eccentric.',
  },
];
