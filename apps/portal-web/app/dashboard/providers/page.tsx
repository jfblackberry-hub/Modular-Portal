import { MemberFindCareWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberFindCareWorkspaceContent';

const providers = [
  {
    id: 'prov-1',
    name: 'North Harbor Clinic',
    specialty: 'Primary care',
    distance: '2.4 miles',
    status: 'In network'
  },
  {
    id: 'prov-2',
    name: 'Lakeview Behavioral Health',
    specialty: 'Behavioral health',
    distance: '5.1 miles',
    status: 'In network'
  },
  {
    id: 'prov-3',
    name: 'Summit Specialty Center',
    specialty: 'Cardiology',
    distance: '8.0 miles',
    status: 'Referral suggested'
  }
];

export default async function ProvidersPage() {
  return <MemberFindCareWorkspaceContent providers={providers} />;
}
