// ISP Franchise Management System - Core Application Logic

class ISPApp {
  constructor() {
    this.storageKey = "FASTLINK_ISP_DATA_V1";
    this.state = this.loadState();
    this.currentTab = "dashboard";
    this.init();
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state, loading defaults", e);
      }
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    this.render();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Navigation
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-tab");
        this.showTab(tab);
      });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("open");
      });
    }

    // Quick add buttons in topbar
    document.getElementById("quickAddClientBtn")?.addEventListener("click", () => this.openClientModal());
    document.getElementById("quickAddExpenseBtn")?.addEventListener("click", () => this.openExpenseModal());
    document.getElementById("addClientBtn")?.addEventListener("click", () => this.openClientModal());
    document.getElementById("addExpenseBtn")?.addEventListener("click", () => this.openExpenseModal());
    document.getElementById("addInventoryBtn")?.addEventListener("click", () => this.promptAddInventory());

    // Search and filters
    document.getElementById("clientSearchInput")?.addEventListener("input", () => this.renderClients());
    document.getElementById("clientProviderFilter")?.addEventListener("change", () => this.renderClients());
    document.getElementById("clientStatusFilter")?.addEventListener("change", () => this.renderClients());

    document.getElementById("expenseSearchInput")?.addEventListener("input", () => this.renderExpenses());
    document.getElementById("expenseTypeFilter")?.addEventListener("change", () => this.renderExpenses());
    document.getElementById("expenseCategoryFilter")?.addEventListener("change", () => this.renderExpenses());

    document.getElementById("packageSearchInput")?.addEventListener("input", () => this.renderPackages());
    document.getElementById("packageCompanyFilter")?.addEventListener("change", () => this.renderPackages());

    // Client package selector sync
    document.getElementById("clientProvider")?.addEventListener("change", (e) => this.updateClientPackageDropdown(e.target.value));
    document.getElementById("clientPackage")?.addEventListener("change", (e) => this.onPackageSelected(e.target.value));

    // Forms
    document.getElementById("clientForm")?.addEventListener("submit", (e) => this.handleClientSubmit(e));
    document.getElementById("expenseForm")?.addEventListener("submit", (e) => this.handleExpenseSubmit(e));

    // Profit Calculator
    document.getElementById("calcProfitBtn")?.addEventListener("click", () => this.calculateProfitDistribution());

    // Settings & Backup
    document.getElementById("saveSettingsBtn")?.addEventListener("click", () => this.saveSettings());
    document.getElementById("exportBackupBtn")?.addEventListener("click", () => this.exportBackup());
    document.getElementById("exportClientsBtn")?.addEventListener("click", () => this.exportClientsCSV());
    document.getElementById("importBackupInput")?.addEventListener("change", (e) => this.importBackup(e));
    document.getElementById("resetDataBtn")?.addEventListener("click", () => this.resetData());
  }

  showTab(tabId, statusFilter = null) {
    this.currentTab = tabId;
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    const targetPane = document.getElementById(`tab-${tabId}`);
    const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    
    if (targetPane) targetPane.classList.add("active");
    if (navItem) navItem.classList.add("active");

    // Close mobile menu if open
    document.getElementById("sidebar").classList.remove("open");

    // Headings
    const titles = {
      dashboard: { h1: "Franchise Overview", sub: "August – October 2026 Financial & Operational Status" },
      clients: { h1: "Clients & Billing Directory", sub: "Manage client connections, monthly dues, and send WhatsApp bills" },
      expenses: { h1: "Expenses (Kharcha)", sub: "Track operational running costs vs capital equipment assets" },
      inventory: { h1: "Samaan & Hardware Inventory", sub: "Stock of OLT, ONTs, fiber cables, adapters and splitters" },
      packages: { h1: "Packages & Margins", sub: "Transworld & Ebone bandwidth pricing and profit margins" },
      investors: { h1: "Investors Capital & Shares", sub: "Investment hisab, equity shares, and automatic dividend distribution" },
      settings: { h1: "Settings & Backup", sub: "Franchise details, JSON data exports, and backups" }
    };

    if (titles[tabId]) {
      document.getElementById("pageHeading").innerText = titles[tabId].h1;
      document.getElementById("pageSubHeading").innerText = titles[tabId].sub;
    }

    if (tabId === "clients" && statusFilter) {
      const select = document.getElementById("clientStatusFilter");
      if (select) {
        select.value = statusFilter;
        this.renderClients();
      }
    }
  }

  render() {
    this.renderDashboard();
    this.renderClients();
    this.renderExpenses();
    this.renderInventory();
    this.renderPackages();
    this.renderInvestors();
    this.calculateProfitDistribution();
  }

  // ================= 1. DASHBOARD =================
  renderDashboard() {
    const clients = this.state.clients;
    const expenses = this.state.expenses;
    const inventory = this.state.inventory;
    const investors = this.state.investors;

    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === "Paid").length;
    const pendingClients = clients.filter(c => c.status === "Pending");

    // Monthly summary calculation
    const octRevenue = clients.filter(c => c.status !== "Office Line").reduce((acc, c) => acc + (Number(c.price) || 0), 0);
    const octPanelCost = clients.filter(c => c.status !== "Office Line").reduce((acc, c) => acc + (Number(c.cost) || 0), 0);
    const octGrossMargin = octRevenue - octPanelCost;

    // Total 3-month stats (Aug + Sep + Oct from sheet)
    const totalRev3Mo = 65000;
    const totalPanelCost3Mo = 37354;
    const totalGrossMargin3Mo = totalRev3Mo - totalPanelCost3Mo;

    // CapEx vs OpEx
    let capexTotal = 0;
    let opexTotal = 0;
    expenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      if (e.type === "CapEx") {
        capexTotal += amt;
      } else {
        opexTotal += amt;
      }
    });

    const totalInvestment = investors.reduce((acc, i) => acc + (Number(i.amount) || 0), 13000000);
    // Unspent cash: Total Investment - CapEx - (OpEx - GrossMargin)
    const netOperationalDeficit = opexTotal - totalGrossMargin3Mo;
    const unspentCash = totalInvestment - capexTotal - (netOperationalDeficit > 0 ? netOperationalDeficit : 0);

    document.getElementById("kpiActiveClients").innerText = `${activeClients}`;
    document.getElementById("kpiTotalRevenue").innerText = `PKR ${totalRev3Mo.toLocaleString()}`;
    document.getElementById("kpiGrossMargin").innerText = `PKR ${totalGrossMargin3Mo.toLocaleString()}`;
    document.getElementById("kpiCashInHand").innerText = `PKR ${(unspentCash / 1000000).toFixed(2)} M`;

    document.getElementById("capexTotalDisplay").innerText = `PKR ${capexTotal.toLocaleString()}`;
    document.getElementById("opexTotalDisplay").innerText = `PKR ${opexTotal.toLocaleString()}`;

    // Pending Alert text
    if (pendingClients.length > 0) {
      const names = pendingClients.map(c => c.name).join(", ");
      document.getElementById("pendingAlertText").innerText = `${pendingClients.length} clients have pending October bills (${names}).`;
    } else {
      document.getElementById("pendingAlertText").innerText = "All registered clients are fully paid for October!";
    }

    // Monthly Table
    const monthlyData = [
      { month: "2026-Aug", clients: 3, rev: 7300, panel: 4130, margin: 3170, exp: 278200, net: -275030, note: "Initial setup & machine purchase" },
      { month: "2026-Sep", clients: 13, rev: 28300, panel: 16238, margin: 12062, exp: 51092, net: -39030, note: "Strong 333% client expansion" },
      { month: "2026-Oct", clients: 14, rev: 29400, panel: 16986, margin: 12414, exp: 87544, net: -75130, note: "Stable base + 4 pending bills" },
      { month: "Total / Avg", clients: 18, rev: 65000, panel: 37354, margin: 27646, exp: 416836, net: -389190, isTotal: true }
    ];

    const tbody = document.getElementById("monthlySummaryBody");
    tbody.innerHTML = monthlyData.map(m => `
      <tr style="${m.isTotal ? 'font-weight:bold; background:#f1f5f9;' : ''}">
        <td>${m.month}</td>
        <td>${m.clients}</td>
        <td>PKR ${m.rev.toLocaleString()}</td>
        <td>PKR ${m.panel.toLocaleString()}</td>
        <td style="color:#16a34a; font-weight:600;">PKR ${m.margin.toLocaleString()}</td>
        <td style="color:#dc2626;">PKR ${m.exp.toLocaleString()}</td>
        <td style="color:${m.net >= 0 ? '#16a34a' : '#ef4444'}; font-weight:700;">PKR ${m.net.toLocaleString()}</td>
      </tr>
    `).join("");
  }

  // ================= 2. CLIENTS & BILLING =================
  renderClients() {
    const searchTerm = (document.getElementById("clientSearchInput")?.value || "").toLowerCase();
    const providerFilter = document.getElementById("clientProviderFilter")?.value || "ALL";
    const statusFilter = document.getElementById("clientStatusFilter")?.value || "ALL";

    let filtered = this.state.clients.filter(client => {
      const matchSearch = client.name.toLowerCase().includes(searchTerm) ||
                          client.phone.toLowerCase().includes(searchTerm) ||
                          (client.address && client.address.toLowerCase().includes(searchTerm)) ||
                          (client.id && client.id.toLowerCase().includes(searchTerm));
      const matchProvider = providerFilter === "ALL" || client.provider === providerFilter;
      const matchStatus = statusFilter === "ALL" || client.status === statusFilter;
      return matchSearch && matchProvider && matchStatus;
    });

    const tbody = document.getElementById("clientsTableBody");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">No clients found matching your search.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(client => {
      const isPaid = client.status === "Paid";
      const isOffice = client.status === "Office Line";
      const badgeClass = isPaid ? "badge-paid" : (isOffice ? "badge-office" : "badge-pending");
      const providerClass = client.provider === "Transworld" ? "badge-transworld" : "badge-ebone";

      return `
        <tr>
          <td>
            <strong>${client.name}</strong><br>
            <span style="font-size:11px; color:#94a3b8;">${client.id || 'N/A'}</span>
          </td>
          <td>
            <a href="tel:${client.phone}" style="color:#2563eb; text-decoration:none;">${client.phone}</a>
          </td>
          <td style="max-width:240px; font-size:12px; color:#475569;">
            ${client.address || 'Quetta'}
          </td>
          <td><span class="badge ${providerClass}">${client.provider}</span></td>
          <td>
            <strong>${client.package}</strong><br>
            <span style="font-size:11px; color:#16a34a;">Bachat: PKR ${client.profit || 0}</span>
          </td>
          <td><strong>PKR ${(Number(client.price) || 0).toLocaleString()}</strong></td>
          <td>
            <span class="badge ${badgeClass}" style="cursor:pointer;" onclick="app.toggleClientStatus('${client.id}')">
              ${client.status} ⇄
            </span>
            ${client.remarks ? `<br><span style="font-size:11px; color:#f59e0b;">${client.remarks}</span>` : ''}
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-whatsapp" title="Send WhatsApp Bill" onclick="app.sendWhatsAppBill('${client.id}')">
                💬 Bill
              </button>
              <button class="btn btn-sm btn-outline" title="Print Invoice" onclick="app.showInvoice('${client.id}')">
                🧾 Print
              </button>
              <button class="btn btn-sm btn-outline" title="Edit" onclick="app.editClient('${client.id}')">
                ✏️
              </button>
              <button class="btn btn-sm btn-outline" style="color:#ef4444;" title="Delete" onclick="app.deleteClient('${client.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  toggleClientStatus(clientId) {
    const client = this.state.clients.find(c => c.id === clientId);
    if (!client) return;
    if (client.status === "Paid") {
      client.status = "Pending";
    } else if (client.status === "Pending") {
      client.status = "Paid";
      delete client.remarks;
    }
    this.saveState();
  }

  sendWhatsAppBill(clientId) {
    const client = this.state.clients.find(c => c.id === clientId);
    if (!client) return;

    // Clean phone number: remove dashes, leading 0 to 92
    let cleanPhone = client.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const message = `Assalam-o-Alaikum ${client.name} sb!
Yeh FastLink Fiber Internet (Quetta) ki taraf se October 2026 ka bill hai:

• Package: ${client.package} (${client.provider})
• Amount Payable: PKR ${client.price.toLocaleString()}
• Current Status: ${client.status}

Baraye meharbani apna bill ada farma dein taake aap ki internet service be-khalal chalti rahe.
Shukriya! Helpline: 0321-3246541`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, "_blank");
  }

  showInvoice(clientId) {
    const client = this.state.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById("invClientName").innerText = client.name;
    document.getElementById("invClientPhone").innerText = client.phone;
    document.getElementById("invPackage").innerText = `${client.package} (${client.provider})`;
    document.getElementById("invAddress").innerText = client.address || "Quetta";
    document.getElementById("invAmount").innerText = `PKR ${(Number(client.price) || 0).toLocaleString()}`;
    
    const badge = document.getElementById("invStatusBadge");
    if (client.status === "Paid") {
      badge.innerText = "STATUS: PAID (PAID FULL)";
      badge.style.color = "#16a34a";
    } else {
      badge.innerText = "STATUS: PAYMENT PENDING";
      badge.style.color = "#dc2626";
    }

    this.openModal("invoiceModal");
  }

  openClientModal(clientId = null) {
    const isEdit = !!clientId;
    document.getElementById("clientModalTitle").innerText = isEdit ? "Edit Client Details" : "Add New Client";
    document.getElementById("clientId").value = clientId || "";
    
    if (isEdit) {
      const client = this.state.clients.find(c => c.id === clientId);
      if (client) {
        document.getElementById("clientName").value = client.name;
        document.getElementById("clientPhone").value = client.phone;
        document.getElementById("clientAddress").value = client.address || "";
        document.getElementById("clientProvider").value = client.provider;
        this.updateClientPackageDropdown(client.provider, client.package);
        document.getElementById("clientPrice").value = client.price;
        document.getElementById("clientStatus").value = client.status;
        document.getElementById("clientDueDay").value = client.dueDay || 1;
      }
    } else {
      document.getElementById("clientForm").reset();
      document.getElementById("clientId").value = "";
      this.updateClientPackageDropdown("Transworld");
    }

    this.openModal("clientModal");
  }

  updateClientPackageDropdown(provider, selectedPkgName = null) {
    const pkgSelect = document.getElementById("clientPackage");
    if (!pkgSelect) return;
    const pkgs = this.state.packages.filter(p => p.company === provider);
    
    pkgSelect.innerHTML = pkgs.map(p => `
      <option value="${p.name}" ${selectedPkgName === p.name ? 'selected' : ''}>
        ${p.name} - PKR ${p.price} (Margin: ${p.profit})
      </option>
    `).join("");

    if (!selectedPkgName && pkgs.length > 0) {
      this.onPackageSelected(pkgs[0].name);
    }
  }

  onPackageSelected(pkgName) {
    const pkg = this.state.packages.find(p => p.name === pkgName);
    if (pkg) {
      document.getElementById("clientPrice").value = pkg.price;
    }
  }

  handleClientSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("clientId").value || `c-${Date.now()}`;
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const address = document.getElementById("clientAddress").value.trim();
    const provider = document.getElementById("clientProvider").value;
    const packageName = document.getElementById("clientPackage").value;
    const price = Number(document.getElementById("clientPrice").value) || 0;
    const status = document.getElementById("clientStatus").value;
    const dueDay = Number(document.getElementById("clientDueDay").value) || 1;

    // Find cost from package matrix
    const pkg = this.state.packages.find(p => p.name === packageName && p.company === provider) || {};
    const cost = pkg.cost || (price * 0.55);
    const profit = price - cost;

    const existingIndex = this.state.clients.findIndex(c => c.id === id);
    const clientData = {
      id,
      name,
      phone,
      address,
      provider,
      package: packageName,
      price,
      cost,
      profit,
      status,
      dueDay,
      connDate: existingIndex >= 0 ? this.state.clients[existingIndex].connDate : new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    if (existingIndex >= 0) {
      this.state.clients[existingIndex] = { ...this.state.clients[existingIndex], ...clientData };
    } else {
      this.state.clients.push(clientData);
    }

    this.saveState();
    this.closeModal("clientModal");
  }

  deleteClient(clientId) {
    if (confirm("Are you sure you want to delete this client?")) {
      this.state.clients = this.state.clients.filter(c => c.id !== clientId);
      this.saveState();
    }
  }

  editClient(clientId) {
    this.openClientModal(clientId);
  }

  // ================= 3. EXPENSES =================
  renderExpenses() {
    const searchTerm = (document.getElementById("expenseSearchInput")?.value || "").toLowerCase();
    const typeFilter = document.getElementById("expenseTypeFilter")?.value || "ALL";
    const categoryFilter = document.getElementById("expenseCategoryFilter")?.value || "ALL";

    let filtered = this.state.expenses.filter(item => {
      const matchSearch = (item.desc && item.desc.toLowerCase().includes(searchTerm)) ||
                          (item.paidTo && item.paidTo.toLowerCase().includes(searchTerm)) ||
                          (item.category && item.category.toLowerCase().includes(searchTerm));
      const matchType = typeFilter === "ALL" || item.type === typeFilter;
      const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchSearch && matchType && matchCategory;
    });

    const tbody = document.getElementById("expensesTableBody");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#94a3b8;">No expenses found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const typeBadge = item.type === "CapEx" ? "badge-capex" : "badge-opex";
      return `
        <tr>
          <td>${item.date}</td>
          <td><span class="badge ${typeBadge}">${item.type}</span></td>
          <td><strong>${item.category}</strong></td>
          <td>${item.desc || '-'}</td>
          <td>${item.paidTo || 'Misc'}</td>
          <td><strong>PKR ${(Number(item.amount) || 0).toLocaleString()}</strong></td>
          <td>${item.method || 'Cash'}</td>
          <td style="font-size:12px; color:#64748b;">${item.remarks || '-'}</td>
          <td>
            <button class="btn btn-sm btn-outline" style="color:#ef4444;" onclick="app.deleteExpense(${item.id})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  openExpenseModal() {
    document.getElementById("expenseForm").reset();
    document.getElementById("expenseDate").value = new Date().toISOString().substring(0, 10);
    this.openModal("expenseModal");
  }

  handleExpenseSubmit(e) {
    e.preventDefault();
    const date = document.getElementById("expenseDate").value;
    const type = document.getElementById("expenseType").value;
    const category = document.getElementById("expenseCategory").value;
    const amount = Number(document.getElementById("expenseAmount").value) || 0;
    const paidTo = document.getElementById("expensePaidTo").value.trim();
    const method = document.getElementById("expenseMethod").value;
    const desc = document.getElementById("expenseDesc").value.trim();

    const newExpense = {
      id: Date.now(),
      date,
      type,
      category,
      amount,
      paidTo,
      method,
      desc
    };

    this.state.expenses.unshift(newExpense);
    this.saveState();
    this.closeModal("expenseModal");
  }

  deleteExpense(id) {
    if (confirm("Delete this expense entry?")) {
      this.state.expenses = this.state.expenses.filter(e => e.id !== id);
      this.saveState();
    }
  }

  // ================= 4. INVENTORY =================
  renderInventory() {
    const tbody = document.getElementById("inventoryTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.state.inventory.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.unit}</td>
        <td><strong>${item.totalQty}</strong></td>
        <td>${item.usedQty}</td>
        <td><strong style="color:${item.remainingQty > 0 ? '#16a34a' : '#64748b'};">${item.remainingQty}</strong></td>
        <td>PKR ${(Number(item.cost) || 0).toLocaleString()}</td>
        <td style="font-size:12px; color:#64748b;">${item.remarks || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="app.editStock(${item.id})">✏️ Edit</button>
        </td>
      </tr>
    `).join("");
  }

  editStock(id) {
    const item = this.state.inventory.find(i => i.id === id);
    if (!item) return;

    const newTotal = prompt(`Total Quantity for ${item.name}:`, item.totalQty);
    if (newTotal === null) return;
    const newUsed = prompt(`Used / Deployed Quantity:`, item.usedQty);
    if (newUsed === null) return;
    const newCost = prompt(`Total Cost (PKR):`, item.cost);
    if (newCost === null) return;

    item.totalQty = Number(newTotal) || 0;
    item.usedQty = Number(newUsed) || 0;
    item.remainingQty = Math.max(0, item.totalQty - item.usedQty);
    item.cost = Number(newCost) || 0;

    this.saveState();
  }

  promptAddInventory() {
    const name = prompt("Enter Item Name (e.g., 24-Port OLT or 2-Core Drop Wire):");
    if (!name) return;
    const unit = prompt("Unit (e.g., Pcs, Meters, Box):", "Pcs");
    const totalQty = Number(prompt("Total Quantity Received:", "10")) || 0;
    const cost = Number(prompt("Total Cost in PKR:", "0")) || 0;

    this.state.inventory.push({
      id: Date.now(),
      name,
      unit: unit || "Pcs",
      totalQty,
      usedQty: 0,
      remainingQty: totalQty,
      cost,
      remarks: "Newly added stock"
    });

    this.saveState();
  }

  // ================= 5. PACKAGES =================
  renderPackages() {
    const searchTerm = (document.getElementById("packageSearchInput")?.value || "").toLowerCase();
    const companyFilter = document.getElementById("packageCompanyFilter")?.value || "ALL";

    let filtered = this.state.packages.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm);
      const matchCompany = companyFilter === "ALL" || p.company === companyFilter;
      return matchSearch && matchCompany;
    });

    const tbody = document.getElementById("packagesTableBody");
    if (!tbody) return;

    tbody.innerHTML = filtered.map(p => {
      const marginPct = ((p.profit / p.price) * 100).toFixed(1);
      const companyBadge = p.company === "Transworld" ? "badge-transworld" : "badge-ebone";
      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td><span class="badge ${companyBadge}">${p.company}</span></td>
          <td>PKR ${p.price.toLocaleString()}</td>
          <td>PKR ${p.cost.toLocaleString()}</td>
          <td style="color:#16a34a; font-weight:700;">PKR ${p.profit.toLocaleString()}</td>
          <td><strong style="color:${marginPct > 40 ? '#16a34a' : '#d97706'}">${marginPct}%</strong></td>
        </tr>
      `;
    }).join("");
  }

  // ================= 6. INVESTORS =================
  renderInvestors() {
    const tbody = document.getElementById("investorsTableBody");
    if (!tbody) return;

    const totalInv = this.state.investors.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    tbody.innerHTML = this.state.investors.map(inv => {
      const actualPct = totalInv > 0 ? ((inv.amount / totalInv) * 100).toFixed(2) : 0;
      return `
        <tr>
          <td><strong>${inv.name}</strong></td>
          <td><strong>PKR ${Number(inv.amount).toLocaleString()}</strong></td>
          <td><span class="badge badge-capex">${actualPct}%</span></td>
          <td>PKR ${(Number(inv.profitPaid) || 0).toLocaleString()}</td>
          <td>${inv.method || 'Online'}</td>
          <td style="font-size:12px; color:#64748b;">${inv.notes || '-'}</td>
        </tr>
      `;
    }).join("") + `
      <tr style="background:#f8fafc; font-weight:bold;">
        <td>TOTAL</td>
        <td>PKR ${totalInv.toLocaleString()}</td>
        <td>100.00%</td>
        <td>PKR 0</td>
        <td>-</td>
        <td>All initial capital secured</td>
      </tr>
    `;
  }

  calculateProfitDistribution() {
    const profitInput = document.getElementById("profitCalcInput");
    const amount = Number(profitInput ? profitInput.value : 100000) || 0;
    const totalInv = this.state.investors.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    const container = document.getElementById("profitDistributionResult");
    if (!container) return;

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table" style="background:#fff;">
          <thead>
            <tr>
              <th>Investor Name</th>
              <th>Investment</th>
              <th>Share %</th>
              <th>Calculated Profit Share (PKR)</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.investors.map(inv => {
              const pct = totalInv > 0 ? (inv.amount / totalInv) : 0;
              const payout = Math.round(amount * pct);
              return `
                <tr>
                  <td><strong>${inv.name}</strong></td>
                  <td>PKR ${inv.amount.toLocaleString()}</td>
                  <td>${(pct * 100).toFixed(2)}%</td>
                  <td style="color:#16a34a; font-weight:bold; font-size:14px;">PKR ${payout.toLocaleString()}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // ================= 7. BACKUP & UTILITIES =================
  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `ISP_Management_Backup_${new Date().toISOString().substring(0,10)}.json`);
    dlAnchor.click();
  }

  exportClientsCSV() {
    let csv = "Client ID,Client Name,Phone,Address,Provider,Package,Price,Panel Cost,Profit,Status,Due Day\n";
    this.state.clients.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.phone}","${c.address || ''}","${c.provider}","${c.package}",${c.price},${c.cost},${c.profit},"${c.status}",${c.dueDay || 1}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ISP_Clients_${new Date().toISOString().substring(0,10)}.csv`;
    a.click();
  }

  importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.clients && imported.expenses && imported.investors) {
          this.state = imported;
          this.saveState();
          alert("Backup restored successfully!");
        } else {
          alert("Invalid backup file structure.");
        }
      } catch (err) {
        alert("Error reading file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  resetData() {
    if (confirm("Reset everything back to the original spreadsheet data? Any unsaved edits will be lost.")) {
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.saveState();
      alert("Reset to initial spreadsheet data complete!");
    }
  }

  saveSettings() {
    const name = document.getElementById("settingFranchiseName").value;
    const phone = document.getElementById("settingPhone").value;
    const address = document.getElementById("settingAddress").value;

    this.state.settings.franchiseName = name;
    this.state.settings.phone = phone;
    this.state.settings.address = address;

    document.getElementById("brandFranchiseName").innerText = name;
    this.saveState();
    alert("Settings saved successfully!");
  }

  openModal(id) {
    document.getElementById(id)?.classList.add("open");
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove("open");
  }
}

// Global App Instance
let app;
window.addEventListener("DOMContentLoaded", () => {
  app = new ISPApp();
});
