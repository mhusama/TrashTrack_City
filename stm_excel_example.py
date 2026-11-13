"""
Automated Selenium Test Suite for Problem 13: Browser Alerts, Prompt Dialogs, and Embedded IFrames
Project: TrashTrack City

Test Matrix:
- TC01 (Smoke): Verify access to site main page
- TC02 (Smoke): Verify resident login (res1@gmail.com / flower)
- TC03 (Alert): Submit empty report form -> Assert "Title Missing" alert
- TC04 (Confirm): Submit proper report form -> Assert "Confirm Report Submission?" confirm dialog
- TC05 (IFrame): Assert resident full name input box inside survey iframe
- TC06 (IFrame): Assert Overall Collection Satisfaction with 5 options (1 to 5 stars) inside survey iframe
- TC07 (Alert): Submit survey without name inside iframe -> Assert "Full Name Missing" alert
- TC08 (Confirm): Submit survey inside iframe -> Assert "Confirm Review?" confirm dialog
- TC09 (Prompt): Edit profile -> Assert old password prompt dialog

Circuit Breaker:
If Smoke Tests (TC01 or TC02) fail, remaining test cases are immediately SKIPPED.
"""

import os
import sys
import time
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, NoAlertPresentException

# Configuration
DEFAULT_BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:5174")
INPUT_FILE = "test_cases_input.xlsx"
OUTPUT_FILE = "test_cases_output.xlsx"
HEADLESS = "--headless" in sys.argv or os.getenv("HEADLESS", "false").lower() == "true"
BASE_URL = DEFAULT_BASE_URL


def init_driver(headless=False):
    """Initializes and returns a Selenium Chrome WebDriver."""
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1366,850")
    options.add_argument("--log-level=3")
    
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(3)
    return driver


def detect_base_url(driver, expected_title_keyword="TrashTrack"):
    """Auto-detects whether the app is on port 5174 or 5173."""
    global BASE_URL
    candidates = [DEFAULT_BASE_URL]
    if "5174" in DEFAULT_BASE_URL:
        candidates.append(DEFAULT_BASE_URL.replace("5174", "5173"))
    elif "5173" in DEFAULT_BASE_URL:
        candidates.append(DEFAULT_BASE_URL.replace("5173", "5174"))

    last_err = ""
    for url in candidates:
        try:
            driver.get(url)
            WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, "root")))
            if expected_title_keyword.lower() in driver.title.lower():
                BASE_URL = url.rstrip("/")
                return True, f"Connected to {BASE_URL}. Title: '{driver.title}'", ""
        except Exception as e:
            last_err = str(e)

    return False, "Failed to connect to application shell on ports 5174/5173", last_err


