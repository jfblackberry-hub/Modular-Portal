ALTER TABLE audit_logs
DROP CONSTRAINT "AuditLog_actorUserId_fkey",
ADD CONSTRAINT "audit_logs_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
