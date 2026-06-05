# Custom Bank Clearance Functionality

## Purpose

This page helps compare ERP bank ledger entries with imported Bank Transactions, mark ERP entries as cleared, and identify bank transactions that are missing in ERP.

## Basic Flow

1. Select Company.
2. Select Bank Account.
3. The linked Ledger Account / Account fills automatically from the selected Bank Account.
4. Enter From Date and To Date in `dd/mm/yyyy` format.
5. Click Get Entries.
6. Review rows, set Clearance Date where required, and click Update Clearance Date.

After update, the page fetches fresh data again so the latest status and totals are shown.

## Filters

Company:
Limits Bank Account options to the selected company.

Bank Account:
Selects the bank statement source. Only Bank Transactions for this Bank Account are shown.

Ledger Account / Account:
Comes from the selected Bank Account master. ERP GL and payment data are calculated using this account.

From Date / To Date:
Defines the transaction period. The user sees dates as `dd/mm/yyyy`; internally the app sends server dates as `yyyy-mm-dd`.

Include Reconciled Entries:
Includes already reconciled/cleared rows in the result.

Include POS Transactions:
Includes POS-related payment rows when fetching ERP clearance entries.

## Summary Cards

ERP Period Total:
Total debit plus credit from GL Entry for the selected Ledger Account within the selected date range. This shows ERP movement for the period.

Bank Statement Total:
Total deposit plus withdrawal from Bank Transaction for the selected Bank Account and date range. This shows statement movement imported from the bank.

Reconciled Total:
Total Bank Transaction amount whose status is Reconciled.

Difference Amount:
Bank Statement Total minus Reconciled Total. This indicates unreconciled statement value.

Total Entries:
Total number of rows returned in the table for the selected filters.

## Table Columns

Checkbox:
Used to select ERP rows for bulk clearance actions. Non-ERP rows are disabled because they cannot be directly cleared from this table.

Date:
Shows transaction/posting date in `dd/mm/yyyy` format.

Type:
Shows whether the row is a Deposit or Withdrawal. It also shows the row source below the badge, such as ERP or Bank Transaction.

Description:
Shows narration, party, or transaction description. This helps identify the entry without needing a separate reference column.

Deposit:
Incoming amount. Displayed as rupee symbol and amount on one line.

Withdrawal:
Outgoing amount. Displayed as rupee symbol and amount on one line.

ERP Voucher:
Shows the linked ERP voucher when available. Clicking it opens the voucher.

Status:
Shows whether the row is Cleared, Reconciled, Pending, Unreconciled, or Missing in ERP.

Clearance Date:
For ERP rows, enter the date in `dd/mm/yyyy` format. This is converted internally before saving.

Action:
Shows Create Entry only for Bank Transactions that are missing in ERP.

## Buttons

Get Entries:
Fetches table rows and recalculates cards for the selected filters.

Update Clearance Date:
Saves clearance dates for ERP rows that have a Clearance Date, then refreshes the page data.

Export CSV:
Exports the current filtered table data.

Unclear Selected:
Removes clearance date from selected ERP rows, then refreshes page data.

Clear Filters:
Clears search and resets status filter to All.

## Pagination

Pagination is hidden when there are 50 or fewer rows. If more than 50 rows are shown, page buttons appear automatically.

## Notes

- Bank Account must have a linked Ledger Account / Account.
- No migration, no bench build, and no bench restart are required for these page-level UI updates.
- If old design appears, hard refresh the browser using `Ctrl + Shift + R`.
