/* ==========================================================================
   Print Business Tracker — Core (storage, calc, sidebar, notifications)
   ========================================================================== */
 
const STORAGE_KEYS = {
  TRANSACTIONS: "transactions",
  SETTINGS: "settings",
  COST_CONFIG: "costConfiguration",
};
 
const DEFAULT_SETTINGS = {
  namaUsaha: "",
  namaPengguna: "",
  persenSaya: 40,
  persenUsaha: 60,
  targetBagianSaya: 500000,
  mataUang: "Rp",
};
 
const DEFAULT_COST_CONFIG = {
  kertas: { A4: 112, F4: 120 },
  tinta: { hitamPutih: 15, fullWarna: 40 },
};
 
/* ---------------------------------- Storage ------------------------------ */
 
function getTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
  } catch (e) {
    return [];
  }
}
 
function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}
 
function getSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
    return saved ? Object.assign({}, DEFAULT_SETTINGS, saved) : Object.assign({}, DEFAULT_SETTINGS);
  } catch (e) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}
 
function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
 
function getCostConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.COST_CONFIG));
    if (!saved) return JSON.parse(JSON.stringify(DEFAULT_COST_CONFIG));
    return {
      kertas: Object.assign({}, DEFAULT_COST_CONFIG.kertas, saved.kertas),
      tinta: Object.assign({}, DEFAULT_COST_CONFIG.tinta, saved.tinta),
    };
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_COST_CONFIG));
  }
}
 
function saveCostConfig(config) {
  localStorage.setItem(STORAGE_KEYS.COST_CONFIG, JSON.stringify(config));
}
 
/* ---------------------------------- Formatting ---------------------------- */
 
function formatRupiah(num) {
  const n = Math.round(Number(num) || 0);
  return "Rp" + n.toLocaleString("id-ID");
}
 
function formatDateDisplay(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}
 
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
 
function genId() {
  return "tx_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}
 
/* ---------------------------------- Calculation --------------------------- */
 
/**
 * Calculate all derived financial fields for a transaction input.
 * input: { ukuranKertas, jenisPrint, jumlah, jumlahHitamPutih, jumlahWarna, hargaJual }
 * Returns computed fields or { error } if invalid.
 */
function calculateTransaction(input) {
  const costConfig = getCostConfig();
  const settings = getSettings();
 
  const ukuranKertas = input.ukuranKertas;
  const jenisPrint = input.jenisPrint;
  const jumlah = Number(input.jumlah) || 0;
  const hargaJual = Number(input.hargaJual) || 0;
  let jumlahHitamPutih = Number(input.jumlahHitamPutih) || 0;
  let jumlahWarna = Number(input.jumlahWarna) || 0;
 
  if (jumlah <= 0) {
    return { error: "Jumlah harus lebih dari 0" };
  }
  if (hargaJual < 0) {
    return { error: "Harga jual tidak boleh negatif" };
  }
 
  const hargaKertas = costConfig.kertas[ukuranKertas];
  if (hargaKertas === undefined) {
    return { error: "Ukuran kertas tidak valid" };
  }
 
  if (jenisPrint === "Campur") {
    if (jumlahHitamPutih + jumlahWarna !== jumlah) {
      return { error: "Jumlah Hitam Putih + Warna harus sama dengan Total Jumlah" };
    }
  } else if (jenisPrint === "Hitam Putih") {
    jumlahHitamPutih = jumlah;
    jumlahWarna = 0;
  } else if (jenisPrint === "Full Warna") {
    jumlahHitamPutih = 0;
    jumlahWarna = jumlah;
  } else {
    return { error: "Jenis print tidak valid" };
  }
 
  const pendapatan = jumlah * hargaJual;
  const modalKertas = jumlah * hargaKertas;
  const modalTinta =
    jumlahHitamPutih * costConfig.tinta.hitamPutih + jumlahWarna * costConfig.tinta.fullWarna;
  const totalModal = modalKertas + modalTinta;
  const keuntungan = pendapatan - totalModal;
 
  const persenBagianSaya = Number(settings.persenSaya) || 0;
  const bagianSaya = keuntungan * (persenBagianSaya / 100);
  const bagianUsaha = keuntungan - bagianSaya;
 
  return {
    ukuranKertas,
    jenisPrint,
    jumlah,
    jumlahHitamPutih,
    jumlahWarna,
    hargaJual,
    pendapatan,
    modalKertas,
    modalTinta,
    totalModal,
    keuntungan,
    persenBagianSaya,
    bagianSaya,
    bagianUsaha,
  };
}
 
/* ---------------------------------- Period filtering ----------------------- */
 
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
 
function filterByPeriod(transactions, period, customStart, customEnd) {
  if (period === "semua") return transactions;
 
  const now = new Date();
  now.setHours(0, 0, 0, 0);
 
  return transactions.filter((tx) => {
    const txDate = new Date(tx.tanggal + "T00:00:00");
    if (isNaN(txDate.getTime())) return false;
 
    if (period === "hari-ini") {
      return txDate.getTime() === now.getTime();
    }
    if (period === "minggu-ini") {
      const monday = startOfWeek(new Date(now));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return txDate >= monday && txDate <= sunday;
    }
    if (period === "bulan-ini") {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (period === "tahun-ini") {
      return txDate.getFullYear() === now.getFullYear();
    }
    if (period === "custom") {
      if (!customStart || !customEnd) return true;
      const start = new Date(customStart + "T00:00:00");
      const end = new Date(customEnd + "T23:59:59");
      return txDate >= start && txDate <= end;
    }
    return true;
  });
}
 
function summarize(transactions) {
  const summary = {
    totalTransaksi: transactions.length,
    totalOmzet: 0,
    totalModal: 0,
    totalKeuntungan: 0,
    totalBagianSaya: 0,
    totalBagianUsaha: 0,
  };
  transactions.forEach((tx) => {
    summary.totalOmzet += tx.pendapatan || 0;
    summary.totalModal += tx.totalModal || 0;
    summary.totalKeuntungan += tx.keuntungan || 0;
    summary.totalBagianSaya += tx.bagianSaya || 0;
    summary.totalBagianUsaha += tx.bagianUsaha || 0;
  });
  return summary;
}
 
/* ---------------------------------- Notifications -------------------------- */
 
function showNotification(message, isError) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " error" : "");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}
 
