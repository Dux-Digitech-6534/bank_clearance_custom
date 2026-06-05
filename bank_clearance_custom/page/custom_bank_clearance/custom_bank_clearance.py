import json

import frappe
from frappe import _
from frappe.utils import flt, getdate

from erpnext.accounts.party import get_party_account
from erpnext.accounts.doctype.bank_clearance.bank_clearance import (
	get_payment_entries_for_bank_clearance,
)


def _as_bool(value):
	if isinstance(value, str):
		return value.lower() in {"1", "true", "yes", "on"}
	return bool(value)


def _parse_entries(entries):
	if isinstance(entries, str):
		return json.loads(entries)
	return entries or []


def _entry_amount(entry):
	return flt(entry.get("debit")) + flt(entry.get("credit"))


def _has_field(doctype, fieldname):
	return frappe.get_meta(doctype).has_field(fieldname)


def _existing_fields(doctype, fields):
	meta = frappe.get_meta(doctype)
	return [field for field in fields if field == "name" or meta.has_field(field)]


def _bank_transaction_amount(transaction):
	return flt(transaction.get("deposit")) + flt(transaction.get("withdrawal"))


def _same_amount(left, right):
	return abs(flt(left) - flt(right)) < 0.005


def _clean(value):
	return (str(value or "")).strip().lower()


def _normalize_entry(entry, index):
	clearance_date = entry.get("clearance_date")
	cheque_date = entry.get("cheque_date")
	posting_date = entry.get("posting_date")
	debit = flt(entry.get("debit"))
	credit = flt(entry.get("credit"))
	payment_document = entry.get("payment_document")

	return {
		"id": f"erp-{index}",
		"row_type": "ERP",
		"source": "ERP Entry",
		"date": str(posting_date) if posting_date else "",
		"type": "Deposit" if debit else "Withdrawal",
		"reference": entry.get("cheque_number") or entry.get("payment_entry") or "",
		"description": entry.get("against_account") or "",
		"deposit": debit,
		"withdrawal": credit,
		"erp_voucher": entry.get("payment_entry") or "",
		"payment_document": payment_document,
		"payment_entry": entry.get("payment_entry"),
		"voucher_type": payment_document,
		"voucher_no": entry.get("payment_entry"),
		"posting_date": str(posting_date) if posting_date else "",
		"party": entry.get("against_account") or "",
		"party_type": "",
		"debit": debit,
		"credit": credit,
		"amount": debit + credit,
		"cheque_no": entry.get("cheque_number") or "",
		"cheque_date": str(cheque_date) if cheque_date else "",
		"clearance_date": str(clearance_date) if clearance_date else "",
		"status": "cleared" if clearance_date else "pending",
		"is_pos": payment_document in {"Sales Invoice", "Purchase Invoice"},
	}


def _get_entries(account, bank_account, from_date, to_date, include_reconciled_entries, include_pos_transactions):
	raw_entries = get_payment_entries_for_bank_clearance(
		from_date,
		to_date,
		account,
		bank_account,
		_as_bool(include_reconciled_entries),
		_as_bool(include_pos_transactions),
	)
	return [_normalize_entry(entry, index) for index, entry in enumerate(raw_entries or [])]


