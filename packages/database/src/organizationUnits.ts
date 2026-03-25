import type {
  OrganizationUnit as PrismaOrganizationUnit,
  OrganizationUnitType as PrismaOrganizationUnitType,
  Prisma,
  PrismaClient
} from '@prisma/client';

export const ORGANIZATION_UNIT_TYPES = [
  'LOCATION',
  'DEPARTMENT',
  'TEAM'
] as const;

export type ControlledOrganizationUnitType =
  (typeof ORGANIZATION_UNIT_TYPES)[number];

export type OrganizationUnitRecord = PrismaOrganizationUnit;

export type OrganizationUnitWriteInput = {
  tenantId: string;
  parentId?: string | null;
  type: ControlledOrganizationUnitType | string;
  name: string;
};

export type UpdateOrganizationUnitInput = {
  id: string;
  tenantId: string;
  parentId?: string | null;
  type?: ControlledOrganizationUnitType | string;
  name?: string;
};

type OrganizationUnitDbClient = PrismaClient | Prisma.TransactionClient;

type OrganizationUnitHierarchyNode = {
  id: string;
  parentId: string | null;
};

const organizationUnitTypeSet = new Set<string>(ORGANIZATION_UNIT_TYPES);

export class OrganizationUnitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrganizationUnitValidationError';
  }
}

function normalizeRequiredString(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new OrganizationUnitValidationError(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeOptionalParentId(parentId: string | null | undefined) {
  if (parentId === undefined) {
    return undefined;
  }

  const normalized = parentId?.trim();
  return normalized ? normalized : null;
}

export function normalizeOrganizationUnitType(
  value: ControlledOrganizationUnitType | string
): ControlledOrganizationUnitType {
  const normalized = value
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  if (!organizationUnitTypeSet.has(normalized)) {
    throw new OrganizationUnitValidationError(
      `Organization unit type must be one of: ${ORGANIZATION_UNIT_TYPES.join(', ')}`
    );
  }

  return normalized as ControlledOrganizationUnitType;
}

export function validateOrganizationUnitInput(
  input: OrganizationUnitWriteInput
) {
  return {
    tenantId: normalizeRequiredString(input.tenantId, 'tenantId'),
    parentId: normalizeOptionalParentId(input.parentId) ?? null,
    type: normalizeOrganizationUnitType(input.type),
    name: normalizeRequiredString(input.name, 'name')
  };
}

async function readOrganizationUnitNode(
  db: OrganizationUnitDbClient,
  tenantId: string,
  id: string
): Promise<OrganizationUnitHierarchyNode | null> {
  return db.organizationUnit.findFirst({
    where: {
      tenantId,
      id
    },
    select: {
      id: true,
      parentId: true
    }
  });
}

export async function assertOrganizationUnitHierarchyIntegrity(
  db: OrganizationUnitDbClient,
  input: {
    tenantId: string;
    id?: string;
    parentId: string | null;
  }
) {
  if (!input.parentId) {
    return;
  }

  if (input.id && input.parentId === input.id) {
    throw new OrganizationUnitValidationError(
      'Organization unit cannot be its own parent'
    );
  }

  const parent = await readOrganizationUnitNode(
    db,
    input.tenantId,
    input.parentId
  );

  if (!parent) {
    throw new OrganizationUnitValidationError(
      'Parent organization unit was not found in the current tenant'
    );
  }

  if (!input.id) {
    return;
  }

  const visited = new Set<string>();
  let cursor: OrganizationUnitHierarchyNode | null = parent;

  while (cursor) {
    if (cursor.id === input.id) {
      throw new OrganizationUnitValidationError(
        'Organization unit hierarchy cannot contain cycles'
      );
    }

    if (visited.has(cursor.id)) {
      throw new OrganizationUnitValidationError(
        'Organization unit hierarchy contains a cycle'
      );
    }

    visited.add(cursor.id);
    cursor = cursor.parentId
      ? await readOrganizationUnitNode(db, input.tenantId, cursor.parentId)
      : null;
  }
}

export async function createOrganizationUnit(
  input: OrganizationUnitWriteInput,
  db: OrganizationUnitDbClient
) {
  const data = validateOrganizationUnitInput(input);

  await assertOrganizationUnitHierarchyIntegrity(db, {
    tenantId: data.tenantId,
    parentId: data.parentId
  });

  return db.organizationUnit.create({
    data
  });
}

export async function updateOrganizationUnit(
  input: UpdateOrganizationUnitInput,
  db: OrganizationUnitDbClient
) {
  const tenantId = normalizeRequiredString(input.tenantId, 'tenantId');
  const id = normalizeRequiredString(input.id, 'id');
  const existing = await db.organizationUnit.findFirst({
    where: {
      tenantId,
      id
    }
  });

  if (!existing) {
    throw new OrganizationUnitValidationError('Organization unit not found');
  }

  const nextParentId =
    input.parentId !== undefined
      ? (normalizeOptionalParentId(input.parentId) ?? null)
      : existing.parentId;
  const nextType =
    input.type !== undefined
      ? normalizeOrganizationUnitType(input.type)
      : (existing.type as PrismaOrganizationUnitType);
  const nextName =
    input.name !== undefined
      ? normalizeRequiredString(input.name, 'name')
      : existing.name;

  await assertOrganizationUnitHierarchyIntegrity(db, {
    tenantId,
    id,
    parentId: nextParentId
  });

  const result = await db.organizationUnit.updateMany({
    where: {
      tenantId,
      id
    },
    data: {
      parentId: nextParentId,
      type: nextType,
      name: nextName
    }
  });

  if (result.count !== 1) {
    throw new OrganizationUnitValidationError(
      'Organization unit update failed'
    );
  }

  const updated = await db.organizationUnit.findFirst({
    where: {
      tenantId,
      id
    }
  });

  if (!updated) {
    throw new OrganizationUnitValidationError(
      'Organization unit disappeared during update'
    );
  }

  return updated;
}
