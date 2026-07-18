import frappe


RECONCILED_ENTRY_MESSAGE = (
	"This entry is already reconciled. Please unreconcile it from Bank Clearance "
	"before cancelling or deleting."
)


def prevent_reconciled_cancel_or_delete(doc, method=None):
	if doc.get("clearance_date"):
		frappe.throw(RECONCILED_ENTRY_MESSAGE)
