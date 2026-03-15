import type { HouseholdProfile, PlanSelectionCandidate } from './domain.js';

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
}

export type ValidationContext = {
  household: HouseholdProfile;
  selectedPlan?: PlanSelectionCandidate;
  requestedEffectiveDate?: string;
};

export type ValidationRule = {
  id: string;
  description: string;
  evaluate: (context: ValidationContext) => ValidationIssue[];
};

const requiredDependentsRule: ValidationRule = {
  id: 'required_dependents',
  description: 'Dependent records should include date of birth and relationship.',
  evaluate: (context) =>
    context.household.dependents.flatMap((dependent) => {
      const issues: ValidationIssue[] = [];

      if (!dependent.dob) {
        issues.push({
          code: 'missing_dependent_dob',
          message: `Dependent ${dependent.firstName} ${dependent.lastName} is missing date of birth.`,
          severity: 'error',
          field: 'dependents.dob'
        });
      }

      return issues;
    })
};

const planSelectionRule: ValidationRule = {
  id: 'plan_selection',
  description: 'Plan selection must be present before submission.',
  evaluate: (context) =>
    context.selectedPlan
      ? []
      : [
          {
            code: 'missing_plan_selection',
            message: 'Select a plan before submitting enrollment.',
            severity: 'error',
            field: 'planSelection'
          }
        ]
};

const effectiveDateRule: ValidationRule = {
  id: 'effective_date_window',
  description: 'Effective date must be selected for enrollment.',
  evaluate: (context) =>
    context.requestedEffectiveDate
      ? []
      : [
          {
            code: 'missing_effective_date',
            message: 'Choose an effective date to continue.',
            severity: 'warning',
            field: 'effectiveDate'
          }
        ]
};

export const enrollmentValidationRules: ValidationRule[] = [
  requiredDependentsRule,
  planSelectionRule,
  effectiveDateRule
];

export function runEnrollmentValidations(context: ValidationContext) {
  return enrollmentValidationRules.flatMap((rule) => rule.evaluate(context));
}