def execute_test_step(driver, test_id, action_type, elem_id, input_data, expected_val):
    """Executes an individual test case and returns (status, actual_result, error_details)."""
    wait = WebDriverWait(driver, 6)

    # Ensure context is reset to default content before each test
    try:
        driver.switch_to.default_content()
    except Exception:
        pass

    # -------------------------------------------------------------
    # TC01: Smoke Test - Main Page Load
    # -------------------------------------------------------------
    if action_type == "SMOKE_MAIN_PAGE":
        ok, actual, err = detect_base_url(driver, expected_val)
        return ("PASS" if ok else "FAIL"), actual, err

    # -------------------------------------------------------------
    # TC02: Smoke Test - Resident Login
    # -------------------------------------------------------------
    elif action_type == "SMOKE_LOGIN":
        driver.get(f"{BASE_URL}/login")
        email, password = input_data.split("|")

        email_input = wait.until(EC.visibility_of_element_located((By.ID, "login-email-input")))
        email_input.clear()
        email_input.send_keys(email)

        pwd_input = driver.find_element(By.ID, "login-password-input")
        pwd_input.clear()
        pwd_input.send_keys(password)

        submit_btn = driver.find_element(By.ID, elem_id)
        submit_btn.click()

        # Wait for redirection to dashboard or presence of welcome banner
        time.sleep(1.5)
        current_url = driver.current_url
        if "/login" not in current_url:
            return "PASS", f"Login successful for {email}. Redirected to {current_url}", ""
        
        # Check if welcome toast appears
        page_source = driver.page_source
        if expected_val.lower() in page_source.lower():
            return "PASS", f"Login successful ({expected_val} detected)", ""
        
        return "FAIL", f"Still on login page ({current_url})", "Login credentials rejected or not redirected"

    # -------------------------------------------------------------
    # TC03: Alert - Submit Empty Report Form
    # -------------------------------------------------------------
    elif action_type == "REPORT_EMPTY_ALERT":
        driver.get(f"{BASE_URL}/")
        # Click "New Report" in resident sidebar or navigate
        try:
            nav_btn = wait.until(EC.element_to_be_clickable((By.ID, "nav-new-report")))
            nav_btn.click()
        except Exception:
            driver.get(f"{BASE_URL}/reports/new")

        title_input = wait.until(EC.visibility_of_element_located((By.ID, "report-title-input")))
        title_input.clear()

        submit_btn = wait.until(EC.element_to_be_clickable((By.ID, elem_id)))
        # Scroll submit button into view and click
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit_btn)
        time.sleep(0.3)
        submit_btn.click()

        alert = wait.until(EC.alert_is_present())
        actual_alert_text = alert.text
        alert.accept()

        if actual_alert_text == expected_val:
            return "PASS", f"Alert triggered with text: '{actual_alert_text}'", ""
        return "FAIL", f"Alert text was '{actual_alert_text}'", f"Expected '{expected_val}'"

    # -------------------------------------------------------------
    # TC04: Confirm - Submit Proper Report Form
    # -------------------------------------------------------------
    elif action_type == "REPORT_SUBMIT_CONFIRM":
        driver.get(f"{BASE_URL}/")
        try:
            nav_btn = wait.until(EC.element_to_be_clickable((By.ID, "nav-new-report")))
            nav_btn.click()
        except Exception:
            driver.get(f"{BASE_URL}/reports/new")

        # Parse inputs: Title|Category|Description|Smell|Spread
        parts = input_data.split("|")
        rep_title = parts[0]
        rep_desc = parts[2] if len(parts) > 2 else "Test description"

        title_input = wait.until(EC.visibility_of_element_located((By.ID, "report-title-input")))
        title_input.clear()
        title_input.send_keys(rep_title)

        desc_input = driver.find_element(By.ID, "report-description-input")
        desc_input.clear()
        desc_input.send_keys(rep_desc)

        # Select Category dropdown
        cat_btn = driver.find_element(By.ID, "report-category-select-btn")
        cat_btn.click()
        time.sleep(0.3)
        cat_opt = wait.until(EC.element_to_be_clickable((By.ID, "category-opt-household_waste")))
        cat_opt.click()
        time.sleep(0.3)
        sub_opt = wait.until(EC.element_to_be_clickable((By.ID, "subcategory-opt-mixed_garbage")))
        sub_opt.click()
        time.sleep(0.3)

        # Select Smell Risk radio
        try:
            smell_radio = driver.find_element(By.ID, "smellRisk-moderate")
            driver.execute_script("arguments[0].click();", smell_radio)
        except Exception:
            pass

        # Select Waste Spread Area radio
        try:
            spread_radio = driver.find_element(By.ID, "wasteSpreadArea-medium")
            driver.execute_script("arguments[0].click();", spread_radio)
        except Exception:
            pass

        # Click Submit
        submit_btn = driver.find_element(By.ID, elem_id)
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit_btn)
        time.sleep(0.3)
        submit_btn.click()

        # Catch Confirm dialog
        confirm_dialog = wait.until(EC.alert_is_present())
        actual_confirm_text = confirm_dialog.text
        confirm_dialog.accept()

        if actual_confirm_text == expected_val:
            return "PASS", f"Confirm dialog appeared with text: '{actual_confirm_text}' and was accepted", ""
        return "FAIL", f"Confirm dialog text was '{actual_confirm_text}'", f"Expected '{expected_val}'"

    # -------------------------------------------------------------
    # TC05: IFrame - Assert Resident Full Name Input
    # -------------------------------------------------------------
    elif action_type == "IFRAME_NAME_INPUT_ASSERT":
        driver.get(f"{BASE_URL}/survey")

        # Switch context to iframe
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "city-survey-iframe")))

        name_input = wait.until(EC.visibility_of_element_located((By.ID, elem_id)))
        is_visible = name_input.is_displayed()
        input_type = name_input.get_attribute("type")

        label_el = wait.until(EC.presence_of_element_located((By.ID, "resident-name-label")))
        actual_label = label_el.text.strip()

        # Switch context back AFTER inspecting elements inside iframe
        driver.switch_to.default_content()

        if is_visible and ("resident" in actual_label.lower() or "full name" in actual_label.lower()):
            return "PASS", f"Full name input box verified inside iframe (Type: '{input_type}', Label: '{actual_label}')", ""
        return "FAIL", f"Label was '{actual_label}'", "Input box or label mismatch inside iframe"

    # -------------------------------------------------------------
    # TC06: IFrame - Assert 5 Options 1 to 5 Stars
    # -------------------------------------------------------------
    elif action_type == "IFRAME_SATISFACTION_OPTIONS":
        driver.get(f"{BASE_URL}/survey")

        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "city-survey-iframe")))

        rating_select = wait.until(EC.presence_of_element_located((By.ID, elem_id)))
        options = rating_select.find_elements(By.TAG_NAME, "option")
        option_texts = [opt.text.strip() for opt in options]
        count = len(options)

        driver.switch_to.default_content()

        if count == int(expected_val):
            return "PASS", f"Found {count} options inside iframe: {option_texts}", ""
        return "FAIL", f"Found {count} options ({option_texts})", f"Expected {expected_val} options (1 to 5 stars)"

    # -------------------------------------------------------------
    # TC07: Alert - Submit Survey Without Name
    # -------------------------------------------------------------
    elif action_type == "SURVEY_EMPTY_NAME_ALERT":
        driver.get(f"{BASE_URL}/survey")

        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "city-survey-iframe")))

        # Ensure name is clear
        name_input = wait.until(EC.presence_of_element_located((By.ID, "survey-resident-name")))
        name_input.clear()

        submit_btn = driver.find_element(By.ID, elem_id)
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit_btn)
        submit_btn.click()

        # Catch Alert
        alert = wait.until(EC.alert_is_present())
        actual_alert_text = alert.text
        alert.accept()

        driver.switch_to.default_content()

        if actual_alert_text == expected_val:
            return "PASS", f"Alert correctly displayed: '{actual_alert_text}'", ""
        return "FAIL", f"Alert was '{actual_alert_text}'", f"Expected '{expected_val}'"

    # -------------------------------------------------------------
    # TC08: Confirm - Submit Survey Confirm Review
    # -------------------------------------------------------------
    elif action_type == "SURVEY_CONFIRM_REVIEW":
        driver.get(f"{BASE_URL}/survey")

        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "city-survey-iframe")))

        parts = input_data.split("|")
        survey_name = parts[0]
        survey_ward = parts[1] if len(parts) > 1 else "Ward 19 (Gulshan/Banani)"
        survey_rating = parts[2] if len(parts) > 2 else "4"
        survey_comment = parts[3] if len(parts) > 3 else "Regular bin cleanup"

        name_input = wait.until(EC.presence_of_element_located((By.ID, "survey-resident-name")))
        name_input.clear()
        name_input.send_keys(survey_name)

        ward_select = driver.find_element(By.ID, "survey-ward")
        ward_select.send_keys(survey_ward)

        rating_select = driver.find_element(By.ID, "survey-rating")
        rating_select.send_keys(survey_rating)

        comments_input = driver.find_element(By.ID, "survey-comments")
        comments_input.clear()
        comments_input.send_keys(survey_comment)

        submit_btn = driver.find_element(By.ID, elem_id)
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit_btn)
        submit_btn.click()

        # Catch Confirm
        confirm_dialog = wait.until(EC.alert_is_present())
        actual_confirm_text = confirm_dialog.text
        confirm_dialog.accept()

        time.sleep(0.3)
        status_box = driver.find_element(By.ID, "survey-status")
        actual_status = status_box.text

        driver.switch_to.default_content()

        if actual_confirm_text == expected_val:
            return "PASS", f"Confirm dialog appeared: '{actual_confirm_text}'. Status: '{actual_status}'", ""
        return "FAIL", f"Confirm text was '{actual_confirm_text}'", f"Expected '{expected_val}'"

    # -------------------------------------------------------------
    # TC09: Prompt - Edit Profile Old Password Prompt
    # -------------------------------------------------------------
    elif action_type == "PROFILE_PASSWORD_PROMPT":
        driver.get(f"{BASE_URL}/profile")

        save_btn = wait.until(EC.element_to_be_clickable((By.ID, elem_id)))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", save_btn)
        time.sleep(0.3)
        save_btn.click()

        # Catch Prompt dialog
        prompt_dialog = wait.until(EC.alert_is_present())
        actual_prompt_text = prompt_dialog.text
        # Send old password custom text
        prompt_dialog.send_keys(input_data)
        prompt_dialog.accept()

        if actual_prompt_text == expected_val:
            return "PASS", f"JS Prompt appeared with text: '{actual_prompt_text}'. Password sent and accepted.", ""
        return "FAIL", f"Prompt text was '{actual_prompt_text}'", f"Expected '{expected_val}'"

    return "FAIL", "Unknown action", f"Action type '{action_type}' unrecognized."