/* ---------------------------------- Sidebar / Nav --------------------------- */
 
const NAV_ITEMS = [
  {
    href: "index.html",
    label: "Dashboard",
    key: "dashboard",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  },
  {
    href: "transaksi.html",
    label: "Transaksi",
    key: "transaksi",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></svg>',
  },
  {
    href: "laporan.html",
    label: "Laporan",
    key: "laporan",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  },
  {
    href: "bagian-saya.html",
    label: "Bagian Saya",
    key: "bagian-saya",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  },
  {
    href: "pengaturan.html",
    label: "Pengaturan",
    key: "pengaturan",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  },
];
 
function renderShell(activeKey, pageTitle) {
  const settings = getSettings();
  const namaUsaha = settings.namaUsaha || "Print Tracker";
  const namaPengguna = settings.namaPengguna || "Pemilik";
  const initials = namaUsaha
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";
 
  const navLinksHtml = NAV_ITEMS.map(
    (item) => `
      <a href="${item.href}" class="sidebar-link${item.key === activeKey ? " active" : ""}">
        ${item.icon}
        <span>${item.label}</span>
      </a>`
  ).join("");
 
  const sidebarHtml = `
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">${initials}</div>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-name">${escapeHtml(namaUsaha)}</div>
          <div class="sidebar-brand-sub">${escapeHtml(namaPengguna)}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${navLinksHtml}
      </nav>
    </aside>
  `;
 
  const topbarHtml = `
    <div class="topbar">
      <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="topbar-title">${pageTitle}</div>
    </div>
  `;
 
  const shellStart = document.getElementById("shell-sidebar");
  const shellTop = document.getElementById("shell-topbar");
  if (shellStart) shellStart.outerHTML = sidebarHtml;
  if (shellTop) shellTop.outerHTML = topbarHtml;
 
  initSidebarToggle();
}
 
function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const hamburger = document.getElementById("hamburgerBtn");
 
  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }
  function toggleSidebar() {
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
 
  if (hamburger) {
    hamburger.addEventListener("click", toggleSidebar);
  }
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }
  sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => {
      closeSidebar();
    });
  });
}
 
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
 
