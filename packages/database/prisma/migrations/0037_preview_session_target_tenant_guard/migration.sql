-- Remove preview sessions whose target user's primary tenant does not match the session row.
DELETE FROM "PreviewSession" AS ps
USING "User" AS u
WHERE ps."targetUserId" = u.id
  AND (
    u."tenantId" IS NULL
    OR u."tenantId" <> ps."tenantId"
  );

CREATE OR REPLACE FUNCTION preview_session_enforce_target_tenant_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u.id = NEW."targetUserId"
      AND u."tenantId" IS NOT NULL
      AND u."tenantId" = NEW."tenantId"
  ) THEN
    RAISE EXCEPTION 'PreviewSession targetUser primary tenant must match tenantId';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preview_session_enforce_target_tenant_match ON "PreviewSession";

CREATE TRIGGER preview_session_enforce_target_tenant_match
BEFORE INSERT OR UPDATE OF "tenantId", "targetUserId" ON "PreviewSession"
FOR EACH ROW
EXECUTE FUNCTION preview_session_enforce_target_tenant_match();

CREATE INDEX "PreviewSession_tenantId_targetUserId_idx"
ON "PreviewSession"("tenantId", "targetUserId");
