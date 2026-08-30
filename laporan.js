document.addEventListener("DOMContentLoaded", () => {
  renderShell("laporan", "Laporan");

  let currentPeriod = "semua";
  const customDateRow = document.getElementById("customDateRow");
  const customStart = document.getElementById("customStart");
  const customEnd = document.getElementById("customEnd");

  const filterButtons = document.querySelectorAll("#periodFilter .filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPeriod = btn.dataset.period;

      if (currentPeriod === "custom") {
        customDateRow.classList.add("show");
      } else {
        customDateRow.classList.remove("show");
        render();
      }
    });
  });

  document.getElementById("btnApplyCustom").addEventListener("click", () => {
    if (!customStart.value || !customEnd.value) {
      showNotification("Pilih tanggal mulai dan tanggal akhir", true);
      return;
    }
    render();
  });

  function render() {
    const all = getTransactions();
    const filtered = filterByPeriod(all, currentPeriod, customStart.value, customEnd.value);
    const summary = summarize(filtered);

    document.getElementById("statTotalTransaksi").textContent = summary.totalTransaksi;
    document.getElementById("statOmzet").textContent = formatRupiah(summary.totalOmzet);
    document.getElementById("statModal").textContent = formatRupiah(summary.totalModal);
    document.getElementById("statKeuntungan").textContent = formatRupiah(summary.totalKeuntungan);
    document.getElementById("statBagianSaya").textContent = formatRupiah(summary.totalBagianSaya);
    document.getElementById("statBagianUsaha").textContent = formatRupiah(summary.totalBagianUsaha);
  }

  render();
});
