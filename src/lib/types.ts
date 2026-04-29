export type ExerciseId =
  | 'wall-slides'
  | 'prone-ytw'
  | 'serratus-slide'
  | 'band-pull-aparts'
  | 'face-pulls';

export type Category = 'activation' | 'integration';

export type ExerciseLevel = {
  level: number;
  name: string;
  description: string[];
  cueText: string;
  failureModes: string[];
  defaultSets: number;
  defaultReps: number | string;
  graduationCriteria: string;
};

export type Exercise = {
  id: ExerciseId;
  name: string;
  category: Category;
  order: number;
  progressionNotes: string;
  levels: ExerciseLevel[];
};

export type FormRating = 1 | 2 | 3 | 4 | 5;
export type Aggravation = 0 | 1 | 2 | 3 | 4 | 5;

export type SessionExercise = {
  exerciseId: ExerciseId;
  level?: number; // undefined = legacy / unspecified
  setsCompleted: number;
  repsCompleted: number;
  load?: string;
  formRating: FormRating;
  notes?: string;
  skipped?: boolean;
  skipReason?: string;
  aggravated?: boolean;
};

export type Session = {
  id: string;
  date: string;
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
  startDate: string;
  weeklyTarget: number;
  phaseOverride?: Phase;
  levelsOnboardingSeen?: boolean;
};

export type ProgressionEvent = {
  id: string;
  date: string;
  exerciseId: ExerciseId;
  kind: 'level-up' | 'level-down' | 'add-load';
  fromLevel?: number;
  toLevel?: number;
  notes?: string;
  acceptedAt: number;
};

export type ExerciseProgressionState = {
  exerciseId: ExerciseId;
  currentLevel?: number;
  lastPromptSessionId?: string;
};
