/**
 * Shared API contract types.
 *
 * These interfaces mirror the Django + DRF backend exactly (see the backend
 * serializers.py and services.py). Keep them in sync with that source of truth.
 * No `any` is used anywhere in the client against these types.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------
export type Role = "student" | "admin";
export type PriorAIExposure = "" | "none" | "basic" | "regular" | "advanced";
export type QuestionType = "mcq" | "likert";
export type AssessmentType = "pretest" | "posttest" | "quiz" | "usability";
export type ModuleStatus = "locked" | "unlocked" | "in_progress" | "completed";
export type Dimension =
  | "ethical_awareness"
  | "critical_evaluation"
  | "bias_recognition"
  | "privacy_accountability"
  | "responsible_use"
  | "ai_social_good";

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------
/** Plain user object returned by register/login (accounts.UserSerializer). */
export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  faculty: string;
  level_of_study: string;
  prior_ai_exposure: PriorAIExposure;
  current_streak: number;
  created_at: string;
}

/** Computed profile from GET /api/auth/me/ (accounts.services.get_me_payload). */
export interface Me {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  faculty: string;
  level_of_study: string;
  prior_ai_exposure: PriorAIExposure;
  streak: number;
  pretest_completed: boolean;
  posttest_available: boolean;
  modules_completed: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  faculty?: string;
  level_of_study?: string;
  prior_ai_exposure?: PriorAIExposure;
  consent_agreed: boolean;
  consent_version: string;
}

// ---------------------------------------------------------------------------
// Gating
// ---------------------------------------------------------------------------
/** progress.services.get_user_state(). Returned by module complete, submit, etc. */
export interface UserState {
  pretest_completed: boolean;
  unlocked_module_ids: number[];
  next_module_id: number | null;
  all_modules_completed: boolean;
  posttest_completed: boolean;
  usability_completed: boolean;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export interface ModuleListItem {
  id: number;
  sequence_no: number;
  title: string;
  summary: string;
  status: ModuleStatus;
  is_accessible: boolean;
}

export interface ContentPage {
  id: number;
  title: string;
  body: string; // markdown
  page_order: number;
}

export interface ScenarioOption {
  id: number;
  option_text: string;
}

export interface Scenario {
  id: number;
  situation_text: string;
  scenario_order: number;
  options: ScenarioOption[];
}

export interface ModuleDetail {
  id: number;
  sequence_no: number;
  title: string;
  summary: string;
  pages: ContentPage[];
  scenarios: Scenario[];
}

/** Result of POST /api/scenarios/<id>/choose/. */
export interface ScenarioChoiceResult {
  consequence_text: string;
  ethical_principle: string;
  dimension: Dimension;
  newly_unlocked_scenario_ids: number[];
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------
/** Student-facing question — deliberately NO correct_answer field. */
export interface Question {
  id: number;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  dimension: string; // ethical dimension OR usability domain
  question_order: number;
  max_score: string; // DRF serialises Decimal as string
}

export interface Assessment {
  id: number;
  assessment_type: AssessmentType;
  title: string;
  module: number | null;
  questions: Question[];
}

export interface ResponseItem {
  question_id: number;
  answer: string;
}

/** Per-question feedback returned by quiz submissions only. */
export interface QuizFeedbackItem {
  question_id: number;
  correct: boolean;
  item_score: string;
  explanation: string | null;
}

/** Result of POST /api/assessments/<id>/submit/. `feedback` present for quizzes only. */
export interface SubmitResult {
  total_score: string;
  max_possible: string;
  user_state: UserState;
  feedback?: QuizFeedbackItem[];
}

// ---------------------------------------------------------------------------
// Ethical Reasoning Profile
// ---------------------------------------------------------------------------
export interface DimensionScoreBlock {
  score: string;
  max: string;
  percent: number | null;
}

export interface DimensionProfileEntry {
  dimension: Dimension;
  label: string;
  pretest: DimensionScoreBlock | null;
  current: DimensionScoreBlock;
  posttest: DimensionScoreBlock | null;
}

export interface DimensionProfile {
  dimensions: DimensionProfileEntry[];
  has_pretest: boolean;
  has_posttest: boolean;
}

export interface GrowthEntry {
  dimension: Dimension;
  label: string;
  pretest_score: string;
  posttest_score: string;
  gain: string;
  percent_gain: number;
}

export interface GrowthReport {
  dimensions: GrowthEntry[];
  overall: {
    pretest_total: string;
    posttest_total: string;
    gain: string;
    percent_gain: number | null;
  };
}

// ---------------------------------------------------------------------------
// Reflections
// ---------------------------------------------------------------------------
export interface Reflection {
  id: number;
  module: number;
  module_sequence: number;
  module_title: string;
  prompt_text: string;
  response_text: string;
  created_at: string;
}

export interface ReflectionPromptInfo {
  module: number;
  prompt_text: string;
  already_submitted: boolean;
}

// ---------------------------------------------------------------------------
// Admin / researcher
// ---------------------------------------------------------------------------
export interface Participant {
  id: number;
  full_name: string;
  email: string;
  faculty: string;
  level_of_study: string;
  prior_ai_exposure: PriorAIExposure;
  has_consent: boolean;
  pretest_completed: boolean;
  posttest_completed: boolean;
  pretest_total: string | null;
  posttest_total: string | null;
  gain: string | null;
  modules_completed: number;
}

export interface DimensionMean {
  dimension: Dimension;
  label: string;
  mean_pretest: number | null;
  mean_posttest: number | null;
}

export interface AdminStats {
  total_students: number;
  pretest_completed: number;
  posttest_completed: number;
  completed_all_modules: number;
  completion_rate: number;
  mean_pretest: number | null;
  mean_posttest: number | null;
  mean_gain: number | null;
  per_dimension: DimensionMean[];
}

export type ExportDataset = "scores" | "responses" | "usability" | "reflections";
