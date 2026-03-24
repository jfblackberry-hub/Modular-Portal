import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createBrokerEmployerWorkspaceDataResolvers } from '../components/billing-enrollment/BrokerDashboardWorkspaceSection';
import { createEmployerCommandCenterInitialState } from '../components/billing-enrollment/EmployerCommandCenterDashboard';

test('broker workspace-specific data stays unloaded until a workspace resolver runs', async () => {
  const calls = {
    bookOfBusiness: 0,
    renewals: 0,
    quotes: 0,
    commissions: 0
  };

  const resolvers = createBrokerEmployerWorkspaceDataResolvers({
    loadBookOfBusinessData: async () => {
      calls.bookOfBusiness += 1;
      return {
        groups: [],
        filterOptions: {
          renewalMonths: [],
          linesOfBusiness: [],
          statuses: [],
          regions: [],
          assignedReps: []
        }
      };
    },
    loadRenewalsData: async () => {
      calls.renewals += 1;
      return {
        groupedRenewals: {}
      };
    },
    loadQuotesData: async () => {
      calls.quotes += 1;
      return {
        quotes: []
      };
    },
    loadCommissionsData: async () => {
      calls.commissions += 1;
      return {
        records: []
      };
    }
  });

  assert.deepEqual(calls, {
    bookOfBusiness: 0,
    renewals: 0,
    quotes: 0,
    commissions: 0
  });

  await resolvers.loadQuotesData();
  assert.deepEqual(calls, {
    bookOfBusiness: 0,
    renewals: 0,
    quotes: 1,
    commissions: 0
  });

  await resolvers.loadCommissionsData();
  assert.deepEqual(calls, {
    bookOfBusiness: 0,
    renewals: 0,
    quotes: 1,
    commissions: 1
  });
});

test('employer live mode starts without fallback dashboard payload on initial render', () => {
  const initialState = createEmployerCommandCenterInitialState({
    employerName: 'Acme Manufacturing',
    mode: 'live'
  });

  assert.equal(initialState.isLoading, true);
  assert.equal(initialState.data, null);
});
