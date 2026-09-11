// ============================================================
      // APP SHELL
      // ============================================================
      function renderApp() {
        const html = `
          <div class="app">
            <aside class="sidebar" id="sidebar">
              <div class="brand">
                <div class="brand-mark">🎒</div>
                <div>
                  <div class="brand-text">Gantariku</div>
                  <div class="brand-sub">Absensi &amp; SPP</div>
                </div>
              </div>

              <button class="mobile-menu-btn" id="mobileMenuBtn" onclick="window.__app.toggleMobileMenu()" aria-label="Buka menu">☰</button>

              <div class="sidebar-menu" id="sidebarMenu">
                <div class="user-info">
                  <div class="user-name">${currentUser.nama}</div>
                  <div class="user-role">${getRoleLabel(currentUserRole)}</div>
                </div>

                <div class="nav" id="nav"></div>

                <div class="sidebar-foot">
                  <div><span class="conn-dot"></span> Terhubung</div>
                  <button class="logout-btn" onclick="window.__app.logout()">Logout</button>
                </div>
              </div>
            </aside>

            <main class="content">
              <header class="topbar">
                <div>
                  <h1 id="pageTitle">Dasbor</h1>
                  <p id="pageSub">Ringkasan hari ini</p>
                </div>
                <div style="display:flex;align-items:center;gap:10px;position:relative;">
                  <button class="btn secondary small" onclick="window.__app.toggleNotifikasi()" id="btnNotifikasi">🔔 Notifikasi <span id="notifCount" class="badge badge-bad" style="margin-left:4px;display:none;">0</span></button>
                  <div class="today-chip" id="todayChip"></div>
                </div>
              </header>
              <div class="notif-panel" id="notifPanel"></div>
              <section class="view" id="view"></section>
            </main>
          </div>
        `;

        document.getElementById("app").innerHTML = html;
        renderNav();
        renderView();
        updateTodayChip();
      }

      function renderNav() {
        const nav = NAV_CONFIG[currentUserRole] || [];
        const navEl = document.getElementById("nav");
        navEl.innerHTML = nav
          .map(
            (item) =>
              `<button class="nav-item ${currentNav === item.id ? "active" : ""}"
                       onclick="window.__app.goTo('${item.id}')">
                <span>${item.icon}</span>
                <span>${item.label}</span>
              </button>`
          )
          .join("");
      }

      function goTo(navId) {
        currentNav = navId;
        closeMobileMenu();
        renderNav();
        renderView();
      }

      // ------------------------------------------------------
      // Menu mobile (hamburger)
      // ------------------------------------------------------
      function toggleMobileMenu() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.toggle("mobile-open");
      }

      function closeMobileMenu() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("mobile-open");
      }

