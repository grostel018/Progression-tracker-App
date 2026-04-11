"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveCategoryAction,
  archiveDreamAction,
  archiveGoalAction,
  createHabitAction,
  createTaskAction,
  saveCategoryAction,
  saveDreamAction,
  saveGoalAction
} from "@/features/planning/actions/cloud";
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
import { CloudActionTrackingSections } from "@/features/planning/components/cloud-action-tracking-sections";
import { CloudGoalProgressSection } from "@/features/planning/components/cloud-goal-progress-section";
import { PLANNING_ACTION_INITIAL_STATE } from "@/features/planning/types";
import type { CategoryRecord, DreamRecord, GoalRecord, PlanningSnapshot } from "@/types/planning";

function focusFirstField(form: HTMLFormElement | null): void {
  form?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])")?.focus();
}

function formatDateInputValue(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

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

type InlineNotice = {
  message: string;
  variant: "success" | "error";
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

export function CloudPlannerWorkspace({ initialSnapshot, displayName, statusText }: { initialSnapshot: PlanningSnapshot; displayName: string; statusText: string }): JSX.Element {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [categoryForm, setCategoryForm] = useState<CategoryFormValues>(EMPTY_CATEGORY_FORM);
  const [dreamForm, setDreamForm] = useState<DreamFormValues>(EMPTY_DREAM_FORM);
  const [goalForm, setGoalForm] = useState<GoalFormValues>(EMPTY_GOAL_FORM);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [showArchivedDreams, setShowArchivedDreams] = useState(false);
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState<InlineNotice | null>(null);
  const [dreamNotice, setDreamNotice] = useState<InlineNotice | null>(null);
  const [goalNotice, setGoalNotice] = useState<InlineNotice | null>(null);
  const [habitNotice, setHabitNotice] = useState<InlineNotice | null>(null);
  const [taskNotice, setTaskNotice] = useState<InlineNotice | null>(null);
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const dreamFormRef = useRef<HTMLFormElement>(null);
  const goalFormRef = useRef<HTMLFormElement>(null);
  const habitFormRef = useRef<HTMLFormElement>(null);
  const taskFormRef = useRef<HTMLFormElement>(null);

  const [categoryState, categoryAction] = useFormState(saveCategoryAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [categoryArchiveState, categoryArchiveAction] = useFormState(archiveCategoryAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [dreamState, dreamAction] = useFormState(saveDreamAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [dreamArchiveState, dreamArchiveAction] = useFormState(archiveDreamAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [goalState, goalAction] = useFormState(saveGoalAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [goalArchiveState, goalArchiveAction] = useFormState(archiveGoalAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [habitState, habitAction] = useFormState(createHabitAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });
  const [taskState, taskAction] = useFormState(createTaskAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot: initialSnapshot });

  useEffect(() => {
    if (categoryState.status === "success") {
      setSnapshot(categoryState.snapshot);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setCategoryNotice({ variant: "success", message: categoryState.message ?? "Category saved." });
      focusFirstField(categoryFormRef.current);
    } else if (categoryState.status === "error" && categoryState.message) {
      setCategoryNotice({ variant: "error", message: categoryState.message });
    }
  }, [categoryState]);

  useEffect(() => {
    if (categoryArchiveState.status === "success") {
      setSnapshot(categoryArchiveState.snapshot);
      setCategoryNotice({ variant: "success", message: categoryArchiveState.message ?? "Category archived." });
      if (categoryForm.id && categoryArchiveState.snapshot.categories.find((item) => item.id === categoryForm.id)?.status === "ARCHIVED") {
        setCategoryForm(EMPTY_CATEGORY_FORM);
      }
    } else if (categoryArchiveState.status === "error" && categoryArchiveState.message) {
      setCategoryNotice({ variant: "error", message: categoryArchiveState.message });
    }
  }, [categoryArchiveState, categoryForm.id]);

  useEffect(() => {
    if (dreamState.status === "success") {
      setSnapshot(dreamState.snapshot);
      setDreamForm(EMPTY_DREAM_FORM);
      setDreamNotice({ variant: "success", message: dreamState.message ?? "Dream saved." });
      focusFirstField(dreamFormRef.current);
    } else if (dreamState.status === "error" && dreamState.message) {
      setDreamNotice({ variant: "error", message: dreamState.message });
    }
  }, [dreamState]);

  useEffect(() => {
    if (dreamArchiveState.status === "success") {
      setSnapshot(dreamArchiveState.snapshot);
      setDreamNotice({ variant: "success", message: dreamArchiveState.message ?? "Dream archived." });
      if (dreamForm.id && dreamArchiveState.snapshot.dreams.find((item) => item.id === dreamForm.id)?.status === "ARCHIVED") {
        setDreamForm(EMPTY_DREAM_FORM);
      }
    } else if (dreamArchiveState.status === "error" && dreamArchiveState.message) {
      setDreamNotice({ variant: "error", message: dreamArchiveState.message });
    }
  }, [dreamArchiveState, dreamForm.id]);

  useEffect(() => {
    if (goalState.status === "success") {
      setSnapshot(goalState.snapshot);
      setGoalForm(EMPTY_GOAL_FORM);
      setGoalNotice({ variant: "success", message: goalState.message ?? "Goal saved." });
      focusFirstField(goalFormRef.current);
    } else if (goalState.status === "error" && goalState.message) {
      setGoalNotice({ variant: "error", message: goalState.message });
    }
  }, [goalState]);

  useEffect(() => {
    if (goalArchiveState.status === "success") {
      setSnapshot(goalArchiveState.snapshot);
      setGoalNotice({ variant: "success", message: goalArchiveState.message ?? "Goal archived." });
      if (goalForm.id && goalArchiveState.snapshot.goals.find((item) => item.id === goalForm.id)?.status === "ARCHIVED") {
        setGoalForm(EMPTY_GOAL_FORM);
      }
    } else if (goalArchiveState.status === "error" && goalArchiveState.message) {
      setGoalNotice({ variant: "error", message: goalArchiveState.message });
    }
  }, [goalArchiveState, goalForm.id]);

  useEffect(() => {
    if (habitState.status === "success") {
      setSnapshot(habitState.snapshot);
      habitFormRef.current?.reset();
      setHabitNotice({ variant: "success", message: habitState.message ?? "Habit added." });
      focusFirstField(habitFormRef.current);
    } else if (habitState.status === "error" && habitState.message) {
      setHabitNotice({ variant: "error", message: habitState.message });
    }
  }, [habitState]);

  useEffect(() => {
    if (taskState.status === "success") {
      setSnapshot(taskState.snapshot);
      taskFormRef.current?.reset();
      setTaskNotice({ variant: "success", message: taskState.message ?? "Task added." });
      focusFirstField(taskFormRef.current);
    } else if (taskState.status === "error" && taskState.message) {
      setTaskNotice({ variant: "error", message: taskState.message });
    }
  }, [taskState]);

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
      <PlannerOverview modeLabel="Cloud mode" snapshot={snapshot} />

      <PlannerCommandSurface displayName={displayName} modeLabel="Cloud mode" statusText={statusText}>
        <section className="grid gap-6 xl:grid-cols-2">
        <PlannerSectionCard description="Life areas that help organize the longer-term structures underneath them." kicker="Categories" sectionId="categories" title="Keep your planner organized without forcing too much structure.">
          <form action={categoryAction} className="space-y-3.5" ref={categoryFormRef}>
            <input name="id" type="hidden" value={categoryForm.id} />
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-category-name">Category name</PlannerFieldLabel>
              <Input aria-describedby={categoryState.fieldErrors?.name ? "cloud-category-name-error" : undefined} aria-invalid={categoryState.fieldErrors?.name ? true : undefined} id="cloud-category-name" name="name" onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Health" required value={categoryForm.name} />
              <PlannerFieldError id="cloud-category-name-error" message={categoryState.fieldErrors?.name} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-category-description" optional>Description</PlannerFieldLabel>
              <Textarea id="cloud-category-description" name="description" onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={categoryForm.description} />
            </div>

            {categoryNotice ? <PlannerInlineStatus variant={categoryNotice.variant}>{categoryNotice.message}</PlannerInlineStatus> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <PlannerSubmitButton pendingLabel={categoryForm.id ? "Saving category..." : "Adding category..."}>{categoryForm.id ? "Save category" : "Add category"}</PlannerSubmitButton>
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
                      <form action={categoryArchiveAction}>
                        <input name="id" type="hidden" value={category.id} />
                        <Button size="sm" type="submit" variant="ghost">Archive</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlannerSectionCard>

        <PlannerSectionCard description="Longer-range aspirations that can stay independent or later collect goals underneath them." kicker="Dreams" sectionId="dreams" title="Set a direction worth chasing.">
          <form action={dreamAction} className="space-y-3.5" ref={dreamFormRef}>
            <input name="id" type="hidden" value={dreamForm.id} />
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-dream-title">Dream title</PlannerFieldLabel>
              <Input aria-describedby={dreamState.fieldErrors?.title ? "cloud-dream-title-error" : undefined} aria-invalid={dreamState.fieldErrors?.title ? true : undefined} id="cloud-dream-title" name="title" onChange={(event) => setDreamForm((current) => ({ ...current, title: event.target.value }))} placeholder="Have a healthier body" required value={dreamForm.title} />
              <PlannerFieldError id="cloud-dream-title-error" message={dreamState.fieldErrors?.title} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-dream-category" optional>Category</PlannerFieldLabel>
              <Select id="cloud-dream-category" name="categoryId" onChange={(event) => setDreamForm((current) => ({ ...current, categoryId: event.target.value }))} value={dreamForm.categoryId}>
                <option value="">No category yet</option>
                {dreamCategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}{category.status === "ARCHIVED" ? " (archived)" : ""}</option>
                ))}
              </Select>
              <PlannerFieldError id="cloud-dream-category-error" message={dreamState.fieldErrors?.categoryId} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-dream-vision" optional>Long-term vision</PlannerFieldLabel>
              <Textarea aria-describedby={dreamState.fieldErrors?.vision ? "cloud-dream-vision-error" : undefined} aria-invalid={dreamState.fieldErrors?.vision ? true : undefined} id="cloud-dream-vision" name="vision" onChange={(event) => setDreamForm((current) => ({ ...current, vision: event.target.value }))} placeholder="What does this dream mean to you over the long term?" value={dreamForm.vision} />
              <PlannerFieldError id="cloud-dream-vision-error" message={dreamState.fieldErrors?.vision} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-dream-target-date" optional>Target date</PlannerFieldLabel>
              <Input aria-describedby={dreamState.fieldErrors?.targetDate ? "cloud-dream-target-date-error" : undefined} aria-invalid={dreamState.fieldErrors?.targetDate ? true : undefined} id="cloud-dream-target-date" name="targetDate" onChange={(event) => setDreamForm((current) => ({ ...current, targetDate: event.target.value }))} type="date" value={dreamForm.targetDate} />
              <PlannerFieldHint>Date only for now to keep planning lighter on mobile.</PlannerFieldHint>
              <PlannerFieldError id="cloud-dream-target-date-error" message={dreamState.fieldErrors?.targetDate} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-dream-description" optional>Context</PlannerFieldLabel>
              <Textarea aria-describedby={dreamState.fieldErrors?.description ? "cloud-dream-description-error" : undefined} aria-invalid={dreamState.fieldErrors?.description ? true : undefined} id="cloud-dream-description" name="description" onChange={(event) => setDreamForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={dreamForm.description} />
              <PlannerFieldError id="cloud-dream-description-error" message={dreamState.fieldErrors?.description} />
            </div>

            {dreamNotice ? <PlannerInlineStatus variant={dreamNotice.variant}>{dreamNotice.message}</PlannerInlineStatus> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <PlannerSubmitButton pendingLabel={dreamForm.id ? "Saving dream..." : "Adding dream..."}>{dreamForm.id ? "Save dream" : "Add dream"}</PlannerSubmitButton>
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
                      <form action={dreamArchiveAction}>
                        <input name="id" type="hidden" value={dream.id} />
                        <Button size="sm" type="submit" variant="ghost">Archive</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlannerSectionCard>
        <PlannerSectionCard description="Concrete outcomes that can stand alone or connect back to a dream when that helps." kicker="Goals" sectionId="goals" title="Turn a direction into a measurable target.">
          <form action={goalAction} className="space-y-3.5" ref={goalFormRef}>
            <input name="id" type="hidden" value={goalForm.id} />
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-goal-title">Goal title</PlannerFieldLabel>
              <Input aria-describedby={goalState.fieldErrors?.title ? "cloud-goal-title-error" : undefined} aria-invalid={goalState.fieldErrors?.title ? true : undefined} id="cloud-goal-title" name="title" onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} placeholder="Lose 20 kilos" required value={goalForm.title} />
              <PlannerFieldError id="cloud-goal-title-error" message={goalState.fieldErrors?.title} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="cloud-goal-category" optional>Category</PlannerFieldLabel>
                <Select id="cloud-goal-category" name="categoryId" onChange={(event) => setGoalForm((current) => ({ ...current, categoryId: event.target.value }))} value={goalForm.categoryId}>
                  <option value="">No category yet</option>
                  {goalCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}{category.status === "ARCHIVED" ? " (archived)" : ""}</option>
                  ))}
                </Select>
                <PlannerFieldError id="cloud-goal-category-error" message={goalState.fieldErrors?.categoryId} />
              </div>
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="cloud-goal-dream" optional>Linked dream</PlannerFieldLabel>
                <Select id="cloud-goal-dream" name="dreamId" onChange={(event) => setGoalForm((current) => ({ ...current, dreamId: event.target.value }))} value={goalForm.dreamId}>
                  <option value="">Link to a dream later</option>
                  {goalDreamOptions.map((dream) => (
                    <option key={dream.id} value={dream.id}>{dream.title}{dream.status === "ARCHIVED" ? " (archived)" : ""}</option>
                  ))}
                </Select>
                <PlannerFieldError id="cloud-goal-dream-error" message={goalState.fieldErrors?.dreamId} />
              </div>
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-goal-progress-type">Progress type</PlannerFieldLabel>
              <Select id="cloud-goal-progress-type" name="progressType" onChange={(event) => setGoalForm((current) => ({ ...current, progressType: event.target.value as GoalFormValues["progressType"] }))} value={goalForm.progressType}>
                <option value="BINARY">Complete / not complete</option>
                <option value="PERCENT">Percentage progress</option>
                <option value="TARGET_COUNT">Target count</option>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="cloud-goal-target-value" optional>Target value</PlannerFieldLabel>
                <Input aria-describedby={goalState.fieldErrors?.targetValue ? "cloud-goal-target-value-error" : undefined} aria-invalid={goalState.fieldErrors?.targetValue ? true : undefined} id="cloud-goal-target-value" name="targetValue" onChange={(event) => setGoalForm((current) => ({ ...current, targetValue: event.target.value }))} placeholder="Optional target value" type="number" value={goalForm.targetValue} />
                <PlannerFieldError id="cloud-goal-target-value-error" message={goalState.fieldErrors?.targetValue} />
              </div>
              <div className="space-y-2">
                <PlannerFieldLabel htmlFor="cloud-goal-target-date" optional>Target date</PlannerFieldLabel>
                <Input aria-describedby={goalState.fieldErrors?.targetDate ? "cloud-goal-target-date-error" : undefined} aria-invalid={goalState.fieldErrors?.targetDate ? true : undefined} id="cloud-goal-target-date" name="targetDate" onChange={(event) => setGoalForm((current) => ({ ...current, targetDate: event.target.value }))} type="date" value={goalForm.targetDate} />
                <PlannerFieldHint>Date only for now to keep planning lighter on mobile.</PlannerFieldHint>
                <PlannerFieldError id="cloud-goal-target-date-error" message={goalState.fieldErrors?.targetDate} />
              </div>
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-goal-description" optional>Context</PlannerFieldLabel>
              <Textarea aria-describedby={goalState.fieldErrors?.description ? "cloud-goal-description-error" : undefined} aria-invalid={goalState.fieldErrors?.description ? true : undefined} id="cloud-goal-description" name="description" onChange={(event) => setGoalForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={goalForm.description} />
              <PlannerFieldError id="cloud-goal-description-error" message={goalState.fieldErrors?.description} />
            </div>

            {goalNotice ? <PlannerInlineStatus variant={goalNotice.variant}>{goalNotice.message}</PlannerInlineStatus> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <PlannerSubmitButton pendingLabel={goalForm.id ? "Saving goal..." : "Adding goal..."}>{goalForm.id ? "Save goal" : "Add goal"}</PlannerSubmitButton>
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
                      <form action={goalArchiveAction}>
                        <input name="id" type="hidden" value={goal.id} />
                        <Button size="sm" type="submit" variant="ghost">Archive</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlannerSectionCard>
          <CloudGoalProgressSection onSnapshotChange={setSnapshot} snapshot={snapshot} />
          <CloudActionTrackingSections onSnapshotChange={setSnapshot} snapshot={snapshot} />
        </section>
      </PlannerCommandSurface>
    </div>
  );
}