def _get_erp_period_total(account, from_date, to_date):
	totals = frappe.db.sql(
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
	return flt(totals[0]) + flt(totals[1])


def _get_bank_transactions(bank_account, from_date, to_date):
	if not bank_account:
		return []

	fields = _existing_fields(
		"Bank Transaction",
		[
			"name",
			"date",
			"bank_account",
			"deposit",
			"withdrawal",
			"currency",
			"description",
			"reference_number",
			"status",
			"party_type",
			"party",
			"allocated_amount",
			"unallocated_amount",
		],
	)
	filters = {
		"bank_account": bank_account,
		"date": ["between", [from_date, to_date]],
	}
	if _has_field("Bank Transaction", "docstatus"):
		filters["docstatus"] = ["!=", 2]

	return frappe.get_all("Bank Transaction", filters=filters, fields=fields, order_by="date asc, name asc")


def _match_erp_entry(transaction, erp_entries):
	amount = _bank_transaction_amount(transaction)
	date = str(transaction.get("date") or "")
	reference = _clean(transaction.get("reference_number"))
	party = _clean(transaction.get("party"))
	description = _clean(transaction.get("description"))

	for entry in erp_entries:
		if not _same_amount(amount, _entry_amount(entry)):
			continue
		entry_ref = _clean(entry.get("cheque_no") or entry.get("payment_entry") or entry.get("voucher_no"))
		entry_party = _clean(entry.get("party"))
		entry_desc = _clean(entry.get("description") or entry.get("party"))
		if reference and entry_ref and reference == entry_ref:
			return entry
		if date and date in {str(entry.get("posting_date") or ""), str(entry.get("cheque_date") or "")}:
			return entry
		if party and entry_party and (party in entry_party or entry_party in party):
			return entry
		if description and entry_desc and (description in entry_desc or entry_desc in description):
			return entry
	return None


def _normalize_bank_transaction(transaction, index, erp_entries):
	deposit = flt(transaction.get("deposit"))
	withdrawal = flt(transaction.get("withdrawal"))
	matched = _match_erp_entry(transaction, erp_entries)
	status = transaction.get("status") or "Unreconciled"
	if status != "Reconciled" and not matched:
		status = "Missing in ERP"

	return {
		"id": f"bank-{index}",
		"row_type": "Bank Transaction",
		"source": "Bank Transaction",
		"bank_transaction": transaction.get("name"),
		"date": str(transaction.get("date") or ""),
		"type": "Deposit" if deposit else "Withdrawal",
		"reference": transaction.get("reference_number") or transaction.get("name") or "",
		"description": transaction.get("description") or "",
		"deposit": deposit,
		"withdrawal": withdrawal,
		"amount": deposit + withdrawal,
		"erp_voucher": matched.get("payment_entry") if matched else "",
		"payment_document": "",
		"payment_entry": "",
		"voucher_type": "",
		"voucher_no": "",
		"posting_date": str(transaction.get("date") or ""),
		"party": transaction.get("party") or "",
		"party_type": transaction.get("party_type") or "",
		"debit": deposit,
		"credit": withdrawal,
		"cheque_no": transaction.get("reference_number") or "",
		"cheque_date": str(transaction.get("date") or ""),
		"clearance_date": "",
		"status": status,
	}


def _summary_from_bank_transactions(account, from_date, to_date, bank_transactions, entries):
	bank_statement_total = sum(_bank_transaction_amount(transaction) for transaction in bank_transactions)
	reconciled_total = sum(
		_bank_transaction_amount(transaction)
		for transaction in bank_transactions
		if transaction.get("status") == "Reconciled"
	)
	unreconciled_total = bank_statement_total - reconciled_total
	erp_period_total = _get_erp_period_total(account, from_date, to_date)

	return {
		"entry_count": len(entries),
		"bank_statement_total": bank_statement_total,
		"reconciled_total": reconciled_total,
		"unreconciled_total": unreconciled_total,
		"difference_amount": bank_statement_total - reconciled_total,
		"erp_period_total": erp_period_total,
	}


@frappe.whitelist()
def get_companies():
	return frappe.get_all("Company", fields=["name"], order_by="name")


@frappe.whitelist()
def get_account_from_bank_account(bank_account):
	if not bank_account:
		return None
	return frappe.db.get_value("Bank Account", bank_account, "account")


@frappe.whitelist()
def get_bank_account_details(bank_account):
	if not bank_account:
		return {}

	return frappe.db.get_value(
		"Bank Account",
		bank_account,
		["name", "account", "company", "bank", "bank_account_no"],
		as_dict=True,
	) or {}


@frappe.whitelist()
def get_bank_accounts_for_company(company=None):
	filters = {}
	if company:
		filters["company"] = company

	return frappe.get_all(
		"Bank Account",
		filters=filters,
		fields=["name", "account", "bank", "bank_account_no", "company"],
		order_by="name",
	)


@frappe.whitelist()
def get_payment_entries(
	account,
	bank_account=None,
	from_date=None,
	to_date=None,
	include_reconciled_entries=False,
	include_pos_transactions=False,
):
	if not account:
		frappe.throw(_("Account is mandatory to get payment entries"))
	if not from_date or not to_date:
		frappe.throw(_("From Date and To Date are mandatory"))

	entries = _get_entries(
		account,
		bank_account,
		from_date,
		to_date,
		include_reconciled_entries,
		include_pos_transactions,
	)
	bank_transactions = _get_bank_transactions(bank_account, from_date, to_date)
	bank_rows = [
		_normalize_bank_transaction(transaction, index, entries)
		for index, transaction in enumerate(bank_transactions)
	]
	mixed_entries = bank_rows + entries
	return {
		"entries": mixed_entries,
		"summary": _summary_from_bank_transactions(account, from_date, to_date, bank_transactions, mixed_entries),
	}


@frappe.whitelist()
def get_balance_summary(
	account,
	from_date,
	to_date,
	bank_account=None,
	include_reconciled_entries=True,
	include_pos_transactions=True,
):
	entries = _get_entries(
		account,
		bank_account,
		from_date,
		to_date,
		include_reconciled_entries,
		include_pos_transactions,
	)
	bank_transactions = _get_bank_transactions(bank_account, from_date, to_date)
	return _summary_from_bank_transactions(account, from_date, to_date, bank_transactions, entries)


def _set_clearance_date(entry, clearance_date, account=None):
	payment_document = entry.get("payment_document") or entry.get("voucher_type")
	payment_entry = entry.get("payment_entry") or entry.get("voucher_no")
	if not payment_document or not payment_entry:
		return False

	if payment_document == "Sales Invoice":
		if not account:
			frappe.throw(_("Account is required to update Sales Invoice clearance dates"))
		frappe.db.set_value(
			"Sales Invoice Payment",
			{"parent": payment_entry, "account": account, "amount": [">", 0]},
			"clearance_date",
			clearance_date,
		)
	else:
		frappe.db.set_value(payment_document, payment_entry, "clearance_date", clearance_date)
	return True


@frappe.whitelist()
def clear_selected_entries(entries, clearance_date, account=None):
	if not clearance_date:
		frappe.throw(_("Clearance Date is mandatory"))

	updated = 0
	for entry in _parse_entries(entries):
		cheque_date = entry.get("cheque_date")
		if cheque_date and getdate(clearance_date) < getdate(cheque_date):
			frappe.throw(_("Clearance Date cannot be before Cheque Date for {0}").format(entry.get("voucher_no")))
		if _set_clearance_date(entry, clearance_date, account):
			updated += 1

	frappe.db.commit()
	return {"updated": updated, "message": _("{0} entries cleared successfully").format(updated)}


@frappe.whitelist()
def unclear_selected_entries(entries, account=None):
	updated = 0
	for entry in _parse_entries(entries):
		if _set_clearance_date(entry, None, account):
			updated += 1

	frappe.db.commit()
	return {"updated": updated, "message": _("{0} entries uncleared successfully").format(updated)}


@frappe.whitelist()
def create_missing_entry(data):
	if isinstance(data, str):
		data = json.loads(data)
	data = frappe._dict(data or {})

	entry_type = data.get("entry_type")
	transaction_type = data.get("transaction_type")
	amount = flt(data.get("amount"))
	company = data.get("company")
	account = data.get("account")
	posting_date = data.get("posting_date")

	if entry_type not in {"Payment Entry", "Journal Entry"}:
		frappe.throw(_("Entry Type must be Payment Entry or Journal Entry"))
	if transaction_type not in {"Deposit", "Withdrawal"}:
		frappe.throw(_("Transaction Type must be Deposit or Withdrawal"))
	if not amount or not company or not account or not posting_date:
		frappe.throw(_("Posting Date, Amount, Company and Ledger Account are mandatory"))

	if entry_type == "Payment Entry":
		doc = _create_payment_entry(data)
	else:
		doc = _create_journal_entry(data)

	frappe.db.commit()
	return {
		"doctype": doc.doctype,
		"name": doc.name,
		"message": _("{0} {1} created as Draft").format(doc.doctype, doc.name),
	}


def _create_payment_entry(data):
	party_type = data.get("party_type")
	party = data.get("party")
	if not party_type or not party:
		frappe.throw(_("Party Type and Party are required for Payment Entry. Use Journal Entry for charges, interest or adjustments."))

	party_account = get_party_account(party_type, party, data.company)
	doc = frappe.new_doc("Payment Entry")
	doc.company = data.company
	doc.posting_date = data.posting_date
	doc.payment_type = "Receive" if data.transaction_type == "Deposit" else "Pay"
	doc.party_type = party_type
	doc.party = party
	doc.paid_amount = flt(data.amount)
	doc.received_amount = flt(data.amount)
	doc.reference_no = data.get("reference_number") or data.get("bank_transaction") or "Bank Transaction"
	doc.reference_date = data.get("reference_date") or data.posting_date
	doc.remarks = data.get("remarks") or _("Created from Bank Transaction")

	if data.transaction_type == "Deposit":
		doc.paid_from = party_account
		doc.paid_to = data.account
	else:
		doc.paid_from = data.account
		doc.paid_to = party_account

	doc.insert()
	return doc


def _create_journal_entry(data):
	offset_account = data.get("offset_account")
	if not offset_account:
		frappe.throw(_("Adjustment Account is required for Journal Entry"))

	doc = frappe.new_doc("Journal Entry")
	doc.company = data.company
	doc.posting_date = data.posting_date
	doc.voucher_type = "Bank Entry"
	doc.cheque_no = data.get("reference_number")
	doc.cheque_date = data.get("reference_date") or data.posting_date
	doc.user_remark = data.get("remarks") or _("Created from Bank Transaction")

	if data.transaction_type == "Deposit":
		doc.append("accounts", {"account": data.account, "debit_in_account_currency": flt(data.amount)})
		doc.append("accounts", {"account": offset_account, "credit_in_account_currency": flt(data.amount)})
	else:
		doc.append("accounts", {"account": offset_account, "debit_in_account_currency": flt(data.amount)})
		doc.append("accounts", {"account": data.account, "credit_in_account_currency": flt(data.amount)})

	doc.insert()
	return doc
