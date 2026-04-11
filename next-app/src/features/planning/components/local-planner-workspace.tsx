"use client";

import { useEffect, useRef, useState } from "react";
import { ZodError } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localPlanningService } from "@/features/local-mode/planning-storage";
import { PlanningInputError } from "@/features/planning/errors";
import {
  PlannerEmptyState,
  PlannerFieldError,
  PlannerFieldHint,
  PlannerFieldLabel,
  PlannerInlineStatus,
  PlannerReadOnlyHint
} from "@/features/planning/components/planner-feedback";
import { PlannerCommandSurface } from "@/features/planning/components/planner-command-surface";
import { PlannerOverview } from "@/features/planning/components/planner-overview";
import { PlannerSectionCard } from "@/features/planning/components/planner-section-card";
import { PlannerSubmitButton } from "@/features/planning/components/planner-submit-button";
import { LocalActionTrackingSections } from "@/features/planning/components/local-action-tracking-sections";
import { LocalGoalProgressSection } from "@/features/planning/components/local-goal-progress-section";
import { createGoalSchema, habitFrequencyEnum } from "@/features/planning/schema";
import type { CategoryRecord, DreamRecord, GoalRecord, PlanningSnapshot } from "@/types/planning";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function focusFirstField(form: HTMLFormElement | null): void {
  form?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])")?.focus();
}

function formatDateInputValue(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

type SectionState = {
  message?: string;
  variant?: "success" | "error";
  fieldErrors?: Record<string, string>;
};

type CategoryFormValues = {
  id: string;
  name: string;
  description: string;
};

type DreamFormValues = {
  id: string;
  title: string;
  description: string;
  vision: string;
  categoryId: string;
  targetDate: string;
};

type GoalFormValues = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  dreamId: string;
  progressType: "BINARY" | "PERCENT" | "TARGET_COUNT";
  targetDate: string;
  targetValue: string;
};

const EMPTY_SNAPSHOT: PlanningSnapshot = {
  categories: [],
  dreams: [],
  goals: [],
  goalLogs: [],
  habits: [],
  tasks: [],
  habitCompletions: [],
  taskCompletions: []
};

const EMPTY_CATEGORY_FORM: CategoryFormValues = {
  id: "",
  name: "",
  description: ""
};

const EMPTY_DREAM_FORM: DreamFormValues = {
  id: "",
  title: "",
  description: "",
  vision: "",
  categoryId: "",
  targetDate: ""
};

const EMPTY_GOAL_FORM: GoalFormValues = {
  id: "",
  title: "",
  description: "",
  categoryId: "",
  dreamId: "",
  progressType: "BINARY",
  targetDate: "",
  targetValue: ""
};

function toCategoryFormValues(category: CategoryRecord): CategoryFormValues {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? ""
  };
}

function toDreamFormValues(dream: DreamRecord): DreamFormValues {
  return {
    id: dream.id,
    title: dream.title,
    description: dream.description ?? "",
    vision: dream.vision ?? "",
    categoryId: dream.categoryId ?? "",
    targetDate: formatDateInputValue(dream.targetDate)
  };
}

function toGoalFormValues(goal: GoalRecord): GoalFormValues {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? "",
    categoryId: goal.categoryId ?? "",
    dreamId: goal.dreamId ?? "",
    progressType: goal.progressType,
    targetDate: formatDateInputValue(goal.targetDate),
    targetValue: goal.targetValue ? String(goal.targetValue) : ""
  };
}

