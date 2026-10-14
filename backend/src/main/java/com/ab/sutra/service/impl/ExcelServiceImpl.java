package com.ab.sutra.service.impl;

import com.ab.sutra.domain.*;
import com.ab.sutra.service.ExcelService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class ExcelServiceImpl implements ExcelService {

    private static final String[] ONBOARDING_32_COLUMNS = {
        "1. First Name", "2. Middle Name", "3. Last Name", "4. Vendor Name",
        "5. Delivery Manager Email", "6. Resource Location", "7. Worked With AB Earlier (Y/N)",
        "8. AB Login ID", "9. AB Corporate Email", "10. Mobile Number",
        "11. Mobile OS (Android/iOS)", "12. Candidate Personal Email", "13. AB Hiring Manager Email",
        "14. Division Name", "15. BGV Status", "16. BGV Email Sent To Screening Team (Y/N)",
        "17. Joining Date in AB (YYYY-MM-DD)", "18. Billing Start Date (YYYY-MM-DD)",
        "19. Billing Rate with Currency", "20. Purchase Order (PO) Number",
        "21. PO End Date (YYYY-MM-DD)", "22. ADM Seniority", "23. ADM Role",
        "24. Project Name", "25. Total Experience (Years)", "26. Relevant Experience (Years)",
        "27. Technical Evaluation Score", "28. Notice Period Days", "29. Is Subcontractor (Y/N)",
        "30. Subcontractors Allowed for PO (Y/N/NA)", "31. Demand Type", "32. Incumbent Email ID (if replacement)"
    };

    private static final String[] OFFBOARDING_14_COLUMNS = {
        "1. Resource Name", "2. Resource Corporate Email (@ab.com)", "3. Last Working Day (LWD)",
        "4. Offboarding Reason", "5. AB Sponsor Email", "6. Division Name",
        "7. AB Joining Date (Current PO)", "8. Billing Start Date (Current Year)",
        "9. Billing Rate with Currency", "10. Purchase Order (PO) Number",
        "11. ADM Seniority", "12. ADM Role (as per SOW)",
        "13. Billed Days Current Year", "14. Is Timesheet in Sync with Billed Days (Yes/No/NA)"
    };

    @Override
    public List<WorkforceRequest> parseOnboardingWorkbook(InputStream inputStream, String supplierName) {
        List<WorkforceRequest> list = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            // Skip Header
            if (rowIterator.hasNext()) rowIterator.next();

            int rowNum = 1;
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                String firstName = getCellValue(row.getCell(0));
                String lastName = getCellValue(row.getCell(2));
                if (firstName.isEmpty() && lastName.isEmpty()) continue;

                String candidateName = (firstName + " " + lastName).trim();
                String refCode = "AB-ONB-2026-" + String.format("%04d", 1000 + rowNum);

                OnboardingDetails details = OnboardingDetails.builder()
                        .firstName(firstName)
                        .middleName(getCellValue(row.getCell(1)))
                        .lastName(lastName)
                        .vendorName(!getCellValue(row.getCell(3)).isEmpty() ? getCellValue(row.getCell(3)) : supplierName)
                        .vendorDeliveryManagerEmail(getCellValue(row.getCell(4)))
                        .resourceLocation(getCellValue(row.getCell(5)))
                        .workedWithABEarlier("Y".equalsIgnoreCase(getCellValue(row.getCell(6))) || "Yes".equalsIgnoreCase(getCellValue(row.getCell(6))))
                        .abLoginId(getCellValue(row.getCell(7)))
                        .abEmailId(getCellValue(row.getCell(8)))
                        .mobileNumber(getCellValue(row.getCell(9)))
                        .mobileOperatingSystem(getCellValue(row.getCell(10)))
                        .candidateEmailId(getCellValue(row.getCell(11)))
                        .abManagerNameOrEmail(getCellValue(row.getCell(12)))
                        .divisionName(getCellValue(row.getCell(13)))
                        .bgvStatus(getCellValue(row.getCell(14)).isEmpty() ? "In Progress" : getCellValue(row.getCell(14)))
                        .bgvEmailSentToBgTeam("Y".equalsIgnoreCase(getCellValue(row.getCell(15))) || "Yes".equalsIgnoreCase(getCellValue(row.getCell(15))))
                        .billingRateWithCurrency(getCellValue(row.getCell(18)))
                        .purchaseOrderNumber(getCellValue(row.getCell(19)))
                        .admSeniority(getCellValue(row.getCell(21)))
                        .admRole(getCellValue(row.getCell(22)))
                        .projectName(getCellValue(row.getCell(23)))
                        .totalExperiencePriorToAB(getCellValue(row.getCell(24)))
                        .relevantExperiencePriorToAB(getCellValue(row.getCell(25)))
                        .technicalEvaluationScore(getCellValue(row.getCell(26)))
                        .noticePeriodDays(getCellValue(row.getCell(27)))
                        .isSubcontractor("Y".equalsIgnoreCase(getCellValue(row.getCell(28))) || "Yes".equalsIgnoreCase(getCellValue(row.getCell(28))))
                        .areSubcontractorsAllowedForPO(getCellValue(row.getCell(29)))
                        .demandType(getCellValue(row.getCell(30)))
                        .incumbentEmailId(getCellValue(row.getCell(31)))
                        .build();

                WorkforceRequest req = WorkforceRequest.builder()
                        .referenceCode(refCode)
                        .type(RequestType.ONBOARDING)
                        .status(RequestStatus.UNDER_REVIEW)
                        .supplierName(supplierName)
                        .candidateName(candidateName)
                        .details(details)
                        .validationChecklist(ValidationChecklist.builder()
                                .bgvVerified(details.getBgvEmailSentToBgTeam())
                                .poActiveAndFunded(false)
                                .subcontractorCompliant(!Boolean.TRUE.equals(details.getIsSubcontractor()))
                                .technicalEvaluationVerified(true)
                                .sowRoleAligned(true)
                                .managerApproved(false)
                                .build())
                        .build();

                list.add(req);
                rowNum++;
            }
        } catch (Exception e) {
            log.error("Error parsing onboarding Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse onboarding workbook: " + e.getMessage());
        }
        return list;
    }

    @Override
    public byte[] generateOnboardingWorkbook(WorkforceRequest request) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Onboarding Data Form");

            CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.DARK_BLUE.getIndex());
            CellStyle dataStyle = createDataStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < ONBOARDING_32_COLUMNS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(ONBOARDING_32_COLUMNS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populate data if present
            if (request != null && request.getDetails() != null) {
                OnboardingDetails d = request.getDetails();
                Row row = sheet.createRow(1);
                row.createCell(0).setCellValue(val(d.getFirstName()));
                row.createCell(1).setCellValue(val(d.getMiddleName()));
                row.createCell(2).setCellValue(val(d.getLastName()));
                row.createCell(3).setCellValue(val(d.getVendorName()));
                row.createCell(4).setCellValue(val(d.getVendorDeliveryManagerEmail()));
                row.createCell(5).setCellValue(val(d.getResourceLocation()));
                row.createCell(6).setCellValue(Boolean.TRUE.equals(d.getWorkedWithABEarlier()) ? "Yes" : "No");
                row.createCell(7).setCellValue(val(d.getAbLoginId()));
                row.createCell(8).setCellValue(val(d.getAbEmailId()));
                row.createCell(9).setCellValue(val(d.getMobileNumber()));
                row.createCell(10).setCellValue(val(d.getMobileOperatingSystem()));
                row.createCell(11).setCellValue(val(d.getCandidateEmailId()));
                row.createCell(12).setCellValue(val(d.getAbManagerNameOrEmail()));
                row.createCell(13).setCellValue(val(d.getDivisionName()));
                row.createCell(14).setCellValue(val(d.getBgvStatus()));
                row.createCell(15).setCellValue(Boolean.TRUE.equals(d.getBgvEmailSentToBgTeam()) ? "Yes" : "No");
                row.createCell(16).setCellValue(d.getJoiningDateInAB() != null ? d.getJoiningDateInAB().toString() : "");
                row.createCell(17).setCellValue(d.getBillingStartDate() != null ? d.getBillingStartDate().toString() : "");
                row.createCell(18).setCellValue(val(d.getBillingRateWithCurrency()));
                row.createCell(19).setCellValue(val(d.getPurchaseOrderNumber()));
                row.createCell(20).setCellValue(d.getPurchaseOrderEndDate() != null ? d.getPurchaseOrderEndDate().toString() : "");
                row.createCell(21).setCellValue(val(d.getAdmSeniority()));
                row.createCell(22).setCellValue(val(d.getAdmRole()));
                row.createCell(23).setCellValue(val(d.getProjectName()));
                row.createCell(24).setCellValue(val(d.getTotalExperiencePriorToAB()));
                row.createCell(25).setCellValue(val(d.getRelevantExperiencePriorToAB()));
                row.createCell(26).setCellValue(val(d.getTechnicalEvaluationScore()));
                row.createCell(27).setCellValue(val(d.getNoticePeriodDays()));
                row.createCell(28).setCellValue(Boolean.TRUE.equals(d.getIsSubcontractor()) ? "Yes" : "No");
                row.createCell(29).setCellValue(val(d.getAreSubcontractorsAllowedForPO()));
                row.createCell(30).setCellValue(val(d.getDemandType()));
                row.createCell(31).setCellValue(val(d.getIncumbentEmailId()));

                for (int c = 0; c < ONBOARDING_32_COLUMNS.length; c++) {
                    if (row.getCell(c) != null) row.getCell(c).setCellStyle(dataStyle);
                }
            }

            for (int i = 0; i < ONBOARDING_32_COLUMNS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating onboarding Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating onboarding workbook", e);
        }
    }

    @Override
    public byte[] generateOffboardingWorkbook(OffboardingDetails offboarding, String supplierName) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Offboarding Data Form");

            CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_80_PERCENT.getIndex());
            CellStyle dataStyle = createDataStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < OFFBOARDING_14_COLUMNS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(OFFBOARDING_14_COLUMNS[i]);
                cell.setCellStyle(headerStyle);
            }

            if (offboarding != null) {
                Row row = sheet.createRow(1);
                row.createCell(0).setCellValue(val(offboarding.getResourceName()));
                row.createCell(1).setCellValue(val(offboarding.getResourceEmailAB()));
                row.createCell(2).setCellValue(offboarding.getOffboardingDateLWD() != null ? offboarding.getOffboardingDateLWD().toString() : "");
                row.createCell(3).setCellValue(val(offboarding.getOffboardingReason()));
                row.createCell(4).setCellValue(val(offboarding.getAbSponsorEmail()));
                row.createCell(5).setCellValue(val(offboarding.getDivisionName()));
                row.createCell(6).setCellValue(offboarding.getAbJoiningDateCurrentPO() != null ? offboarding.getAbJoiningDateCurrentPO().toString() : "");
                row.createCell(7).setCellValue(offboarding.getBillingStartDateCurrentYear() != null ? offboarding.getBillingStartDateCurrentYear().toString() : "");
                row.createCell(8).setCellValue(val(offboarding.getBillingRateWithCurrency()));
                row.createCell(9).setCellValue(val(offboarding.getPurchaseOrderNumber()));
                row.createCell(10).setCellValue(val(offboarding.getAdmSeniority()));
                row.createCell(11).setCellValue(val(offboarding.getAdmRole()));
                row.createCell(12).setCellValue(val(offboarding.getBilledDaysCurrentYear()));
                row.createCell(13).setCellValue(val(offboarding.getIsTimesheetInSync()));

                for (int c = 0; c < OFFBOARDING_14_COLUMNS.length; c++) {
                    if (row.getCell(c) != null) row.getCell(c).setCellStyle(dataStyle);
                }
            }

            for (int i = 0; i < OFFBOARDING_14_COLUMNS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating offboarding Excel workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating offboarding workbook", e);
        }
    }

    @Override
    public byte[] generateGovernanceAuditReport(List<WorkforceRequest> requests) {
        String[] columns = {
            "Reference Code", "Type", "Candidate Name", "Supplier Partner", "Status",
            "Workday ID", "Corporate @ab.com Email", "Division", "PO Number", "ADM Role",
            "Billing Rate", "Joining Date / LWD", "BGV Gate", "PO Active Gate",
            "Subcontractor Compliant Gate", "Manager Approved Gate",
            "Financial Metrics (Efficiency Gain / Billing Loss)", "Created At"
        };

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("AB-SUTRA Governance Report");

            CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.DARK_TEAL.getIndex());
            CellStyle dataStyle = createDataStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (WorkforceRequest r : requests) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getReferenceCode());
                row.createCell(1).setCellValue(r.getType().name());
                row.createCell(2).setCellValue(r.getCandidateName());
                row.createCell(3).setCellValue(r.getSupplierName());
                row.createCell(4).setCellValue(r.getStatus().name());
                row.createCell(5).setCellValue(val(r.getWorkdayId()));
                row.createCell(6).setCellValue(val(r.getGeneratedAbEmailId()));

                String division = r.getDetails() != null ? val(r.getDetails().getDivisionName()) :
                        (r.getOffboarding() != null ? val(r.getOffboarding().getDivisionName()) : "");
                row.createCell(7).setCellValue(division);

                String po = r.getDetails() != null ? val(r.getDetails().getPurchaseOrderNumber()) :
                        (r.getOffboarding() != null ? val(r.getOffboarding().getPurchaseOrderNumber()) : "");
                row.createCell(8).setCellValue(po);

                String role = r.getDetails() != null ? val(r.getDetails().getAdmRole()) :
                        (r.getOffboarding() != null ? val(r.getOffboarding().getAdmRole()) : "");
                row.createCell(9).setCellValue(role);

                String rate = r.getDetails() != null ? val(r.getDetails().getBillingRateWithCurrency()) :
                        (r.getOffboarding() != null ? val(r.getOffboarding().getBillingRateWithCurrency()) : "");
                row.createCell(10).setCellValue(rate);

                String date = r.getDetails() != null && r.getDetails().getJoiningDateInAB() != null ?
                        r.getDetails().getJoiningDateInAB().toString() :
                        (r.getOffboarding() != null && r.getOffboarding().getOffboardingDateLWD() != null ?
                                r.getOffboarding().getOffboardingDateLWD().toString() : "");
                row.createCell(11).setCellValue(date);

                ValidationChecklist v = r.getValidationChecklist();
                row.createCell(12).setCellValue(v != null && Boolean.TRUE.equals(v.getBgvVerified()) ? "VERIFIED" : "PENDING");
                row.createCell(13).setCellValue(v != null && Boolean.TRUE.equals(v.getPoActiveAndFunded()) ? "ACTIVE" : "PENDING");
                row.createCell(14).setCellValue(v != null && Boolean.TRUE.equals(v.getSubcontractorCompliant()) ? "COMPLIANT" : "FLAGGED");
                row.createCell(15).setCellValue(v != null && Boolean.TRUE.equals(v.getManagerApproved()) ? "SIGNED-OFF" : "PENDING");

                // Financial Variance Terminology Rule:
                // "Never call negative billing variances 'negative loss'. Always designate them as 'Efficiency Gain'."
                String financialNote = "SLA Adherent";
                if (r.getStatus() == RequestStatus.ONBOARDED) {
                    financialNote = "Efficiency Gain (Completed Onboarding)";
                } else if (r.getStatus() == RequestStatus.REJECTED) {
                    financialNote = "Rejected (Resolved)";
                }
                row.createCell(16).setCellValue(financialNote);

                row.createCell(17).setCellValue(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : "");

                for (int c = 0; c < columns.length; c++) {
                    if (row.getCell(c) != null) row.getCell(c).setCellStyle(dataStyle);
                }
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating governance audit workbook: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating audit report", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook wb, short bgColor) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 10);
        font.setFontName("Arial");
        style.setFont(font);
        style.setFillForegroundColor(bgColor);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 9);
        font.setFontName("Arial");
        style.setFont(font);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.HAIR);
        style.setBorderTop(BorderStyle.HAIR);
        style.setBorderLeft(BorderStyle.HAIR);
        style.setBorderRight(BorderStyle.HAIR);
        return style;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                yield String.valueOf((long) cell.getNumericCellValue());
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String val(String str) {
        return str != null ? str : "";
    }
}
