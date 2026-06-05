# Custom New Bank Clearance Functionality

## Page

Route: `/app/custom-new-bank-clearance`

This page is a custom Bank Clearance page for selecting a company, linked ledger account, bank account, and date range, then fetching ERPNext bank clearance entries.

## Filter Flow

1. Company
   - Loaded dynamically from ERPNext `Company`.

2. Ledger Account / Account
   - Loaded after Company is selected.
   - Values come from `Bank Account.account` records linked to the selected Company.

3. Bank Account
   - Loaded after Ledger Account / Account is selected.
   - Values come from `Bank Account` records matching the selected Company and Account.

4. From Date / To Date
   - Defaults to the current month.
   - Used to fetch ERP entries for the selected account and period.

## Summary Cards

| Card | Meaning |
|---|---|
| ERP Period Total | Sum of GL Entry debit + credit for selected Account and date range. |
| Actual Bank Balance | Bank statement amount from fetched rows by default. User can manually enter actual bank balance if needed. |
| Reconciled Total | Total amount of entries already reconciled. |
| Difference Amount | Actual Bank Balance minus ERP Period Total. |
| Total Entries | Number of fetched entries in selected date range. |

## Table Columns

| Column | Meaning |
|---|---|
| Checkbox | Select row for bulk clearance date update or unclear action. |
| Date | Posting date of ERP/bank clearance row. |
| Type | Receipt or Payment based on deposit/withdrawal. |
| Description | Against account or transaction description. |
| Deposit | Money received into the bank account. |
| Withdrawal | Money paid from the bank account. |
| ERP Voucher | ERPNext voucher number, such as Payment Entry or Journal Entry. |
| Status | Pending, Date Set, Reconciled, or POS. |
| Clearance Date | Date to mark the selected ERP row as cleared. |
| Action | Reserved for row-level actions. |

## Buttons

| Button | Status | What It Does |
|---|---|---|
| Get Entries | Working | Fetches real ERPNext bank clearance entries for selected Company, Account, Bank Account, and dates. |
| Update Clearance Date | Front-end only on this new page | Applies the selected bulk clearance date to selected rows in the current table state. |
| Finalize Session | Front-end only on this new page | Marks date-set rows as reconciled after no pending rows remain. |
| Export CSV | Working | Exports currently visible rows to CSV. |
| Unclear Selected | Front-end only on this new page | Clears selected rows that are not already reconciled. |
| Clear Filters | Working | Clears search/tabs/toggles and resets table filtering. |
| All / Pending / Date Set / Reconciled / POS | Working | Filters visible rows by status/source. |

## Why Entries May Not Appear

Entries will not appear if:

- Company is not selected.
- Ledger Account / Account is not selected.
- Bank Account is not selected.
- Date range does not include matching ERP entries.
- The selected account has no Payment Entry, Journal Entry, Sales Invoice, or Purchase Invoice bank clearance rows in that period.
- Include Reconciled Entries is off and all matching rows are already reconciled.
- Include POS Transactions is off and matching rows are POS-related.

## Current Restriction

This new page fetches real entries, but some clearance actions remain front-end only unless backend save/update methods are added later. The existing old custom page still has the more complete backend clearance update behavior.