def save_output_excel(results, output_path):
    """Saves formatted test results to output Excel file."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Test Execution Results"

    headers = [
        "Test_ID",
        "Module",
        "Test_Name",
        "Action_Type",
        "Status",
        "Actual_Result",
        "Error_Details",
        "Timestamp",
    ]
    ws.append(headers)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")

    fill_pass = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
    font_pass = Font(name="Calibri", size=11, bold=True, color="006100")

    fill_fail = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
    font_fail = Font(name="Calibri", size=11, bold=True, color="9C0006")

    fill_skip = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
    font_skip = Font(name="Calibri", size=11, bold=True, color="9C6500")

    center = Alignment(horizontal="center", vertical="center")

    thin_border = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9"),
    )

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center

    for row_data in results:
        ws.append(row_data)
        cur_row = ws.max_row
        status_cell = ws.cell(row=cur_row, column=5)
        status_val = status_cell.value

        if status_val == "PASS":
            status_cell.fill = fill_pass
            status_cell.font = font_pass
        elif status_val == "FAIL":
            status_cell.fill = fill_fail
            status_cell.font = font_fail
        elif status_val == "SKIPPED":
            status_cell.fill = fill_skip
            status_cell.font = font_skip

        for col_i in range(1, len(headers) + 1):
            c = ws.cell(row=cur_row, column=col_i)
            c.border = thin_border
            if col_i in [1, 2, 4, 5]:
                c.alignment = center

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

    try:
        wb.save(output_path)
        print(f"\n[INFO] Output report saved to: {output_path}")
    except PermissionError:
        fallback_path = output_path.replace(".xlsx", "_latest.xlsx")
        wb.save(fallback_path)
        print(f"\n[WARNING] '{output_path}' is currently open in Excel. Saved results to: '{fallback_path}' instead.")


def main():
    print("=" * 75)
    print(" TrashTrack City - Problem 13 Selenium Automation Suite")
    print("=" * 75)

    if not os.path.exists(INPUT_FILE):
        print(f"[FATAL] Input file '{INPUT_FILE}' not found! Run generate_input_excel.py first.")
        sys.exit(1)

    wb_in = openpyxl.load_workbook(INPUT_FILE)
    sheet_in = wb_in.active
    test_rows = list(sheet_in.iter_rows(min_row=2, values_only=True))

    results = []
    smoke_suite_passed = True
    driver = None

    try:
        driver = init_driver(headless=HEADLESS)
        print(f"[INFO] ChromeDriver active (headless={HEADLESS}). Base URL candidate: {DEFAULT_BASE_URL}\n")

        for row in test_rows:
            test_id, module, test_name, action_type, elem_id, input_data, expected_val, is_critical = row
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Circuit breaker: if smoke test failed, skip subsequent tests
            if not smoke_suite_passed:
                print(f"[{test_id}] {test_name} ... SKIPPED (Aborted due to Smoke Test failure)")
                results.append([
                    test_id,
                    module,
                    test_name,
                    action_type,
                    "SKIPPED",
                    "Not executed",
                    "Aborted due to Smoke Test (TC01/TC02) failure",
                    timestamp,
                ])
                continue

            print(f"[{test_id}] {test_name} ...", end=" ", flush=True)

            try:
                status, actual_val, error_detail = execute_test_step(
                    driver, test_id, action_type, elem_id, input_data, str(expected_val)
                )
            except Exception as e:
                import traceback
                status = "FAIL"
                actual_val = "Exception during test"
                error_detail = traceback.format_exc()

            print(status)
            results.append([
                test_id,
                module,
                test_name,
                action_type,
                status,
                actual_val,
                error_detail,
                timestamp,
            ])

            # Check smoke test gate
            if is_critical and status != "PASS":
                print(f"\n[CRITICAL CIRCUIT BREAKER] {test_id} failed: {error_detail}")
                print("[CRITICAL] Halting test suite execution to prevent false cascading failures.\n")
                smoke_suite_passed = False

    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        save_output_excel(results, OUTPUT_FILE)

    print("=" * 75)
    print(" Test Suite Finished.")
    print("=" * 75)


if __name__ == "__main__":
    main()
