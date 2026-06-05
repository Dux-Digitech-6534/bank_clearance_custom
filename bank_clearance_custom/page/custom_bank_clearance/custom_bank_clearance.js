frappe.pages["custom-bank-clearance"].on_page_load = function (wrapper) {
	new CustomBankClearance(wrapper);
};

class CustomBankClearance {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Bank Clearance"),
			single_column: true,
		});
		this.prepare_frappe_frame();
		this.method =
			"bank_clearance_custom.page.custom_bank_clearance.custom_bank_clearance.";
		this.entries = [];
		this.filtered = [];
		this.selected = {};
		this.current_filter = "all";
		this.render();
		this.bind();
		this.load_defaults();
	}

	prepare_frappe_frame() {
		const $wrapper = $(this.wrapper);
		$wrapper.closest(".page-container").find(".page-head").hide();
		$wrapper.closest(".layout-main-section-wrapper").css({ width: "100%", maxWidth: "none" });
		$wrapper.closest(".layout-main-section").css({ padding: 0 });
		this.page.main.css({ margin: 0, padding: 0 });
	}

	icon(name) {
		const icons = {
			check: '<path d="M20 6 9 17l-5-5"></path>',
			"check-double": '<path d="m3 12 3 3 6-6"></path><path d="m11 12 3 3 7-7"></path>',
			sliders: '<path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><path d="M2 14h4"></path><path d="M10 8h4"></path><path d="M18 16h4"></path>',
			refresh: '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12a9 9 0 0 1 15.74-6.26L21 8"></path><path d="M16 8h5V3"></path>',
			download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path>',
			x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
			"x-circle": '<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>',
			bank: '<path d="m3 21 18 0"></path><path d="M5 21V10"></path><path d="M19 21V10"></path><path d="M9 21V10"></path><path d="M15 21V10"></path><path d="M3 10h18"></path><path d="m12 3 9 7H3z"></path>',
			circle: '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>',
			clock: '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
			alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
			calculator: '<rect width="16" height="20" x="4" y="2" rx="2"></rect><path d="M8 6h8"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>',
			list: '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
		};
		const key = String(name || "").replace("fa-", "");
		return `<svg class="bc-svg" viewBox="0 0 24 24" aria-hidden="true">${icons[key] || icons.circle}</svg>`;
	}

	render() {
		this.page.main.html(`
			<style>
				.bc-page{--bg:#F8FAFC;--surface:#fff;--muted:#F8FAFC;--line:#E5E7EB;--line2:#D1D5DB;--text:#1F2937;--text2:#374151;--text3:#6B7280;--blue:#4A7FA5;--blue2:rgba(74,127,165,.12);--green:#4A8C6E;--green2:rgba(74,140,110,.12);--amber:#A07840;--amber2:rgba(160,120,64,.12);--red:#9E4A4A;--red2:rgba(158,74,74,.12);--violet:#6F5BA7;--violet2:rgba(111,91,167,.12);background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.5;margin:0;padding:6px 24px 28px;min-height:calc(100vh - 44px)}
				.bc-svg{width:14px;height:14px;display:inline-block;vertical-align:-2px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
				.bc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:26px}.bc-title{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:600;letter-spacing:0}.bc-title-icon{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--blue);color:#fff;font-size:12px}.bc-sub{margin-top:5px;color:var(--text3);font-size:13px}.bc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
				.bc-btn{height:34px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--text2);font-weight:500;font-size:13px;padding:0 14px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;font-family:inherit}.bc-btn:hover{background:var(--muted);border-color:var(--line2);color:var(--text)}.bc-primary{background:var(--blue);border-color:var(--blue);color:#fff}.bc-primary:hover{background:#3f6f91;color:#fff}.bc-success{background:var(--green);border-color:var(--green);color:#fff}.bc-success:hover{background:#3f795f;color:#fff}.bc-warn{background:var(--amber2);border-color:rgba(160,120,64,.28);color:var(--amber)}
				.bc-panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)}.bc-filter-panel{padding:20px;margin-bottom:16px}.bc-panel-title{display:flex;align-items:center;gap:8px;color:var(--text2);font-size:13px;font-weight:600;letter-spacing:.03em;margin-bottom:16px}.bc-filter-grid{display:grid;grid-template-columns:200px 210px 200px 150px 150px;gap:14px;align-items:end}.bc-field label{display:block;color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.bc-field input,.bc-field select{width:100%;height:35px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:0 11px;color:var(--text);font-size:13px;outline:none;font-family:inherit}.bc-field input:focus,.bc-field select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(74,127,165,.14)}.bc-field input[readonly]{background:#fff;color:var(--text2);border-style:solid}.bc-hidden-account{display:none}.bc-toggles{display:flex;gap:24px;border-top:1px solid var(--line);margin-top:16px;padding-top:16px;flex-wrap:wrap}.bc-toggle{display:inline-flex;align-items:center;gap:8px;color:var(--text2);font-size:13px;cursor:pointer}.bc-toggle input{appearance:none;width:36px;height:20px;background:var(--line);border-radius:999px;position:relative;cursor:pointer;transition:.2s}.bc-toggle input:before{content:"";position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;left:2px;top:2px;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:.2s}.bc-toggle input:checked{background:var(--blue)}.bc-toggle input:checked:before{left:18px}
				.bc-kpis{display:grid;grid-template-columns:repeat(6,minmax(160px,1fr));gap:14px;margin:16px 0}.bc-kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);border-top:2px solid var(--blue);min-height:152px}.bc-kpi.green{border-top-color:var(--green)}.bc-kpi.amber{border-top-color:var(--amber)}.bc-kpi.red{border-top-color:var(--red)}.bc-kpi.violet{border-top-color:var(--violet)}.bc-kpi-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--blue2);color:var(--blue);margin-bottom:10px;font-size:15px}.bc-kpi.green .bc-kpi-icon{background:var(--green2);color:var(--green)}.bc-kpi.amber .bc-kpi-icon{background:var(--amber2);color:var(--amber)}.bc-kpi.red .bc-kpi-icon{background:var(--red2);color:var(--red)}.bc-kpi.violet .bc-kpi-icon{background:var(--violet2);color:var(--violet)}.bc-kpi-label{font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.04em}.bc-kpi-value{font-size:20px;line-height:1.35;font-weight:600;margin-top:4px;color:var(--blue);font-family:"DM Mono",monospace;word-break:break-word}.bc-kpi.green .bc-kpi-value{color:var(--green)}.bc-kpi.amber .bc-kpi-value{color:var(--amber)}.bc-kpi.red .bc-kpi-value{color:var(--red)}.bc-kpi.violet .bc-kpi-value{color:var(--violet)}.bc-kpi-sub{font-size:11px;color:var(--text3);margin-top:2px}
				.bc-helper{display:none;margin:0 0 14px;padding:10px 12px;border:1px solid rgba(160,120,64,.24);background:rgba(160,120,64,.08);border-radius:10px;color:var(--amber);font-size:13px}.bc-helper.show{display:block}
				.bc-bulk{display:none;align-items:center;gap:10px;background:rgba(74,127,165,.08);border:1px solid rgba(74,127,165,.24);border-radius:12px;padding:12px 14px;margin-bottom:14px}.bc-bulk.show{display:flex}.bc-bulk label{font-weight:700;color:var(--blue)}.bc-bulk input{height:32px;border:1px solid rgba(74,127,165,.28);border-radius:8px;padding:0 10px}.bc-count{margin-left:auto;color:var(--blue);font-weight:750}
				.bc-table-panel{overflow:hidden;margin-top:16px}.bc-toolbar{height:61px;display:flex;align-items:center;gap:10px;padding:0 18px;border-bottom:1px solid var(--line)}.bc-search{height:34px;min-width:280px;border:1px solid var(--line);border-radius:8px;padding:0 12px;background:var(--bg);font-family:inherit}.bc-pill{height:30px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--text2);padding:0 14px;font-size:12px;cursor:pointer;font-family:inherit}.bc-pill.on{background:var(--blue);border-color:var(--blue);color:#fff}.bc-toolbar-spacer{flex:1}.bc-sel-pill{display:none;background:var(--blue2);color:var(--blue);font-weight:500;border-radius:999px;padding:4px 10px;font-size:12px}.bc-sel-pill.show{display:inline-block}.bc-table-wrap{overflow:auto}.bc-table{width:100%;border-collapse:collapse;background:#fff}.bc-table th{height:42px;background:var(--muted);border-bottom:1px solid var(--line);color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:0 14px;white-space:nowrap}.bc-table td{border-bottom:1px solid var(--line);padding:11px 14px;vertical-align:middle;color:var(--text)}.bc-table tr:hover{background:rgba(74,127,165,.05)}.bc-table tr.sel{background:rgba(74,127,165,.10)}.bc-check{width:16px;height:16px;border:1.5px solid var(--line2);border-radius:4px;appearance:none;background:#fff;cursor:pointer;position:relative}.bc-check:checked{background:var(--blue);border-color:var(--blue)}.bc-check:checked:after{content:"";position:absolute;top:2px;left:4.5px;width:5px;height:8px;border:2px solid #fff;border-top:none;border-left:none;transform:rotate(42deg)}.bc-doc-type{font-size:11px;color:var(--text3);font-weight:500}.bc-link{display:inline-block;color:var(--blue);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;font-weight:500;cursor:pointer}.bc-party{font-weight:500;font-size:13px}.bc-party-sub{font-size:11px;color:var(--text3);margin-top:2px}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.dr{color:var(--red);font-weight:500}.cr{color:var(--blue);font-weight:500}.bc-badge{display:inline-flex;align-items:center;height:24px;border-radius:999px;padding:0 9px;font-size:11px;font-weight:500}.b-dr{background:var(--red2);border:1px solid rgba(158,74,74,.24);color:var(--red)}.b-cr{background:var(--blue2);border:1px solid rgba(74,127,165,.24);color:var(--blue)}.b-ok{background:var(--green2);border:1px solid rgba(74,140,110,.24);color:var(--green)}.b-pending{background:var(--amber2);border:1px solid rgba(160,120,64,.24);color:var(--amber)}.bc-date{height:32px;border:1px solid var(--line);border-radius:7px;padding:0 9px;background:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}.bc-date.filled{background:var(--green2);border-color:var(--green);color:var(--green)}.total-row td{background:var(--muted);font-weight:600}.bc-foot{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;color:var(--text3);font-size:12px}.bc-pages{display:flex;gap:4px}.bc-page-btn{width:30px;height:30px;border:1px solid var(--line);border-radius:7px;background:#fff;color:var(--text2);font-family:inherit}.bc-page-btn.on{background:var(--blue);border-color:var(--blue);color:#fff}
				@media(max-width:1200px){.bc-filter-grid{grid-template-columns:repeat(2,minmax(190px,1fr))}.bc-kpis{grid-template-columns:repeat(2,minmax(180px,1fr))}}@media(max-width:700px){.bc-page{padding:16px 12px}.bc-top{display:block}.bc-actions{justify-content:flex-start;margin-top:14px}.bc-filter-grid{grid-template-columns:1fr}.bc-kpis{grid-template-columns:1fr}.bc-search{min-width:0;flex:1}.bc-toolbar{height:auto;padding:14px;flex-wrap:wrap}.bc-bulk{align-items:flex-start}.bc-count{margin-left:0}}
			</style>
			<div class="bc-page">
				<div class="bc-top">
					<div>
						<div class="bc-title"><span class="bc-title-icon">${this.icon("check")}</span>Bank Clearance</div>
						<div class="bc-sub">Mark bank transactions as cleared once they appear on your bank statement</div>
					</div>
					<div class="bc-actions">
						<button class="bc-btn bc-success" data-action="update_clearance">${this.icon("check-double")} Update Clearance Date</button>
					</div>
				</div>
				<div class="bc-panel bc-filter-panel">
					<div class="bc-panel-title">${this.icon("sliders")} Filters</div>
					<div class="bc-filter-grid">
						<div class="bc-field"><label>Company</label><select data-field="company"></select></div>
						<div class="bc-field"><label>Bank Account</label><select data-field="bank_account"></select></div>
						<div class="bc-field"><label>Ledger Account / Account</label><input data-field="account" readonly></div>
						<div class="bc-field"><label>From Date</label><input type="date" data-field="from_date"></div>
						<div class="bc-field"><label>To Date</label><input type="date" data-field="to_date"></div>
					</div>
					<div class="bc-toggles">
						<label class="bc-toggle"><input type="checkbox" data-field="include_reconciled"> Include Reconciled Entries</label>
						<label class="bc-toggle"><input type="checkbox" data-field="include_pos"> Include POS Transactions</label>
					</div>
				</div>
				<div class="bc-kpis" data-area="summary_cards"></div>
				<div class="bc-helper" data-area="difference_helper">Difference Amount shows unreconciled bank transaction amount for the selected date range. If a bank transaction has no ERP entry, use Create Entry to create the missing Payment Entry or Journal Entry, then reconcile it.</div>
				<div class="bc-bulk" data-area="bulk">
					<label>Set clearance date for selected rows:</label>
					<input type="date" data-field="bulk_date">
					<button class="bc-btn bc-success" data-action="apply_selected">Apply to Selected</button>
					<button class="bc-btn bc-primary" data-action="apply_all">Apply to All</button>
					<span class="bc-count" data-area="bulk_count">0 selected</span>
				</div>
				<div class="bc-panel bc-table-panel">
					<div class="bc-toolbar">
						<input class="bc-search" data-field="search" placeholder="Search voucher, party, amount...">
						<button class="bc-pill on" data-filter="all">All</button>
						<button class="bc-pill" data-filter="pending">Pending</button>
						<button class="bc-pill" data-filter="cleared">Cleared</button>
						<span class="bc-sel-pill" data-area="selected_count"></span>
						<span class="bc-toolbar-spacer"></span>
						<button class="bc-btn bc-primary" data-action="fetch">${this.icon("refresh")} Get Entries</button>
						<button class="bc-btn" data-action="export">${this.icon("download")} Export CSV</button>
						<button class="bc-btn bc-warn" data-action="unclear">${this.icon("x-circle")} Unclear Selected</button>
						<button class="bc-btn" data-action="clear_filters">${this.icon("x")} Clear Filters</button>
					</div>
					<div class="bc-table-wrap"><table class="bc-table"><thead><tr>
						<th><input type="checkbox" class="bc-check" data-field="select_all"></th>
						<th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th>Deposit</th><th>Withdrawal</th><th>ERP Voucher</th><th>Status</th><th>Clearance Date</th><th>Action</th>
					</tr></thead><tbody data-area="tbody"></tbody></table></div>
					<div class="bc-foot"><span data-area="row_info">Showing 0 entries</span><div class="bc-pages"><button class="bc-page-btn on">1</button><button class="bc-page-btn">2</button><button class="bc-page-btn">3</button></div></div>
				</div>
			</div>
		`);
		this.render_cards({});
	}

	bind() {
		const root = this.page.main;
		root.on("change", "[data-field='company']", () => this.on_company_change());
		root.on("change", "[data-field='bank_account']", () => this.on_bank_account_change());
		root.on("click", "[data-action='fetch']", () => this.fetch_entries());
		root.on("click", "[data-action='update_clearance']", () => this.update_clearance());
		root.on("click", "[data-action='unclear']", () => this.unclear_selected());
		root.on("click", "[data-action='export']", () => this.export_csv());
		root.on("click", "[data-action='apply_selected']", () => this.apply_bulk(false));
		root.on("click", "[data-action='apply_all']", () => this.apply_bulk(true));
		root.on("click", "[data-action='clear_filters']", () => this.clear_filters());
		root.on("click", "[data-filter]", (event) => this.set_filter($(event.currentTarget)));
		root.on("input", "[data-field='search']", () => this.render_table());
		root.on("change", "[data-row-select]", (event) => this.toggle_row($(event.currentTarget)));
		root.on("change", "[data-field='select_all']", (event) => this.toggle_all(event.currentTarget.checked));
		root.on("change", "[data-clearance-date]", (event) => this.set_local_clearance_date($(event.currentTarget)));
		root.on("click", "[data-create-entry]", (event) => this.open_create_entry_dialog($(event.currentTarget).data("id")));
		root.on("click", "[data-open-voucher]", (event) => {
			const row = this.entries.find((entry) => entry.id === $(event.currentTarget).data("id"));
			if (row) frappe.set_route("Form", row.payment_document, row.payment_entry);
		});
	}

	async load_defaults() {
		const today = frappe.datetime.get_today();
		this.$("[data-field='from_date']").val(today.slice(0, 8) + "01");
		this.$("[data-field='to_date']").val(today);
		await this.load_companies();
	}

	$(selector) {
		return this.page.main.find(selector);
	}

	async call(method, args = {}) {
		const response = await frappe.call({ method: this.method + method, args });
		return response.message;
	}

	async load_companies() {
		const rows = await this.call("get_companies");
		const select = this.$("[data-field='company']");
		select.html(`<option value="">Select Company</option>`);
		(rows || []).forEach((row) => {
			select.append(`<option value="${frappe.utils.escape_html(row.name)}">${frappe.utils.escape_html(row.name)}</option>`);
		});
		if ((rows || []).length === 1) {
			select.val(rows[0].name);
			await this.load_bank_accounts();
		} else {
			this.reset_bank_account_select(__("Select Company first"));
		}
	}

	async on_company_change() {
		this.entries = [];
		this.selected = {};
		this.render_table();
		this.render_cards({});
		this.set_bank_context({});
		await this.load_bank_accounts();
	}

	reset_bank_account_select(label) {
		this.$("[data-field='bank_account']").html(`<option value="">${frappe.utils.escape_html(label)}</option>`);
	}

	async load_bank_accounts() {
		const company = this.$("[data-field='company']").val();
		this.set_bank_context({});
		if (!company) {
			this.reset_bank_account_select(__("Select Company first"));
			return;
		}
		const rows = await this.call("get_bank_accounts_for_company", { company });
		const select = this.$("[data-field='bank_account']");
		select.html(`<option value="">Select Bank Account</option>`);
		if (!(rows || []).length) {
			this.reset_bank_account_select(__("No Bank Accounts found"));
			frappe.show_alert({ message: __("No Bank Accounts found for selected Company"), indicator: "orange" }, 5);
			return;
		}
		(rows || []).forEach((row) => {
			const label = [row.name, row.bank, row.bank_account_no].filter(Boolean).join(" - ");
			select.append(`<option value="${frappe.utils.escape_html(row.name)}">${frappe.utils.escape_html(label)}</option>`);
		});
	}

	async on_bank_account_change() {
		const bank_account = this.$("[data-field='bank_account']").val();
		this.entries = [];
		this.selected = {};
		this.render_table();
		this.render_cards({});
		if (!bank_account) {
			this.set_bank_context({});
			return;
		}
		const details = await this.call("get_bank_account_details", { bank_account });
		this.set_bank_context(details || {});
		frappe.show_alert({ message: __("Linked Account auto-filled from Bank Account"), indicator: "blue" }, 3);
	}

	set_bank_context(details) {
		if (details.company) this.$("[data-field='company']").val(details.company);
		this.$("[data-field='account']").val(details.account || "");
	}

	get_args() {
		return {
			company: this.$("[data-field='company']").val(),
			bank_account: this.$("[data-field='bank_account']").val(),
			account: this.$("[data-field='account']").val(),
			from_date: this.$("[data-field='from_date']").val(),
			to_date: this.$("[data-field='to_date']").val(),
			include_reconciled_entries: this.$("[data-field='include_reconciled']").is(":checked"),
			include_pos_transactions: this.$("[data-field='include_pos']").is(":checked"),
		};
	}

	async fetch_entries() {
		const args = this.get_args();
		if (!args.company || !args.bank_account || !args.account || !args.from_date || !args.to_date) {
			frappe.msgprint(__("Please select Company, Bank Account, From Date and To Date."));
			return;
		}
		const data = await this.call("get_payment_entries", args);
		this.entries = data.entries || [];
		this.selected = {};
		this.render_cards(data.summary || {});
		this.render_table();
		frappe.show_alert({ message: __("Payment entries fetched"), indicator: "green" }, 3);
	}

	render_cards(summary) {
		const diff = flt(summary.difference_amount);
		const cards = [
			["Bank Statement Total", this.money(summary.bank_statement_total), "Bank Transaction deposit + withdrawal", "bank", "blue"],
			["Reconciled Total", this.money(summary.reconciled_total), "Reconciled Bank Transactions", "circle", "green"],
			["Unreconciled Total", this.money(summary.unreconciled_total), "Pending bank statement amount", "clock", "amber"],
			["Difference Amount", this.money(diff), "Bank Statement Total - Reconciled Total", "alert", Math.abs(diff) < 0.005 ? "green" : "red"],
			["ERP Period Total", this.money(summary.erp_period_total), "GL debit + credit for selected range", "calculator", "blue"],
			["Total Entries", summary.entry_count || 0, "in selected period", "list", "violet"],
		];
		this.$("[data-area='summary_cards']").html(cards.map((card) => this.card_html(card)).join(""));
		this.$("[data-area='difference_helper']").toggleClass("show", Math.abs(diff) >= 0.005);
	}

	card_html(card) {
		return `<div class="bc-kpi ${card[4]}"><div class="bc-kpi-icon">${this.icon(card[3])}</div><div class="bc-kpi-label">${card[0]}</div><div class="bc-kpi-value">${card[1]}</div><div class="bc-kpi-sub">${card[2]}</div></div>`;
	}

	render_table() {
		const q = (this.$("[data-field='search']").val() || "").toLowerCase();
		this.filtered = this.entries.filter((row) => {
			const status = (row.status || "").toLowerCase();
			if (this.current_filter === "pending" && !["pending", "unreconciled", "missing in erp"].includes(status)) return false;
			if (this.current_filter === "cleared" && !["cleared", "reconciled"].includes(status)) return false;
			const haystack = `${row.source} ${row.reference} ${row.description} ${row.erp_voucher} ${row.party} ${row.deposit} ${row.withdrawal}`.toLowerCase();
			return !q || haystack.includes(q);
		});
		let total_deposit = 0;
		let total_withdrawal = 0;
		let cleared = 0;
		let uncleared = 0;
		const html = this.filtered.map((row) => {
			const deposit = flt(row.deposit);
			const withdrawal = flt(row.withdrawal);
			total_deposit += deposit;
			total_withdrawal += withdrawal;
			if (["cleared", "reconciled"].includes((row.status || "").toLowerCase())) cleared += flt(row.amount);
			else uncleared += flt(row.amount);
			const checked = this.selected[row.id] ? "checked" : "";
			const selected = this.selected[row.id] ? "sel" : "";
			const date_class = row.clearance_date ? "bc-date filled" : "bc-date";
			const can_select = row.row_type === "ERP";
			const status_class = ["cleared", "reconciled"].includes((row.status || "").toLowerCase()) ? "b-ok" : row.status === "Missing in ERP" ? "b-dr" : "b-pending";
			const voucher_html = row.erp_voucher
				? `<span class="bc-link" data-open-voucher data-id="${row.id}">${frappe.utils.escape_html(row.erp_voucher)}</span>`
				: "-";
			const action = row.status === "Missing in ERP"
				? `<button class="bc-btn bc-primary" style="height:28px;padding:0 10px;font-size:12px" data-create-entry data-id="${row.id}">Create Entry</button>`
				: "";
			return `<tr class="${selected}">
				<td><input class="bc-check" type="checkbox" data-row-select data-id="${row.id}" ${checked} ${can_select ? "" : "disabled"}></td>
				<td class="mono">${row.date || row.posting_date || ""}</td>
				<td><span class="bc-badge ${row.type === "Deposit" ? "b-cr" : "b-dr"}">${frappe.utils.escape_html(row.type || "")}</span><div class="bc-doc-type">${frappe.utils.escape_html(row.source || "")}</div></td>
				<td class="mono">${frappe.utils.escape_html(row.reference || "-")}</td>
				<td><div class="bc-party">${frappe.utils.escape_html(row.description || row.party || "-")}</div><div class="bc-party-sub">${frappe.utils.escape_html(row.party_type || "")}</div></td>
				<td class="mono cr">${deposit ? this.money(deposit) : "-"}</td>
				<td class="mono dr">${withdrawal ? this.money(withdrawal) : "-"}</td>
				<td>${voucher_html}</td>
				<td><span class="bc-badge ${status_class}">${frappe.utils.escape_html(row.status || "")}</span></td>
				<td>${can_select ? `<input type="date" class="${date_class}" data-clearance-date data-id="${row.id}" value="${row.clearance_date || ""}">` : "-"}</td>
				<td>${action}</td>
			</tr>`;
		}).join("");
		const totals = `<tr class="total-row"><td colspan="5">TOTALS</td><td class="mono cr">${this.money(total_deposit)}</td><td class="mono dr">${this.money(total_withdrawal)}</td><td></td><td class="cr">Cleared/Reconciled: ${this.money(cleared)}</td><td class="dr">Open: ${this.money(uncleared)}</td><td></td></tr>`;
		this.$("[data-area='tbody']").html(html || `<tr><td colspan="11" style="text-align:center;color:var(--text3);padding:28px">No entries loaded</td></tr>`).append(html ? totals : "");
		this.$("[data-area='row_info']").text(`Showing ${this.filtered.length} of ${this.entries.length} entries`);
		this.update_selected_ui();
	}

	set_local_clearance_date(input) {
		const row = this.entries.find((entry) => entry.id === input.data("id"));
		if (!row) return;
		row.clearance_date = input.val();
		row.status = row.clearance_date ? "cleared" : "pending";
		this.render_table();
	}

	async update_clearance() {
		const rows = this.entries.filter((row) => row.row_type === "ERP" && row.clearance_date);
		if (!rows.length) {
			frappe.msgprint(__("No entries have a clearance date to update."));
			return;
		}
		const by_date = rows.reduce((groups, row) => {
			groups[row.clearance_date] = groups[row.clearance_date] || [];
			groups[row.clearance_date].push(row);
			return groups;
		}, {});
		for (const [date, date_rows] of Object.entries(by_date)) {
			await this.clear_entries(date_rows, date);
		}
		await this.fetch_entries();
	}

	async apply_bulk(all) {
		const date = this.$("[data-field='bulk_date']").val();
		if (!date) {
			frappe.msgprint(__("Pick a clearance date first."));
			return;
		}
		const rows = (all ? this.filtered : this.entries.filter((row) => this.selected[row.id])).filter((row) => row.row_type === "ERP");
		if (!rows.length) {
			frappe.msgprint(__("No rows selected."));
			return;
		}
		rows.forEach((row) => {
			row.clearance_date = date;
			row.status = "cleared";
		});
		this.render_table();
		await this.clear_entries(rows, date);
		await this.fetch_entries();
	}

	async unclear_selected() {
		const rows = this.entries.filter((row) => row.row_type === "ERP" && this.selected[row.id]);
		if (!rows.length) {
			frappe.msgprint(__("Select rows to unclear."));
			return;
		}
		await this.unclear_entries(rows);
		await this.fetch_entries();
	}

	async clear_entries(rows, clearance_date) {
		const entries = rows.map((row) => ({ ...row, clearance_date }));
		const result = await this.call("clear_selected_entries", {
			entries: JSON.stringify(entries),
			clearance_date,
			account: this.get_args().account,
		});
		frappe.show_alert({ message: result.message, indicator: "green" }, 3);
	}

	async unclear_entries(rows) {
		const result = await this.call("unclear_selected_entries", {
			entries: JSON.stringify(rows),
			account: this.get_args().account,
		});
		frappe.show_alert({ message: result.message, indicator: "orange" }, 3);
	}

	toggle_row(input) {
		this.selected[input.data("id")] = input.is(":checked");
		this.render_table();
	}

	toggle_all(checked) {
		this.filtered.filter((row) => row.row_type === "ERP").forEach((row) => (this.selected[row.id] = checked));
		this.render_table();
	}

	set_filter(button) {
		this.$("[data-filter]").removeClass("on");
		button.addClass("on");
		this.current_filter = button.data("filter");
		this.render_table();
	}

	clear_filters() {
		this.$("[data-field='search']").val("");
		this.current_filter = "all";
		this.$("[data-filter]").removeClass("on");
		this.$("[data-filter='all']").addClass("on");
		this.render_table();
	}

	update_selected_ui() {
		const count = Object.values(this.selected).filter(Boolean).length;
		const selectable = this.filtered.filter((row) => row.row_type === "ERP");
		this.$("[data-area='selected_count']").toggleClass("show", count > 0).text(`${count} selected`);
		this.$("[data-area='bulk']").toggleClass("show", count > 0);
		this.$("[data-area='bulk_count']").text(`${count} row${count === 1 ? "" : "s"} selected`);
		this.$("[data-field='select_all']").prop("checked", selectable.length > 0 && selectable.every((row) => this.selected[row.id]));
	}

	open_create_entry_dialog(id) {
		const row = this.entries.find((entry) => entry.id === id);
		if (!row) return;
		const args = this.get_args();
		const amount = flt(row.deposit) || flt(row.withdrawal);
		const dialog = new frappe.ui.Dialog({
			title: __("Create Missing ERP Entry"),
			fields: [
				{ fieldname: "entry_type", label: __("Entry Type"), fieldtype: "Select", options: ["Payment Entry", "Journal Entry"], reqd: 1, default: "Payment Entry" },
				{ fieldname: "posting_date", label: __("Posting Date"), fieldtype: "Date", reqd: 1, default: row.date },
				{ fieldname: "amount", label: __("Amount"), fieldtype: "Currency", reqd: 1, default: amount },
				{ fieldname: "transaction_type", label: __("Transaction Type"), fieldtype: "Select", options: ["Deposit", "Withdrawal"], reqd: 1, default: row.type },
				{ fieldname: "company", label: __("Company"), fieldtype: "Link", options: "Company", reqd: 1, default: args.company },
				{ fieldname: "bank_account", label: __("Bank Account"), fieldtype: "Link", options: "Bank Account", default: args.bank_account },
				{ fieldname: "account", label: __("Ledger Account / Account"), fieldtype: "Link", options: "Account", reqd: 1, default: args.account },
				{ fieldname: "offset_account", label: __("Adjustment Account"), fieldtype: "Link", options: "Account", depends_on: "eval:doc.entry_type=='Journal Entry'" },
				{ fieldname: "party_type", label: __("Party Type"), fieldtype: "Link", options: "DocType", default: row.party_type },
				{ fieldname: "party", label: __("Party"), fieldtype: "Dynamic Link", options: "party_type", default: row.party },
				{ fieldname: "reference_number", label: __("Reference Number"), fieldtype: "Data", default: row.reference },
				{ fieldname: "reference_date", label: __("Reference Date"), fieldtype: "Date", default: row.date },
				{ fieldname: "remarks", label: __("Remarks"), fieldtype: "Small Text", default: row.description },
			],
			primary_action_label: __("Create Entry"),
			primary_action: async (values) => {
				values.bank_transaction = row.bank_transaction;
				await this.call("create_missing_entry", { data: JSON.stringify(values) });
				dialog.hide();
				frappe.show_alert({ message: __("Draft entry created"), indicator: "green" }, 4);
				await this.fetch_entries();
			},
		});
		dialog.show();
	}

	export_csv() {
		const rows = [["Date", "Type", "Reference", "Description", "Deposit", "Withdrawal", "ERP Voucher", "Status", "Clearance Date"]];
		this.filtered.forEach((row) => rows.push([row.date || row.posting_date, row.type, row.reference, row.description || row.party, row.deposit, row.withdrawal, row.erp_voucher, row.status, row.clearance_date]));
		const csv = rows.map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")).join("\n");
		const link = document.createElement("a");
		link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
		link.download = `bank_clearance_${frappe.datetime.get_today()}.csv`;
		link.click();
	}

	money(value) {
		return format_currency(flt(value), frappe.defaults.get_default("currency") || "INR");
	}
}
