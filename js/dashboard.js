document.addEventListener("DOMContentLoaded", () => {
  renderShell("dashboard", "Dashboard");

  let currentPeriod = "semua";

  const filterButtons = document.querySelectorAll("#periodFilter .filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPeriod = btn.dataset.period;
      render();
    });
  });

  function render() {
    const all = getTransactions();
    const filtered = filterByPeriod(all, currentPeriod);
    const summary = summarize(filtered);

    document.getElementById("statOmzet").textContent = formatRupiah(summary.totalOmzet);
    document.getElementById("statModal").textContent = formatRupiah(summary.totalModal);
    document.getElementById("statKeuntungan").textContent = formatRupiah(summary.totalKeuntungan);
    document.getElementById("statBagianSaya").textContent = formatRupiah(summary.totalBagianSaya);
    document.getElementById("statBagianUsaha").textContent = formatRupiah(summary.totalBagianUsaha);
    document.getElementById("statTotalTransaksi").textContent = summary.totalTransaksi;
  }

  render();
});
