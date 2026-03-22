ALTER TABLE "PreviewSession"
ADD COLUMN "currentRoute" TEXT,
ADD COLUMN "currentRouteUpdatedAt" TIMESTAMP(3),
ADD COLUMN "routeHistory" JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX "PreviewSession_currentRouteUpdatedAt_idx"
ON "PreviewSession"("currentRouteUpdatedAt");
