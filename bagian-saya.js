document.addEventListener("DOMContentLoaded", () => {
  renderShell("bagian-saya", "Bagian Saya");

  function render() {
    const all = getTransactions();
    const settings = getSettings();

    const hariIni = summarize(filterByPeriod(all, "hari-ini")).totalBagianSaya;
    const mingguIni = summarize(filterByPeriod(all, "minggu-ini")).totalBagianSaya;
    const bulanIni = summarize(filterByPeriod(all, "bulan-ini")).totalBagianSaya;
    const tahunIni = summarize(filterByPeriod(all, "tahun-ini")).totalBagianSaya;
    const total = summarize(all).totalBagianSaya;

    document.getElementById("statHariIni").textContent = formatRupiah(hariIni);
    document.getElementById("statMingguIni").textContent = formatRupiah(mingguIni);
    document.getElementById("statBulanIni").textContent = formatRupiah(bulanIni);
    document.getElementById("statTahunIni").textContent = formatRupiah(tahunIni);
    document.getElementById("statTotal").textContent = formatRupiah(total);

    const target = Number(settings.targetBagianSaya) || 0;
    const tercapai = bulanIni;
    const percent = target > 0 ? Math.min(100, Math.round((tercapai / target) * 100)) : 0;

    document.getElementById("targetValue").textContent = formatRupiah(target);
    document.getElementById("tercapaiValue").textContent = formatRupiah(tercapai);
    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressPercent").textContent = percent + "%";
  }

  render();
});
