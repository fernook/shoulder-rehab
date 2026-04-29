export type ExerciseId =
  | 'wall-slides'
  | 'prone-ytw'
  | 'serratus-slide'
  | 'band-pull-aparts'
  | 'face-pulls';

export type Category = 'activation' | 'integration';

export type Exercise = {
  id: ExerciseId;
  name: string;
  category: Category;
  defaultSets: number;
  defaultReps: number | string;
  cueText: string;
  failureModes: string[];
  progressionNotes: string;
  order: number;
};

export type FormRating = 1 | 2 | 3 | 4 | 5;
export type Aggravation = 0 | 1 | 2 | 3 | 4 | 5;

export type SessionExercise = {
  exerciseId: ExerciseId;
  setsCompleted: number;
  repsCompleted: number;
  load?: string;
  formRating: FormRating;
  notes?: string;
  skipped?: boolean;
  skipReason?: string;
};

export type Session = {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  durationMinutes?: number;
  exercises: SessionExercise[];
  overallFeel: FormRating;
  notes?: string;
  createdAt: number;
};

export type FunctionalCheckTrigger =
  | 'suit'
  | 'baby-carrier'
  | 'backpack'
  | 'lifting'
  | 'other';

export type FunctionalCheck = {
  id: string;
  date: string;
  trigger: FunctionalCheckTrigger;
  triggerDetail?: string;
  durationMinutes: number;
  aggravation: Aggravation;
  notes?: string;
  createdAt: number;
};

export type Phase = 'activation' | 'integration' | 'consolidation' | 'maintenance';

export type Settings = {
  id: 'singleton';
  startDate: string; // ISO date
  weeklyTarget: number;
  phaseOverride?: Phase;
};

export type ProgressionEvent = {
  id: string;
  date: string;
  exerciseId: ExerciseId;
  fromNotes: string;
  acceptedAt: number;
};

export type ProgressionPromptDismissal = {
  exerciseId: ExerciseId;
  dismissedAtSessionCount: number;
};

export type ExerciseProgressionState = {
  exerciseId: ExerciseId;
  setsOverride?: number;
  repsOverride?: number | string;
  cueOverride?: string;
  progressionStep: number; // increments each accepted progression
  lastPromptSessionId?: string;
};
