from datetime import datetime

import frappe
from frappe.utils import flt, add_days, getdate
import json

from erpnext.accounts.doctype.bank_clearance.bank_clearance import (
	get_payment_entries_for_bank_clearance,
)
from erpnext.accounts.report.general_ledger.general_ledger import (
    execute as execute_general_ledger,
)


@frappe.whitelist()
def get_companies():
	return frappe.get_all("Company", fields=["name"], order_by="name")


@frappe.whitelist()
def get_accounts_for_company(company):
	if not company:
		return []

	return frappe.get_all(
		"Account",
		filters={
			"company": company,
			"is_group": 0,
			"account_type": ["in", ["Bank", "Cash"]],
		},
		fields=["name as account"],
		order_by="name",
	)


@frappe.whitelist()
def get_bank_accounts_for_account(company, account):
	if not company or not account:
		return []

	return frappe.get_all(
		"Bank Account",
		filters={"company": company, "account": account},
		fields=["name", "bank", "bank_account_no", "account"],
		order_by="name",
	)


def _as_bool(value):
	if isinstance(value, str):
		return value.lower() in {"1", "true", "yes", "on"}
	return bool(value)


def _parse_posting_date(value):
	if not value:
		return None

	text = str(value).strip()
	for date_format in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
		try:
			return datetime.strptime(text, date_format).date()
		except ValueError:
			pass

	return getdate(value)


def _server_date(value):
	parsed_date = _parse_posting_date(value)
	return parsed_date.isoformat() if parsed_date else ""


def _is_opening_journal_entry(payment_document, payment_entry):
	if payment_document != "Journal Entry" or not payment_entry:
		return False

	return frappe.db.get_value("Journal Entry", payment_entry, "voucher_type") == "Opening Entry"


def _get_reference_no_from_voucher(payment_document, payment_entry):
	"""
	Fetch Cheque/Reference No from actual voucher document.

	ERPNext Bank Clearance helper does not always return reference_no,
	so we read it directly from Payment Entry / Journal Entry / other voucher.
	"""
	if not payment_document or not payment_entry:
		return ""

	if not frappe.db.exists(payment_document, payment_entry):
		return ""

	meta = frappe.get_meta(payment_document)

	possible_fields = [
		"reference_no",
		"cheque_no",
		"cheque_number",
		"cheque_reference_no",
		"ref_no",
	]

	for fieldname in possible_fields:
		if meta.has_field(fieldname):
			value = frappe.db.get_value(payment_document, payment_entry, fieldname)
			if value:
				return value

	return ""


def _get_latest_opening_entry(account, company, from_date):
	rows = frappe.db.sql(
		"""
		select
			je.name,
			je.posting_date,
			sum(jea.debit_in_account_currency) - sum(jea.credit_in_account_currency) as amount
		from `tabJournal Entry` je
		inner join `tabJournal Entry Account` jea on jea.parent = je.name
		where je.docstatus = 1
			and je.company = %s
			and je.voucher_type = 'Opening Entry'
			and je.posting_date <= %s
			and jea.account = %s
		group by je.name, je.posting_date
		order by je.posting_date desc, je.name desc
		limit 1
		""",
		(company, from_date, account),
		as_dict=True,
	)

	if not rows:
		return {
			"name": "",
			"posting_date": from_date,
			"amount": 0,
		}

	return {
		"name": rows[0].name,
		"posting_date": rows[0].posting_date,
		"amount": flt(rows[0].amount),
	}


def _get_reconciled_movement_after_opening(account, bank_account, opening_date, from_date):
	movement_to_date = add_days(from_date, -1)

	if getdate(movement_to_date) < getdate(opening_date):
		return 0

	rows = get_payment_entries_for_bank_clearance(
		opening_date,
		movement_to_date,
		account,
		bank_account,
		True,
		True,
	)

	total = 0

	for row in rows or []:
		payment_document = row.get("payment_document") or ""
		payment_entry = row.get("payment_entry") or ""

		if _is_opening_journal_entry(payment_document, payment_entry):
			continue

		if row.get("clearance_date"):
			total += flt(row.get("debit")) - flt(row.get("credit"))

	return total


# def _get_opening_balance(account, company, bank_account, from_date):
# 	opening = _get_latest_opening_entry(account, company, from_date)

# 	base_opening = flt(opening.get("amount"))
# 	opening_date = opening.get("posting_date")

# 	reconciled_movement = _get_reconciled_movement_after_opening(
# 		account,
# 		bank_account,
# 		opening_date,
# 		from_date,
# 	)

# 	return base_opening + reconciled_movement

# def _get_opening_balance(account, company, bank_account, from_date):
# 	balance = frappe.db.sql(
# 		"""
# 		select sum(debit) - sum(credit)
# 		from `tabGL Entry`
# 		where is_cancelled = 0
# 			and company = %(company)s
# 			and account = %(account)s
# 			and posting_date <= %(from_date)s
# 			and (posting_date < %(from_date)s or is_opening = 'Yes')
# 		""",
# 		{"company": company, "account": account, "from_date": from_date},
# 	)
# 	return flt(balance[0][0]) if balance else 0

