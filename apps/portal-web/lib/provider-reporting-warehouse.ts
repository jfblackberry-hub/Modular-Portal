type PatientStatus = 'active' | 'discharged' | 'inactive';
type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
type AuthorizationStatus = 'active' | 'expiring_soon' | 'low_remaining' | 'expired' | 'pending';
type ClaimStatus = 'submitted' | 'paid' | 'denied' | 'pending' | 'resubmitted';
type EligibilityStatus = 'verified' | 'unverified' | 'failed';
type ServiceSetting = 'clinic' | 'home' | 'school';
type StaffRole = 'therapist' | 'supervising_clinician';

export interface ReportingWarehouseLocation {
  id: string;
  name: string;
}

export interface ReportingWarehouseStaff {
  id: string;
  locationId: string;
  locationName: string;
  name: string;
  role: StaffRole;
  status: 'active' | 'inactive';
}

export interface ReportingWarehousePatient {
  dateOfBirth: string;
  dischargeDate: string | null;
  firstName: string;
  id: string;
  lastName: string;
  payer: string;
  patientType: string;
  primaryLocationId: string;
  primaryLocationName: string;
  startDate: string;
  status: PatientStatus;
  supervisingClinicianId: string;
  supervisingClinicianName: string;
  therapistId: string;
  therapistName: string;
}

export interface ReportingWarehouseSession {
  date: string;
  durationHours: number;
  id: string;
  locationId: string;
  locationName: string;
  patientId: string;
  patientType: string;
  payer: string;
  serviceSetting: ServiceSetting;
  sessionStatus: SessionStatus;
  supervisingClinicianId: string;
  supervisingClinicianName: string;
  supervisionCompleted: boolean;
  supervisionExpected: boolean;
  therapistId: string;
  therapistName: string;
}

export interface ReportingWarehouseAuthorization {
  endDate: string;
  id: string;
  locationId: string;
  locationName: string;
  patientId: string;
  patientType: string;
  payer: string;
  remainingVisits: number;
  startDate: string;
  status: AuthorizationStatus;
  totalVisits: number;
  usedVisits: number;
}

export interface ReportingWarehouseEligibilityCheck {
  failureReason: string | null;
  id: string;
  locationId: string;
  locationName: string;
  patientId: string;
  patientType: string;
  serviceDate: string;
  status: EligibilityStatus;
  therapistId: string;
  therapistName: string;
  verificationDate: string;
}

export interface ReportingWarehouseClaim {
  adjudicationDate: string | null;
  allowedAmount: number;
  amountBilled: number;
  amountPaid: number;
  denialReason: string | null;
  id: string;
  locationId: string;
  locationName: string;
  outstandingAmount: number;
  patientId: string;
  patientType: string;
  payer: string;
  resubmissionDate: string | null;
  resubmissionResolved: boolean;
  serviceDate: string;
  status: ClaimStatus;
  submissionDate: string;
  supervisingClinicianId: string;
  supervisingClinicianName: string;
  therapistId: string;
  therapistName: string;
}

export interface ReportingWarehouseSummary {
  approximateRecordCounts: {
    authorizations: number;
    claims: number;
    eligibilityChecks: number;
    locations: number;
    patients: number;
    sessions: number;
    staff: number;
  };
  generatedThrough: string;
  lookbackMonths: number;
}

export interface ProviderReportingWarehouse {
  authorizations: ReportingWarehouseAuthorization[];
  claims: ReportingWarehouseClaim[];
  eligibilityChecks: ReportingWarehouseEligibilityCheck[];
  locations: ReportingWarehouseLocation[];
  patients: ReportingWarehousePatient[];
  sessions: ReportingWarehouseSession[];
  staff: ReportingWarehouseStaff[];
  summary: ReportingWarehouseSummary;
}

export interface ProviderReportingWarehouseScope {
  tenantId: string;
  tenantName?: string | null;
  tenantTypeCode?: string | null;
}

