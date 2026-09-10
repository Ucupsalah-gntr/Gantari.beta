// ============================================================
      // VIEW: GURU & PELATIH
      // ============================================================
      function renderGuru() {
        return `
          <div class="section">
            <div class="section-head">
              <h2>Guru & Pelatih Gantari</h2>
              <div class="controls">
                <input type="text" id="cariGuru" placeholder="Cari nama atau email...">
                <button class="btn secondary" onclick="window.__app.loadGuru()">Refresh</button>
              </div>
            </div>
            <div class="section-body">
              <p style="margin-top:0;color:var(--ink-soft);font-size:13px;">
                Akun guru/pelatih dikelola melalui autentikasi Supabase. Halaman ini menampilkan akun dengan role <strong>guru</strong> yang sudah terdaftar.
              </p>
              <table>
                <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody id="daftarGuru"><tr><td colspan="4" style="text-align:center;">Memuat data guru...</td></tr></tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadGuru() {
        const tbody = document.getElementById("daftarGuru");
        const searchInput = document.getElementById("cariGuru");
        if (!tbody || !supabase) return;
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat data guru...</td></tr>`;
        try {
          const { data, error } = await supabase
            .from("pengguna")
            .select("id, nama, email, role")
            .eq("role", "guru")
            .order("nama", { ascending: true });
          if (error) throw error;
          const keyword = (searchInput?.value || "").toLowerCase().trim();
          const hasil = (data || []).filter(g =>
            (g.nama || "").toLowerCase().includes(keyword) ||
            (g.email || "").toLowerCase().includes(keyword)
          );
          if (!hasil.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada akun guru/pelatih.</td></tr>`;
            return;
          }
          tbody.innerHTML = hasil.map(g => `
            <tr>
              <td>${g.nama || "-"}</td>
              <td>${g.email || "-"}</td>
              <td><span class="badge badge-good">Guru / Pelatih</span></td>
              <td><span class="badge badge-muted">Aktif</span></td>
            </tr>
          `).join("");
          if (searchInput && !searchInput.dataset.bound) {
            searchInput.addEventListener("input", loadGuru);
            searchInput.dataset.bound = "1";
          }
        } catch (error) {
          console.error("Error load guru:", error);
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#E11D48;">Gagal memuat data guru: ${error.message}</td></tr>`;
        }
      }
