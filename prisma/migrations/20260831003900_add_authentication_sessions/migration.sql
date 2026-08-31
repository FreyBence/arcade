-- CreateTable
CREATE TABLE "authentication_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authentication_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authentication_sessions_refreshTokenHash_key" ON "authentication_sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "authentication_sessions_userId_idx" ON "authentication_sessions"("userId");

-- CreateIndex
CREATE INDEX "authentication_sessions_expiresAt_idx" ON "authentication_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "authentication_sessions_revokedAt_idx" ON "authentication_sessions"("revokedAt");

-- AddForeignKey
ALTER TABLE "authentication_sessions" ADD CONSTRAINT "authentication_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
