import { loadApiServiceConfig } from '@payer-portal/config';
import { PrismaClient } from '@payer-portal/database';
import mysql from 'mysql2/promise';

type CatalogContext = {
  tenantSlug: string;
  brandingConfig: unknown;
};

type CatalogMemberProfile = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  memberNumber: string;
  createdAt: string;
  updatedAt: string;
};

type CatalogClaim = {
  id: string;
  claimNumber: string;
  claimDate: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

type CatalogProvider = {
  id: string;
  name: string;
  providerNumber: string | null;
  specialty: string | null;
  status: string;
};

type CatalogDriver = 'postgres' | 'mysql';
type MemberLookupMode = 'email' | 'memberNumber' | 'first';

type ParsedCatalogConfig = {
  driver: CatalogDriver;
  databaseUrl: string;
  schema: string;
  usersTable: string;
  claimsTable: string;
  providersTable: string;
  tenantColumn: string | null;
  tenantValue: string | null;
  memberLookupMode: MemberLookupMode;
  fixedMemberNumber: string | null;
  userIdColumn: string;
  userEmailColumn: string;
  userFirstNameColumn: string;
  userLastNameColumn: string;
  userDobColumn: string;
  userMemberNumberColumn: string;
  userCreatedAtColumn: string;
  userUpdatedAtColumn: string;
  claimIdColumn: string;
  claimMemberIdColumn: string | null;
  claimMemberEmailColumn: string | null;
  claimNumberColumn: string;
  claimDateColumn: string;
  claimStatusColumn: string;
  claimTotalAmountColumn: string;
  claimCreatedAtColumn: string;
  claimUpdatedAtColumn: string;
  providerIdColumn: string;
  providerNameColumn: string;
  providerNumberColumn: string;
  providerSpecialtyColumn: string;
  providerStatusColumn: string;
  providerCreatedAtColumn: string;
  memberPartyTable: string | null;
  memberPartyIdColumn: string | null;
  partyIdColumn: string | null;
  partyFirstNameColumn: string | null;
  partyLastNameColumn: string | null;
  partyDobColumn: string | null;
};

const postgresClientsByUrl = new Map<string, PrismaClient>();
const mysqlPoolsByUrl = new Map<string, mysql.Pool>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(
  value: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const entry = value[key];
  return isRecord(entry) ? entry : {};
}

function getString(
  value: Record<string, unknown>,
  key: string,
  fallback: string
) {
  const entry = value[key];
  return typeof entry === 'string' && entry.trim() ? entry.trim() : fallback;
}

function getOptionalString(value: Record<string, unknown>, key: string) {
  const entry = value[key];
  return typeof entry === 'string' && entry.trim() ? entry.trim() : null;
}

function parseBoolean(
  value: Record<string, unknown>,
  key: string,
  fallback: boolean
) {
  const entry = value[key];
  return typeof entry === 'boolean' ? entry : fallback;
}

function getDriver(config: Record<string, unknown>): CatalogDriver {
  const driver = getString(config, 'driver', 'postgres').toLowerCase();
  return driver === 'mysql' ? 'mysql' : 'postgres';
}

function getDatabaseUrl(config: Record<string, unknown>) {
  const directUrl =
    typeof config.databaseUrl === 'string' ? config.databaseUrl.trim() : '';
  if (directUrl) {
    return directUrl;
  }

  const envName =
    typeof config.databaseUrlEnv === 'string'
      ? config.databaseUrlEnv.trim()
      : 'PORTAL_CATALOG_DATABASE_URL';
  const fromEnv = process.env[envName]?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  return loadApiServiceConfig().portalCatalogDatabaseUrl ?? '';
}

function getMemberLookup(
  portalCatalog: Record<string, unknown>
): Pick<ParsedCatalogConfig, 'memberLookupMode' | 'fixedMemberNumber'> {
  const memberLookup = getRecord(portalCatalog, 'memberLookup');
  const mode = getString(memberLookup, 'mode', 'email').toLowerCase();
  const memberLookupMode: MemberLookupMode =
    mode === 'first' || mode === 'membernumber' ? (mode === 'membernumber' ? 'memberNumber' : 'first') : 'email';

  return {
    memberLookupMode,
    fixedMemberNumber: getOptionalString(memberLookup, 'fixedMemberNumber')
  };
}

function parseConfig(context: CatalogContext): ParsedCatalogConfig | null {
  if (!isRecord(context.brandingConfig)) {
    return null;
  }

  const portalCatalog = getRecord(context.brandingConfig, 'portalCatalog');
  const enabled = parseBoolean(portalCatalog, 'enabled', false);

  if (!enabled) {
    return null;
  }

  const databaseUrl = getDatabaseUrl(portalCatalog);

  if (!databaseUrl) {
    return null;
  }

  const driver = getDriver(portalCatalog);
  const tables = getRecord(portalCatalog, 'tables');
  const columns = getRecord(portalCatalog, 'columns');
  const joins = getRecord(portalCatalog, 'joins');
  const memberLookup = getMemberLookup(portalCatalog);

  return {
    driver,
    databaseUrl,
    schema: getString(portalCatalog, 'schema', 'public'),
    usersTable: getString(tables, 'users', 'members'),
    claimsTable: getString(tables, 'claims', 'claims'),
    providersTable: getString(tables, 'providers', 'providers'),
    tenantColumn: getOptionalString(columns, 'tenant'),
    tenantValue: getOptionalString(portalCatalog, 'tenantValue'),
    ...memberLookup,
    userIdColumn: getString(columns, 'userId', 'id'),
    userEmailColumn: getString(columns, 'userEmail', 'email'),
    userFirstNameColumn: getString(columns, 'userFirstName', 'firstName'),
    userLastNameColumn: getString(columns, 'userLastName', 'lastName'),
    userDobColumn: getString(columns, 'userDob', 'dob'),
    userMemberNumberColumn: getString(columns, 'userMemberNumber', 'memberNumber'),
    userCreatedAtColumn: getString(columns, 'userCreatedAt', 'createdAt'),
    userUpdatedAtColumn: getString(columns, 'userUpdatedAt', 'updatedAt'),
    claimIdColumn: getString(columns, 'claimId', 'id'),
    claimMemberIdColumn: getOptionalString(columns, 'claimMemberId'),
    claimMemberEmailColumn: getOptionalString(columns, 'claimMemberEmail'),
    claimNumberColumn: getString(columns, 'claimNumber', 'claimNumber'),
    claimDateColumn: getString(columns, 'claimDate', 'claimDate'),
    claimStatusColumn: getString(columns, 'claimStatus', 'status'),
    claimTotalAmountColumn: getString(columns, 'claimTotalAmount', 'totalAmount'),
    claimCreatedAtColumn: getString(columns, 'claimCreatedAt', 'createdAt'),
    claimUpdatedAtColumn: getString(columns, 'claimUpdatedAt', 'updatedAt'),
    providerIdColumn: getString(columns, 'providerId', 'id'),
    providerNameColumn: getString(columns, 'providerName', 'name'),
    providerNumberColumn: getString(columns, 'providerNumber', 'providerNumber'),
    providerSpecialtyColumn: getString(columns, 'providerSpecialty', 'specialty'),
    providerStatusColumn: getString(columns, 'providerStatus', 'status'),
    providerCreatedAtColumn: getString(columns, 'providerCreatedAt', 'createdAt'),
    memberPartyTable: getOptionalString(joins, 'memberPartyTable'),
    memberPartyIdColumn: getOptionalString(joins, 'memberPartyIdColumn'),
    partyIdColumn: getOptionalString(joins, 'partyIdColumn'),
    partyFirstNameColumn: getOptionalString(joins, 'partyFirstNameColumn'),
    partyLastNameColumn: getOptionalString(joins, 'partyLastNameColumn'),
    partyDobColumn: getOptionalString(joins, 'partyDobColumn')
  };
}

function assertIdentifier(value: string, fieldName: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid portalCatalog identifier for ${fieldName}`);
  }
}

function assertOptionalIdentifier(value: string | null, fieldName: string) {
  if (value !== null) {
    assertIdentifier(value, fieldName);
  }
}

function quoteIdentifier(driver: CatalogDriver, identifier: string) {
  return driver === 'mysql' ? `\`${identifier}\`` : `"${identifier}"`;
}

function quoteTable(
  driver: CatalogDriver,
  schema: string,
  table: string
) {
  if (driver === 'mysql') {
    return quoteIdentifier(driver, table);
  }

  return `${quoteIdentifier(driver, schema)}.${quoteIdentifier(driver, table)}`;
}

function getPostgresClient(databaseUrl: string) {
  const existing = postgresClientsByUrl.get(databaseUrl);
  if (existing) {
    return existing;
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
  postgresClientsByUrl.set(databaseUrl, client);
  return client;
}

function getMySqlPool(databaseUrl: string) {
  const existing = mysqlPoolsByUrl.get(databaseUrl);
  if (existing) {
    return existing;
  }

  const pool = mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10
  });
  mysqlPoolsByUrl.set(databaseUrl, pool);
  return pool;
}