const TODAY = new Date('2026-03-26T12:00:00Z');
const LOOKBACK_MONTHS = 24;
const PAYERS = [
  'Meridian Medicaid',
  'Blue Cross Blue Shield',
  'Aetna Better Health',
  'UnitedHealthcare Community Plan',
  'Priority Health'
] as const;
const PATIENT_TYPES = [
  'Early Learner',
  'School Age',
  'Focused Care',
  'Transition Support'
] as const;
const SERVICE_SETTINGS: ServiceSetting[] = ['clinic', 'home', 'school'];
const DENIAL_REASONS = ['authorization', 'eligibility', 'coding', 'documentation'] as const;
const FIRST_NAMES = [
  'Noah', 'Liam', 'Sofia', 'Maya', 'Ethan', 'Mason', 'Olivia', 'Ava', 'Leo', 'Emma',
  'Amelia', 'James', 'Elijah', 'Charlotte', 'Harper', 'Evelyn', 'Mila', 'Aria', 'Benjamin',
  'Daniel', 'Carter', 'Owen', 'Wyatt', 'Hazel', 'Scarlett', 'Nora', 'Isla', 'Camila', 'Layla',
  'Luca', 'Aiden', 'Ezra', 'Hudson', 'Grace', 'Riley', 'Lillian', 'Stella', 'Penelope', 'Chloe'
] as const;
const LAST_NAMES = [
  'Bennett', 'Ramirez', 'Cole', 'Carter', 'Nguyen', 'Foster', 'Hayes', 'Turner', 'Brooks',
  'Simmons', 'Morales', 'Reed', 'Watson', 'Patel', 'Ward', 'Bailey', 'Torres', 'Kelly', 'Cook',
  'Rivera', 'Sanders', 'Price', 'Ross', 'Diaz', 'Long', 'Bell', 'Phillips', 'Perry', 'Jenkins',
  'Powell', 'Bryant', 'Russell', 'Griffin', 'Barnes', 'Hughes', 'Henderson', 'Coleman', 'Patterson'
] as const;

const LOCATION_BLUEPRINTS = [
  'Apara Flint Center',
  'Apara Ann Arbor Center',
  'Apara Grand Blanc Home Team',
  'Apara Lansing Autism Center',
  'Apara Plymouth Outreach'
] as const;

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setUTCMonth(copy.getUTCMonth() + months);
  return copy;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthsBetween(start: Date, end: Date) {
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth())
  );
}

