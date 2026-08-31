document.addEventListener("DOMContentLoaded", () => {
  renderShell("pengaturan", "Pengaturan");

  const sNamaUsaha = document.getElementById("sNamaUsaha");
  const sNamaPengguna = document.getElementById("sNamaPengguna");
  const sPersenSaya = document.getElementById("sPersenSaya");
  const sPersenUsaha = document.getElementById("sPersenUsaha");
  const sTarget = document.getElementById("sTarget");
  const sMataUang = document.getElementById("sMataUang");
  const cKertasA4 = document.getElementById("cKertasA4");
  const cKertasF4 = document.getElementById("cKertasF4");
  const cTintaBW = document.getElementById("cTintaBW");
  const cTintaWarna = document.getElementById("cTintaWarna");

  function loadForm() {
    const settings = getSettings();
    const costConfig = getCostConfig();

    sNamaUsaha.value = settings.namaUsaha || "";
    sNamaPengguna.value = settings.namaPengguna || "";
    sPersenSaya.value = settings.persenSaya;
    sPersenUsaha.value = settings.persenUsaha;
    sTarget.value = settings.targetBagianSaya;
    sMataUang.value = settings.mataUang || "Rp";

    cKertasA4.value = costConfig.kertas.A4;
    cKertasF4.value = costConfig.kertas.F4;
    cTintaBW.value = costConfig.tinta.hitamPutih;
    cTintaWarna.value = costConfig.tinta.fullWarna;
  }

  sPersenSaya.addEventListener("input", () => {
    const val = Math.max(0, Math.min(100, Number(sPersenSaya.value) || 0));
    sPersenUsaha.value = 100 - val;
  });

  document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const persenSaya = Math.max(0, Math.min(100, Number(sPersenSaya.value) || 0));

    if (Number(sTarget.value) < 0) {
      showNotification("Target tidak boleh negatif", true);
      return;
    }
    if (Number(cKertasA4.value) < 0 || Number(cKertasF4.value) < 0 || Number(cTintaBW.value) < 0 || Number(cTintaWarna.value) < 0) {
      showNotification("Biaya tidak boleh negatif", true);
      return;
    }

    const settings = {
      namaUsaha: sNamaUsaha.value.trim(),
      namaPengguna: sNamaPengguna.value.trim(),
      persenSaya: persenSaya,
      persenUsaha: 100 - persenSaya,
      targetBagianSaya: Number(sTarget.value) || 0,
      mataUang: sMataUang.value,
    };
    saveSettings(settings);

    const costConfig = {
      kertas: {
        A4: Number(cKertasA4.value) || 0,
        F4: Number(cKertasF4.value) || 0,
      },
      tinta: {
        hitamPutih: Number(cTintaBW.value) || 0,
        fullWarna: Number(cTintaWarna.value) || 0,
      },
    };
    saveCostConfig(costConfig);

    showNotification("✓ Pengaturan berhasil disimpan");
    renderShell("pengaturan", "Pengaturan"); // refresh sidebar brand name
  });

  loadForm();
});
