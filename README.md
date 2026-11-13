# TrashTrack City - Automated Selenium Testing (Problem 13)

Automated test framework using **Selenium WebDriver**, **Python**, and **openpyxl** for Problem 13: **Browser Alerts, Prompt Dialogs, and Embedded IFrames**.

---

## 1. Test Cases Overview

The test cases are read from [`test_cases_input.xlsx`](file:///e:/TrashTrack_City/TrashTrack_City/test_cases_input.xlsx) and recorded to [`test_cases_output.xlsx`](file:///e:/TrashTrack_City/TrashTrack_City/test_cases_output.xlsx).

| Test ID | Module | Test Name | Description & Actions | Expected Result | Fail-Fast Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01** | **Smoke** | Enter Site Main Page | Check if frontend is accessible and `#root` renders. | Document title contains `"TrashTrack City"`. | **Critical:** If FAIL, abort subsequent tests. |
| **TC02** | **Smoke** | Resident Login Check | Authenticate resident using `res1@gmail.com` / `flower`. | Redirects to resident dashboard `/` with user session. | **Critical:** If FAIL, abort subsequent tests. |
| **TC03** | **Alert** | Submit Empty Report Form | Click submit on New Report with empty title. | Native JS alert pops up with text: `"Title Missing"`. | Normal |
| **TC04** | **Confirm** | Submit Proper Report Form | Fill title, category, description, smell, and waste spread area; click submit. | Native JS confirm pops up with text: `"Confirm Report Submission?"`. | Normal |
| **TC05** | **IFrame** | Assert Full Name Input in IFrame | Switch into `#city-survey-iframe` using `driver.switch_to.frame()`. | Finds `#survey-resident-name` input box with label `"Resident Full Name:"`. | Normal |
| **TC06** | **IFrame** | Assert Overall Collection Satisfaction | Inspect `#survey-rating` dropdown inside `#city-survey-iframe`. | Finds 5 options representing 1 to 5 stars (`['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']`). | Normal |
| **TC07** | **Alert** | Submit Survey Without Name | Inside iframe, leave full name empty and click submit. | Native JS alert pops up with text: `"Full Name Missing"`. | Normal |
| **TC08** | **Confirm** | Submit Survey & Confirm Review | Fill survey form inside iframe and click submit. | Native JS confirm pops up with text: `"Confirm Review?"`. | Normal |
| **TC09** | **Prompt** | Edit Profile Password Prompt | On `/profile`, click Save Changes. | Native JS prompt pops up with text: `"Please enter your old password:"`. | Normal |

---

## 2. Prerequisites & Setup

Ensure the required Python libraries are installed:
```bash
pip install selenium openpyxl pandas
```

---

## 3. Running the Tests

### Step 1: Start the Backend & Frontend Servers
* **Terminal 1 (Backend):**
  ```bash
  cd backend
  npm run dev
  ```
* **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```

### Step 2: (Optional) Re-Generate the Input Excel File
The input file [`test_cases_input.xlsx`](file:///e:/TrashTrack_City/TrashTrack_City/test_cases_input.xlsx) is pre-generated. To re-generate it at any time:
```bash
python generate_input_excel.py
```

### Step 3: Run the Selenium Test Suite
* **Interactive Mode** (Watch Chrome execute and handle dialogs & iframes visually):
  ```bash
  python stm_excel_example.py
  ```
* **Headless Mode** (Fast, background execution):
  ```bash
  python stm_excel_example.py --headless
  ```
* **One-Click PowerShell Runner** (Automatically starts backend & frontend, runs tests, and cleans up):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\run_tests.ps1
  ```

---

## 4. Viewing the Output Report

Open [`test_cases_output.xlsx`](file:///e:/TrashTrack_City/TrashTrack_City/test_cases_output.xlsx) in Excel or LibreOffice Calc:
* **Status Badges:** Color-coded `PASS` (green), `FAIL` (red), and `SKIPPED` (yellow).
* **Actual Values:** Captured message strings from alerts, confirms, prompts, and the iframe DOM.
* **Timestamps:** Exact time of execution for each test case.
