/**
 * Typed browser API client.
 *
 * All calls target the same-origin BFF proxy (/bff/...), so the httpOnly token
 * cookies are attached automatically by the browser and the JWT never touches
 * client JavaScript. The BFF handles Bearer attachment and transparent refresh;
 * this module only needs to surface typed results and errors.
 *
 * On a 401 that survives the BFF's refresh attempt, the session is over — we
 * redirect to /login (in the browser only).
 */
import type {
  AdminStats,
  Assessment,
  DimensionProfile,
  ExportDataset,
  GrowthReport,
  Me,
  ModuleDetail,
  ModuleListItem,
  Participant,
  Reflection,
  ReflectionPromptInfo,
  RegisterPayload,
  ResponseItem,
  ScenarioChoiceResult,
  SubmitResult,
  User,
  UserState,
} from "@/types/api";

/** Typed error thrown by every client call on a non-2xx response. */
export class ApiError extends Error {
  status: number;
  code?: string;
  /** Raw DRF payload (field errors etc.) when present. */
  data?: unknown;

  constructor(status: number, message: string, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const BFF = "/bff";

function messageFromPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    // DRF field errors: take the first one.
    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      if (typeof value === "string") return value;
    }
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (res.status === 401) {
    // Session ended (BFF already tried refresh). Bounce to login in the browser.
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Your session has expired. Please log in again.", "unauthorized");
  }

  const text = await res.text();
  const payload: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const code =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).code
        : undefined;
    throw new ApiError(
      res.status,
      messageFromPayload(payload, `Request failed (${res.status}).`),
      typeof code === "string" ? code : undefined,
      payload,
    );
  }

  return payload as T;
}

/**
 * Single low-level fetch helper, exported for callers that need custom handling.
 */
export function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init);
}

const jsonBody = (data: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(data),
});

// ---------------------------------------------------------------------------
// Auth (these hit the dedicated cookie-setting proxy routes)
// ---------------------------------------------------------------------------
export const register = (payload: RegisterPayload) =>
  apiFetch<{ user: User }>("/auth/register", jsonBody(payload));

export const login = (email: string, password: string) =>
  apiFetch<{ user: User }>("/auth/login", jsonBody({ email, password }));

export const logout = () => apiFetch<{ detail: string }>("/auth/logout", { method: "POST" });

export const me = () => apiFetch<Me>("/auth/me");

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export const getModules = () => apiFetch<ModuleListItem[]>("/modules");

export const getModule = (id: number) => apiFetch<ModuleDetail>(`/modules/${id}`);

export const completeModule = (id: number) =>
  apiFetch<UserState>(`/modules/${id}/complete`, { method: "POST" });

export const chooseScenarioOption = (scenarioId: number, optionId: number) =>
  apiFetch<ScenarioChoiceResult>(
    `/scenarios/${scenarioId}/choose`,
    jsonBody({ option_id: optionId }),
  );

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------
export const getPretest = () => apiFetch<Assessment>("/assessments/pretest");
export const getPosttest = () => apiFetch<Assessment>("/assessments/posttest");
export const getQuiz = (moduleId: number) =>
  apiFetch<Assessment>(`/assessments/quiz/${moduleId}`);
export const getUsability = () => apiFetch<Assessment>("/assessments/usability");

export const submitAssessment = (assessmentId: number, responses: ResponseItem[]) =>
  apiFetch<SubmitResult>(`/assessments/${assessmentId}/submit`, jsonBody({ responses }));

// ---------------------------------------------------------------------------
// Profile & reflections
// ---------------------------------------------------------------------------
export const getProfile = () => apiFetch<DimensionProfile>("/profile");
export const getGrowth = () => apiFetch<GrowthReport>("/profile/growth");

export const getReflectionPrompt = (moduleId: number) =>
  apiFetch<ReflectionPromptInfo>(`/modules/${moduleId}/reflection`);

export const postReflection = (moduleId: number, responseText: string) =>
  apiFetch<Reflection>(`/modules/${moduleId}/reflection`, jsonBody({ response_text: responseText }));

export const getReflections = () => apiFetch<Reflection[]>("/reflections");

// ---------------------------------------------------------------------------
// Admin / researcher
// ---------------------------------------------------------------------------
export const getParticipants = () => apiFetch<Participant[]>("/admin/participants");
export const getAdminStats = () => apiFetch<AdminStats>("/admin/stats");

/** Export URL for a CSV dataset (opened/downloaded via the browser through the BFF). */
export const exportUrl = (dataset: ExportDataset) =>
  `${BFF}/admin/export?dataset=${dataset}`;
