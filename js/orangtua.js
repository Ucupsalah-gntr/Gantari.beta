// ============================================================
      // VIEW: HALAMAN ORANG TUA
      // ============================================================

      // Satu akun orang tua bisa punya lebih dari satu anak (siswa.orang_tua_id
      // menunjuk ke pengguna.id). Daftar anak & anak yang sedang dipilih
      // disimpan di sini supaya bisa dipakai bersama oleh ketiga halaman.
      let anakOrangTuaList = [];
      let anakTerpilihId = null;

      async function pastikanAnakOrangTuaDimuat() {
        if (!supabase || !currentUser) return;
        if (anakOrangTuaList.length > 0) return;

        const { data, error } = await supabase
          .from("siswa")
          .select("id, nama, nis, kelas, tahun_ajaran")
          .eq("orang_tua_id", currentUser.id)
          .order("nama", { ascending: true });

        if (error) {
          console.error("Error load daftar anak:", error);
          return;
        }

        anakOrangTuaList = data || [];
        if (!anakTerpilihId && anakOrangTuaList.length > 0) {
          anakTerpilihId = anakOrangTuaList[0].id;
        }
      }

      function anakYangDipilih() {
        return anakOrangTuaList.find((a) => a.id === anakTerpilihId) || anakOrangTuaList[0] || null;
      }

      function renderPilihAnakHtml() {
        if (anakOrangTuaList.length <= 1) return "";
        const opsi = anakOrangTuaList
          .map((a) => `<option value="${a.id}" ${a.id === anakTerpilihId ? "selected" : ""}>${a.nama} — ${a.kelas || "-"}</option>`)
          .join("");
        return `
          <div class="controls" style="margin-bottom:16px;">
            <select id="pilihAnak" onchange="window.__app.gantiAnak(this.value)">${opsi}</select>
          </div>
        `;
      }

      function gantiAnak(id) {
        anakTerpilihId = id;
        renderView();
      }

      // ------------------------------------------------------
      // Ringkasan Anak
      // ------------------------------------------------------
      function renderRingkasanAnak() {
        return `
          <div id="pilihAnakWrap"></div>
          <div id="ringkasanAnakBody"><div class="empty">Memuat data anak...</div></div>
        `;
      }

      async function loadRingkasanAnak() {
        const wrap = document.getElementById("pilihAnakWrap");
        const body = document.getElementById("ringkasanAnakBody");
        if (!body || !supabase) return;

        await pastikanAnakOrangTuaDimuat();
        if (wrap) wrap.innerHTML = renderPilihAnakHtml();

        if (anakOrangTuaList.length === 0) {
          body.innerHTML = `<div class="empty">Belum ada data siswa yang terhubung dengan akun ini. Hubungi admin sekolah untuk menautkannya.</div>`;
          return;
        }

        const anak = anakYangDipilih();

        try {
          const today = new Date();
          const bulanIni = today.getMonth() + 1;
          const tahunIni = today.getFullYear();
          const bulanStr = String(bulanIni).padStart(2, "0");
          const hariTerakhir = new Date(tahunIni, bulanIni, 0).getDate();

          const { data: absensiBulanIni, error: absensiError } = await supabase
            .from("absensi")
            .select("status")
            .eq("siswa_id", anak.id)
            .gte("tanggal", `${tahunIni}-${bulanStr}-01`)
            .lte("tanggal", `${tahunIni}-${bulanStr}-${String(hariTerakhir).padStart(2, "0")}`);
          if (absensiError) throw absensiError;

          const hitung = { H: 0, I: 0, S: 0, A: 0 };
          (absensiBulanIni || []).forEach((a) => {
            if (hitung[a.status] !== undefined) hitung[a.status]++;
          });

          const { data: sppBulanIni, error: sppError } = await supabase
            .from("spp")
            .select("status, nominal")
            .eq("siswa_id", anak.id)
            .eq("bulan", bulanIni)
            .eq("tahun", tahunIni)
            .maybeSingle();
          if (sppError) throw sppError;

          body.innerHTML = `
            <div class="section">
              <div class="section-head"><h2>${anak.nama}</h2></div>
              <div class="section-body">
                <p style="margin:0 0 18px; color:var(--ink-soft);">
                  NIS: ${anak.nis || "-"} &middot; Kelas: ${anak.kelas || "-"} &middot; Tahun Ajaran: ${anak.tahun_ajaran || "-"}
                </p>

                <div class="stat-row">
                  <div class="stat c-teal"><div class="num">${hitung.H}</div><div class="lbl">Hadir — ${namaBulan(bulanIni)}</div></div>
                  <div class="stat c-warn"><div class="num">${hitung.I}</div><div class="lbl">Izin — ${namaBulan(bulanIni)}</div></div>
                  <div class="stat c-sick"><div class="num">${hitung.S}</div><div class="lbl">Sakit — ${namaBulan(bulanIni)}</div></div>
                  <div class="stat c-bad"><div class="num">${hitung.A}</div><div class="lbl">Alpa — ${namaBulan(bulanIni)}</div></div>
                </div>

                <div style="margin-top:20px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <span class="badge ${sppBulanIni ? (sppBulanIni.status === "Lunas" ? "badge-good" : "badge-bad") : "badge-muted"}">
                    SPP ${namaBulan(bulanIni)} ${tahunIni}: ${sppBulanIni ? sppBulanIni.status : "Belum ada tagihan"}
                  </span>
                  ${sppBulanIni ? `<span style="color:var(--ink-soft); font-size:13px;">${formatRupiah(sppBulanIni.nominal)}</span>` : ""}
                </div>
              </div>
            </div>
          `;
        } catch (error) {
          console.error("Error load ringkasan anak:", error);
          body.innerHTML = `<div class="empty" style="color:#E11D48;">Gagal memuat ringkasan anak.</div>`;
        }
      }

      // ------------------------------------------------------
      // Kehadiran Anak
      // ------------------------------------------------------
      function renderAbsenAnak() {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const awalBulanStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

        return `
          <div id="pilihAnakWrap"></div>
          <div class="section">
            <div class="section-head">
              <h2>Kehadiran Anak</h2>
              <div class="controls">
                <input type="date" id="absenAnakDari" value="${awalBulanStr}">
                <input type="date" id="absenAnakSampai" value="${todayStr}">
                <button class="btn secondary" onclick="window.__app.loadAbsenAnak()">Tampilkan</button>
              </div>
            </div>
            <div class="section-body">
              <table>
                <thead><tr><th>Tanggal</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody id="daftarAbsenAnak">
                  <tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadAbsenAnak() {
        const wrap = document.getElementById("pilihAnakWrap");
        const tbody = document.getElementById("daftarAbsenAnak");
        if (!tbody || !supabase) return;

        await pastikanAnakOrangTuaDimuat();
        if (wrap) wrap.innerHTML = renderPilihAnakHtml();

        if (anakOrangTuaList.length === 0) {
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada data siswa yang terhubung dengan akun ini.</td></tr>`;
          return;
        }

        const anak = anakYangDipilih();
        const dari = document.getElementById("absenAnakDari")?.value;
        const sampai = document.getElementById("absenAnakSampai")?.value;

        if (!dari || !sampai) {
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Pilih rentang tanggal terlebih dahulu.</td></tr>`;
          return;
        }

        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr>`;

        try {
          const { data, error } = await supabase
            .from("absensi")
            .select("tanggal, status, keterangan")
            .eq("siswa_id", anak.id)
            .gte("tanggal", dari)
            .lte("tanggal", sampai)
            .order("tanggal", { ascending: false });
          if (error) throw error;

          if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada data absensi pada rentang ini.</td></tr>`;
            return;
          }

          tbody.innerHTML = data
            .map(
              (a) => `
            <tr>
              <td>${a.tanggal || "-"}</td>
              <td><span class="badge ${statusBadgeAbsensi(a.status)}">${labelStatusAbsensi(a.status)}</span></td>
              <td>${a.keterangan || "-"}</td>
            </tr>
          `
            )
            .join("");
        } catch (error) {
          console.error("Error load absen anak:", error);
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#E11D48;">Gagal memuat data absensi.</td></tr>`;
        }
      }

      // ------------------------------------------------------
      // Status SPP (anak)
      // ------------------------------------------------------
      function renderSppAnak() {
        const tahunSekarang = new Date().getFullYear();
        const tahunOptions =
          `<option value="">Semua tahun</option>` +
          [tahunSekarang, tahunSekarang - 1, tahunSekarang - 2]
            .map((t) => `<option value="${t}" ${t === tahunSekarang ? "selected" : ""}>${t}</option>`)
            .join("");

        return `
          <div id="pilihAnakWrap"></div>
          <div class="section">
            <div class="section-head">
              <h2>Status SPP</h2>
              <div class="controls">
                <select id="sppAnakTahun">${tahunOptions}</select>
                <button class="btn secondary" onclick="window.__app.loadSppAnak()">Tampilkan</button>
              </div>
            </div>
            <div class="section-body">
              <table>
                <thead><tr><th>Bulan</th><th>Tahun</th><th class="num">Nominal</th><th>Status</th><th>Tanggal Bayar</th></tr></thead>
                <tbody id="daftarSppAnak">
                  <tr><td colspan="5" style="text-align:center;">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadSppAnak() {
        const wrap = document.getElementById("pilihAnakWrap");
        const tbody = document.getElementById("daftarSppAnak");
        if (!tbody || !supabase) return;

        await pastikanAnakOrangTuaDimuat();
        if (wrap) wrap.innerHTML = renderPilihAnakHtml();

        if (anakOrangTuaList.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data siswa yang terhubung dengan akun ini.</td></tr>`;
          return;
        }

        const anak = anakYangDipilih();
        const tahun = document.getElementById("sppAnakTahun")?.value;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Memuat data...</td></tr>`;

        try {
          let query = supabase
            .from("spp")
            .select("bulan, tahun, nominal, status, tanggal_bayar")
            .eq("siswa_id", anak.id);
          if (tahun) query = query.eq("tahun", Number(tahun));

          const { data, error } = await query.order("tahun", { ascending: false }).order("bulan", { ascending: false });
          if (error) throw error;

          if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data SPP.</td></tr>`;
            return;
          }

          tbody.innerHTML = data
            .map(
              (s) => `
            <tr>
              <td>${namaBulan(s.bulan)}</td>
              <td>${s.tahun}</td>
              <td class="num">${formatRupiah(s.nominal)}</td>
              <td><span class="badge ${s.status === "Lunas" ? "badge-good" : "badge-bad"}">${s.status}</span></td>
              <td>${s.tanggal_bayar || "-"}</td>
            </tr>
          `
            )
            .join("");
        } catch (error) {
          console.error("Error load SPP anak:", error);
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#E11D48;">Gagal memuat data SPP.</td></tr>`;
        }
      }