def _get_bank_calculated_opening(account, company, from_date):
    """
    Existing Bank Clearance calculation.
    Only used as fallback if General Ledger report cannot be executed.
    """

    balance = frappe.db.sql(
        """
        select
            coalesce(sum(debit), 0) - coalesce(sum(credit), 0)
        from `tabGL Entry`
        where is_cancelled = 0
            and company = %(company)s
            and account = %(account)s
            and posting_date <= %(from_date)s
            and (
                posting_date < %(from_date)s
                or is_opening = 'Yes'
            )
        """,
        {
            "company": company,
            "account": account,
            "from_date": from_date,
        },
    )

    if not balance or balance[0][0] is None:
        return 0

    return flt(balance[0][0])


def _get_gl_report_opening(account, company, from_date, to_date):
    """
    Get the Opening Balance exactly from ERPNext General Ledger report logic.

    GL is the source of truth:
    if GL Opening is 0, this function returns 0.
    """

    filters = frappe._dict(
        {
            "company": company,
            "from_date": _server_date(from_date),
            "to_date": _server_date(to_date or from_date),

            # Same selected ledger account
            "account": [account],

            # Same default behaviour as General Ledger UI
            "categorize_by": "Categorize by Voucher (Consolidated)",
            "include_default_book_entries": 1,

            # Keep opening entries inside GL Opening calculation
            "show_opening_entries": 0,
            "disable_opening_balance_calculation": 0,

            # Normal GL defaults
            "show_cancelled_entries": 0,
            "finance_book": None,
        }
    )

    columns, data = execute_general_ledger(filters)

    if not data:
        return None

    # General Ledger creates Opening as the first summary row.
    opening_row = data[0]

    opening_debit = flt(opening_row.get("debit"))
    opening_credit = flt(opening_row.get("credit"))

    return opening_debit - opening_credit


def _get_opening_balance(
    account,
    company,
    bank_account,
    from_date,
    to_date=None,
):
    """
    Final Opening Balance rule:

    1. Check General Ledger opening.
    2. If GL returns a value, use it even when value is 0.
    3. Use old Bank Clearance calculation only if GL calculation fails.
    """

    fallback_balance = _get_bank_calculated_opening(
        account,
        company,
        from_date,
    )

    try:
        gl_balance = _get_gl_report_opening(
            account,
            company,
            from_date,
            to_date or from_date,
        )

        # IMPORTANT:
        # 0 is a valid opening balance.
        #
        # Do NOT use:
        # if gl_balance:
        #
        # because 0 would be treated as False.
        if gl_balance is not None:
            return flt(gl_balance)

    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Bank Clearance - GL Opening Balance",
        )

    # Only if GL report fails completely
    return flt(fallback_balance)


def _make_opening_balance_row(account, company, bank_account, from_date):
	opening_balance = _get_opening_balance(account, company, bank_account, from_date)

	return {
		"is_opening_entry": 1,
		"posting_date": from_date,
		"debit": opening_balance if opening_balance > 0 else 0,
		"credit": abs(opening_balance) if opening_balance < 0 else 0,
		"payment_document": "",
		"payment_entry": "",
		"reference_no": "",
		"cheque_no": "",
		"clearance_date": None,
		"source": "Balance B/F",
	}


def _normalize_entry(row, index):
	deposit = flt(row.get("debit"))
	withdrawal = flt(row.get("credit"))
	clearance = row.get("clearance_date")
	payment_document = row.get("payment_document") or ""
	voucher = row.get("payment_entry") or ""
	is_opening_entry = bool(row.get("is_opening_entry"))

	reference_no = (
		row.get("reference_no")
		or row.get("cheque_no")
		or row.get("cheque_number")
		or row.get("cheque_reference_no")
		or row.get("ref_no")
		or _get_reference_no_from_voucher(payment_document, voucher)
		or ""
	)

	if is_opening_entry:
		return {
			"id": index + 1,
			"date": str(row.get("posting_date") or ""),
			"type": "Debit" if deposit else "Credit",
			"description": "B/F Opening Bank Balance",
			"reference_no": "",
			"cheque_no": "",
			"deposit": deposit,
			"withdrawal": withdrawal,
			"voucher": "",
			"payment_document": "",
			"status": "balance_only",
			"source": "Balance B/F",
			"clearance": "",
			"is_opening_entry": 1,
		}

	source = "POS" if payment_document in {"Sales Invoice", "Purchase Invoice"} else "ERP Entry"

	return {
		"id": index + 1,
		"date": str(row.get("posting_date") or ""),
		"type": "Deposit" if deposit else "Withdrawal",
		"description": row.get("against_account") or voucher or payment_document,
		"reference_no": reference_no,
		"cheque_no": reference_no,
		"deposit": deposit,
		"withdrawal": withdrawal,
		"voucher": voucher,
		"payment_document": payment_document,
		"status": "reconciled" if clearance else "pending",
		"source": source,
		"clearance": str(clearance) if clearance else "",
		"is_opening_entry": 0,
	}


