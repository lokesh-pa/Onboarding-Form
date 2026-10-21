import * as XLSX from 'xlsx';
import { OnboardingDetails, BgvData, OffboardingDetails, CustomFieldItem } from '../types';

function formatExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel date serial number conversion
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(val).trim();
}

export interface OffboardingParseResult extends Partial<OffboardingDetails> {
  customFields?: CustomFieldItem[];
}

export interface OnboardingParseResult {
  details: Partial<OnboardingDetails>;
  bgv: Partial<BgvData>;
  customFields: CustomFieldItem[];
  rawRowsCount: number;
}

export function parseExcelOffboardingFile(file: File): Promise<OffboardingParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

        const off: Partial<OffboardingDetails> = {};
        const customFields: CustomFieldItem[] = [];
        const seenCustomKeys = new Set<string>();

        // 1. Try vertical key-value rows
        jsonData.forEach((row) => {
          if (!row || row.length === 0) return;

          const rawCellA = String(row[0] || '').trim();
          const rawCellB = String(row[1] || '').trim();
          const cellA = rawCellA.toLowerCase();
          const cellB = rawCellB.toLowerCase();
          const valB = row[1] !== undefined ? formatExcelDate(row[1]) : '';
          const valC = row[2] !== undefined ? formatExcelDate(row[2]) : '';

          const label = cellB || cellA;
          const displayLabel = rawCellB || rawCellA;
          const val = valC || valB;

          if (!label || !val) return;

          // Standard Fields
          if (label.includes('resource name') || label === 'name') off.resourceName = val;
          else if (label.includes('vendor name') || label.includes('name of the vendor') || label.includes('supplier name') || label === 'vendor') off.vendorName = val;
          else if (label.includes('resource email') || label.includes('email (ab)') || label.includes('resource email (ab)')) off.resourceEmailAB = val;
          else if (label.includes('offboarding date') || label.includes('last working day') || label.includes('lwd')) off.offboardingDateLWD = val;
          else if (label.includes('offboarding reason') || label.includes('reason')) off.offboardingReason = val;
          else if (label.includes('ab sponsor') || label.includes('sponsor email')) off.abSponsorEmail = val;
          else if (label.includes('division name') || label.includes('division')) off.divisionName = val;
          else if (label.includes('ab-joining date') || label.includes('joining date')) off.abJoiningDateCurrentPO = val;
          else if (label.includes('billing start date')) off.billingStartDateCurrentYear = val;
          else if (label.includes('billing rate')) off.billingRateWithCurrency = val;
          else if (label.includes('purchase order') || label.includes('po number')) off.purchaseOrderNumber = val;
          else if (label.includes('adm seniority')) off.admSeniority = val;
          else if (label.includes('adm role')) off.admRole = val;
          else if (label.includes('billed days')) off.billedDaysCurrentYear = val;
          else if (label.includes('timesheet in sync') || label.includes('timesheet')) {
            const v = val.toLowerCase();
            off.isTimesheetInSync = v.includes('y') ? 'Yes' : v.includes('n') ? 'No' : 'NA';
          } else if (!label.startsWith('sr.') && !label.includes('section') && !label.includes('field name')) {
            // Provision: Capture as additional custom field
            const cleanKey = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            if (!seenCustomKeys.has(cleanKey)) {
              seenCustomKeys.add(cleanKey);
              customFields.push({
                id: `cf-off-${Date.now()}-${customFields.length + 1}`,
                key: cleanKey,
                label: displayLabel,
                value: val,
                fieldType: 'text',
                source: 'excel'
              });
            }
          }
        });

        // 2. Also check if row 0 or 1 was a horizontal header row and next row has values
        if (jsonData.length >= 2) {
          const headerRowIdx = jsonData.findIndex(r => r && r.some(c => String(c).toLowerCase().includes('resource name') || String(c).toLowerCase().includes('offboarding date')));
          if (headerRowIdx !== -1 && jsonData[headerRowIdx + 1]) {
            const rawHeaders = jsonData[headerRowIdx].map(h => String(h || '').trim());
            const headers = rawHeaders.map(h => h.toLowerCase());
            const values = jsonData[headerRowIdx + 1];
            headers.forEach((h, colIdx) => {
              const val = formatExcelDate(values[colIdx]);
              if (!val) return;
              if (h.includes('resource name') && !off.resourceName) off.resourceName = val;
              else if ((h.includes('vendor name') || h.includes('vendor') || h.includes('supplier')) && !off.vendorName) off.vendorName = val;
              else if (h.includes('resource email') && !off.resourceEmailAB) off.resourceEmailAB = val;
              else if ((h.includes('offboarding date') || h.includes('lwd') || h.includes('last working')) && !off.offboardingDateLWD) off.offboardingDateLWD = val;
              else if (h.includes('reason') && !off.offboardingReason) off.offboardingReason = val;
              else if (h.includes('sponsor') && !off.abSponsorEmail) off.abSponsorEmail = val;
              else if (h.includes('division') && !off.divisionName) off.divisionName = val;
              else if (h.includes('joining date') && !off.abJoiningDateCurrentPO) off.abJoiningDateCurrentPO = val;
              else if (h.includes('billing start') && !off.billingStartDateCurrentYear) off.billingStartDateCurrentYear = val;
              else if (h.includes('billing rate') && !off.billingRateWithCurrency) off.billingRateWithCurrency = val;
              else if (h.includes('purchase order') && !off.purchaseOrderNumber) off.purchaseOrderNumber = val;
              else if (h.includes('seniority') && !off.admSeniority) off.admSeniority = val;
              else if (h.includes('role') && !off.admRole) off.admRole = val;
              else if (h.includes('billed days') && !off.billedDaysCurrentYear) off.billedDaysCurrentYear = val;
              else if (h.includes('timesheet') && !off.isTimesheetInSync) {
                const v = val.toLowerCase();
                off.isTimesheetInSync = v.includes('y') ? 'Yes' : v.includes('n') ? 'No' : 'NA';
              } else {
                const cleanKey = h.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                if (!seenCustomKeys.has(cleanKey)) {
                  seenCustomKeys.add(cleanKey);
                  customFields.push({
                    id: `cf-off-col-${Date.now()}-${customFields.length + 1}`,
                    key: cleanKey,
                    label: rawHeaders[colIdx] || cleanKey,
                    value: val,
                    fieldType: 'text',
                    source: 'excel'
                  });
                }
              }
            });
          }
        }

        resolve({ ...off, customFields });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read offboarding Excel file.'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseExcelOnboardingFile(file: File): Promise<OnboardingParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

        const details: Partial<OnboardingDetails> = {};
        const bgv: Partial<BgvData> = {};
        const customFields: CustomFieldItem[] = [];
        const seenCustomKeys = new Set<string>();

        // Parse key-value rows
        jsonData.forEach((row) => {
          if (!row || row.length === 0) return;

          // Check if row has description in col 0 or 1, and value in col 1 or 2
          const rawCellA = String(row[0] || '').trim();
          const rawCellB = String(row[1] || '').trim();
          const cellA = rawCellA.toLowerCase();
          const cellB = rawCellB.toLowerCase();
          const valB = row[1] !== undefined ? formatExcelDate(row[1]) : '';
          const valC = row[2] !== undefined ? formatExcelDate(row[2]) : '';

          const label = cellB || cellA;
          const displayLabel = rawCellB || rawCellA;
          const val = valC || valB;

          if (!label || !val) return;

          // Mapping matching Images 1, 2, 3
          if (label.includes('first name')) details.firstName = val;
          else if (label.includes('middle name')) details.middleName = val;
          else if (label.includes('last name')) details.lastName = val;
          else if (label.includes('name of the vendor') || label.includes('supplier name') || label.includes('vendor name')) {
            details.vendorName = val;
            bgv.supplierName = val;
          }
          else if (label.includes('vendor delivery manager') || label.includes('dm email') || label.includes('delivery manager')) details.vendorDeliveryManagerEmail = val;
          else if (label.includes('resource location') || label.includes('worker location') || label === 'location') {
            details.resourceLocation = val;
            bgv.location = val;
          }
          else if (label.includes('worked with ab') || label.includes('worked with db')) {
            details.workedWithABEarlier = val.toLowerCase().includes('y');
          }
          else if (label.includes('login id')) details.abLoginId = val;
          else if (label.includes('ab email id of incumbent') || label.includes('incumbent email')) details.incumbentEmailId = val;
          else if (label.includes('ab email id') || label.includes('ab email')) details.abEmailId = val;
          else if (label.includes('mobile number') || label.includes('mobile')) details.mobileNumber = val;
          else if (label.includes('mobile operating system') || label.includes('operating system') || label.includes('os')) {
            details.mobileOperatingSystem = val.toLowerCase().includes('ios') ? 'iOS' : 'Android';
          }
          else if (label.includes('candidate email') || (label.includes('email id') && !details.candidateEmailId)) details.candidateEmailId = val;
          else if (label.includes('ab manager') || label.includes('person of contact') || label.includes('sponsor')) details.abManagerNameOrEmail = val;
          else if (label.includes('division name') || label.includes('division at ab') || label === 'division') {
            details.divisionName = val;
            bgv.divisionAtAB = val;
          }
          else if (label.includes('bgv status') || label.includes('background screening status')) {
            details.bgvStatus = val.toLowerCase().includes('pend') ? 'Pending' : 'Completed';
            bgv.screeningStatus = val.toLowerCase().includes('pend') ? 'Pending' : 'Complete';
          }
          else if (label.includes('bgv email sent to') || label.includes('backgroundscreening@') || label.includes('bgv email sent')) {
            details.bgvEmailSentToBgTeam = val.toLowerCase().includes('y');
          }
          else if (label.includes('joining date')) details.joiningDateInAB = val;
          else if (label.includes('billing start date') || label.includes('billing start')) details.billingStartDate = val;
          else if (label.includes('billing rate')) details.billingRateWithCurrency = val;
          else if (label.includes('purchase order number') || label.includes('po number') || label === 'po') details.purchaseOrderNumber = val;
          else if (label.includes('purchase order end date') || label.includes('po end date')) details.purchaseOrderEndDate = val;
          else if (label.includes('adm seniority') || label.includes('seniority')) {
            const v = val.toLowerCase();
            details.admSeniority = v.includes('senior') ? 'Senior' : v.includes('prof') ? 'Professional' : 'Junior';
          }
          else if (label.includes('adm role') || label.includes('role as per sow') || label === 'role') details.admRole = val;
          else if (label.includes('project name')) details.projectName = val;
          else if (label.includes('total experience')) details.totalExperiencePriorToAB = val;
          else if (label.includes('relevant experience')) details.relevantExperiencePriorToAB = val;
          else if (label.includes('technical evaluation score') || label.includes('tech score')) details.technicalEvaluationScore = val;
          else if (label.includes('notice period')) details.noticePeriodDays = val;
          else if (label.includes('subcontractor (yes/no)') || label.includes('is this resource a subcontractor')) {
            details.isSubcontractor = val.toLowerCase().includes('y');
          }
          else if (label.includes('subcontractors allowed for this po') || label.includes('subcontractors allowed')) {
            details.areSubcontractorsAllowedForPO = val.toLowerCase().includes('y') ? 'Yes' : val.toLowerCase().includes('n') ? 'No' : 'NA';
          }
          else if (label.includes('replacement? or new demand') || label.includes('demand type') || label.includes('replacement')) {
            details.demandType = val.toLowerCase().includes('rep') ? 'Replacement' : 'New Demand';
          }
          else if (label.includes('country specific checks')) {
            bgv.performedCountrySpecificChecks = val.toLowerCase().includes('y');
          }
          else if (label.includes('date of background screening completion') || label.includes('screening completion')) {
            bgv.completionDate = val;
          }
          else if (!label.startsWith('sr.') && !label.includes('section') && !label.includes('candidate details') && !label.includes('engagement') && !label.includes('experience & compliance')) {
            // Provision: Capture unknown/extra rows as custom fields
            const cleanKey = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            if (!seenCustomKeys.has(cleanKey)) {
              seenCustomKeys.add(cleanKey);
              customFields.push({
                id: `cf-onb-${Date.now()}-${customFields.length + 1}`,
                key: cleanKey,
                label: displayLabel,
                value: val,
                fieldType: 'text',
                source: 'excel'
              });
            }
          }
        });

        // Also check if row was a horizontal table with multiple columns
        if (jsonData.length >= 2) {
          const headerRowIdx = jsonData.findIndex(r => r && r.some(c => String(c).toLowerCase().includes('first name') || String(c).toLowerCase().includes('candidate name')));
          if (headerRowIdx !== -1 && jsonData[headerRowIdx + 1]) {
            const rawHeaders = jsonData[headerRowIdx].map(h => String(h || '').trim());
            const headers = rawHeaders.map(h => h.toLowerCase());
            const values = jsonData[headerRowIdx + 1];
            headers.forEach((h, colIdx) => {
              const val = formatExcelDate(values[colIdx]);
              if (!val) return;
              if (h.includes('first name') && !details.firstName) details.firstName = val;
              else if (h.includes('middle name') && !details.middleName) details.middleName = val;
              else if (h.includes('last name') && !details.lastName) details.lastName = val;
              else if (h.includes('vendor') && !details.vendorName) { details.vendorName = val; bgv.supplierName = val; }
              else if ((h.includes('dm email') || h.includes('delivery manager')) && !details.vendorDeliveryManagerEmail) details.vendorDeliveryManagerEmail = val;
              else if (h.includes('location') && !details.resourceLocation) { details.resourceLocation = val; bgv.location = val; }
              else if (h.includes('mobile') && !details.mobileNumber) details.mobileNumber = val;
              else if ((h.includes('email') || h.includes('candidate email')) && !details.candidateEmailId) details.candidateEmailId = val;
              else if (h.includes('manager') && !details.abManagerNameOrEmail) details.abManagerNameOrEmail = val;
              else if (h.includes('division') && !details.divisionName) { details.divisionName = val; bgv.divisionAtAB = val; }
              else if (h.includes('joining') && !details.joiningDateInAB) details.joiningDateInAB = val;
              else if (h.includes('billing start') && !details.billingStartDate) details.billingStartDate = val;
              else if (h.includes('rate') && !details.billingRateWithCurrency) details.billingRateWithCurrency = val;
              else if (h.includes('po number') && !details.purchaseOrderNumber) details.purchaseOrderNumber = val;
              else if (h.includes('role') && !details.admRole) details.admRole = val;
              else if (h.includes('seniority') && !details.admSeniority) details.admSeniority = val.toLowerCase().includes('senior') ? 'Senior' : val.toLowerCase().includes('prof') ? 'Professional' : 'Junior';
              else if (h.includes('score') && !details.technicalEvaluationScore) details.technicalEvaluationScore = val;
              else {
                const cleanKey = h.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                if (!seenCustomKeys.has(cleanKey)) {
                  seenCustomKeys.add(cleanKey);
                  customFields.push({
                    id: `cf-onb-col-${Date.now()}-${customFields.length + 1}`,
                    key: cleanKey,
                    label: rawHeaders[colIdx] || cleanKey,
                    value: val,
                    fieldType: 'text',
                    source: 'excel'
                  });
                }
              }
            });
          }
        }

        // Also check sheet 2 if exists (e.g. BGV sheet)
        if (workbook.SheetNames.length > 1) {
          const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
          const sheet2Data = XLSX.utils.sheet_to_json(secondSheet, { header: 1 }) as (string | number)[][];
          sheet2Data.forEach((row) => {
            if (!row || row.length === 0) return;
            const label = String(row[0] || '').toLowerCase();
            const val = String(row[1] || '').trim();
            if (label.includes('supplier name') && !bgv.supplierName) bgv.supplierName = val;
            if (label.includes('location') && !bgv.location) bgv.location = val;
            if (label.includes('country specific') && bgv.performedCountrySpecificChecks === undefined) {
              bgv.performedCountrySpecificChecks = val.toLowerCase().includes('y');
            }
            if (label.includes('division') && !bgv.divisionAtAB) bgv.divisionAtAB = val;
            if (label.includes('screening completion') && !bgv.completionDate) bgv.completionDate = val;
          });
        }

        resolve({ details, bgv, customFields, rawRowsCount: jsonData.length });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read Excel spreadsheet.'));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Onboarding Form 2026 (Items 1-32 matching Images 2 & 3)
  const onboardingHeaders = [
    ['Onboarding Form 2026 (All highlighted fields are mandatory)'],
    ['Sr. No.', 'Description', 'Details'],
    [1, 'First Name', 'Sarah'],
    [2, 'Middle Name', 'Jane'],
    [3, 'Last Name', 'Connor'],
    [4, 'Name of the Vendor', 'Apex Global Solutions Ltd'],
    [5, 'Vendor Delivery Manager Email', 'dm.apex@apextech.com'],
    [6, 'Resource Location', 'Bengaluru, India'],
    [7, 'Worked with AB earlier (Yes/No)', 'No'],
    [8, 'AB login ID (Update if worked with DB/AB earlier else mark NA)', 'NA'],
    [9, 'AB email ID (Update if worked with DB/AB earlier else mark NA)', 'NA'],
    [10, 'Mobile Number', '+91 98765 43210'],
    [11, 'Mobile Operating System', 'iOS'],
    [12, 'Email id', 'sarah.connor@apextech.com'],
    [13, 'AB Manager/ Person of Contact Name or Email ID', 'robert.smith@ab.com'],
    [14, 'Division Name', 'Wealth Management Tech'],
    [15, 'BGV Status (Completed/Pending)', 'Completed'],
    [16, 'BGV Email sent to Contingentworker.Backgroundscreening@ab.com?', 'Yes'],
    [17, 'Joining Date(in AB)', '2026-10-01'],
    [18, 'Billing Start Date', '2026-10-01'],
    [19, 'Billing Rate with Currency', '$85/hr'],
    [20, 'Purchase Order Number', 'PO-AB-2026-98114'],
    [21, 'Purchase Order End Date', '2027-09-30'],
    [22, 'ADM Seniority (Junior/Professional/Senior)', 'Senior'],
    [23, 'ADM Role (as per SOW)', 'Senior Full Stack Lead'],
    [24, 'Project name as per the agreement', 'Phoenix Core Banking Modernization'],
    [25, 'Total Experience Prior to AB', '8.5 Years'],
    [26, 'Relevant Experience Prior to AB', '6.0 Years'],
    [27, 'Technical Evaluation Score (applicable for engineers)', '92/100'],
    [28, 'Notice Period required to initiate termination (days)', '30'],
    [29, 'Is this resource a Subcontractor (Yes/No)', 'No'],
    [30, 'If yes- Are subcontractors allowed for this PO?', 'NA'],
    [31, 'Is this Replacement? Or New Demand', 'New Demand'],
    [32, 'AB email ID of Incumbent (if replacement)', 'NA']
  ];

  const wsOnboarding = XLSX.utils.aoa_to_sheet(onboardingHeaders);
  wsOnboarding['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsOnboarding, 'Onboarding Form 2026');

  // Sheet 2: BGV Notification (Image 1 format)
  const bgvRows = [
    ['AB Background Screening Verification Confirmation'],
    ['Please put the Name of Supplier and the Date in the Subject'],
    [],
    ['Supplier Name:', 'Apex Global Solutions Ltd'],
    ['Contingent Worker Name(s):'],
    ['1.', 'Sarah Jane Connor'],
    ['2.', ''],
    ['3.', ''],
    ['Contingent Worker Location:', 'Bengaluru, India'],
    ['Have you performed country specific checks?', 'Yes'],
    ['Division at AB:', 'Wealth Management Tech'],
    ['Background Screening Status: [Complete]', 'Complete'],
    ['Date of Background Screening Completion: [dd/mm/yyyy]', '05/09/2026'],
    [],
    ['Attach Screenshot of email or Email as object below:', 'Attached in system as BGV_Confirmation_Apex.pdf']
  ];

  const wsBgv = XLSX.utils.aoa_to_sheet(bgvRows);
  wsBgv['!cols'] = [{ wch: 42 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsBgv, 'BGV Notification');

  XLSX.writeFile(wb, 'AB_Contingent_Worker_Onboarding_Template_2026.xlsx');
}
