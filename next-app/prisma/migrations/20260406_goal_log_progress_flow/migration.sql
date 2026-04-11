-- CreateTable
CREATE TABLE "GoalLog" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "progressValue" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalLog_goalId_loggedAt_idx" ON "GoalLog"("goalId", "loggedAt");

-- AddForeignKey
ALTER TABLE "GoalLog" ADD CONSTRAINT "GoalLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
