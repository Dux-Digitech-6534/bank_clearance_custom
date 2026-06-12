frappe.pages["custom-new-bank-clearance"].on_page_load = function (wrapper) {
	new CustomNewBankClearance(wrapper);
};

class CustomNewBankClearance {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Custom New Bank Clearance"),
			single_column: true,
		});
		this.prepare_frame();
		this.method =
			"bank_clearance_custom.bank_clearance_custom.page.custom_new_bank_clearance.custom_new_bank_clearance.";
		this.fetched = false;
		this.erp_balance = 0;
		this.summary = {};
		this.active_tab = "all";
		this.selected = new Set();
		this.entries = [];
		this.page_size = 20;
		this.current_page = 1;
		this.render();
		this.bind();
		this.set_current_month_dates();
		this.load_companies();
		this.refresh();
	}

	prepare_frame() {
		const $wrapper = $(this.wrapper);
		$wrapper.closest(".page-container").find(".page-head").hide();
		$wrapper.closest(".layout-main-section-wrapper").css({ width: "100%", maxWidth: "none" });
		$wrapper.closest(".layout-main-section").css({ padding: 0 });
		this.page.main.css({ margin: 0, padding: 0 });
	}

	render() {
		this.page.main.html(`
			<style>
				.cnbc{--bg:#F8FAFC;--surface:#fff;--muted:#F8FAFC;--line:#E5E7EB;--line2:#D1D5DB;--text:#1F2937;--text2:#374151;--text3:#6B7280;--blue:#4A7FA5;--blue2:rgba(74,127,165,.12);--green:#4A8C6E;--green2:rgba(74,140,110,.12);--amber:#A07840;--amber2:rgba(160,120,64,.12);--red:#9E4A4A;--red2:rgba(158,74,74,.12);--violet:#6F5BA7;--violet2:rgba(111,91,167,.12);background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.5;margin:0;padding:6px 24px 28px;min-height:calc(100vh - 44px)}
				.cnbc *{box-sizing:border-box}.cnbc-svg{width:14px;height:14px;display:inline-block;vertical-align:-2px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}.cnbc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:26px}.cnbc-title{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:600;letter-spacing:0}.cnbc-title-icon{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--blue);color:#fff;font-size:12px}.cnbc-sub{margin-top:5px;color:var(--text3);font-size:13px}.cnbc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
				.cnbc-btn{height:34px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--text2);font-weight:500;font-size:13px;padding:0 14px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;font-family:inherit}.cnbc-btn:hover{background:var(--muted);border-color:var(--line2);color:var(--text)}.cnbc-primary{background:var(--blue);border-color:var(--blue);color:#fff}.cnbc-primary:hover{background:#3f6f91;color:#fff}.cnbc-success{background:var(--green);border-color:var(--green);color:#fff}.cnbc-success:hover{background:#3f795f;color:#fff}.cnbc-warn{background:var(--amber2);border-color:rgba(160,120,64,.28);color:var(--amber)}
				.cnbc-panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)}.cnbc-filter-panel{padding:20px;margin-bottom:16px}.cnbc-panel-title{display:flex;align-items:center;gap:8px;color:var(--text2);font-size:13px;font-weight:600;letter-spacing:.03em;margin-bottom:16px}.cnbc-filter-grid{display:grid;grid-template-columns:minmax(180px,1.05fr) minmax(210px,1.25fr) minmax(210px,1.25fr) minmax(140px,.82fr) minmax(140px,.82fr) minmax(120px,.68fr);gap:12px;align-items:end}.cnbc-field label{display:block;color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.cnbc-field input,.cnbc-field select{width:100%;height:35px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:0 11px;color:var(--text);font-size:13px;outline:none;font-family:inherit}.cnbc-field input[type="date"]{min-width:100%;display:block}.cnbc-field input:focus,.cnbc-field select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(74,127,165,.14)}.cnbc-filter-actions{display:flex;flex-direction:column;gap:7px}.cnbc-filter-action{height:35px;width:100%;justify-content:center;padding:0 12px}.cnbc-toggles{display:flex;gap:24px;border-top:1px solid var(--line);margin-top:16px;padding-top:16px;flex-wrap:wrap}.cnbc-toggle{display:inline-flex;align-items:center;gap:8px;color:var(--text2);font-size:13px;cursor:pointer}.cnbc-toggle input{appearance:none;-webkit-appearance:none;width:16px;height:16px;border:1.5px solid var(--line2);background:#fff!important;background-image:none!important;border-radius:4px;position:relative;cursor:pointer;transition:.15s;flex:0 0 auto}.cnbc-toggle input:before{display:none}.cnbc-toggle input:checked{background:#fff!important;background-image:none!important;border-color:var(--blue)}.cnbc-toggle input:checked:after{content:"";position:absolute;top:1px;left:4px;width:5px;height:9px;border:2px solid var(--blue);border-top:none;border-left:none;transform:rotate(42deg)}
				.cnbc-kpis{display:grid;grid-template-columns:repeat(5,minmax(180px,1fr));gap:14px;margin:16px 0}.cnbc-kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);border-top:2px solid var(--blue);min-height:152px}.cnbc-kpi.green{border-top-color:var(--green)}.cnbc-kpi.amber{border-top-color:var(--amber)}.cnbc-kpi.red{border-top-color:var(--red)}.cnbc-kpi.violet{border-top-color:var(--violet)}.cnbc-kpi-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--blue2);color:var(--blue);margin-bottom:10px;font-size:15px}.cnbc-kpi.green .cnbc-kpi-icon{background:var(--green2);color:var(--green)}.cnbc-kpi.amber .cnbc-kpi-icon{background:var(--amber2);color:var(--amber)}.cnbc-kpi.red .cnbc-kpi-icon{background:var(--red2);color:var(--red)}.cnbc-kpi.violet .cnbc-kpi-icon{background:var(--violet2);color:var(--violet)}.cnbc-kpi-label{font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.04em}.cnbc-kpi-value{line-height:1.35;font-weight:600;margin-top:4px;color:var(--blue);font-family:inherit;white-space:nowrap}.cnbc-kpi.green .cnbc-kpi-value{color:var(--green)}.cnbc-kpi.amber .cnbc-kpi-value{color:var(--amber)}.cnbc-kpi.red .cnbc-kpi-value{color:var(--red)}.cnbc-kpi.violet .cnbc-kpi-value{color:var(--violet)}.cnbc-kpi-sub{font-size:11px;color:var(--text3);margin-top:2px}.cnbc-actual{width:100%;height:30px;border:0;border-bottom:1px solid var(--line);padding:0;background:transparent;color:var(--amber);font:inherit;font-weight:600;outline:none}
				.cnbc-bulk{display:none;align-items:center;gap:10px;background:rgba(74,127,165,.08);border:1px solid rgba(74,127,165,.24);border-radius:12px;padding:12px 14px;margin-bottom:14px}.cnbc-bulk.show{display:flex}.cnbc-bulk label{font-weight:700;color:var(--blue)}.cnbc-bulk input{height:32px;border:1px solid rgba(74,127,165,.28);border-radius:8px;padding:0 10px;font-family:inherit}.cnbc-count{margin-left:auto;color:var(--blue);font-weight:750}
				.cnbc-table-panel{overflow:hidden;margin-top:16px}.cnbc-toolbar{height:61px;display:flex;align-items:center;gap:10px;padding:0 18px;border-bottom:1px solid var(--line)}.cnbc-search{height:34px;min-width:300px;border:1px solid var(--line);border-radius:8px;padding:0 12px;background:var(--bg);font-family:inherit}.cnbc-pill{height:30px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--text2);padding:0 14px;font-size:12px;cursor:pointer;font-family:inherit}.cnbc-pill.on{background:var(--blue);border-color:var(--blue);color:#fff}.cnbc-toolbar-spacer{flex:1}.cnbc-table-wrap{overflow:auto}.cnbc-table{width:100%;min-width:1120px;border-collapse:collapse;background:#fff}.cnbc-table th{height:42px;background:var(--muted);border-bottom:1px solid var(--line);color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:0 14px;white-space:nowrap}.cnbc-table td{border-bottom:1px solid var(--line);padding:11px 14px;vertical-align:middle;color:var(--text)}.cnbc-table tr:hover{background:rgba(74,127,165,.05)}.cnbc-table tr.sel{background:rgba(74,127,165,.10)}.cnbc-check{width:16px;height:16px;border:1.5px solid var(--line2);border-radius:4px;appearance:none;-webkit-appearance:none;background:#fff!important;background-image:none!important;cursor:pointer;position:relative}.cnbc-check:checked{background:#fff!important;background-image:none!important;border-color:var(--blue)}.cnbc-check:checked:after{content:"";position:absolute;top:1px;left:4px;width:5px;height:9px;border:2px solid var(--blue);border-top:none;border-left:none;transform:rotate(42deg)}.cnbc-doc-type{font-size:11px;color:var(--text3);font-weight:500}.cnbc-link{display:inline-block;color:var(--blue);font-family:inherit;font-size:12px;font-weight:500}.cnbc-money{display:inline-block;white-space:nowrap}.cnbc-money-green{color:var(--green);font-weight:500}.cnbc-money-red{color:var(--red);font-weight:500}.cnbc-badge{display:inline-flex;align-items:center;height:24px;border-radius:999px;padding:0 9px;font-size:11px;font-weight:500}.b-ok{background:var(--green2);border:1px solid rgba(74,140,110,.24);color:var(--green)}.b-pending{background:var(--amber2);border:1px solid rgba(160,120,64,.24);color:var(--amber)}.b-date{background:var(--blue2);border:1px solid rgba(74,127,165,.24);color:var(--blue)}.b-pos{background:var(--violet2);border:1px solid rgba(111,91,167,.24);color:var(--violet)}.b-dr{background:var(--red2);border:1px solid rgba(158,74,74,.24);color:var(--red)}.cnbc-date{width:100%;min-width:150px;height:32px;box-sizing:border-box;border:1px solid var(--line);border-radius:7px;padding:0 9px;background:#fff;font-family:inherit;font-size:12px}.cnbc-foot{height:54px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 18px;color:var(--text3);font-size:12px}.cnbc-page-controls{margin-left:auto;display:flex;align-items:center;gap:6px}.cnbc-page-label{color:var(--text2);font-weight:500}
				.cnbc-final{display:none;margin-bottom:14px;background:var(--green2);border:1px solid rgba(74,140,110,.24);border-radius:12px;padding:12px 14px;color:var(--green);font-weight:600}.cnbc-final.show{display:block}
				@media(max-width:1200px){.cnbc-filter-grid{grid-template-columns:repeat(2,minmax(190px,1fr))}.cnbc-kpis{grid-template-columns:repeat(2,minmax(180px,1fr))}}@media(max-width:700px){.cnbc{padding:16px 12px}.cnbc-top{display:block}.cnbc-actions{justify-content:flex-start;margin-top:14px}.cnbc-filter-grid{grid-template-columns:1fr}.cnbc-kpis{grid-template-columns:1fr}.cnbc-search{min-width:0;flex:1}.cnbc-toolbar{height:auto;padding:14px;flex-wrap:wrap}.cnbc-bulk{align-items:flex-start}.cnbc-count{margin-left:0}}
			</style>
			<div class="cnbc">
				<div class="cnbc-top">
					<div>
						<div class="cnbc-title"><span class="cnbc-title-icon">${this.icon("check")}</span>Bank Clearance</div>
						<div class="cnbc-sub">Mark bank transactions as cleared once they appear on your bank statement</div>
					</div>
					<div class="cnbc-actions">
						<button class="cnbc-btn cnbc-success" data-action="reconcile">${this.icon("check-double")} Reconcile</button>
					</div>
				</div>
				<div class="cnbc-panel cnbc-filter-panel">
					<div class="cnbc-panel-title">${this.icon("sliders")} Filters</div>
					<div class="cnbc-filter-grid">
						<div class="cnbc-field"><label>Company</label><select data-field="company"><option value="">Loading Companies...</option></select></div>
						<div class="cnbc-field"><label>Ledger Account / Account</label><select data-field="ledger"><option value="">Select Company first</option></select></div>
						<div class="cnbc-field"><label>Bank Account</label><select data-field="bank_account"><option value="">Select Account first</option></select></div>
						<div class="cnbc-field"><label>From Date</label><input type="date" data-field="from_date"></div>
						<div class="cnbc-field"><label>To Date</label><input type="date" data-field="to_date"></div>
						<div class="cnbc-filter-actions">
							<button class="cnbc-btn cnbc-filter-action" data-action="clear_filter_fields">${this.icon("x")} Clear Filters</button>
							<button class="cnbc-btn cnbc-primary cnbc-filter-action" data-action="get_entries">${this.icon("refresh")} Get Entries</button>
						</div>
					</div>
					<div class="cnbc-toggles">
						<label class="cnbc-toggle"><input type="checkbox" data-field="include_reconciled"> Include Reconciled Entries</label>
						<label class="cnbc-toggle"><input type="checkbox" data-field="include_pos"> Include POS Transactions</label>
					</div>
				</div>
				<div class="cnbc-kpis" data-area="summary_cards"></div>
				<div class="cnbc-final" data-area="final_summary"></div>
				<div class="cnbc-bulk" data-area="bulk">
					<label>Set clearance date for selected rows:</label>
					<input type="date" data-field="bulk_date" value="02/06/2026" placeholder="dd/mm/yyyy">
					<button class="cnbc-btn cnbc-success" data-action="apply_date">Apply to Selected</button>
					<span class="cnbc-count" data-area="bulk_count">0 selected</span>
				</div>
				<div class="cnbc-panel cnbc-table-panel">
					<div class="cnbc-toolbar">
						<input class="cnbc-search" data-field="search" placeholder="Search voucher, party, amount...">
						<button class="cnbc-pill on" data-tab="all">All</button>
						<button class="cnbc-pill" data-tab="pending">Pending</button>
						<button class="cnbc-pill" data-tab="date_set">Date Set</button>
						<button class="cnbc-pill" data-tab="cleared">Reconciled</button>
						<button class="cnbc-pill" data-tab="pos">POS</button>
						<span class="cnbc-toolbar-spacer"></span>
						<button class="cnbc-btn" data-action="export">${this.icon("download")} Export CSV</button>
						
						<button class="cnbc-btn" data-action="clear_filters">${this.icon("x")} Clear Filters</button>
					</div>
					<div class="cnbc-table-wrap"><table class="cnbc-table"><thead><tr>
						<th><input type="checkbox" class="cnbc-check" data-field="select_all"></th>
						<th>Date</th><th>Type</th><th>Description</th><th>Deposit</th><th>Withdrawal</th><th>ERP Voucher</th><th>Status</th><th>Clearance Date</th><th>Action</th>
					</tr></thead><tbody data-area="tbody"></tbody></table></div>
					<div class="cnbc-foot"><span data-area="row_info">Showing 0 entries</span><span data-area="totals">Deposit ${this.money(0)} - Withdrawal ${this.money(0)}</span><span class="cnbc-page-controls" data-area="pagination"></span></div>
				</div>
			</div>
		`);
		this.render_cards();
	}

	bind() {
		const root = this.page.main;
		root.on("change", "[data-field='company']", () => this.on_company_change());
		root.on("change", "[data-field='ledger']", () => this.on_account_change());
		root.on("click", "[data-action='get_entries']", () => this.get_entries());
		root.on("click", "[data-action='reconcile']", () => this.reconcile());
		root.on("click", "[data-action='apply_date']", () => this.apply_selected_date());
		root.on("click", "[data-action='clear_selected']", () => this.clear_selected());
		root.on("click", "[data-action='clear_filters']", () => this.clear_filters());
		root.on("click", "[data-action='clear_filter_fields']", () => this.clear_filter_fields());
		root.on("click", "[data-action='export']", () => this.export_csv());
		root.on("change", "[data-field='actual_bank']", () => this.refresh());
		root.on("change", "[data-field='from_date'], [data-field='to_date']", () => {
			this.reset_page();
			this.refresh();
		});
		root.on("input", "[data-field='search']", () => {
			this.clear_final_message();
			this.reset_page();
			this.refresh();
		});
		root.on("change", "[data-field='include_reconciled'], [data-field='include_pos']", () => {
			this.clear_final_message();
			this.reset_page();
			this.reload_if_ready();
		});
		root.on("click", "[data-tab]", (event) => this.set_tab($(event.currentTarget)));
		root.on("change", "[data-field='select_all']", (event) => {
			this.paginated_entries().forEach((row) => event.currentTarget.checked ? this.selected.add(row.id) : this.selected.delete(row.id));
			this.refresh();
		});
		root.on("click", "[data-page-action]", (event) => this.change_page($(event.currentTarget).data("page-action")));
		root.on("change", "[data-row-select]", (event) => {
			const id = Number($(event.currentTarget).data("id"));
			event.currentTarget.checked ? this.selected.add(id) : this.selected.delete(id);
			this.update_selected_ui();
		});
		root.on("change", "[data-clearance-date]", (event) => {
			const row = this.entries.find((entry) => entry.id === Number($(event.currentTarget).data("id")));
			if (!row) return;
			row.clearance = this.to_server_date($(event.currentTarget).val());
			if (row.status === "pending" && row.clearance) row.status = "date_set";
			if (row.status === "date_set" && !row.clearance) row.status = "pending";
			this.refresh();
		});
	}

	$(selector) {
		return this.page.main.find(selector);
	}

	async call(method, args = {}) {
		const response = await frappe.call({ method: this.method + method, args });
		return response.message || [];
	}

	async load_companies() {
		const select = this.$("[data-field='company']");
		select.html(`<option value="">Select Company</option>`);
		const rows = await this.call("get_companies");
		(rows || []).forEach((row) => {
			select.append(`<option value="${frappe.utils.escape_html(row.name)}">${frappe.utils.escape_html(row.name)}</option>`);
		});
	}

	set_current_month_dates() {
		const today = frappe.datetime.get_today();
		this.$("[data-field='from_date']").val(today.slice(0, 8) + "01");
		this.$("[data-field='to_date']").val(today);
	}

	async on_company_change() {
		this.clear_final_message();
		this.reset_page();
		const company = this.$("[data-field='company']").val();
		const account = this.$("[data-field='ledger']");
		account.html(`<option value="">Select Account</option>`);
		this.$("[data-field='bank_account']").html(`<option value="">Select Account first</option>`);
		if (!company) {
			account.html(`<option value="">Select Company first</option>`);
			return;
		}
		const rows = await this.call("get_accounts_for_company", { company });
		if (!(rows || []).length) {
			account.html(`<option value="">No linked Accounts found</option>`);
			frappe.show_alert({ message: __("No linked Accounts found for selected Company"), indicator: "orange" }, 5);
			return;
		}
		rows.forEach((row) => {
			account.append(`<option value="${frappe.utils.escape_html(row.account)}">${frappe.utils.escape_html(row.account)}</option>`);
		});
	}

	async on_account_change() {
		this.clear_final_message();
		this.reset_page();
		const company = this.$("[data-field='company']").val();
		const account = this.$("[data-field='ledger']").val();
		const bank = this.$("[data-field='bank_account']");
		bank.html(`<option value="">Select Bank Account</option>`);
		if (!account) {
			bank.html(`<option value="">Select Account first</option>`);
			return;
		}
		const rows = await this.call("get_bank_accounts_for_account", { company, account });
		if (!(rows || []).length) {
			bank.html(`<option value="">No Bank Accounts found</option>`);
			frappe.show_alert({ message: __("No Bank Accounts found for selected Account"), indicator: "orange" }, 5);
			return;
		}
		rows.forEach((row) => {
			const label = [row.name, row.bank, row.bank_account_no].filter(Boolean).join(" - ");
			bank.append(`<option value="${frappe.utils.escape_html(row.name)}">${frappe.utils.escape_html(label)}</option>`);
		});
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
			alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
			calculator: '<rect width="16" height="20" x="4" y="2" rx="2"></rect><path d="M8 6h8"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>',
			list: '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
		};
		return `<svg class="cnbc-svg" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.circle}</svg>`;
	}

	has_required_filters() {
		return Boolean(
			this.$("[data-field='company']").val()
			&& this.$("[data-field='ledger']").val()
			&& this.$("[data-field='bank_account']").val()
			&& this.$("[data-field='from_date']").val()
			&& this.$("[data-field='to_date']").val()
		);
	}

	async reload_if_ready() {
		if (!this.has_required_filters()) return;
		await this.get_entries({ quiet: true });
	}

	async fetch_entries(args, include_reconciled) {
		const response = await frappe.call({
			method: "bank_clearance_custom.page.custom_bank_clearance.custom_bank_clearance.get_payment_entries",
			args: {
				account: args.account,
				bank_account: args.bank_account,
				from_date: args.from_date,
				to_date: args.to_date,
				include_reconciled_entries: include_reconciled,
				include_pos_transactions: args.include_pos,
			},
		});
		return response.message || {};
	}

	async get_entries(options = {}) {
		this.clear_final_message();
		const args = {
			company: this.$("[data-field='company']").val(),
			account: this.$("[data-field='ledger']").val(),
			bank_account: this.$("[data-field='bank_account']").val(),
			from_date: this.$("[data-field='from_date']").val(),
			to_date: this.$("[data-field='to_date']").val(),
			include_reconciled: this.$("[data-field='include_reconciled']").is(":checked"),
			include_pos: this.$("[data-field='include_pos']").is(":checked"),
		};
		if (!args.company || !args.account || !args.bank_account) {
			if (options.quiet) return;
			frappe.msgprint(__("Please select Company, Account and Bank Account."));
			return;
		}
		if (!args.from_date || !args.to_date) {
			if (options.quiet) return;
			frappe.msgprint(__("Please select From Date and To Date."));
			return;
		}
		const include_reconciled_for_table = args.include_reconciled || args.include_pos;
		const result = await this.fetch_entries(args, include_reconciled_for_table);
		const summary_args = { ...args, include_pos: true };
		const summary_result = await this.fetch_entries(summary_args, true);
		const summary_entries = (summary_result.entries || []).map((row, index) => this.normalize_entry(row, index));
		// const period_total = summary_entries.reduce((sum, row) => sum + row.deposit + row.withdrawal, 0);
		// const reconciled_total = summary_entries.reduce((sum, row) => {
		// 	return row.status === "reconciled" || row.clearance ? sum + row.deposit + row.withdrawal : sum;
		// }, 0);
		const period_total = summary_entries.reduce((sum, row) => {
			return sum + flt(row.deposit) - flt(row.withdrawal);
		}, 0);

		const reconciled_total = summary_entries.reduce((sum, row) => {
				return row.status === "reconciled" || row.clearance
					? sum + flt(row.deposit) - flt(row.withdrawal)
					: sum;
			}, 0);
		this.fetched = true;
		this.summary = {
			bank_statement_balance: period_total,
			reconciled_erp_balance: reconciled_total,
			entry_count: (result.entries || []).length,
		};
		this.erp_balance = flt(this.summary.reconciled_erp_balance);
		this.entries = (result.entries || []).map((row, index) => this.normalize_entry(row, index));
		this.selected.clear();
		this.reset_page();
		this.refresh();
		if (!options.quiet) {
			frappe.show_alert({ message: __("{0} entries fetched").replace("{0}", this.entries.length), indicator: "green" }, 3);
		}
	}

	normalize_entry(row, index) {
		const deposit = flt(row.deposit || row.debit);
		const withdrawal = flt(row.withdrawal || row.credit);
		const status = (row.status || "").toLowerCase();
		return {
			id: index + 1,
			date: row.date || row.posting_date || "",
			type: row.type || (deposit ? "Receipt" : "Payment"),
			description: row.description || row.party || row.payment_document || "",
			deposit,
			withdrawal,
			voucher: row.erp_voucher || row.payment_entry || row.voucher_no || "",
			voucher_no: row.payment_entry || row.voucher_no || row.erp_voucher || "",
			voucher_type: row.payment_document || row.voucher_type || "",
			payment_document: row.payment_document || row.voucher_type || "",
			status: row.clearance_date || status === "cleared" || status === "reconciled" ? "reconciled" : "pending",
			source: row.source === "POS" || row.is_pos ? "POS" : row.source || row.row_type || "ERP Entry",
			clearance: row.clearance || row.clearance_date || "",
		};
	}

	  filtered_entries() {
		if (!this.fetched) return [];
		const q = (this.$("[data-field='search']").val() || "").toLowerCase();
		const include_reconciled = this.$("[data-field='include_reconciled']").is(":checked");
		const include_pos = this.$("[data-field='include_pos']").is(":checked");
		const from_date = this.to_server_date(this.$("[data-field='from_date']").val());
		const to_date = this.to_server_date(this.$("[data-field='to_date']").val());

		// return this.entries.filter((row) => {
		// 	if (row.date < from_date || row.date > to_date) return false;

		// 	if (row.source === "POS") {
		// 		if (!include_pos) return false;
		// 	} else {
		// 		if (!include_reconciled && row.status === "reconciled") return false;
		// 	}

		// 	if (this.active_tab === "pending" && row.status !== "pending") return false;
		// 	if (this.active_tab === "date_set" && row.status !== "date_set") return false;
		// 	if (this.active_tab === "cleared" && row.status !== "reconciled") return false;
		// 	if (this.active_tab === "pos" && row.source !== "POS") return false;

		// 	return `${row.date} ${row.type} ${row.description} ${row.deposit} ${row.withdrawal} ${row.voucher} ${row.status} ${row.source}`
		// 		.toLowerCase()
		// 		.includes(q);
		// });
		const rows = this.entries.filter((row) => {
			if (row.date < from_date || row.date > to_date) return false;

			if (row.source === "POS") {
				if (!include_pos) return false;
			} else {
				if (!include_reconciled && row.status === "reconciled") return false;
			}

			if (this.active_tab === "pending" && row.status !== "pending") return false;
			if (this.active_tab === "date_set" && row.status !== "date_set") return false;
			if (this.active_tab === "cleared" && row.status !== "reconciled") return false;
			if (this.active_tab === "pos" && row.source !== "POS") return false;

			return `${row.date} ${row.type} ${row.description} ${row.deposit} ${row.withdrawal} ${row.voucher} ${row.status} ${row.source}`
				.toLowerCase()
				.includes(q);
		});

		rows.sort((a, b) => new Date(a.date) - new Date(b.date));

		return rows;
	}

	refresh() {
		this.render_cards();
		this.render_table();
		this.update_selected_ui();
	}

	reset_page() {
		this.current_page = 1;
	}

	total_pages(total_rows=this.filtered_entries().length) {
		return Math.max(1, Math.ceil(total_rows / this.page_size));
	}

	paginated_entries(rows=this.filtered_entries()) {
		const total_pages = this.total_pages(rows.length);
		if (this.current_page > total_pages) this.current_page = total_pages;
		if (this.current_page < 1) this.current_page = 1;
		const start = (this.current_page - 1) * this.page_size;
		return rows.slice(start, start + this.page_size);
	}

	// change_page(action) {
	// 	const total_pages = this.total_pages();
	// 	if (action === "prev" && this.current_page > 1) this.current_page -= 1;
	// 	if (action === "next" && this.current_page < total_pages) this.current_page += 1;
	// 	this.refresh();
	// }
	change_page(action) {
		const total_pages = this.total_pages();

		if (action === "first") this.current_page = 1;
		if (action === "prev" && this.current_page > 1) this.current_page -= 1;
		if (action === "next" && this.current_page < total_pages) this.current_page += 1;
		if (action === "last") this.current_page = total_pages;

		this.refresh();

		this.$(".cnbc-table-panel")[0]?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}

	render_cards() {
		const reconciled_total = flt(this.summary.reconciled_erp_balance);
		const actual_value = this.$("[data-field='actual_bank']").val();

		const has_actual_value = actual_value !== undefined && String(actual_value).trim() !== "";
		const actual_bank = has_actual_value ? flt(actual_value) : 0;

		const diff = has_actual_value ? actual_bank - reconciled_total : 0;
		const erp_color = reconciled_total < 0 ? "red" : "green";

		const visible_entries = this.filtered_entries().length;
		// const actual_value = this.$("[data-field='actual_bank']").val();
		// const actual_bank = actual_value === undefined || actual_value === "" ? statement_total : Number(actual_value);
		// const diff = actual_bank - reconciled_total;
		const cards = [
			["Reconciled ERP Balance", this.money(reconciled_total), "", "circle", "green"],
			["Bank Statement Balance", `<input class="cnbc-actual" data-field="actual_bank" value="${actual_value || ""}">`, ".", "bank", "amber"],
			["Difference Amount", this.money(diff, true), "", "alert", "red"],
			["Visible Entries", visible_entries, "", "list", "violet"],
		];
		this.$("[data-area='summary_cards']").html(cards.map((card) => this.card_html(card)).join(""));
	}

	card_html(card) {
		return `<div class="cnbc-kpi ${card[4]}"><div class="cnbc-kpi-icon">${this.icon(card[3])}</div><div class="cnbc-kpi-label">${card[0]}</div><div class="cnbc-kpi-value">${card[1]}</div><div class="cnbc-kpi-sub">${card[2]}</div></div>`;
	}

	render_table() {
		const filtered_rows = this.filtered_entries();
		const rows = this.paginated_entries(filtered_rows);
		const html = rows.map((row) => {
			const checked = this.selected.has(row.id) ? "checked" : "";
			const selected = this.selected.has(row.id) ? "sel" : "";
			const status_class = row.source === "POS" ? "b-pos" : row.status === "reconciled" ? "b-ok" : row.status === "date_set" ? "b-date" : "b-pending";
			const status_label = row.source === "POS" ? "POS" : row.status === "date_set" ? "Date Set" : row.status === "reconciled" ? "Reconciled" : "Pending";
			const action_label = row.status === "reconciled" ? "Cleared" : row.clearance ? "Set Clearance" : "Pending";
			const voucher_link = row.voucher && row.voucher_type
				? `<a class="cnbc-link" href="/app/${frappe.router.slug(row.voucher_type)}/${frappe.utils.escape_html(row.voucher)}" target="_blank">${frappe.utils.escape_html(row.voucher)}</a>`
				: "-";
			return `<tr class="${selected}">
				<td><input class="cnbc-check" type="checkbox" data-row-select data-id="${row.id}" ${checked}></td>
				<td>${this.to_display_date(row.date)}</td>
				<td><span class="cnbc-badge ${row.deposit ? "b-ok" : "b-dr"}">${frappe.utils.escape_html(row.type)}</span><div class="cnbc-doc-type">${frappe.utils.escape_html(row.source)}</div></td>
				<td>${frappe.utils.escape_html(row.description)}</td>
				<td class="cnbc-money-green">${row.deposit ? this.money(row.deposit) : "-"}</td>
				<td class="cnbc-money-red">${row.withdrawal ? this.money(row.withdrawal) : "-"}</td>
				<td>${voucher_link}</td>
				<td><span class="cnbc-badge ${status_class}">${status_label}</span></td>
				<td><input type="date" class="cnbc-date" data-clearance-date data-id="${row.id}" value="${row.clearance || row.date || ""}"></td>
				<td><span class="cnbc-doc-type">${action_label}</span></td>
			</tr>`;
		}).join("");
		this.$("[data-area='tbody']").html(html || `<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:28px">No entries loaded</td></tr>`);
		const deposit = filtered_rows.reduce((sum, row) => sum + row.deposit, 0);
		const withdrawal = filtered_rows.reduce((sum, row) => sum + row.withdrawal, 0);
		const start = filtered_rows.length ? (this.current_page - 1) * this.page_size + 1 : 0;
		const end = filtered_rows.length ? start + rows.length - 1 : 0;
		this.$("[data-area='row_info']").text(filtered_rows.length ? `Showing ${start}-${end} of ${filtered_rows.length} entries` : "Showing 0 entries");
		this.$("[data-area='totals']").html(`Deposit ${this.money(deposit)} - Withdrawal ${this.money(withdrawal)}`);
		this.render_pagination(filtered_rows.length);
	}

	// render_pagination(total_rows) {
	// 	if (!total_rows) {
	// 		this.$("[data-area='pagination']").html("");
	// 		return;
	// 	}
	// 	const total_pages = this.total_pages(total_rows);
	// 	this.$("[data-area='pagination']").html(`
	// 		<button class="cnbc-btn" data-page-action="prev" ${this.current_page <= 1 ? "disabled" : ""}>Previous</button>
	// 		<span class="cnbc-page-label">${this.current_page} / ${total_pages}</span>
	// 		<button class="cnbc-btn" data-page-action="next" ${this.current_page >= total_pages ? "disabled" : ""}>Next</button>
	// 	`);
	// }

	render_pagination(total_rows) {
			if (!total_rows) {
				this.$("[data-area='pagination']").html("");
				return;
			}

			const total_pages = this.total_pages(total_rows);

			this.$("[data-area='pagination']").html(`
				<button class="cnbc-btn" data-page-action="first" ${this.current_page <= 1 ? "disabled" : ""}>First</button>
				<button class="cnbc-btn" data-page-action="prev" ${this.current_page <= 1 ? "disabled" : ""}>Previous</button>

				<span class="cnbc-page-label">${this.current_page} / ${total_pages}</span>

				<button class="cnbc-btn" data-page-action="next" ${this.current_page >= total_pages ? "disabled" : ""}>Next</button>
				<button class="cnbc-btn" data-page-action="last" ${this.current_page >= total_pages ? "disabled" : ""}>Last</button>
			`);
		}

	update_selected_ui() {
		const count = this.selected.size;
		const rows = this.paginated_entries();
		this.$("[data-area='bulk']").toggleClass("show", count > 0);
		this.$("[data-area='bulk_count']").text(`${count} selected`);
		this.$("[data-field='select_all']").prop("checked", rows.length > 0 && rows.every((row) => this.selected.has(row.id)));
	}

	apply_selected_date() {
		if (!this.fetched) return frappe.msgprint(__("Please click Get Entries first."));
		if (!this.selected.size) return frappe.msgprint(__("Please select at least one row."));
		const bulk_date = this.to_server_date(this.$("[data-field='bulk_date']").val());
		if (!bulk_date) return frappe.msgprint(__("Please set a clearance date for the selected row(s)."));
		const selected_rows = this.entries.filter((row) => this.selected.has(row.id));
		const rows = selected_rows.filter((row) => row.status !== "reconciled");
		if (!rows.length) return frappe.msgprint(__("Selected rows are already reconciled."));
		rows.forEach((row) => {
			row.clearance = bulk_date;
			if (row.status === "pending") row.status = "date_set";
		});
		this.refresh();
	}

	clear_selected() {
		this.entries.forEach((row) => {
			if (this.selected.has(row.id) && row.status !== "reconciled") {
				row.clearance = "";
				row.status = "pending";
			}
		});
		this.selected.clear();
		this.refresh();
	}

	clear_filters() {
		this.clear_final_message();
		this.$("[data-field='search']").val("");
		this.$("[data-field='include_reconciled']").prop("checked", false);
		this.$("[data-field='include_pos']").prop("checked", false);
		this.active_tab = "all";
		this.reset_page();
		this.$("[data-tab]").removeClass("on");
		this.$("[data-tab='all']").addClass("on");
		this.selected.clear();
		this.refresh();
	}

	clear_filter_fields() {
		this.clear_final_message();
		this.$("[data-field='company']").val("");
		this.$("[data-field='ledger']").html(`<option value="">Select Company first</option>`);
		this.$("[data-field='bank_account']").html(`<option value="">Select Account first</option>`);
		this.$("[data-field='from_date']").val("");
		this.$("[data-field='to_date']").val("");
		this.fetched = false;
		this.summary = {};
		this.erp_balance = 0;
		this.entries = [];
		this.selected.clear();
		this.reset_page();
		this.refresh();
	}

	set_tab(button) {
		this.clear_final_message();
		this.reset_page();
		this.$("[data-tab]").removeClass("on");
		button.addClass("on");
		this.active_tab = button.data("tab");
		this.refresh();
	}

	async reconcile() {
		if (!this.fetched) return frappe.msgprint(__("Please click Get Entries first."));
		if (!this.selected.size) return frappe.msgprint(__("Please select at least one row."));
		const selected_rows = this.entries.filter((row) => this.selected.has(row.id));
		const pending_rows = selected_rows.filter((row) => row.status !== "reconciled");
		if (!pending_rows.length) return frappe.msgprint(__("Selected rows are already reconciled."));
		await this.save_clearance_dates(pending_rows);
	}

	async save_clearance_dates(rows) {
		const payload = rows.map((row) => ({
			voucher_type: row.voucher_type || row.payment_document,
			voucher_no: row.voucher_no || row.voucher,
			payment_document: row.voucher_type || row.payment_document,
			payment_entry: row.voucher_no || row.voucher,
			clearance_date: this.to_server_date(row.clearance),
		})).filter((row) => row.voucher_type && row.voucher_no && row.clearance_date);

		if (!payload.length) {
			frappe.msgprint(__("Please set a clearance date for the selected row(s)."));
			return;
		}

		const account = this.$("[data-field='ledger']").val();
		const result = await frappe.call({
			method: "bank_clearance_custom.page.custom_bank_clearance.custom_bank_clearance.clear_selected_entries",
			args: {
				entries: JSON.stringify(payload),
				clearance_date: payload[0].clearance_date,
				account,
			},
		});
		this.selected.clear();
		this.clear_final_message();
		await this.get_entries({ quiet: true });
		const message = (result.message && result.message.message) || __("Rows reconciled successfully.");
		this.$("[data-area='final_summary']").addClass("show").html(frappe.utils.escape_html(message));
		frappe.show_alert({ message, indicator: "green" }, 4);
	}

	clear_final_message() {
		this.$("[data-area='final_summary']").removeClass("show").html("");
	}

	export_csv() {
		const header = ["Date", "Type", "Description", "Deposit", "Withdrawal", "ERP Voucher", "Status", "Clearance Date"];
		const rows = this.filtered_entries().map((row) => [this.to_display_date(row.date), row.type, row.description, row.deposit, row.withdrawal, row.voucher, row.status, this.to_display_date(row.clearance)]);
		const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")).join("\n");
		const link = document.createElement("a");
		link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
		link.download = "custom-new-bank-clearance-export.csv";
		link.click();
	}

	to_display_date(value) {
		if (!value) return "";
		const text = String(value);
		if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
		const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
		return match ? `${match[3]}/${match[2]}/${match[1]}` : text;
	}

	to_server_date(value) {
		if (!value) return "";
		const text = String(value).trim();
		if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
		const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
		return match ? `${match[3]}-${match[2]}-${match[1]}` : text;
	}

	money(value, signed=false) {
		const number = Number(value || 0);
		const sign = signed && number > 0 ? "+" : signed && number < 0 ? "-" : "";
		const amount = Math.abs(number).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		return `<span class="cnbc-money">${sign}&#8377; ${amount}</span>`;
	}

	strip_html(value) {
		return String(value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
	}
}
