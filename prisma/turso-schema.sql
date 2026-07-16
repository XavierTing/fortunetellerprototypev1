-- Cinnabar database schema for Turso (libsql).
-- Apply once to a fresh Turso db:  turso db shell <db-name> < prisma/turso-schema.sql
-- Generated from the local dev.db, which is kept in sync via `prisma db push`.

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatThread_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CompatibilityPair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileAId" TEXT NOT NULL,
    "personB" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompatibilityPair_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DailyFortune" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyFortune_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "birthDate" DATETIME NOT NULL,
    "birthTime" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "tzId" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'male',
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "chartCache" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Reading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "cards" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reading_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");

CREATE INDEX "ChatThread_profileId_idx" ON "ChatThread"("profileId");

CREATE INDEX "CompatibilityPair_profileAId_idx" ON "CompatibilityPair"("profileAId");

CREATE UNIQUE INDEX "DailyFortune_profileId_date_key" ON "DailyFortune"("profileId", "date");

CREATE INDEX "DailyFortune_profileId_idx" ON "DailyFortune"("profileId");

CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

CREATE INDEX "Reading_profileId_idx" ON "Reading"("profileId");

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