export function LocalPlannerWorkspace({ displayName, statusText }: { displayName: string; statusText: string }): JSX.Element {
  const [snapshot, setSnapshot] = useState<PlanningSnapshot>(EMPTY_SNAPSHOT);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [categoryForm, setCategoryForm] = useState<CategoryFormValues>(EMPTY_CATEGORY_FORM);
  const [dreamForm, setDreamForm] = useState<DreamFormValues>(EMPTY_DREAM_FORM);
  const [goalForm, setGoalForm] = useState<GoalFormValues>(EMPTY_GOAL_FORM);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [showArchivedDreams, setShowArchivedDreams] = useState(false);
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const [categoryState, setCategoryState] = useState<SectionState>({});
  const [dreamState, setDreamState] = useState<SectionState>({});
  const [goalState, setGoalState] = useState<SectionState>({});
  const [habitState, setHabitState] = useState<SectionState>({});
  const [taskState, setTaskState] = useState<SectionState>({});
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [isDreamSaving, setIsDreamSaving] = useState(false);
  const [isGoalSaving, setIsGoalSaving] = useState(false);
  const [isHabitSaving, setIsHabitSaving] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const dreamFormRef = useRef<HTMLFormElement>(null);
  const goalFormRef = useRef<HTMLFormElement>(null);
  const habitFormRef = useRef<HTMLFormElement>(null);
  const taskFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const nextSnapshot = await localPlanningService.getSnapshot();

        if (cancelled) {
          return;
        }

        setSnapshot(nextSnapshot);
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsCategorySaving(true);
    setCategoryState({});

    try {
      const nextSnapshot = categoryForm.id
        ? await localPlanningService.updateCategory({
          id: categoryForm.id,
          name: categoryForm.name,
          description: categoryForm.description
        })
        : await localPlanningService.saveCategory({
          name: categoryForm.name,
          description: categoryForm.description
        });

      setSnapshot(nextSnapshot);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setCategoryState({ variant: "success", message: categoryForm.id ? "Category saved on this device." : "Category added on this device." });
      focusFirstField(categoryFormRef.current);
    } catch (error) {
      if (error instanceof ZodError) {
        setCategoryState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setCategoryState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setCategoryState({ variant: "error", message: "Could not save that category locally." });
      }
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function handleDreamSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsDreamSaving(true);
    setDreamState({});

    try {
      const nextSnapshot = dreamForm.id
        ? await localPlanningService.updateDream({
          id: dreamForm.id,
          title: dreamForm.title,
          description: dreamForm.description,
          vision: dreamForm.vision,
          categoryId: dreamForm.categoryId,
          targetDate: dreamForm.targetDate
        })
        : await localPlanningService.saveDream({
          title: dreamForm.title,
          description: dreamForm.description,
          vision: dreamForm.vision,
          categoryId: dreamForm.categoryId,
          targetDate: dreamForm.targetDate
        });

      setSnapshot(nextSnapshot);
      setDreamForm(EMPTY_DREAM_FORM);
      setDreamState({ variant: "success", message: dreamForm.id ? "Dream saved on this device." : "Dream added on this device." });
      focusFirstField(dreamFormRef.current);
    } catch (error) {
      if (error instanceof ZodError) {
        setDreamState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setDreamState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setDreamState({ variant: "error", message: "Could not save that dream locally." });
      }
    } finally {
      setIsDreamSaving(false);
    }
  }

  async function handleGoalSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsGoalSaving(true);
    setGoalState({});

    try {
      const payload = {
        title: goalForm.title,
        description: goalForm.description,
        categoryId: goalForm.categoryId,
        dreamId: goalForm.dreamId,
        progressType: createGoalSchema.shape.progressType.parse(goalForm.progressType),
        targetDate: goalForm.targetDate,
        targetValue: goalForm.targetValue ? Number(goalForm.targetValue) : null
      };

      const nextSnapshot = goalForm.id
        ? await localPlanningService.updateGoal({ id: goalForm.id, ...payload })
        : await localPlanningService.saveGoal(payload);

      setSnapshot(nextSnapshot);
      setGoalForm(EMPTY_GOAL_FORM);
      setGoalState({ variant: "success", message: goalForm.id ? "Goal saved on this device." : "Goal added on this device." });
      focusFirstField(goalFormRef.current);
    } catch (error) {
      if (error instanceof ZodError) {
        setGoalState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setGoalState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setGoalState({ variant: "error", message: "Could not save that goal locally." });
      }
    } finally {
      setIsGoalSaving(false);
    }
  }

  async function handleHabitSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    const form = event.currentTarget;
    event.preventDefault();
    setIsHabitSaving(true);
    setHabitState({});
    const formData = new FormData(form);

    try {
      const nextSnapshot = await localPlanningService.saveHabit({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        goalId: String(formData.get("goalId") ?? ""),
        frequency: habitFrequencyEnum.parse(String(formData.get("frequency") ?? "DAILY")),
        customDays: null
      });

      setSnapshot(nextSnapshot);
      setHabitState({ variant: "success", message: "Habit saved on this device." });
      form.reset();
      focusFirstField(habitFormRef.current);
    } catch (error) {
      if (error instanceof ZodError) {
        setHabitState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else {
        setHabitState({ variant: "error", message: "Could not save that habit locally." });
      }
    } finally {
      setIsHabitSaving(false);
    }
  }

  async function handleTaskSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    const form = event.currentTarget;
    event.preventDefault();
    setIsTaskSaving(true);
    setTaskState({});
    const formData = new FormData(form);

    try {
      const nextSnapshot = await localPlanningService.saveTask({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        goalId: String(formData.get("goalId") ?? ""),
        scheduledFor: String(formData.get("scheduledFor") ?? "")
      });

      setSnapshot(nextSnapshot);
      setTaskState({ variant: "success", message: "Task saved on this device." });
      form.reset();
      focusFirstField(taskFormRef.current);
    } catch (error) {
      if (error instanceof ZodError) {
        setTaskState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else {
        setTaskState({ variant: "error", message: "Could not save that task locally." });
      }
    } finally {
      setIsTaskSaving(false);
    }
  }

  async function handleCategoryArchive(id: string): Promise<void> {
    setCategoryState({});

    try {
      const nextSnapshot = await localPlanningService.archiveCategory(id);
      setSnapshot(nextSnapshot);
      if (categoryForm.id === id) {
        setCategoryForm(EMPTY_CATEGORY_FORM);
      }
      setCategoryState({ variant: "success", message: "Category archived on this device." });
    } catch {
      setCategoryState({ variant: "error", message: "Could not archive that category locally." });
    }
  }

  async function handleDreamArchive(id: string): Promise<void> {
    setDreamState({});

    try {
      const nextSnapshot = await localPlanningService.archiveDream(id);
      setSnapshot(nextSnapshot);
      if (dreamForm.id === id) {
        setDreamForm(EMPTY_DREAM_FORM);
      }
      setDreamState({ variant: "success", message: "Dream archived on this device." });
    } catch {
      setDreamState({ variant: "error", message: "Could not archive that dream locally." });
    }
  }

  async function handleGoalArchive(id: string): Promise<void> {
    setGoalState({});

    try {
      const nextSnapshot = await localPlanningService.archiveGoal(id);
      setSnapshot(nextSnapshot);
      if (goalForm.id === id) {
        setGoalForm(EMPTY_GOAL_FORM);
      }
      setGoalState({ variant: "success", message: "Goal archived on this device." });
    } catch {
      setGoalState({ variant: "error", message: "Could not archive that goal locally." });
    }
  }

  if (status === "loading") {
    return <PlannerInlineStatus variant="success">Loading the local planner workspace...</PlannerInlineStatus>;
  }

  if (status === "error") {
    return <PlannerInlineStatus variant="error">The local planner could not load from this browser.</PlannerInlineStatus>;
  }

  const activeCategories = snapshot.categories.filter((item) => item.status === "ACTIVE");
  const visibleCategories = showArchivedCategories ? snapshot.categories : activeCategories;
  const activeGoals = snapshot.goals.filter((item) => item.status !== "ARCHIVED");
  const visibleDreams = showArchivedDreams ? snapshot.dreams : snapshot.dreams.filter((item) => item.status !== "ARCHIVED");
  const visibleGoals = showArchivedGoals ? snapshot.goals : activeGoals;
  const dreamCategoryOptions = snapshot.categories.filter((item) => item.status === "ACTIVE" || item.id === dreamForm.categoryId);
  const goalCategoryOptions = snapshot.categories.filter((item) => item.status === "ACTIVE" || item.id === goalForm.categoryId);
  const goalDreamOptions = snapshot.dreams.filter((item) => item.status !== "ARCHIVED" || item.id === goalForm.dreamId);

  function getCategoryName(categoryId?: string | null): string | null {
    return snapshot.categories.find((item) => item.id === categoryId)?.name ?? null;
  }

  function getDreamTitle(dreamId?: string | null): string | null {
    return snapshot.dreams.find((item) => item.id === dreamId)?.title ?? null;
  }

  return (
    <div className="space-y-8">
      <PlannerOverview modeLabel="Local mode" snapshot={snapshot} />

      <PlannerCommandSurface displayName={displayName} modeLabel="Local mode" statusText={statusText}>
        <section className="grid gap-6 xl:grid-cols-2">
        <PlannerSectionCard description="Life areas that help organize the longer-term structures underneath them." kicker="Categories" sectionId="categories" title="Keep your planner organized without forcing too much structure.">
          <form aria-busy={isCategorySaving} className="space-y-3.5" onSubmit={(event) => void handleCategorySubmit(event)} ref={categoryFormRef}>
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-category-name">Category name</PlannerFieldLabel>
              <Input aria-describedby={categoryState.fieldErrors?.name ? "local-category-name-error" : undefined} aria-invalid={categoryState.fieldErrors?.name ? true : undefined} id="local-category-name" onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Health" required value={categoryForm.name} />
              <PlannerFieldError id="local-category-name-error" message={categoryState.fieldErrors?.name} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-category-description" optional>Description</PlannerFieldLabel>
              <Textarea id="local-category-description" onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={categoryForm.description} />
            </div>

            {categoryState.message ? <PlannerInlineStatus variant={categoryState.variant === "error" ? "error" : "success"}>{categoryState.message}</PlannerInlineStatus> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <PlannerSubmitButton pending={isCategorySaving}>{categoryForm.id ? "Save category locally" : "Add category locally"}</PlannerSubmitButton>
              {categoryForm.id ? (
                <Button fullWidth onClick={() => setCategoryForm(EMPTY_CATEGORY_FORM)} type="button" variant="secondary">
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Stored categories</p>
              <Button onClick={() => setShowArchivedCategories((current) => !current)} size="sm" type="button" variant="ghost">
                {showArchivedCategories ? "Hide archived" : "Show archived"}
              </Button>
            </div>
            {visibleCategories.length === 0 ? <PlannerEmptyState>No categories yet. Add a life area when you want a little structure without a deep hierarchy.</PlannerEmptyState> : null}
            {visibleCategories.map((category) => (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.06]" key={category.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{category.name}</p>
                      <Badge variant={category.status === "ARCHIVED" ? "warning" : "success"}>{category.status === "ARCHIVED" ? "Archived" : "Active"}</Badge>
                    </div>
                    {category.description ? <p className="text-sm leading-6 text-muted">{category.description}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setCategoryForm(toCategoryFormValues(category))} size="sm" type="button" variant="secondary">
                      Edit
                    </Button>
                    {category.status !== "ARCHIVED" ? (
                      <Button onClick={() => void handleCategoryArchive(category.id)} size="sm" type="button" variant="ghost">Archive</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlannerSectionCard>

        <PlannerSectionCard description="Longer-range aspirations that can stay independent or later collect goals underneath them." kicker="Dreams" sectionId="dreams" title="Set a direction worth chasing.">
          <form aria-busy={isDreamSaving} className="space-y-3.5" onSubmit={(event) => void handleDreamSubmit(event)} ref={dreamFormRef}>
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-dream-title">Dream title</PlannerFieldLabel>
              <Input aria-describedby={dreamState.fieldErrors?.title ? "local-dream-title-error" : undefined} aria-invalid={dreamState.fieldErrors?.title ? true : undefined} id="local-dream-title" onChange={(event) => setDreamForm((current) => ({ ...current, title: event.target.value }))} placeholder="Have a healthier body" required value={dreamForm.title} />
              <PlannerFieldError id="local-dream-title-error" message={dreamState.fieldErrors?.title} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-dream-category" optional>Category</PlannerFieldLabel>
              <Select id="local-dream-category" onChange={(event) => setDreamForm((current) => ({ ...current, categoryId: event.target.value }))} value={dreamForm.categoryId}>
                <option value="">No category yet</option>
                {dreamCategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}{category.status === "ARCHIVED" ? " (archived)" : ""}</option>
                ))}
              </Select>
              <PlannerFieldError id="local-dream-category-error" message={dreamState.fieldErrors?.categoryId} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-dream-vision" optional>Long-term vision</PlannerFieldLabel>
              <Textarea aria-describedby={dreamState.fieldErrors?.vision ? "local-dream-vision-error" : undefined} aria-invalid={dreamState.fieldErrors?.vision ? true : undefined} id="local-dream-vision" onChange={(event) => setDreamForm((current) => ({ ...current, vision: event.target.value }))} placeholder="What does this dream mean to you over the long term?" value={dreamForm.vision} />
              <PlannerFieldError id="local-dream-vision-error" message={dreamState.fieldErrors?.vision} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-dream-target-date" optional>Target date</PlannerFieldLabel>
              <Input aria-describedby={dreamState.fieldErrors?.targetDate ? "local-dream-target-date-error" : undefined} aria-invalid={dreamState.fieldErrors?.targetDate ? true : undefined} id="local-dream-target-date" onChange={(event) => setDreamForm((current) => ({ ...current, targetDate: event.target.value }))} type="date" value={dreamForm.targetDate} />
              <PlannerFieldHint>Date only for now to keep planning lighter on mobile.</PlannerFieldHint>
              <PlannerFieldError id="local-dream-target-date-error" message={dreamState.fieldErrors?.targetDate} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-dream-description" optional>Context</PlannerFieldLabel>
              <Textarea aria-describedby={dreamState.fieldErrors?.description ? "local-dream-description-error" : undefined} aria-invalid={dreamState.fieldErrors?.description ? true : undefined} id="local-dream-description" onChange={(event) => setDreamForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={dreamForm.description} />
              <PlannerFieldError id="local-dream-description-error" message={dreamState.fieldErrors?.description} />
            </div>

            {dreamState.message ? <PlannerInlineStatus variant={dreamState.variant === "error" ? "error" : "success"}>{dreamState.message}</PlannerInlineStatus> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <PlannerSubmitButton pending={isDreamSaving}>{dreamForm.id ? "Save dream locally" : "Add dream locally"}</PlannerSubmitButton>
              {dreamForm.id ? (
                <Button fullWidth onClick={() => setDreamForm(EMPTY_DREAM_FORM)} type="button" variant="secondary">
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Stored dreams</p>
              <Button onClick={() => setShowArchivedDreams((current) => !current)} size="sm" type="button" variant="ghost">
                {showArchivedDreams ? "Hide archived" : "Show archived"}
              </Button>
            </div>
            {visibleDreams.length === 0 ? <PlannerEmptyState>No dreams yet. Start with the long-term direction you care about most.</PlannerEmptyState> : null}
            {visibleDreams.map((dream) => (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.06]" key={dream.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{dream.title}</p>
                      <Badge variant={dream.status === "ARCHIVED" ? "warning" : "success"}>{dream.status === "ARCHIVED" ? "Archived" : "Active"}</Badge>
                      {dream.categoryId ? <Badge variant="muted">{getCategoryName(dream.categoryId)}</Badge> : null}
                    </div>
                    {dream.vision ? <p className="text-sm leading-6 text-muted">{dream.vision}</p> : null}
                    {dream.targetDate ? <p className="text-xs leading-5 text-muted/75">Target date: {formatDateInputValue(dream.targetDate)}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setDreamForm(toDreamFormValues(dream))} size="sm" type="button" variant="secondary">
                      Edit
                    </Button>
                    {dream.status !== "ARCHIVED" ? (
                      <Button onClick={() => void handleDreamArchive(dream.id)} size="sm" type="button" variant="ghost">Archive</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlannerSectionCard>
        <PlannerSectionCard description="Concrete outcomes that can stand alone or connect back to a dream when that helps." kicker="Goals" sectionId="goals" title="Turn a direction into a measurable target.">
          <form aria-busy={isGoalSaving} className="space-y-3.5" onSubmit={(event) => void handleGoalSubmit(event)} ref={goalFormRef}>
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-goal-title">Goal title</PlannerFieldLabel>
              <Input aria-describedby={goalState.fieldErrors?.title ? "local-goal-title-error" : undefined} aria-invalid={goalState.fieldErrors?.title ? true : undefined} id="local-goal-title" onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} placeholder="Lose 20 kilos" required value={goalForm.title} />
              <PlannerFieldError id="local-goal-title-error" message={goalState.fieldErrors?.title} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="local-goal-category" optional>Category</PlannerFieldLabel>
                <Select id="local-goal-category" onChange={(event) => setGoalForm((current) => ({ ...current, categoryId: event.target.value }))} value={goalForm.categoryId}>
                  <option value="">No category yet</option>
                  {goalCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}{category.status === "ARCHIVED" ? " (archived)" : ""}</option>
                  ))}
                </Select>
                <PlannerFieldError id="local-goal-category-error" message={goalState.fieldErrors?.categoryId} />
              </div>
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="local-goal-dream" optional>Linked dream</PlannerFieldLabel>
                <Select id="local-goal-dream" onChange={(event) => setGoalForm((current) => ({ ...current, dreamId: event.target.value }))} value={goalForm.dreamId}>
                  <option value="">Link to a dream later</option>
                  {goalDreamOptions.map((dream) => (
                    <option key={dream.id} value={dream.id}>{dream.title}{dream.status === "ARCHIVED" ? " (archived)" : ""}</option>
                  ))}
                </Select>
                <PlannerFieldError id="local-goal-dream-error" message={goalState.fieldErrors?.dreamId} />
              </div>
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-goal-progress-type">Progress type</PlannerFieldLabel>
              <Select id="local-goal-progress-type" onChange={(event) => setGoalForm((current) => ({ ...current, progressType: event.target.value as GoalFormValues["progressType"] }))} value={goalForm.progressType}>
                <option value="BINARY">Complete / not complete</option>
                <option value="PERCENT">Percentage progress</option>
                <option value="TARGET_COUNT">Target count</option>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="local-goal-target-value" optional>Target value</PlannerFieldLabel>
                <Input aria-describedby={goalState.fieldErrors?.targetValue ? "local-goal-target-value-error" : undefined} aria-invalid={goalState.fieldErrors?.targetValue ? true : undefined} id="local-goal-target-value" onChange={(event) => setGoalForm((current) => ({ ...current, targetValue: event.target.value }))} placeholder="Optional target value" type="number" value={goalForm.targetValue} />
                <PlannerFieldError id="local-goal-target-value-error" message={goalState.fieldErrors?.targetValue} />
              </div>
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="local-goal-target-date" optional>Target date</PlannerFieldLabel>
                <Input aria-describedby={goalState.fieldErrors?.targetDate ? "local-goal-target-date-error" : undefined} aria-invalid={goalState.fieldErrors?.targetDate ? true : undefined} id="local-goal-target-date" onChange={(event) => setGoalForm((current) => ({ ...current, targetDate: event.target.value }))} type="date" value={goalForm.targetDate} />
                <PlannerFieldHint>Date only for now to keep planning lighter on mobile.</PlannerFieldHint>
                <PlannerFieldError id="local-goal-target-date-error" message={goalState.fieldErrors?.targetDate} />
              </div>
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-goal-description" optional>Context</PlannerFieldLabel>
              <Textarea aria-describedby={goalState.fieldErrors?.description ? "local-goal-description-error" : undefined} aria-invalid={goalState.fieldErrors?.description ? true : undefined} id="local-goal-description" onChange={(event) => setGoalForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={goalForm.description} />
              <PlannerFieldError id="local-goal-description-error" message={goalState.fieldErrors?.description} />
            </div>

            {goalState.message ? <PlannerInlineStatus variant={goalState.variant === "error" ? "error" : "success"}>{goalState.message}</PlannerInlineStatus> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <PlannerSubmitButton pending={isGoalSaving}>{goalForm.id ? "Save goal locally" : "Add goal locally"}</PlannerSubmitButton>
              {goalForm.id ? (
                <Button fullWidth onClick={() => setGoalForm(EMPTY_GOAL_FORM)} type="button" variant="secondary">
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Stored goals</p>
              <Button onClick={() => setShowArchivedGoals((current) => !current)} size="sm" type="button" variant="ghost">
                {showArchivedGoals ? "Hide archived" : "Show archived"}
              </Button>
            </div>
            {visibleGoals.length === 0 ? <PlannerEmptyState>No goals yet. Add the first concrete outcome you want to reach.</PlannerEmptyState> : null}
            {visibleGoals.map((goal) => (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.06]" key={goal.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{goal.title}</p>
                      <Badge variant={goal.status === "ARCHIVED" ? "warning" : "success"}>{goal.status === "ARCHIVED" ? "Archived" : "Active"}</Badge>
                      {goal.categoryId ? <Badge variant="muted">{getCategoryName(goal.categoryId)}</Badge> : null}
                      {goal.dreamId ? <Badge variant="muted">{getDreamTitle(goal.dreamId)}</Badge> : null}
                    </div>
                    <p className="text-sm leading-6 text-muted">{goal.progressType === "TARGET_COUNT" && goal.targetValue ? `Target: ${goal.targetValue}` : goal.progressType === "PERCENT" ? "Track this as a percentage." : "Treat this as a binary milestone."}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setGoalForm(toGoalFormValues(goal))} size="sm" type="button" variant="secondary">
                      Edit
                    </Button>
                    {goal.status !== "ARCHIVED" ? (
                      <Button onClick={() => void handleGoalArchive(goal.id)} size="sm" type="button" variant="ghost">Archive</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlannerSectionCard>

          <LocalGoalProgressSection onSnapshotChange={setSnapshot} snapshot={snapshot} />
          <LocalActionTrackingSections onSnapshotChange={setSnapshot} snapshot={snapshot} />
        </section>
      </PlannerCommandSurface>
    </div>
  );
}





