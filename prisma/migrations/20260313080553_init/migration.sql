-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platformId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PostMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptDNA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "platform" TEXT,
    "category" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'TESTING',
    "parentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    CONSTRAINT "PromptDNA_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "PromptDNA" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptMutation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptDNAId" TEXT NOT NULL,
    "mutationType" TEXT NOT NULL,
    "beforeSnippet" TEXT,
    "afterSnippet" TEXT,
    "reason" TEXT NOT NULL,
    "sourceInsightIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptMutation_promptDNAId_fkey" FOREIGN KEY ("promptDNAId") REFERENCES "PromptDNA" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptDNAId" TEXT NOT NULL,
    "postsGenerated" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementRate" REAL NOT NULL DEFAULT 0,
    "avgViews" REAL NOT NULL DEFAULT 0,
    "avgLikes" REAL NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "measuredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptPerformance_promptDNAId_fkey" FOREIGN KEY ("promptDNAId") REFERENCES "PromptDNA" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIInsight_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentBrainExport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptDNAId" TEXT,
    "promptDNAVersion" INTEGER NOT NULL,
    "insightIds" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentBrainExport_promptDNAId_fkey" FOREIGN KEY ("promptDNAId") REFERENCES "PromptDNA" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentBrainSync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exportId" TEXT NOT NULL,
    "contentBrainResponse" TEXT,
    "promptsUpdated" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentBrainSync_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "ContentBrainExport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Post_platform_idx" ON "Post"("platform");

-- CreateIndex
CREATE INDEX "Post_publishedAt_idx" ON "Post"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_platform_platformId_key" ON "Post"("platform", "platformId");

-- CreateIndex
CREATE INDEX "PostMetrics_postId_idx" ON "PostMetrics"("postId");

-- CreateIndex
CREATE INDEX "PostMetrics_fetchedAt_idx" ON "PostMetrics"("fetchedAt");

-- CreateIndex
CREATE INDEX "PromptDNA_status_idx" ON "PromptDNA"("status");

-- CreateIndex
CREATE INDEX "PromptDNA_category_idx" ON "PromptDNA"("category");

-- CreateIndex
CREATE INDEX "PromptDNA_platform_idx" ON "PromptDNA"("platform");

-- CreateIndex
CREATE INDEX "PromptMutation_promptDNAId_idx" ON "PromptMutation"("promptDNAId");

-- CreateIndex
CREATE INDEX "PromptPerformance_promptDNAId_idx" ON "PromptPerformance"("promptDNAId");

-- CreateIndex
CREATE INDEX "AIInsight_type_idx" ON "AIInsight"("type");

-- CreateIndex
CREATE INDEX "AIInsight_postId_idx" ON "AIInsight"("postId");

-- CreateIndex
CREATE INDEX "ContentBrainExport_status_idx" ON "ContentBrainExport"("status");

-- CreateIndex
CREATE INDEX "ContentBrainSync_exportId_idx" ON "ContentBrainSync"("exportId");
