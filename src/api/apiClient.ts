import { WorkforceRequest, TickerConfig, LongTermDelegation, PolicyResourceLink } from '../types';

const API_BASE = '/api/v1';

export const apiClient = {
  async getRequests(): Promise<WorkforceRequest[]> {
    const res = await fetch(`${API_BASE}/requests`);
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },

  async submitOnboarding(payload: Partial<WorkforceRequest>, actorEmail: string = 'vendor.ops@supplier.com'): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to submit onboarding');
    return res.json();
  },

  async submitOffboarding(payload: any, supplierName: string, actorEmail: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/offboarding?supplierName=${encodeURIComponent(supplierName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to submit offboarding');
    return res.json();
  },

  async updateComplianceChecklist(id: string, checklist: any, actorEmail: string, actorRole: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/compliance-checklist?actorEmail=${encodeURIComponent(actorEmail)}&actorRole=${encodeURIComponent(actorRole)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checklist)
    });
    if (!res.ok) throw new Error('Failed to update compliance checklist');
    return res.json();
  },

  async managerSignoff(id: string, managerEmail: string, notes?: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/manager-signoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerEmail, notes })
    });
    if (!res.ok) throw new Error('Failed to sign off');
    return res.json();
  },

  async initiateWorkday(id: string, workdayId: string, notes?: string, actorEmail?: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/initiate-workday`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workdayId, notes, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to initiate Workday');
    return res.json();
  },

  async completeOnboarding(id: string, corporateAbEmail: string, workdayId?: string, actorEmail?: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/complete-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corporateAbEmail, workdayId, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to complete onboarding');
    return res.json();
  },

  async delegateRequest(id: string, delegateeEmail: string, delegateeName: string, scope: string, reason: string, actorEmail: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/delegate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delegateeEmail, delegateeName, scope, reason, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to delegate request');
    return res.json();
  },

  async acknowledgeOffboarding(id: string, targetInitiationDate: string, notes?: string, sponsorEmail?: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/acknowledge-offboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetInitiationDate, notes, sponsorEmail })
    });
    if (!res.ok) throw new Error('Failed to acknowledge offboarding');
    return res.json();
  },

  async uploadTermination(id: string, terminationNumber: string, screenshotUrl: string, notes?: string, actorEmail?: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/upload-termination`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminationNumber, screenshotUrl, notes, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to upload termination');
    return res.json();
  },

  async verifyTimesheet(id: string, inSync: boolean, actorEmail: string): Promise<WorkforceRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/verify-timesheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inSync, actorEmail })
    });
    if (!res.ok) throw new Error('Failed to verify timesheet');
    return res.json();
  },

  async searchDirectory(emailQuery: string) {
    const res = await fetch(`${API_BASE}/directory/search?email=${encodeURIComponent(emailQuery)}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getTickerConfig(): Promise<TickerConfig> {
    const res = await fetch(`${API_BASE}/ticker`);
    if (!res.ok) throw new Error('Failed to fetch ticker');
    return res.json();
  },

  async updateTickerConfig(config: TickerConfig): Promise<TickerConfig> {
    const res = await fetch(`${API_BASE}/ticker`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update ticker');
    return res.json();
  },

  async getPolicies(): Promise<PolicyResourceLink[]> {
    const res = await fetch(`${API_BASE}/policies`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async getManagerDelegation(): Promise<LongTermDelegation> {
    const res = await fetch(`${API_BASE}/delegation/manager`);
    if (!res.ok) throw new Error('Failed to fetch delegation');
    return res.json();
  },

  async updateManagerDelegation(delegation: LongTermDelegation): Promise<LongTermDelegation> {
    const res = await fetch(`${API_BASE}/delegation/manager`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delegation)
    });
    if (!res.ok) throw new Error('Failed to update manager delegation');
    return res.json();
  },

  downloadGovernanceReportUrl(): string {
    return `${API_BASE}/reports/governance-excel`;
  }
};
