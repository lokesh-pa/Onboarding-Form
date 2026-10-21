export interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  division: string;
}

export const COMPANY_DIRECTORY: CompanyEmployee[] = [
  {
    id: 'emp-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@ab.com',
    role: 'PMO Governance Lead',
    department: 'Contingent Workforce Office',
    division: 'Enterprise Operations'
  },
  {
    id: 'emp-002',
    name: 'David Miller',
    email: 'david.miller@ab.com',
    role: 'Engineering Director',
    department: 'Core Banking & Wealth Tech',
    division: 'Retail Banking & Wealth'
  },
  {
    id: 'emp-003',
    name: 'Alex Chen',
    email: 'alex.chen@ab.com',
    role: 'Lead Architect / Hiring Manager',
    department: 'Enterprise Architecture',
    division: 'Commercial Banking'
  },
  {
    id: 'emp-004',
    name: 'Rachel Vance',
    email: 'rachel.vance@ab.com',
    role: 'PMO Specialist',
    department: 'Contingent Workforce Office',
    division: 'Human Resources & Governance'
  },
  {
    id: 'emp-005',
    name: 'Robert Sponsor',
    email: 'robert.sponsor@ab.com',
    role: 'VP Engineering & Hiring Sponsor',
    department: 'Technology Infrastructure',
    division: 'Global Technology Infrastructure'
  },
  {
    id: 'emp-006',
    name: 'Elena Rostova',
    email: 'elena.rostova@ab.com',
    role: 'Director, Advanced Analytics',
    department: 'Enterprise Data Platform',
    division: 'Enterprise Risk & Compliance'
  },
  {
    id: 'emp-007',
    name: 'Marcus Brody',
    email: 'marcus.brody@ab.com',
    role: 'Contingent Workforce Operations Manager',
    department: 'Vendor Management Office',
    division: 'Corporate Functions'
  },
  {
    id: 'emp-008',
    name: 'Lisa Wong',
    email: 'lisa.wong@ab.com',
    role: 'Application Engineering Manager',
    department: 'Digital Experience Engineering',
    division: 'Retail Banking & Wealth'
  },
  {
    id: 'emp-009',
    name: 'Arjun Patel',
    email: 'arjun.patel@ab.com',
    role: 'Cloud Platform Lead',
    department: 'Cloud Platform Engineering',
    division: 'Global Technology Infrastructure'
  },
  {
    id: 'emp-010',
    name: 'Michael Torres',
    email: 'michael.torres@ab.com',
    role: 'Senior Hiring Manager',
    department: 'Payments & Settlement Services',
    division: 'Commercial Banking'
  },
  {
    id: 'emp-011',
    name: 'AB BGV Screening Desk',
    email: 'contingentworker.backgroundscreening@ab.com',
    role: 'Background Screening Operations',
    department: 'HR Operations',
    division: 'Human Resources & Governance'
  },
  {
    id: 'emp-012',
    name: 'AB Contingent PMO Desk',
    email: 'pmo.contingent@ab.com',
    role: 'Central PMO Desk',
    department: 'Workforce Governance',
    division: 'Corporate Functions'
  }
];

export function searchCompanyDirectory(query: string): CompanyEmployee[] {
  if (!query || !query.trim()) return COMPANY_DIRECTORY.slice(0, 5);
  const q = query.toLowerCase().trim();
  return COMPANY_DIRECTORY.filter(
    (emp) =>
      emp.email.toLowerCase().includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
  );
}
