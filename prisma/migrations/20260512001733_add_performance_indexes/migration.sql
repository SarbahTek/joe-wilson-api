-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");

-- CreateIndex
CREATE INDEX "enrollments_masterclassId_idx" ON "enrollments"("masterclassId");

-- CreateIndex
CREATE INDEX "masterclasses_isPublished_status_idx" ON "masterclasses"("isPublished", "status");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_masterclassId_idx" ON "payments"("masterclassId");

-- CreateIndex
CREATE INDEX "session_progress_userId_idx" ON "session_progress"("userId");

-- CreateIndex
CREATE INDEX "sessions_masterclassId_idx" ON "sessions"("masterclassId");

-- CreateIndex
CREATE INDEX "users_resetPasswordToken_idx" ON "users"("resetPasswordToken");