async function runQuery(
  config: ParsedCatalogConfig,
  sql: string,
  params: Array<string | number>
) {
  if (config.driver === 'mysql') {
    const pool = getMySqlPool(config.databaseUrl);
    const [rows] = await pool.query(sql, params);
    return rows as Array<Record<string, unknown>>;
  }

  const client = getPostgresClient(config.databaseUrl);
  return client.$queryRawUnsafe<Array<Record<string, unknown>>>(sql, ...params);
}

function toIsoString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function toStringValue(value: unknown, fallback: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'bigint') {
    return String(value);
  }

  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function toNumberValue(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function sqlParam(driver: CatalogDriver, index: number) {
  return driver === 'mysql' ? '?' : `$${index}`;
}

type MemberQueryResult = CatalogMemberProfile & {
  sourceMemberId: string;
};

async function getMemberRow(
  context: CatalogContext,
  userEmail: string
): Promise<MemberQueryResult | null> {
  const config = parseConfig(context);
  if (!config) {
    return null;
  }

  assertIdentifier(config.schema, 'schema');
  assertIdentifier(config.usersTable, 'tables.users');
  assertIdentifier(config.userIdColumn, 'columns.userId');
  assertIdentifier(config.userEmailColumn, 'columns.userEmail');
  assertIdentifier(config.userFirstNameColumn, 'columns.userFirstName');
  assertIdentifier(config.userLastNameColumn, 'columns.userLastName');
  assertIdentifier(config.userDobColumn, 'columns.userDob');
  assertIdentifier(config.userMemberNumberColumn, 'columns.userMemberNumber');
  assertIdentifier(config.userCreatedAtColumn, 'columns.userCreatedAt');
  assertIdentifier(config.userUpdatedAtColumn, 'columns.userUpdatedAt');
  assertOptionalIdentifier(config.tenantColumn, 'columns.tenant');
  assertOptionalIdentifier(config.memberPartyTable, 'joins.memberPartyTable');
  assertOptionalIdentifier(config.memberPartyIdColumn, 'joins.memberPartyIdColumn');
  assertOptionalIdentifier(config.partyIdColumn, 'joins.partyIdColumn');
  assertOptionalIdentifier(config.partyFirstNameColumn, 'joins.partyFirstNameColumn');
  assertOptionalIdentifier(config.partyLastNameColumn, 'joins.partyLastNameColumn');
  assertOptionalIdentifier(config.partyDobColumn, 'joins.partyDobColumn');

  const memberRef = quoteTable(config.driver, config.schema, config.usersTable);
  const memberAlias = 'm';
  const values: Array<string | number> = [];
  const where: string[] = [];

  if (config.tenantColumn) {
    values.push(config.tenantValue ?? context.tenantSlug);
    where.push(
      `${memberAlias}.${quoteIdentifier(config.driver, config.tenantColumn)} = ${sqlParam(config.driver, values.length)}`
    );
  }

  if (config.memberLookupMode === 'email') {
    values.push(userEmail);
    where.push(
      `LOWER(${memberAlias}.${quoteIdentifier(config.driver, config.userEmailColumn)}) = LOWER(${sqlParam(config.driver, values.length)})`
    );
  } else if (config.memberLookupMode === 'memberNumber') {
    const memberNumberLookup = config.fixedMemberNumber ?? userEmail;
    if (!memberNumberLookup.trim()) {
      return null;
    }
    values.push(memberNumberLookup);
    where.push(
      `${memberAlias}.${quoteIdentifier(config.driver, config.userMemberNumberColumn)} = ${sqlParam(config.driver, values.length)}`
    );
  }

  const joinedToParty =
    !!config.memberPartyTable &&
    !!config.memberPartyIdColumn &&
    !!config.partyIdColumn;
  const partyAlias = 'p';
  const partyRef = joinedToParty
    ? quoteTable(config.driver, config.schema, config.memberPartyTable!)
    : null;

  const firstNameExpr =
    joinedToParty && config.partyFirstNameColumn
      ? `${partyAlias}.${quoteIdentifier(config.driver, config.partyFirstNameColumn)}`
      : `${memberAlias}.${quoteIdentifier(config.driver, config.userFirstNameColumn)}`;
  const lastNameExpr =
    joinedToParty && config.partyLastNameColumn
      ? `${partyAlias}.${quoteIdentifier(config.driver, config.partyLastNameColumn)}`
      : `${memberAlias}.${quoteIdentifier(config.driver, config.userLastNameColumn)}`;
  const dobExpr =
    joinedToParty && config.partyDobColumn
      ? `${partyAlias}.${quoteIdentifier(config.driver, config.partyDobColumn)}`
      : `${memberAlias}.${quoteIdentifier(config.driver, config.userDobColumn)}`;

  const sql = `
    SELECT
      ${memberAlias}.${quoteIdentifier(config.driver, config.userIdColumn)} AS member_id,
      ${firstNameExpr} AS first_name,
      ${lastNameExpr} AS last_name,
      ${dobExpr} AS dob,
      ${memberAlias}.${quoteIdentifier(config.driver, config.userMemberNumberColumn)} AS member_number,
      ${memberAlias}.${quoteIdentifier(config.driver, config.userCreatedAtColumn)} AS created_at,
      ${memberAlias}.${quoteIdentifier(config.driver, config.userUpdatedAtColumn)} AS updated_at
    FROM ${memberRef} ${memberAlias}
    ${joinedToParty ? `LEFT JOIN ${partyRef} ${partyAlias} ON ${memberAlias}.${quoteIdentifier(config.driver, config.memberPartyIdColumn!)} = ${partyAlias}.${quoteIdentifier(config.driver, config.partyIdColumn!)}` : ''}
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${memberAlias}.${quoteIdentifier(config.driver, config.userIdColumn)} ASC
    LIMIT 1
  `;

  const rows = await runQuery(config, sql, values);
  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    sourceMemberId: toStringValue(row.member_id, ''),
    id: toStringValue(row.member_id, `${context.tenantSlug}-${userEmail}`),
    firstName: toStringValue(row.first_name, 'Member'),
    lastName: toStringValue(row.last_name, 'User'),
    dob: toStringValue(row.dob, '1989-06-15'),
    memberNumber: toStringValue(row.member_number, 'M00012345'),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

export async function getCatalogMemberProfile(
  context: CatalogContext,
  memberEmail: string
): Promise<CatalogMemberProfile | null> {
  const row = await getMemberRow(context, memberEmail);
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    dob: row.dob,
    memberNumber: row.memberNumber,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function getCatalogClaims(
  context: CatalogContext,
  memberEmail: string,
  limit = 100
): Promise<CatalogClaim[] | null> {
  const config = parseConfig(context);
  if (!config) {
    return null;
  }

  const member = await getMemberRow(context, memberEmail);
  if (!member) {
    return [];
  }

  assertIdentifier(config.schema, 'schema');
  assertIdentifier(config.claimsTable, 'tables.claims');
  assertIdentifier(config.claimIdColumn, 'columns.claimId');
  assertIdentifier(config.claimNumberColumn, 'columns.claimNumber');
  assertIdentifier(config.claimDateColumn, 'columns.claimDate');
  assertIdentifier(config.claimStatusColumn, 'columns.claimStatus');
  assertIdentifier(config.claimTotalAmountColumn, 'columns.claimTotalAmount');
  assertIdentifier(config.claimCreatedAtColumn, 'columns.claimCreatedAt');
  assertIdentifier(config.claimUpdatedAtColumn, 'columns.claimUpdatedAt');
  assertOptionalIdentifier(config.tenantColumn, 'columns.tenant');
  assertOptionalIdentifier(config.claimMemberIdColumn, 'columns.claimMemberId');
  assertOptionalIdentifier(
    config.claimMemberEmailColumn,
    'columns.claimMemberEmail'
  );

  const claimsRef = quoteTable(config.driver, config.schema, config.claimsTable);
  const claimAlias = 'c';
  const values: Array<string | number> = [];
  const where: string[] = [];

  if (config.tenantColumn) {
    values.push(config.tenantValue ?? context.tenantSlug);
    where.push(
      `${claimAlias}.${quoteIdentifier(config.driver, config.tenantColumn)} = ${sqlParam(config.driver, values.length)}`
    );
  }

  if (config.claimMemberIdColumn) {
    values.push(member.sourceMemberId);
    where.push(
      `${claimAlias}.${quoteIdentifier(config.driver, config.claimMemberIdColumn)} = ${sqlParam(config.driver, values.length)}`
    );
  } else if (config.claimMemberEmailColumn) {
    values.push(memberEmail);
    where.push(
      `LOWER(${claimAlias}.${quoteIdentifier(config.driver, config.claimMemberEmailColumn)}) = LOWER(${sqlParam(config.driver, values.length)})`
    );
  }

  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const sql = `
    SELECT
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimIdColumn)} AS claim_id,
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimNumberColumn)} AS claim_number,
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimDateColumn)} AS claim_date,
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimStatusColumn)} AS claim_status,
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimTotalAmountColumn)} AS total_amount,
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimCreatedAtColumn)} AS created_at,
      ${claimAlias}.${quoteIdentifier(config.driver, config.claimUpdatedAtColumn)} AS updated_at
    FROM ${claimsRef} ${claimAlias}
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${claimAlias}.${quoteIdentifier(config.driver, config.claimCreatedAtColumn)} DESC
    LIMIT ${safeLimit}
  `;

  const rows = await runQuery(config, sql, values);
  return rows.map((row) => ({
    id: toStringValue(row.claim_id, ''),
    claimNumber: toStringValue(row.claim_number, ''),
    claimDate: toStringValue(row.claim_date, toIsoString(row.created_at)),
    status: toStringValue(row.claim_status, 'processing'),
    totalAmount: toNumberValue(row.total_amount, 0),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  }));
}

export async function getCatalogProviders(
  context: CatalogContext,
  limit = 100
): Promise<CatalogProvider[] | null> {
  const config = parseConfig(context);
  if (!config) {
    return null;
  }

  assertIdentifier(config.schema, 'schema');
  assertIdentifier(config.providersTable, 'tables.providers');
  assertIdentifier(config.providerIdColumn, 'columns.providerId');
  assertIdentifier(config.providerNameColumn, 'columns.providerName');
  assertIdentifier(config.providerNumberColumn, 'columns.providerNumber');
  assertIdentifier(config.providerSpecialtyColumn, 'columns.providerSpecialty');
  assertIdentifier(config.providerStatusColumn, 'columns.providerStatus');
  assertIdentifier(config.providerCreatedAtColumn, 'columns.providerCreatedAt');
  assertOptionalIdentifier(config.tenantColumn, 'columns.tenant');

  const providersRef = quoteTable(
    config.driver,
    config.schema,
    config.providersTable
  );
  const providerAlias = 'p';
  const values: Array<string | number> = [];
  const where: string[] = [];

  if (config.tenantColumn) {
    values.push(config.tenantValue ?? context.tenantSlug);
    where.push(
      `${providerAlias}.${quoteIdentifier(config.driver, config.tenantColumn)} = ${sqlParam(config.driver, values.length)}`
    );
  }

  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const sql = `
    SELECT
      ${providerAlias}.${quoteIdentifier(config.driver, config.providerIdColumn)} AS provider_id,
      ${providerAlias}.${quoteIdentifier(config.driver, config.providerNameColumn)} AS provider_name,
      ${providerAlias}.${quoteIdentifier(config.driver, config.providerNumberColumn)} AS provider_number,
      ${providerAlias}.${quoteIdentifier(config.driver, config.providerSpecialtyColumn)} AS provider_specialty,
      ${providerAlias}.${quoteIdentifier(config.driver, config.providerStatusColumn)} AS provider_status
    FROM ${providersRef} ${providerAlias}
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${providerAlias}.${quoteIdentifier(config.driver, config.providerCreatedAtColumn)} DESC
    LIMIT ${safeLimit}
  `;

  const rows = await runQuery(config, sql, values);
  return rows.map((row) => ({
    id: toStringValue(row.provider_id, ''),
    name: toStringValue(row.provider_name, 'Unknown Provider'),
    providerNumber: toNullableString(row.provider_number),
    specialty: toNullableString(row.provider_specialty),
    status: toStringValue(row.provider_status, 'active')
  }));
}
