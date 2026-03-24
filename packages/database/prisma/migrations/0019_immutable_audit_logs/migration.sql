ALTER TABLE "AuditLog" RENAME TO audit_logs;

ALTER TABLE audit_logs
DROP CONSTRAINT "AuditLog_tenantId_fkey",
ADD CONSTRAINT "audit_logs_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only and cannot be %', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
