import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Test_Cases_Input"

headers = [
    "Test_ID",
    "Module",
    "Test_Name",
    "Action_Type",
    "Target_Element_ID",
    "Input_Data",
    "Expected_Value",
    "Is_Critical",
]
ws.append(headers)

test_cases = [
    (
        "TC01",
        "Smoke",
        "Enter Site Main Page",
        "SMOKE_MAIN_PAGE",
        "root",
        "N/A",
        "TrashTrack City",
        True,
    ),
    (
        "TC02",
        "Smoke",
        "Resident Login Check (res1@gmail.com)",
        "SMOKE_LOGIN",
        "login-submit-btn",
        "res1@gmail.com|flower",
        "Welcome back",
        True,
    ),
    (
        "TC03",
        "Alert",
        "Submit Empty Report Form - Assert Alert",
        "REPORT_EMPTY_ALERT",
        "submit-report-btn",
        "N/A",
        "Title Missing",
        False,
    ),
    (
        "TC04",
        "Confirm",
        "Submit Proper Report Form - Assert Confirm",
        "REPORT_SUBMIT_CONFIRM",
        "submit-report-btn",
        "Overflowing Dumpster in Ward 19|Household Waste|Waste spilled across sidewalk|moderate|medium",
        "Confirm Report Submission?",
        False,
    ),
    (
        "TC05",
        "IFrame",
        "Assert Resident Full Name Input in IFrame",
        "IFRAME_NAME_INPUT_ASSERT",
        "survey-resident-name",
        "N/A",
        "Resident Full Name:",
        False,
    ),
    (
        "TC06",
        "IFrame",
        "Assert Overall Collection Satisfaction 5 Options (1-5 Stars)",
        "IFRAME_SATISFACTION_OPTIONS",
        "survey-rating",
        "N/A",
        "5",
        False,
    ),
    (
        "TC07",
        "Alert",
        "Submit Survey Without Name - Assert Alert",
        "SURVEY_EMPTY_NAME_ALERT",
        "survey-submit-btn",
        "N/A",
        "Full Name Missing",
        False,
    ),
    (
        "TC08",
        "Confirm",
        "Submit Survey - Assert Confirm Review Dialog",
        "SURVEY_CONFIRM_REVIEW",
        "survey-submit-btn",
        "Tanvir Ahmed|Ward 19 (Gulshan/Banani)|4|Prompt morning STS clearance",
        "Confirm Review?",
        False,
    ),
    (
        "TC09",
        "Prompt",
        "Edit Profile - Assert Old Password Prompt",
        "PROFILE_PASSWORD_PROMPT",
        "save-profile-btn",
        "flower",
        "Please enter your old password:",
        False,
    ),
]

for tc in test_cases:
    ws.append(list(tc))

# Formatting
header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
center_align = Alignment(horizontal="center", vertical="center")

thin_border = Border(
    left=Side(style="thin", color="D9D9D9"),
    right=Side(style="thin", color="D9D9D9"),
    top=Side(style="thin", color="D9D9D9"),
    bottom=Side(style="thin", color="D9D9D9"),
)

for col_num in range(1, len(headers) + 1):
    cell = ws.cell(row=1, column=col_num)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = center_align

for row in ws.iter_rows(min_row=2, max_row=len(test_cases) + 1, min_col=1, max_col=len(headers)):
    for cell in row:
        cell.border = thin_border
        if cell.column in [1, 2, 4, 8]:
            cell.alignment = center_align

for col in ws.columns:
    max_len = max(len(str(cell.value or "")) for cell in col)
    col_letter = col[0].column_letter
    ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

output_filename = "test_cases_input.xlsx"
wb.save(output_filename)
print(f"Generated {output_filename} successfully with {len(test_cases)} test cases!")
