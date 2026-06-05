import frappe
from frappe.utils import flt
import json

from erpnext.accounts.doctype.bank_clearance.bank_clearance import (
	get_payment_entries_for_bank_clearance,
)


@frappe.whitelist()
def get_companies():
	return frappe.get_all("Company", fields=["name"], order_by="name")


@frappe.whitelist()
def get_accounts_for_company(company):
	if not company:
		return []

	rows = frappe.get_all(
		"Bank Account",
		filters={"company": company, "account": ["is", "set"]},
		fields=["account"],
		order_by="account",
	)
	seen = set()
	accounts = []
	for row in rows:
		account = row.get("account")
		if account and account not in seen:
			seen.add(account)
			accounts.append({"account": account})
	return accounts


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


def _erp_period_total(account, from_date, to_date):
	result = frappe.db.sql(
		"""
		select
			sum(debit_in_account_currency),
			sum(credit_in_account_currency)
		from `tabGL Entry`
		where account = %s
			and posting_date between %s and %s
			and is_cancelled = 0
		""",
		(account, from_date, to_date),
	)[0]
	return flt(result[0]) + flt(result[1])


def _normalize_entry(row, index):
	deposit = flt(row.get("debit"))
	withdrawal = flt(row.get("credit"))
	clearance = row.get("clearance_date")
	payment_document = row.get("payment_document") or ""
	voucher = row.get("payment_entry") or ""
	source = "POS" if payment_document in {"Sales Invoice", "Purchase Invoice"} else "ERP Entry"

	return {
		"id": index + 1,
		"date": str(row.get("posting_date") or ""),
		"type": "Receipt" if deposit else "Payment",
		"description": row.get("against_account") or voucher or payment_document,
		"deposit": deposit,
		"withdrawal": withdrawal,
		"voucher": voucher,
		"payment_document": payment_document,
		"status": "reconciled" if clearance else "pending",
		"source": source,
		"clearance": str(clearance) if clearance else "",
	}


@frappe.whitelist()
def get_entries(account, bank_account, from_date, to_date, include_reconciled=False, include_pos=False):
	if not account:
		frappe.throw("Account is required")
	if not from_date or not to_date:
		frappe.throw("From Date and To Date are required")

	raw_entries = get_payment_entries_for_bank_clearance(
		from_date,
		to_date,
		account,
		bank_account,
		_as_bool(include_reconciled),
		_as_bool(include_pos),
	)
	entries = [_normalize_entry(row, index) for index, row in enumerate(raw_entries or [])]
	statement_total = sum(flt(row.get("deposit")) + flt(row.get("withdrawal")) for row in entries)
	reconciled_total = sum(
		flt(row.get("deposit")) + flt(row.get("withdrawal"))
		for row in entries
		if row.get("status") == "reconciled"
	)
	erp_total = _erp_period_total(account, from_date, to_date)

	return {
		"entries": entries,
		"summary": {
			"erp_period_total": erp_total,
			"actual_bank_balance": statement_total,
			"reconciled_total": reconciled_total,
			"difference_amount": statement_total - erp_total,
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

	clearance_date = entries[0].get("clearance_date") or entries[0].get("clearance")
	if not clearance_date:
		frappe.throw("Clearance Date is mandatory")

	from bank_clearance_custom.bank_clearance_custom.page.custom_bank_clearance.custom_bank_clearance import (
		clear_selected_entries,
	)

	for row in entries:
		row["payment_document"] = row.get("payment_document") or row.get("voucher_type")
		row["payment_entry"] = row.get("payment_entry") or row.get("voucher_no") or row.get("voucher")

	return clear_selected_entries(entries, clearance_date, account)
