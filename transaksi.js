document.addEventListener("DOMContentLoaded", () => {
  renderShell("transaksi", "Transaksi");

  const formCard = document.getElementById("formCard");
  const form = document.getElementById("transaksiForm");
  const editIdInput = document.getElementById("editId");
  const formTitle = document.getElementById("formTitle");

  const fTanggal = document.getElementById("fTanggal");
  const fPelanggan = document.getElementById("fPelanggan");
  const fUkuranKertas = document.getElementById("fUkuranKertas");
  const fJenisPrint = document.getElementById("fJenisPrint");
  const fJumlahBW = document.getElementById("fJumlahBW");
  const fJumlahWarna = document.getElementById("fJumlahWarna");
  const fJumlah = document.getElementById("fJumlah");
  const fHargaJual = document.getElementById("fHargaJual");
  const fCatatan = document.getElementById("fCatatan");

  const campurRow1 = document.getElementById("campurRow1");
  const campurRow2 = document.getElementById("campurRow2");
  const errJumlah = document.getElementById("errJumlah");

  const settings = getSettings();
  document.getElementById("pvLabelSaya").textContent = `Bagian Saya (${settings.persenSaya}%)`;
  document.getElementById("pvLabelUsaha").textContent = `Bagian Usaha (${settings.persenUsaha}%)`;

  let searchQuery = "";

  /* ------------------------- Form show/hide ------------------------- */

  function openForm(editTx) {
    form.reset();
    fTanggal.value = todayISO();
    fUkuranKertas.value = "A4";
    fJenisPrint.value = "Hitam Putih";
    fJumlahBW.value = 0;
    fJumlahWarna.value = 0;
    editIdInput.value = "";
    formTitle.textContent = "Tambah Transaksi Baru";

    if (editTx) {
      editIdInput.value = editTx.id;
      formTitle.textContent = "Edit Transaksi";
      fTanggal.value = editTx.tanggal;
      fPelanggan.value = editTx.pelanggan || "";
      fUkuranKertas.value = editTx.ukuranKertas;
      fJenisPrint.value = editTx.jenisPrint;
      fJumlahBW.value = editTx.jumlahHitamPutih || 0;
      fJumlahWarna.value = editTx.jumlahWarna || 0;
      fJumlah.value = editTx.jumlah;
      fHargaJual.value = editTx.hargaJual;
      fCatatan.value = editTx.catatan || "";
    }

    updateCampurVisibility();
    updatePreview();
    formCard.style.display = "block";
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeForm() {
    formCard.style.display = "none";
    form.reset();
  }

  document.getElementById("btnTambahTransaksi").addEventListener("click", () => openForm(null));
  document.getElementById("btnCloseForm").addEventListener("click", closeForm);

  /* ------------------------- Campur field visibility ------------------------- */

  function updateCampurVisibility() {
    const isCampur = fJenisPrint.value === "Campur";
    campurRow1.style.display = isCampur ? "flex" : "none";
    campurRow2.style.display = isCampur ? "flex" : "none";
  }

  fJenisPrint.addEventListener("change", () => {
    updateCampurVisibility();
    updatePreview();
  });

  /* ------------------------- Real-time preview ------------------------- */

  function currentInput() {
    return {
      ukuranKertas: fUkuranKertas.value,
      jenisPrint: fJenisPrint.value,
      jumlah: fJumlah.value,
      jumlahHitamPutih: fJumlahBW.value,
      jumlahWarna: fJumlahWarna.value,
      hargaJual: fHargaJual.value,
    };
  }

  function updatePreview() {
    const result = calculateTransaction(currentInput());

    if (result.error) {
      document.getElementById("pvPendapatan").textContent = "Rp0";
      document.getElementById("pvModalKertas").textContent = "Rp0";
      document.getElementById("pvModalTinta").textContent = "Rp0";
      document.getElementById("pvTotalModal").textContent = "Rp0";
      document.getElementById("pvKeuntungan").textContent = "Rp0";
      document.getElementById("pvBagianSaya").textContent = "Rp0";
      document.getElementById("pvBagianUsaha").textContent = "Rp0";

      if (fJenisPrint.value === "Campur" && result.error.indexOf("Hitam Putih") !== -1) {
        errJumlah.classList.add("show");
      } else {
        errJumlah.classList.remove("show");
      }
      return;
    }

    errJumlah.classList.remove("show");
    document.getElementById("pvPendapatan").textContent = formatRupiah(result.pendapatan);
    document.getElementById("pvModalKertas").textContent = formatRupiah(result.modalKertas);
    document.getElementById("pvModalTinta").textContent = formatRupiah(result.modalTinta);
    document.getElementById("pvTotalModal").textContent = formatRupiah(result.totalModal);
    document.getElementById("pvKeuntungan").textContent = formatRupiah(result.keuntungan);
    document.getElementById("pvBagianSaya").textContent = formatRupiah(result.bagianSaya);
    document.getElementById("pvBagianUsaha").textContent = formatRupiah(result.bagianUsaha);
  }

  [fUkuranKertas, fJenisPrint, fJumlahBW, fJumlahWarna, fJumlah, fHargaJual].forEach((el) => {
    el.addEventListener("input", updatePreview);
    el.addEventListener("change", updatePreview);
  });

  /* ------------------------- Form submit ------------------------- */

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const input = currentInput();
    const result = calculateTransaction(input);

    if (result.error) {
      showNotification(result.error, true);
      if (fJenisPrint.value === "Campur") {
        errJumlah.classList.add("show");
      }
      return;
    }

    const tanggal = fTanggal.value;
    if (!tanggal) {
      showNotification("Tanggal wajib diisi", true);
      return;
    }

    const transactions = getTransactions();
    const editId = editIdInput.value;

    const record = Object.assign(
      {
        id: editId || genId(),
        tanggal: tanggal,
        pelanggan: fPelanggan.value.trim(),
        catatan: fCatatan.value.trim(),
      },
      result
    );

    if (editId) {
      const idx = transactions.findIndex((t) => t.id === editId);
      if (idx !== -1) {
        transactions[idx] = record;
      }
      saveTransactions(transactions);
      showNotification("✓ Transaksi berhasil diperbarui");
    } else {
      transactions.push(record);
      saveTransactions(transactions);
      showNotification("✓ Transaksi berhasil ditambahkan");
    }

    closeForm();
    renderTable();
  });

  /* ------------------------- Table rendering ------------------------- */

  function renderTable() {
    const transactions = getTransactions()
      .slice()
      .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

    const filtered = searchQuery
      ? transactions.filter((tx) => {
          const q = searchQuery.toLowerCase();
          return (
            (tx.pelanggan || "").toLowerCase().includes(q) ||
            (tx.ukuranKertas || "").toLowerCase().includes(q) ||
            (tx.jenisPrint || "").toLowerCase().includes(q) ||
            (tx.catatan || "").toLowerCase().includes(q) ||
            formatDateDisplay(tx.tanggal).includes(q)
          );
        })
      : transactions;

    const tbody = document.getElementById("txTableBody");
    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="10">Belum ada transaksi</td></tr>`;
      return;
    }

    filtered.forEach((tx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDateDisplay(tx.tanggal)}</td>
        <td>${escapeHtml(tx.pelanggan) || "-"}</td>
        <td><span class="badge badge-blue">${escapeHtml(tx.ukuranKertas)}</span></td>
        <td>${escapeHtml(tx.jenisPrint)}</td>
        <td>${tx.jumlah}</td>
        <td>${formatRupiah(tx.pendapatan)}</td>
        <td>${formatRupiah(tx.totalModal)}</td>
        <td style="color:var(--green)">${formatRupiah(tx.keuntungan)}</td>
        <td style="color:var(--blue-light)">${formatRupiah(tx.bagianSaya)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" data-action="detail" data-id="${tx.id}" title="Detail">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon" data-action="edit" data-id="${tx.id}" title="Edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="btn-icon danger" data-action="delete" data-id="${tx.id}" title="Hapus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const tx = getTransactions().find((t) => t.id === id);
        if (!tx) return;

        if (action === "detail") {
          showDetail(tx);
        } else if (action === "edit") {
          openForm(tx);
        } else if (action === "delete") {
          if (confirm("Yakin ingin menghapus transaksi ini?")) {
            const remaining = getTransactions().filter((t) => t.id !== id);
            saveTransactions(remaining);
            showNotification("✓ Transaksi berhasil dihapus");
            renderTable();
          }
        }
      });
    });
  }

  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderTable();
  });

  /* ------------------------- Detail modal ------------------------- */

  const detailModal = document.getElementById("detailModal");

  function showDetail(tx) {
    const content = document.getElementById("detailContent");
    content.innerHTML = `
      <div class="detail-row"><span class="k">Tanggal</span><span class="v">${formatDateDisplay(tx.tanggal)}</span></div>
      <div class="detail-row"><span class="k">Pelanggan</span><span class="v">${escapeHtml(tx.pelanggan) || "-"}</span></div>
      <div class="detail-row"><span class="k">Ukuran Kertas</span><span class="v">${escapeHtml(tx.ukuranKertas)}</span></div>
      <div class="detail-row"><span class="k">Jenis Print</span><span class="v">${escapeHtml(tx.jenisPrint)}</span></div>
      ${tx.jenisPrint === "Campur" ? `<div class="detail-row"><span class="k">Jumlah Hitam Putih</span><span class="v">${tx.jumlahHitamPutih}</span></div>
      <div class="detail-row"><span class="k">Jumlah Warna</span><span class="v">${tx.jumlahWarna}</span></div>` : ""}
      <div class="detail-row"><span class="k">Jumlah</span><span class="v">${tx.jumlah}</span></div>
      <div class="detail-row"><span class="k">Harga Jual / Lembar</span><span class="v">${formatRupiah(tx.hargaJual)}</span></div>
      <div class="detail-row"><span class="k">Pendapatan</span><span class="v">${formatRupiah(tx.pendapatan)}</span></div>
      <div class="detail-row"><span class="k">Modal Kertas</span><span class="v">${formatRupiah(tx.modalKertas)}</span></div>
      <div class="detail-row"><span class="k">Modal Tinta</span><span class="v">${formatRupiah(tx.modalTinta)}</span></div>
      <div class="detail-row"><span class="k">Total Modal</span><span class="v">${formatRupiah(tx.totalModal)}</span></div>
      <div class="detail-row"><span class="k">Keuntungan</span><span class="v">${formatRupiah(tx.keuntungan)}</span></div>
      <div class="detail-row"><span class="k">Bagian Saya (${tx.persenBagianSaya}%)</span><span class="v">${formatRupiah(tx.bagianSaya)}</span></div>
      <div class="detail-row"><span class="k">Bagian Usaha</span><span class="v">${formatRupiah(tx.bagianUsaha)}</span></div>
      <div class="detail-row"><span class="k">Catatan</span><span class="v">${escapeHtml(tx.catatan) || "-"}</span></div>
    `;
    detailModal.classList.add("show");
  }

  function closeDetail() {
    detailModal.classList.remove("show");
  }

  document.getElementById("btnCloseDetail").addEventListener("click", closeDetail);
  document.getElementById("btnCloseDetail2").addEventListener("click", closeDetail);
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeDetail();
  });

  /* ------------------------- CSV export ------------------------- */

  document.getElementById("btnExportCsv").addEventListener("click", () => {
    const transactions = getTransactions();
    if (transactions.length === 0) {
      showNotification("Tidak ada data untuk diekspor", true);
      return;
    }

    const headers = [
      "Tanggal", "Pelanggan", "Ukuran Kertas", "Jenis Print", "Jumlah",
      "Jumlah Hitam Putih", "Jumlah Warna", "Harga Jual", "Pendapatan",
      "Modal Kertas", "Modal Tinta", "Total Modal", "Keuntungan",
      "Persen Bagian Saya", "Bagian Saya", "Bagian Usaha", "Catatan",
    ];

    const rows = transactions.map((tx) => [
      tx.tanggal, tx.pelanggan || "", tx.ukuranKertas, tx.jenisPrint, tx.jumlah,
      tx.jumlahHitamPutih, tx.jumlahWarna, tx.hargaJual, tx.pendapatan,
      tx.modalKertas, tx.modalTinta, tx.totalModal, tx.keuntungan,
      tx.persenBagianSaya, tx.bagianSaya, tx.bagianUsaha, (tx.catatan || "").replace(/\n/g, " "),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaksi-print-${todayISO()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification("✓ Data berhasil diekspor");
  });

  renderTable();
});