function normalizeScopeKey(scope: ProviderReportingWarehouseScope | undefined) {
  const raw =
    scope?.tenantId ??
    scope?.tenantName ??
    scope?.tenantTypeCode ??
    'default-provider-tenant';

  return raw.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function resolveScopeBrand(scope: ProviderReportingWarehouseScope | undefined) {
  const tenantName = scope?.tenantName?.trim();

  if (!tenantName) {
    return 'Apara';
  }

  return tenantName
    .replace(/\b(autism|centers|center|medical|group|clinic|hospital|health)\b/gi, '')
    .trim()
    .split(/\s+/)[0] ?? 'Apara';
}

function makeId(prefix: string, index: number, scopeKey: string) {
  return `${scopeKey}-${prefix}-${String(index + 1).padStart(4, '0')}`;
}

function buildLocations(scope: ProviderReportingWarehouseScope | undefined, scopeKey: string) {
  const brand = resolveScopeBrand(scope);

  return LOCATION_BLUEPRINTS.map((name, index) => ({
    id: makeId('loc', index, scopeKey),
    name: name.replace(/^Apara\b/, brand)
  }));
}

function buildStaff(locations: ReportingWarehouseLocation[], scopeKey: string) {
  const staff: ReportingWarehouseStaff[] = [];

  locations.forEach((location, locationIndex) => {
    for (let index = 0; index < 6; index += 1) {
      const name = `${FIRST_NAMES[(locationIndex * 7 + index) % FIRST_NAMES.length]} ${LAST_NAMES[(locationIndex * 11 + index) % LAST_NAMES.length]}`;
      staff.push({
        id: makeId('ther', locationIndex * 6 + index, scopeKey),
        name,
        role: 'therapist',
        locationId: location.id,
        locationName: location.name,
        status: index === 5 && locationIndex % 2 === 0 ? 'inactive' : 'active'
      });
    }

    for (let index = 0; index < 2; index += 1) {
      const name = `Dr. ${FIRST_NAMES[(locationIndex * 5 + index + 12) % FIRST_NAMES.length]} ${LAST_NAMES[(locationIndex * 9 + index + 4) % LAST_NAMES.length]}`;
      staff.push({
        id: makeId('sup', locationIndex * 2 + index, scopeKey),
        name,
        role: 'supervising_clinician',
        locationId: location.id,
        locationName: location.name,
        status: 'active'
      });
    }
  });

  return staff;
}

function buildPatients(
  locations: ReportingWarehouseLocation[],
  therapists: ReportingWarehouseStaff[],
  supervisors: ReportingWarehouseStaff[],
  scopeKey: string
) {
  const patients: ReportingWarehousePatient[] = [];
  const baseMonth = startOfMonth(addMonths(TODAY, -LOOKBACK_MONTHS + 1));

  for (let index = 0; index < 300; index += 1) {
    const location = locations[index % locations.length];
    const locationTherapists = therapists.filter((staff) => staff.locationId === location.id);
    const locationSupervisors = supervisors.filter((staff) => staff.locationId === location.id);
    const therapist = locationTherapists[index % locationTherapists.length]!;
    const supervisor = locationSupervisors[index % locationSupervisors.length]!;
    const admitMonthOffset = (index * 3) % LOOKBACK_MONTHS;
    const startDate = addDays(addMonths(baseMonth, admitMonthOffset), (index * 5) % 24);
    const statusCycle = index % 10;
    let status: PatientStatus = 'active';
    let dischargeDate: Date | null = null;

    if (statusCycle === 8) {
      status = 'inactive';
      dischargeDate = addMonths(startDate, 8 + (index % 7));
    } else if (statusCycle === 9) {
      status = 'discharged';
      dischargeDate = addMonths(startDate, 6 + (index % 5));
    }

    if (dischargeDate && dischargeDate > TODAY) {
      dischargeDate = addDays(TODAY, -(index % 21));
    }

    const ageYears = 4 + (index % 12);
    const dob = addDays(TODAY, -(ageYears * 365 + (index % 180)));

    patients.push({
      id: makeId('pat', index, scopeKey),
      firstName: FIRST_NAMES[index % FIRST_NAMES.length]!,
      lastName: LAST_NAMES[(index * 3) % LAST_NAMES.length]!,
      dateOfBirth: formatIsoDate(dob),
      patientType: PATIENT_TYPES[index % PATIENT_TYPES.length]!,
      primaryLocationId: location.id,
      primaryLocationName: location.name,
      status,
      startDate: formatIsoDate(startDate),
      dischargeDate: dischargeDate ? formatIsoDate(dischargeDate) : null,
      payer: PAYERS[(index * 5) % PAYERS.length]!,
      therapistId: therapist.id,
      therapistName: therapist.name,
      supervisingClinicianId: supervisor.id,
      supervisingClinicianName: supervisor.name
    });
  }

  return patients;
}

function buildSessions(patients: ReportingWarehousePatient[], scopeKey: string) {
  const sessions: ReportingWarehouseSession[] = [];
  const baseMonth = startOfMonth(addMonths(TODAY, -LOOKBACK_MONTHS + 1));
  let sessionIndex = 0;

  for (const patient of patients) {
    const patientStart = new Date(patient.startDate);
    const patientEnd =
      patient.dischargeDate && new Date(patient.dischargeDate) < TODAY
        ? new Date(patient.dischargeDate)
        : TODAY;

    const totalMonths = Math.max(1, monthsBetween(startOfMonth(patientStart), startOfMonth(patientEnd)) + 1);
    for (let monthOffset = 0; monthOffset < totalMonths; monthOffset += 1) {
      const monthStart = addMonths(startOfMonth(patientStart), monthOffset);
      if (monthStart < baseMonth || monthStart > TODAY) {
        continue;
      }

      const sessionsThisMonth = 3 + ((sessionIndex + monthOffset + patient.id.length) % 5);
      for (let slot = 0; slot < sessionsThisMonth; slot += 1) {
        const serviceDate = addDays(monthStart, ((slot * 6) + monthOffset + sessionIndex) % 24);
        if (serviceDate < patientStart || serviceDate > patientEnd || serviceDate > TODAY) {
          continue;
        }

        const statusSeed = (sessionIndex + slot + monthOffset) % 20;
        let sessionStatus: SessionStatus = 'completed';

        if (statusSeed >= 16 && statusSeed <= 17) {
          sessionStatus = 'cancelled';
        } else if (statusSeed === 18) {
          sessionStatus = 'no_show';
        } else if (
          serviceDate >= addDays(TODAY, -7) &&
          serviceDate <= addDays(TODAY, 7) &&
          statusSeed === 19
        ) {
          sessionStatus = 'scheduled';
        }

        const supervisionExpected = patient.patientType !== 'Transition Support' || slot % 2 === 0;
        const supervisionCompleted =
          !supervisionExpected || (sessionStatus === 'completed' ? statusSeed % 5 !== 0 : true);

        sessions.push({
          id: makeId('sess', sessionIndex, scopeKey),
          patientId: patient.id,
          locationId: patient.primaryLocationId,
          locationName: patient.primaryLocationName,
          patientType: patient.patientType,
          payer: patient.payer,
          therapistId: patient.therapistId,
          therapistName: patient.therapistName,
          supervisingClinicianId: patient.supervisingClinicianId,
          supervisingClinicianName: patient.supervisingClinicianName,
          date: formatIsoDate(serviceDate),
          serviceSetting: SERVICE_SETTINGS[(sessionIndex + slot) % SERVICE_SETTINGS.length]!,
          durationHours: 2 + ((slot + sessionIndex) % 3),
          sessionStatus,
          supervisionExpected,
          supervisionCompleted
        });
        sessionIndex += 1;
      }
    }
  }

  return sessions;
}

function buildAuthorizations(
  patients: ReportingWarehousePatient[],
  sessions: ReportingWarehouseSession[],
  scopeKey: string
) {
  const authorizations: ReportingWarehouseAuthorization[] = [];
  let authIndex = 0;

  for (const patient of patients) {
    const patientStart = new Date(patient.startDate);
    const patientEnd =
      patient.dischargeDate && new Date(patient.dischargeDate) < TODAY
        ? new Date(patient.dischargeDate)
        : TODAY;

    for (
      let authStart = startOfMonth(patientStart);
      authStart <= patientEnd;
      authStart = addMonths(authStart, 4)
    ) {
      const authEnd = addDays(addMonths(authStart, 3), -1);
      const totalVisits = 18 + ((authIndex + patient.id.length) % 18);
      const usedVisits = sessions.filter((session) => {
        const date = new Date(session.date);
        return (
          session.patientId === patient.id &&
          session.sessionStatus === 'completed' &&
          date >= authStart &&
          date <= authEnd
        );
      }).length;
      const remainingVisits = Math.max(0, totalVisits - usedVisits);

      let status: AuthorizationStatus = 'active';
      const daysUntilEnd = Math.round(
        (authEnd.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (authStart > TODAY) {
        status = 'pending';
      } else if (authEnd < TODAY) {
        status = 'expired';
      } else if (remainingVisits <= 4) {
        status = 'low_remaining';
      } else if (daysUntilEnd <= 21) {
        status = 'expiring_soon';
      }

      authorizations.push({
        id: makeId('auth', authIndex, scopeKey),
        patientId: patient.id,
        locationId: patient.primaryLocationId,
        locationName: patient.primaryLocationName,
        patientType: patient.patientType,
        payer: patient.payer,
        startDate: formatIsoDate(authStart),
        endDate: formatIsoDate(authEnd),
        totalVisits,
        usedVisits,
        remainingVisits,
        status
      });
      authIndex += 1;
    }
  }

  return authorizations;
}

function buildEligibilityChecks(sessions: ReportingWarehouseSession[], scopeKey: string) {
  const checks: ReportingWarehouseEligibilityCheck[] = [];

  sessions.forEach((session, index) => {
    const sessionDate = new Date(session.date);
    let status: EligibilityStatus = 'verified';
    let failureReason: string | null = null;

    if (session.sessionStatus === 'scheduled' && index % 7 === 0) {
      status = 'unverified';
    } else if (index % 19 === 0) {
      status = 'failed';
      failureReason = index % 2 === 0 ? 'coverage termed' : 'payer response timeout';
    }

    checks.push({
      id: makeId('elig', index, scopeKey),
      patientId: session.patientId,
      locationId: session.locationId,
      locationName: session.locationName,
      patientType: session.patientType,
      therapistId: session.therapistId,
      therapistName: session.therapistName,
      serviceDate: session.date,
      verificationDate: formatIsoDate(addDays(sessionDate, -2)),
      status,
      failureReason
    });
  });

  return checks;
}

function buildClaims(sessions: ReportingWarehouseSession[], scopeKey: string) {
  const claims: ReportingWarehouseClaim[] = [];
  let claimIndex = 0;

  for (const session of sessions) {
    if (session.sessionStatus !== 'completed') {
      continue;
    }

    const baseRate = session.patientType === 'Focused Care' ? 238 : session.patientType === 'Early Learner' ? 202 : 188;
    const amountBilled = baseRate * session.durationHours;
    const allowedAmount = Math.round(amountBilled * 0.92);
    const submissionDate = addDays(new Date(session.date), 3 + (claimIndex % 6));
    let status: ClaimStatus = 'paid';
    let amountPaid = Math.round(allowedAmount * 0.97);
    let adjudicationDate: Date | null = addDays(submissionDate, 10 + (claimIndex % 18));
    let denialReason: string | null = null;
    let resubmissionDate: Date | null = null;
    let resubmissionResolved = false;

    const claimSeed = claimIndex % 20;
    if (claimSeed >= 12 && claimSeed <= 14) {
      status = 'pending';
      amountPaid = 0;
      adjudicationDate = null;
    } else if (claimSeed >= 15 && claimSeed <= 17) {
      status = 'denied';
      amountPaid = 0;
      denialReason = DENIAL_REASONS[claimSeed % DENIAL_REASONS.length]!;
      adjudicationDate = addDays(submissionDate, 12 + (claimIndex % 9));
      if (claimSeed === 17) {
        status = 'resubmitted';
        resubmissionDate = addDays(adjudicationDate, 5 + (claimIndex % 7));
        resubmissionResolved = claimIndex % 3 !== 0;
        if (resubmissionResolved) {
          amountPaid = Math.round(allowedAmount * 0.93);
        }
      }
    } else if (claimSeed === 18) {
      status = 'submitted';
      amountPaid = 0;
      adjudicationDate = null;
    }

    claims.push({
      id: makeId('clm', claimIndex, scopeKey),
      patientId: session.patientId,
      locationId: session.locationId,
      locationName: session.locationName,
      patientType: session.patientType,
      payer: session.payer,
      therapistId: session.therapistId,
      therapistName: session.therapistName,
      supervisingClinicianId: session.supervisingClinicianId,
      supervisingClinicianName: session.supervisingClinicianName,
      serviceDate: session.date,
      submissionDate: formatIsoDate(submissionDate),
      adjudicationDate: adjudicationDate ? formatIsoDate(adjudicationDate) : null,
      amountBilled,
      allowedAmount,
      amountPaid,
      outstandingAmount: Math.max(0, allowedAmount - amountPaid),
      status,
      denialReason,
      resubmissionDate: resubmissionDate ? formatIsoDate(resubmissionDate) : null,
      resubmissionResolved
    });
    claimIndex += 1;
  }

  return claims;
}

function buildSummary(warehouse: Omit<ProviderReportingWarehouse, 'summary'>): ReportingWarehouseSummary {
  return {
    lookbackMonths: LOOKBACK_MONTHS,
    generatedThrough: formatIsoDate(TODAY),
    approximateRecordCounts: {
      locations: warehouse.locations.length,
      staff: warehouse.staff.length,
      patients: warehouse.patients.length,
      sessions: warehouse.sessions.length,
      authorizations: warehouse.authorizations.length,
      eligibilityChecks: warehouse.eligibilityChecks.length,
      claims: warehouse.claims.length
    }
  };
}

const cachedWarehouses = new Map<string, ProviderReportingWarehouse>();

export function getProviderReportingWarehouse(scope?: ProviderReportingWarehouseScope) {
  const scopeKey = normalizeScopeKey(scope);
  const cachedWarehouse = cachedWarehouses.get(scopeKey);

  if (cachedWarehouse) {
    return cachedWarehouse;
  }

  const locations = buildLocations(scope, scopeKey);
  const staff = buildStaff(locations, scopeKey);
  const therapists = staff.filter((record) => record.role === 'therapist');
  const supervisors = staff.filter((record) => record.role === 'supervising_clinician');
  const patients = buildPatients(locations, therapists, supervisors, scopeKey);
  const sessions = buildSessions(patients, scopeKey);
  const authorizations = buildAuthorizations(patients, sessions, scopeKey);
  const eligibilityChecks = buildEligibilityChecks(sessions, scopeKey);
  const claims = buildClaims(sessions, scopeKey);

  const warehouse = {
    locations,
    staff,
    patients,
    sessions,
    authorizations,
    eligibilityChecks,
    claims,
    summary: buildSummary({
      locations,
      staff,
      patients,
      sessions,
      authorizations,
      eligibilityChecks,
      claims
    })
  };

  cachedWarehouses.set(scopeKey, warehouse);
  return warehouse;
}
