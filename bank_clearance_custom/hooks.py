app_name = "bank_clearance_custom"
app_title = "Bank Clearance Custom"
app_publisher = "Custom"
app_description = "Custom Bank Clearance Dashboard for ERPNext v15"
app_email = "admin@example.com"
app_license = "mit"

doc_events = {
	"Payment Entry": {
		"before_cancel": "bank_clearance_custom.reconciliation_guard.prevent_reconciled_cancel_or_delete",
		"before_trash": "bank_clearance_custom.reconciliation_guard.prevent_reconciled_cancel_or_delete",
	},
	"Journal Entry": {
		"before_cancel": "bank_clearance_custom.reconciliation_guard.prevent_reconciled_cancel_or_delete",
		"before_trash": "bank_clearance_custom.reconciliation_guard.prevent_reconciled_cancel_or_delete",
	},
}