// ============================================================
      // VIEW ROUTER
      // ============================================================
      function renderView() {
        const viewEl = document.getElementById("view");
        const titleEl = document.getElementById("pageTitle");
        const subEl = document.getElementById("pageSub");

        let html = "";
        let title = "Dasbor";
        let subtitle = "Ringkasan hari ini";

        switch (currentNav) {
          case "dasbor":
            html = renderDasbor();
            title = "Dasbor";
            subtitle = "Ringkasan hari ini";
            break;
          case "siswa":
            html = renderSiswa();
            title = "Data Siswa";
            subtitle = "Kelola data siswa";
            break;
          case "spp":
            html = renderSpp();
            title = "Monitoring SPP";
            subtitle = "Pantau pembayaran SPP";
            break;
          case "guru":
            html = renderGuru();
            title = "Guru & Pelatih";
            subtitle = "Daftar akun guru dan pelatih Gantari";
            break;
          case "absen-guru":
            html = renderAbsensiGuruAdmin();
            title = "Absensi Guru";
            subtitle = "Pantau kehadiran guru dan pelatih";
            break;
          case "absen-saya":
            html = renderAbsensiSaya();
            title = "Kehadiran Saya";
            subtitle = "Catat kehadiran Anda";
            break;
          case "rekap":
            html = renderRekap();
            title = "Rekap Absensi";
            subtitle = "Laporan kehadiran";
            break;
          case "input-absen":
            html = renderInputAbsen();
            title = "Input Absensi";
            subtitle = "Catat kehadiran siswa";
            break;
          case "riwayat-absen":
            html = renderRiwayatAbsen();
            title = "Riwayat Absensi";
            subtitle = "Lihat riwayat kehadiran";
            break;
          case "perkembangan":
            html = renderPerkembanganAdmin();
            title = "Perkembangan Anak";
            subtitle = "Pantau catatan perkembangan siswa";
            break;
          case "perkembangan-input":
            html = renderPerkembanganInput();
            title = "Perkembangan Anak";
            subtitle = "Catat perkembangan siswa";
            break;
          case "ringkasan":
            html = renderRingkasanAnak();
            title = "Ringkasan Anak";
            subtitle = "Ikhtisar prestasi dan pembayaran";
            break;
          case "absen-anak":
            html = renderAbsenAnak();
            title = "Kehadiran Anak";
            subtitle = "Riwayat kehadiran";
            break;
          case "spp-anak":
            html = renderSppAnak();
            title = "Status SPP";
            subtitle = "Status pembayaran SPP";
            break;
          case "perkembangan-anak":
            html = renderPerkembanganAnak();
            title = "Perkembangan Anak";
            subtitle = "Lihat catatan perkembangan anak";
            break;
          default:
            html = `<div class="empty">Menu tidak ditemukan</div>`;
        }

        viewEl.innerHTML = html;
        titleEl.textContent = title;
        subEl.textContent = subtitle;

        // ------------------------------------------------------
        // Hook setelah render, per halaman
        // ------------------------------------------------------
        if (currentNav === "dasbor") {
          loadDasbor();
          loadPerhatian();
        }

        if (currentNav === "siswa") {
          loadSiswa();

          const searchInput = document.getElementById("cariSiswa");
          if (searchInput) searchInput.addEventListener("input", cariSiswa);

          const formSiswa = document.getElementById("formSiswa");
          if (formSiswa) formSiswa.addEventListener("submit", simpanSiswa);
        }

        if (currentNav === "guru") {
          loadGuru();
        }

        if (currentNav === "absen-guru") {
          loadAbsensiGuruAdmin();
        }

        if (currentNav === "absen-saya") {
          // Pasang submit handler SEGERA setelah form dirender.
          // Jangan menunggu loadAbsensiSaya(), karena fungsi tersebut melakukan
          // request async terlebih dahulu. Tanpa handler, klik Simpan bisa
          // dianggap submit HTML biasa dan menyebabkan halaman reload.
          const formAbsensiSaya = document.getElementById("formAbsensiSaya");
          if (formAbsensiSaya && !formAbsensiSaya.dataset.bound) {
            formAbsensiSaya.addEventListener("submit", simpanAbsensiSaya);
            formAbsensiSaya.dataset.bound = "1";
          }
          loadAbsensiSaya();
        }

        if (currentNav === "spp") {
          loadSpp();

          const formSpp = document.getElementById("formSpp");
          if (formSpp) formSpp.addEventListener("submit", simpanSpp);

          const filterBulan = document.getElementById("filterBulanSpp");
          const filterTahun = document.getElementById("filterTahunSpp");
          const filterStatus = document.getElementById("filterStatusSpp");
          if (filterBulan) filterBulan.addEventListener("change", loadSpp);
          if (filterTahun) filterTahun.addEventListener("change", loadSpp);
          if (filterStatus) filterStatus.addEventListener("change", loadSpp);
        }

        if (currentNav === "input-absen") {
          loadKelasOptions("inputAbsenKelas");
        }

        if (currentNav === "rekap") {
          loadKelasOptions("rekapKelas");
        }

        if (currentNav === "riwayat-absen") {
          loadKelasOptions("riwayatKelas");
        }

        if (currentNav === "perkembangan") {
          loadPerkembanganAdmin();
          const cariPerk = document.getElementById("perkembanganAdminCari");
          if (cariPerk) cariPerk.addEventListener("input", () => { perkembanganAdminPage = 1; renderPerkembanganAdminCards(); });
        }

        if (currentNav === "perkembangan-input") {
          loadKelasOptions("perkembanganKelas");
          loadPerkembanganGuru();
        }

        if (currentNav === "ringkasan") {
          loadRingkasanAnak();
        }

        if (currentNav === "absen-anak") {
          loadAbsenAnak();
        }

        if (currentNav === "spp-anak") {
          loadSppAnak();
        }

        if (currentNav === "perkembangan-anak") {
          loadPerkembanganAnak();
        }
      }

// ============================================================
      // INITIALIZATION
      // ============================================================
      async function init() {
        try {
          if (!supabase) {
            renderLogin();
            return;
          }

          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (!session) {
            renderLogin();
            return;
          }

          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            await supabase.auth.signOut();
            renderLogin();
            return;
          }

          const profile = await loadUserProfile(user.id);

          currentUser = profile;
          currentUserRole = profile.role;
          currentNav = NAV_CONFIG[currentUserRole]?.[0]?.id || "dasbor";

          renderApp();
        } catch (error) {
          console.error("Init error:", error);
          if (supabase) await supabase.auth.signOut();
          currentUser = null;
          currentUserRole = null;
          renderLogin();
        }
      }

      // Expose app functions to window
      window.__app = {
  goTo,
  logout,
  toggleMobileMenu,

  bukaFormSiswa,
  tutupFormSiswa,
  editSiswa,
  hapusSiswa,

  bukaFormSpp,
  tutupFormSpp,
  tandaiLunas,
  hapusSpp,

  pilihBuktiSpp,
  uploadBuktiSpp,
            
  loadGuru,
  loadAbsensiGuruAdmin,
  loadAbsensiSaya,
  simpanAbsensiSaya,

  exportSppCsv,
  buatTagihanBulanan,
  loadPerhatian,
  exportAbsensiGuruCsv,
  exportRekapAbsensiCsv,
  exportPerkembanganCsv,

  loadPerkembanganAdmin,
  changePerkPage,
  loadSiswaPerkembangan,
  simpanPerkembangan,
  loadPerkembanganGuru,
  loadPerkembanganAnak,

  toggleNotifikasi,

  loadFormInputAbsen,
  simpanAbsensiMassal,

  loadRekapAbsensi,
  loadRiwayatAbsensi,

  gantiAnak,
  loadAbsenAnak,
  loadSppAnak,

  tampilkanRiwayatPerkembangan:
    renderRiwayatPerkembanganDipilih
};

      // Start app setelah koneksi Supabase siap.
      gantarikuSupabaseReady.then(function () {
        init();
      });
