// ============================================================
      // DATA ORANG TUA UNTUK PENGHUBUNGAN SISWA
      // ============================================================
      async function loadOrangTuaUntukForm() {
        const select = document.getElementById("siswaOrangTuaId");
        if (!select || !supabase) return;

        select.innerHTML = `<option value="">Tanpa akun orang tua</option>`;
        try {
          const { data, error } = await supabase
            .from("pengguna")
            .select("id, nama, email")
            .eq("role", "ortu")
            .order("nama", { ascending: true });

          if (error) throw error;
          semuaOrangTua = data || [];
          select.innerHTML =
            `<option value="">Tanpa akun orang tua</option>` +
            semuaOrangTua
              .map((o) => `<option value="${o.id}">${o.nama || o.email || "Orang tua"} — ${o.email || ""}</option>`)
              .join("");
        } catch (error) {
          console.error("Error load akun orang tua:", error);
          select.innerHTML = `<option value="">Gagal memuat akun orang tua</option>`;
        }
      }

// ============================================================
      // VIEW: DATA SISWA
      // ============================================================
      function renderSiswa() {
        return `
          <div class="section">
            <div class="section-head">
              <h2>Daftar Siswa</h2>
              <div class="controls">
                <input type="text" id="cariSiswa" placeholder="Cari nama, NIS, kelas...">
                <button class="btn" onclick="window.__app.bukaFormSiswa()">+ Tambah Siswa</button>
              </div>
            </div>

            <div id="formSiswaContainer" style="display:none; padding:20px; border-bottom:1px solid var(--line);">
              <h3 style="margin-top:0;">Tambah Siswa Baru</h3>
              <form id="formSiswa">
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:15px;">
                  <div class="form-group">
                    <label>Nama Siswa</label>
                    <input type="text" id="siswaNama" placeholder="Masukkan nama siswa" required>
                  </div>
                  <div class="form-group">
                    <label>NIS</label>
                    <input type="text" id="siswaNis" placeholder="Masukkan NIS" required>
                  </div>
                  <div class="form-group">
                    <label>Kelas</label>
                    <input type="text" id="siswaKelas" placeholder="Contoh: 7A" required>
                  </div>
                  <div class="form-group">
                    <label>Tahun Ajaran</label>
                    <input type="text" id="siswaTahunAjaran" placeholder="Contoh: 2026/2027">
                  </div>
                  <div class="form-group">
                    <label>Tanggal Lahir</label>
                    <input type="date" id="siswaTanggalLahir">
                  </div>
                  <div class="form-group">
                    <label>Jenis Kelamin</label>
                    <select id="siswaJenisKelamin">
                      <option value="">Pilih jenis kelamin</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Nomor HP Orang Tua</label>
                    <input type="text" id="siswaNomorHpOrtu" placeholder="Contoh: 081234567890">
                  </div>
                  <div class="form-group">
                    <label>Akun Orang Tua</label>
                    <select id="siswaOrangTuaId">
                      <option value="">Memuat akun orang tua...</option>
                    </select>
                    <small style="color:var(--ink-soft);">Hubungkan siswa dengan akun login orang tua agar data anak muncul otomatis.</small>
                  </div>
                  <div class="form-group">
                    <label>Alamat</label>
                    <input type="text" id="siswaAlamat" placeholder="Masukkan alamat">
                  </div>
                </div>

                <div style="display:flex; gap:10px; margin-top:20px;">
                  <button type="submit" class="btn" id="btnSimpanSiswa">Simpan Siswa</button>
                  <button type="button" class="btn ghost" onclick="window.__app.tutupFormSiswa()">Batal</button>
                </div>
              </form>
            </div>

            <div class="section-body">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NIS</th>
                    <th>Kelas</th>
                    <th>Tahun Ajaran</th>
                    <th>Orang Tua</th>
                    <th>Nomor HP</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="daftarSiswa">
                  <tr><td colspan="7" style="text-align:center;">Memuat data siswa...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      function bukaFormSiswa() {
        const formContainer = document.getElementById("formSiswaContainer");
        if (formContainer) formContainer.style.display = "block";
        loadOrangTuaUntukForm();
      }

      function tutupFormSiswa() {
        const formContainer = document.getElementById("formSiswaContainer");
        const form = document.getElementById("formSiswa");
        if (formContainer) formContainer.style.display = "none";
        if (form) form.reset();
      }

      async function simpanSiswa(event) {
        event.preventDefault();

        if (!supabase) {
          alert("Supabase belum terhubung.");
          return;
        }

        const btn = document.getElementById("btnSimpanSiswa");
        const nama = document.getElementById("siswaNama").value.trim();
        const nis = document.getElementById("siswaNis").value.trim();
        const kelas = document.getElementById("siswaKelas").value.trim();
        const tahunAjaran = document.getElementById("siswaTahunAjaran").value.trim();
        const tanggalLahir = document.getElementById("siswaTanggalLahir").value;
        const jenisKelamin = document.getElementById("siswaJenisKelamin").value;
        const nomorHpOrtu = document.getElementById("siswaNomorHpOrtu").value.trim();
        const orangTuaId = document.getElementById("siswaOrangTuaId")?.value || null;
        const alamat = document.getElementById("siswaAlamat").value.trim();

        if (!nama || !nis || !kelas) {
          alert("Nama, NIS, dan Kelas wajib diisi.");
          return;
        }

        btn.disabled = true;
        btn.textContent = "Menyimpan...";

        try {
          const dataSiswa = {
            nama,
            nis,
            kelas,
            tahun_ajaran: tahunAjaran || null,
            tanggal_lahir: tanggalLahir || null,
            jenis_kelamin: jenisKelamin || null,
            nomor_hp_ortu: nomorHpOrtu || null,
            orang_tua_id: orangTuaId || null,
            alamat: alamat || null,
          };

          const { error } = await supabase.from("siswa").insert(dataSiswa).select();
          if (error) throw error;

          alert("Siswa berhasil ditambahkan!");
          tutupFormSiswa();
          await loadSiswa();
        } catch (error) {
          console.error("Error tambah siswa:", error);
          alert("Gagal menyimpan siswa:\n\n" + error.message);
        } finally {
          btn.disabled = false;
          btn.textContent = "Simpan Siswa";
        }
      }

      async function loadSiswa() {
        const tbody = document.getElementById("daftarSiswa");
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Memuat data siswa...</td></tr>`;

        try {
          if (!supabase) throw new Error("Supabase belum terhubung.");

          const { data, error } = await supabase
            .from("siswa")
            .select("id, nama, nis, kelas, tahun_ajaran, nomor_hp_ortu, orang_tua_id, orang_tua:orang_tua_id ( id, nama, email )")
            .order("created_at", { ascending: false });

          if (error) throw error;

          semuaSiswa = data || [];

          if (semuaSiswa.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Belum ada data siswa.</td></tr>`;
            return;
          }

          renderDaftarSiswa(semuaSiswa);
        } catch (error) {
          console.error("Error load siswa:", error);
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#E11D48;">Gagal memuat data siswa.</td></tr>`;
        }
      }

      function renderDaftarSiswa(dataSiswa) {
        const tbody = document.getElementById("daftarSiswa");
        if (!tbody) return;

        if (!dataSiswa || dataSiswa.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data siswa tidak ditemukan.</td></tr>`;
          return;
        }

        tbody.innerHTML = dataSiswa
          .map(
            (siswa) => `
          <tr>
            <td>${siswa.nama || "-"}</td>
            <td>${siswa.nis || "-"}</td>
            <td>${siswa.kelas || "-"}</td>
            <td>${siswa.tahun_ajaran || "-"}</td>
            <td>${siswa.orang_tua?.nama || siswa.orang_tua?.email || "Belum ditautkan"}</td>
            <td>${siswa.nomor_hp_ortu || "-"}</td>
            <td>
              <button class="btn ghost small" onclick="window.__app.hapusSiswa('${siswa.id}', '${(siswa.nama || "").replace(/'/g, "\\'")}')">
                Hapus
              </button>
            </td>
          </tr>
        `
          )
          .join("");
      }

      function cariSiswa() {
        const input = document.getElementById("cariSiswa");
        if (!input) return;

        const keyword = input.value.toLowerCase().trim();

        const hasil = semuaSiswa.filter((siswa) => {
          const nama = (siswa.nama || "").toLowerCase();
          const nis = (siswa.nis || "").toLowerCase();
          const kelas = (siswa.kelas || "").toLowerCase();
          const tahunAjaran = (siswa.tahun_ajaran || "").toLowerCase();

          return (
            nama.includes(keyword) ||
            nis.includes(keyword) ||
            kelas.includes(keyword) ||
            tahunAjaran.includes(keyword)
          );
        });

        renderDaftarSiswa(hasil);
      }

      async function hapusSiswa(id, nama) {
        if (!supabase) {
          alert("Supabase belum terhubung.");
          return;
        }

        const konfirmasi = confirm(`Yakin ingin menghapus data siswa "${nama}"? Tindakan ini tidak bisa dibatalkan.`);
        if (!konfirmasi) return;

        try {
          const { error } = await supabase.from("siswa").delete().eq("id", id);
          if (error) throw error;
          await loadSiswa();
        } catch (error) {
          console.error("Error hapus siswa:", error);
          alert("Gagal menghapus siswa:\n\n" + error.message);
        }
      }