@frappe.whitelist()
def get_entries(
	account,
	bank_account=None,
	from_date=None,
	to_date=None,
	include_reconciled=False,
	include_pos=False,
	company=None,
):
	if not account:
		frappe.throw("Account is required")

	if not from_date or not to_date:
		frappe.throw("From Date and To Date are required")

	if getdate(to_date) < getdate(from_date):
		frappe.throw("To Date cannot be before From Date.")

	if not company:
		company = frappe.db.get_value("Account", account, "company")

	raw_entries = get_payment_entries_for_bank_clearance(
		from_date,
		to_date,
		account,
		bank_account,
		_as_bool(include_reconciled),
		_as_bool(include_pos),
	)

	opening_row = _make_opening_balance_row(account, company, bank_account, from_date)

	all_entries = [opening_row] + list(raw_entries or [])
	entries = [_normalize_entry(row, index) for index, row in enumerate(all_entries)]

	real_entries = [row for row in entries if not row.get("is_opening_entry")]

	total_deposit = sum(flt(row.get("deposit")) for row in real_entries)
	total_withdrawal = sum(flt(row.get("withdrawal")) for row in real_entries)

	reconciled_deposit = sum(
		flt(row.get("deposit"))
		for row in real_entries
		if row.get("status") == "reconciled"
	)

	reconciled_withdrawal = sum(
		flt(row.get("withdrawal"))
		for row in real_entries
		if row.get("status") == "reconciled"
	)

	opening_balance = flt(opening_row.get("debit")) - flt(opening_row.get("credit"))
	reconciled_total = opening_balance + reconciled_deposit - reconciled_withdrawal

	return {
		"entries": entries,
		"summary": {
			"opening_balance": opening_balance,
			"total_deposit": total_deposit,
			"total_withdrawal": total_withdrawal,
			"reconciled_deposit": reconciled_deposit,
			"reconciled_withdrawal": reconciled_withdrawal,
			"reconciled_total": reconciled_total,
			"entry_count": len(entries),
		},
	}


@frappe.whitelist()
def update_gl_clearance_dates(company, account, entries):
	if not account:
		frappe.throw("Account is required")

	if isinstance(entries, str):
		entries = json.loads(entries)

	if not entries:
		frappe.throw("No entries selected")

	safe_entries = []

	for row in entries:
		payment_document = row.get("payment_document") or row.get("voucher_type")
		payment_entry = row.get("payment_entry") or row.get("voucher_no") or row.get("voucher")
		reference_no = row.get("reference_no") or row.get("cheque_no") or ""

		if row.get("is_opening_entry"):
			continue

		if _is_opening_journal_entry(payment_document, payment_entry):
			continue

		row["payment_document"] = payment_document
		row["payment_entry"] = payment_entry
		row["reference_no"] = reference_no
		row["cheque_no"] = reference_no
		safe_entries.append(row)

	if not safe_entries:
		frappe.throw("No valid entries selected for reconciliation. Opening row cannot be reconciled.")

	entries_by_clearance_date = {}

	for row in safe_entries:
		clearance_date = row.get("clearance_date") or row.get("clearance")
		if not clearance_date:
			frappe.throw("Clearance Date is mandatory")

		posting_date = row.get("posting_date") or row.get("date")
		parsed_clearance_date = _parse_posting_date(clearance_date)
		parsed_posting_date = _parse_posting_date(posting_date) if posting_date else None

		if parsed_posting_date and parsed_clearance_date < parsed_posting_date:
			frappe.throw("Clearance Date cannot be before Posting Date.")

		server_clearance_date = parsed_clearance_date.isoformat()
		row["clearance_date"] = server_clearance_date
		entries_by_clearance_date.setdefault(server_clearance_date, []).append(row)

	from bank_clearance_custom.bank_clearance_custom.page.custom_bank_clearance.custom_bank_clearance import (
		clear_selected_entries,
	)

	updated = 0
	for clearance_date, rows in entries_by_clearance_date.items():
		result = clear_selected_entries(rows, clearance_date, account)
		updated += result.get("updated", 0) if isinstance(result, dict) else 0

	return {"updated": updated, "message": "{0} entries cleared successfully".format(updated)}


@frappe.whitelist()
def unreconcile_entries(entries):
	if isinstance(entries, str):
		entries = json.loads(entries)

	if not entries:
		frappe.throw("No entries selected")

	updated = 0

	for row in entries:
		payment_document = row.get("payment_document") or row.get("voucher_type")
		payment_entry = row.get("payment_entry") or row.get("voucher_no") or row.get("voucher")

		if not payment_document or not payment_entry:
			continue

		if row.get("is_opening_entry"):
			continue

		if _is_opening_journal_entry(payment_document, payment_entry):
			continue

		if not frappe.db.exists(payment_document, payment_entry):
			continue

		if frappe.get_meta(payment_document).has_field("clearance_date"):
			frappe.db.set_value(payment_document, payment_entry, "clearance_date", None)
			updated += 1

	frappe.db.commit()

	return {
		"message": f"{updated} entr{'y' if updated == 1 else 'ies'} unreconciled successfully."
	}