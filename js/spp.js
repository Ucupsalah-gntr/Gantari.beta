// ============================================================
// GANTARIKU — MONITORING SPP & VERIFIKASI PEMBAYARAN
// ============================================================


// ============================================================
// VIEW MONITORING SPP
// ============================================================

function renderSpp() {
  const now = getNowWIB();

  const bulanOptions = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]
    .map(
      (nm, i) =>
        `<option value="${i + 1}" ${
          i + 1 === now.getMonth() + 1
            ? "selected"
            : ""
        }>${nm}</option>`
    )
    .join("");

  const tahunSekarang =
    now.getFullYear();

  const tahunOptions = [
    tahunSekarang - 1,
    tahunSekarang,
    tahunSekarang + 1,
  ]
    .map(
      (t) =>
        `<option value="${t}" ${
          t === tahunSekarang
            ? "selected"
            : ""
        }>${t}</option>`
    )
    .join("");

  return `
    <div class="section">

      <div class="section-head">

        <h2>Monitoring SPP</h2>

        <div class="controls">

          <select id="filterBulanSpp">
            ${bulanOptions}
          </select>

          <select id="filterTahunSpp">
            ${tahunOptions}
          </select>

          <select id="filterStatusSpp">

            <option value="">
              Semua status
            </option>

            <option value="Lunas">
              Lunas
            </option>

            <option value="Belum Bayar">
              Belum Bayar
            </option>

            <option value="Menunggu Verifikasi">
              Menunggu Verifikasi
            </option>

          </select>

          <button
            class="btn secondary"
            onclick="window.__app.loadSpp()"
          >
            Tampilkan
          </button>

          <button
            class="btn secondary"
            onclick="window.__app.exportSppCsv()"
          >
            ⬇ Export CSV
          </button>

          <button
            class="btn secondary"
            onclick="window.__app.buatTagihanBulanan()"
          >
            ⚡ Buat Tagihan Bulanan
          </button>

          <button
            class="btn"
            onclick="window.__app.bukaFormSpp()"
          >
            + Tambah Tagihan
          </button>

        </div>

      </div>


      <!-- ======================================================
           FORM TAMBAH SPP
           ====================================================== -->

      <div
        id="formSppContainer"
        style="
          display:none;
          padding:20px;
          border-bottom:1px solid var(--line);
        "
      >

        <h3 style="margin-top:0;">
          Tambah Tagihan SPP
        </h3>

        <form id="formSpp">

          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(auto-fit,minmax(200px,1fr));
              gap:15px;
            "
          >

            <div class="form-group">

              <label>Siswa</label>

              <select
                id="sppSiswaId"
                required
              >
                <option value="">
                  Memuat daftar siswa...
                </option>
              </select>

            </div>


            <div class="form-group">

              <label>Bulan</label>

              <select id="sppBulan">
                ${bulanOptions}
              </select>

            </div>


            <div class="form-group">

              <label>Tahun</label>

              <select id="sppTahun">
                ${tahunOptions}
              </select>

            </div>


            <div class="form-group">

              <label>Nominal (Rp)</label>

              <input
                type="number"
                id="sppNominal"
                placeholder="Contoh: 150000"
                required
              >

            </div>


            <div class="form-group">

              <label>Status</label>

              <select id="sppStatus">

                <option value="Belum Bayar">
                  Belum Bayar
                </option>

                <option value="Lunas">
                  Lunas
                </option>

              </select>

            </div>

          </div>


          <div
            style="
              display:flex;
              gap:10px;
              margin-top:20px;
            "
          >

            <button
              type="submit"
              class="btn"
              id="btnSimpanSpp"
            >
              Simpan Tagihan
            </button>

            <button
              type="button"
              class="btn ghost"
              onclick="window.__app.tutupFormSpp()"
            >
              Batal
            </button>

          </div>

        </form>

      </div>


      <!-- ======================================================
           DAFTAR SPP
           ====================================================== -->

      <div class="section-body">

        <table>

          <thead>

            <tr>
              <th>Nama</th>
              <th>Kelas</th>
              <th class="num">Nominal</th>
              <th>Status</th>
              <th>Bukti</th>
              <th>Aksi</th>
            </tr>

          </thead>

          <tbody id="daftarSpp">

            <tr>
              <td
                colspan="6"
                style="text-align:center;"
              >
                Memuat data SPP...
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  `;
}


// ============================================================
// FORM SPP
// ============================================================

function bukaFormSpp() {
  const c =
    document.getElementById(
      "formSppContainer"
    );

  if (c) {
    c.style.display = "block";
  }

  loadDaftarSiswaUntukFormSpp();
}


function tutupFormSpp() {
  const c =
    document.getElementById(
      "formSppContainer"
    );

  const f =
    document.getElementById(
      "formSpp"
    );

  if (c) {
    c.style.display = "none";
  }

  if (f) {
    f.reset();
  }
}


// ============================================================
// LOAD SISWA UNTUK FORM SPP
// ============================================================

async function loadDaftarSiswaUntukFormSpp() {
  const select =
    document.getElementById(
      "sppSiswaId"
    );

  if (!select || !supabase) return;

  try {
    const {
      data,
      error,
    } = await supabase
      .from("siswa")
      .select(
        "id,nama,kelas"
      )
      .order(
        "nama",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {
      select.innerHTML = `
        <option value="">
          Belum ada siswa
        </option>
      `;
      return;
    }

    select.innerHTML =
      data
        .map(
          (s) =>
            `
            <option value="${s.id}">
              ${s.nama} — ${s.kelas || "-"}
            </option>
            `
        )
        .join("");

  } catch (error) {

    console.error(
      "Error load siswa untuk SPP:",
      error
    );

    select.innerHTML = `
      <option value="">
        Gagal memuat siswa
      </option>
    `;
  }
}


// ============================================================
// SIMPAN SPP
// ============================================================

async function simpanSpp(event) {
  event.preventDefault();

  if (!supabase) {
    alert(
      "Supabase belum terhubung."
    );
    return;
  }

  const btn =
    document.getElementById(
      "btnSimpanSpp"
    );

  const siswaId =
    document.getElementById(
      "sppSiswaId"
    ).value;

  const bulan =
    Number(
      document.getElementById(
        "sppBulan"
      ).value
    );

  const tahun =
    Number(
      document.getElementById(
        "sppTahun"
      ).value
    );

  const nominal =
    Number(
      document.getElementById(
        "sppNominal"
      ).value
    );

  const status =
    document.getElementById(
      "sppStatus"
    ).value;

  if (
    !siswaId ||
    !nominal
  ) {
    alert(
      "Siswa dan nominal wajib diisi."
    );
    return;
  }

  btn.disabled = true;
  btn.textContent =
    "Menyimpan...";

  try {

    const dataSpp = {
      siswa_id:
        siswaId,

      bulan,

      tahun,

      nominal,

      status,

      tanggal_bayar:
        status === "Lunas"
          ? getTodayWIBString()
          : null,

      dicatat_oleh:
        currentUser
          ? currentUser.id
          : null,
    };

    const {
      error,
    } =
      await supabase
        .from("spp")
        .insert(dataSpp)
        .select();

    if (error) {
      throw error;
    }

    alert(
      "Tagihan SPP berhasil ditambahkan!"
    );

    tutupFormSpp();

    await loadSpp();

  } catch (error) {

    console.error(
      "Error tambah SPP:",
      error
    );

    alert(
      "Gagal menyimpan tagihan:\n\n" +
        error.message
    );

  } finally {

    btn.disabled = false;
    btn.textContent =
      "Simpan Tagihan";
  }
}


// ============================================================
// BUAT TAGIHAN BULANAN
// ============================================================

async function buatTagihanBulanan() {

  if (!supabase) {
    return alert(
      "Supabase belum terhubung."
    );
  }

  const bulan =
    Number(
      document.getElementById(
        "filterBulanSpp"
      )?.value
    );

  const tahun =
    Number(
      document.getElementById(
        "filterTahunSpp"
      )?.value
    );

  const inputNominal =
    prompt(
      `Nominal SPP untuk ${namaBulan(
        bulan
      )} ${tahun}:`,
      "150000"
    );

  if (
    inputNominal === null
  ) {
    return;
  }

  const nominal =
    Number(
      String(
        inputNominal
      ).replace(
        /[^0-9]/g,
        ""
      )
    );

  if (
    !nominal ||
    nominal <= 0
  ) {
    alert(
      "Nominal SPP tidak valid."
    );
    return;
  }

  if (
    !confirm(
      `Buat tagihan SPP ${namaBulan(
        bulan
      )} ${tahun} sebesar ${formatRupiah(
        nominal
      )} untuk semua siswa yang belum memiliki tagihan pada periode tersebut?`
    )
  ) {
    return;
  }

  try {

    const {
      data: siswa,
      error: siswaError,
    } =
      await supabase
        .from("siswa")
        .select(
          "id,nama,kelas"
        )
        .order(
          "nama",
          {
            ascending: true,
          }
        );

    if (siswaError) {
      throw siswaError;
    }

    const {
      data: existing,
      error: existingError,
    } =
      await supabase
        .from("spp")
        .select(
          "siswa_id"
        )
        .eq(
          "bulan",
          bulan
        )
        .eq(
          "tahun",
          tahun
        );

    if (existingError) {
      throw existingError;
    }

    const sudahAda =
      new Set(
        (
          existing ||
          []
        ).map(
          (x) =>
            x.siswa_id
        )
      );

    const belumAda =
      (
        siswa || []
      ).filter(
        (x) =>
          !sudahAda.has(
            x.id
          )
      );

    if (
      belumAda.length === 0
    ) {
      alert(
        `Semua siswa sudah memiliki tagihan SPP ${namaBulan(
          bulan
        )} ${tahun}.`
      );
      return;
    }

    const payload =
      belumAda.map(
        (x) => ({
          siswa_id:
            x.id,

          bulan,

          tahun,

          nominal,

          status:
            "Belum Bayar",

          tanggal_bayar:
            null,

          dicatat_oleh:
            currentUser
              ? currentUser.id
              : null,
        })
      );

    const {
      error: insertError,
    } =
      await supabase
        .from("spp")
        .insert(
          payload
        );

    if (insertError) {
      throw insertError;
    }

    alert(
      `Berhasil membuat ${payload.length} tagihan SPP untuk ${namaBulan(
        bulan
      )} ${tahun}.`
    );

    await loadSpp();

  } catch (error) {

    console.error(
      "Error buat tagihan bulanan:",
      error
    );

    alert(
      "Gagal membuat tagihan bulanan:\n\n" +
        error.message
    );
  }
}


// ============================================================
// LOAD SPP ADMIN
// ============================================================

async function loadSpp() {

  const tbody =
    document.getElementById(
      "daftarSpp"
    );

  if (
    !tbody ||
    !supabase
  ) {
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td
        colspan="6"
        style="text-align:center;"
      >
        Memuat data SPP...
      </td>
    </tr>
  `;

  try {

    const bulan =
      Number(
        document.getElementById(
          "filterBulanSpp"
        )?.value
      );

    const tahun =
      Number(
        document.getElementById(
          "filterTahunSpp"
        )?.value
      );

    const status =
      document.getElementById(
        "filterStatusSpp"
      )?.value;

    let query =
      supabase
        .from("spp")
        .select(
          `
          id,
          nominal,
          status,
          tanggal_bayar,
          bukti_bayar_url,
          catatan,
          siswa:siswa_id (
            nama,
            kelas
          )
          `
        )
        .eq(
          "bulan",
          bulan
        )
        .eq(
          "tahun",
          tahun
        );

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    const {
      data,
      error,
    } =
      await query.order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="6"
            style="text-align:center;"
          >
            Belum ada data SPP
            untuk periode ini.
          </td>
        </tr>
      `;

      return;
    }


    tbody.innerHTML =
      data
        .map(
          (s) => {

            const isLunas =
              s.status ===
              "Lunas";

            const isPending =
              s.status ===
              "Menunggu Verifikasi";

            const isBelum =
              s.status ===
              "Belum Bayar";


            let badgeClass =
              "badge-muted";

            if (isLunas) {
              badgeClass =
                "badge-good";
            } else if (
              isPending
            ) {
              badgeClass =
                "badge-warn";
            } else if (
              isBelum
            ) {
              badgeClass =
                "badge-bad";
            }


            // --------------------------------------------------
            // KOLOM BUKTI
            // --------------------------------------------------

            let buktiHtml =
              `<span style="color:var(--ink-soft);">—</span>`;

            if (
              s.bukti_bayar_url
            ) {

              buktiHtml = `
                <a
                  href="${s.bukti_bayar_url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn ghost small"
                >
                  🔎 Lihat Bukti
                </a>
              `;
            }


            // --------------------------------------------------
            // KOLOM AKSI
            // --------------------------------------------------

            let aksiHtml = "";


            // PEMBAYARAN MENUNGGU VERIFIKASI
            if (
              isPending
            ) {

              aksiHtml = `
                <div
                  style="
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                  "
                >

                  <button
                    class="btn small"
                    onclick="window.__app.terimaPembayaranSpp('${s.id}')"
                  >
                    ✓ Terima
                  </button>

                  <button
                    class="btn ghost small"
                    onclick="window.__app.tolakPembayaranSpp('${s.id}')"
                  >
                    ✕ Tolak
                  </button>

                </div>
              `;

            }

            // SUDAH LUNAS
            else if (
              isLunas
            ) {

              aksiHtml = `
                <button
                  class="btn ghost small"
                  onclick="window.__app.hapusSpp('${s.id}')"
                >
                  Hapus
                </button>
              `;

            }

            // BELUM BAYAR
            else {

              aksiHtml = `
                <div
                  style="
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                  "
                >

                  <button
                    class="btn small"
                    onclick="window.__app.tandaiLunas('${s.id}')"
                  >
                    Tandai Lunas
                  </button>

                  <button
                    class="btn ghost small"
                    onclick="window.__app.hapusSpp('${s.id}')"
                  >
                    Hapus
                  </button>

                </div>
              `;
            }


            return `
              <tr>

                <td>
                  ${s.siswa?.nama || "-"}
                </td>

                <td>
                  ${s.siswa?.kelas || "-"}
                </td>

                <td class="num">
                  ${formatRupiah(
                    s.nominal
                  )}
                </td>

                <td>
                  <span
                    class="badge ${badgeClass}"
                  >
                    ${s.status}
                  </span>
                </td>

                <td>
                  ${buktiHtml}
                </td>

                <td>
                  ${aksiHtml}
                </td>

              </tr>
            `;
          }
        )
        .join("");

  } catch (error) {

    console.error(
      "Error load SPP:",
      error
    );

    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          style="
            text-align:center;
            color:#E11D48;
          "
        >
          Gagal memuat data SPP.
        </td>
      </tr>
    `;
  }
}


// ============================================================
// TERIMA PEMBAYARAN
// ============================================================

async function terimaPembayaranSpp(
  id
) {

  if (!supabase) {
    alert(
      "Supabase belum terhubung."
    );
    return;
  }

  const yakin =
    confirm(
      "Terima pembayaran ini?\n\n" +
      "Status SPP akan berubah menjadi Lunas."
    );

  if (!yakin) {
    return;
  }

  try {

    const {
      error,
    } =
      await supabase
        .from("spp")
        .update({
          status:
            "Lunas",

          tanggal_bayar:
            getTodayWIBString(),

          dicatat_oleh:
            currentUser
              ? currentUser.id
              : null,
        })
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    alert(
      "✅ Pembayaran berhasil diverifikasi.\n\nStatus SPP sekarang: Lunas."
    );

    await loadSpp();

  } catch (error) {

    console.error(
      "Error terima pembayaran:",
      error
    );

    alert(
      "Gagal memverifikasi pembayaran:\n\n" +
        error.message
    );
  }
}


// ============================================================
// TOLAK PEMBAYARAN
// ============================================================

async function tolakPembayaranSpp(
  id
) {

  if (!supabase) {
    alert(
      "Supabase belum terhubung."
    );
    return;
  }

  const yakin =
    confirm(
      "Tolak bukti pembayaran ini?\n\n" +
      "Status akan dikembalikan menjadi Belum Bayar agar orang tua dapat mengirim ulang bukti."
    );

  if (!yakin) {
    return;
  }

  try {

    const {
      error,
    } =
      await supabase
        .from("spp")
        .update({
          status:
            "Belum Bayar",

          bukti_bayar_url:
            null,

          tanggal_bayar:
            null,

          catatan:
            "Bukti pembayaran ditolak oleh admin.",
        })
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    alert(
      "Bukti pembayaran ditolak.\n\n" +
      "Orang tua dapat mengirim ulang bukti pembayaran."
    );

    await loadSpp();

  } catch (error) {

    console.error(
      "Error tolak pembayaran:",
      error
    );

    alert(
      "Gagal menolak pembayaran:\n\n" +
        error.message
    );
  }
}


// ============================================================
// TANDAI LUNAS MANUAL
// ============================================================

async function tandaiLunas(
  id
) {

  if (!supabase) {
    return;
  }

  const yakin =
    confirm(
      "Tandai tagihan ini sebagai Lunas?"
    );

  if (!yakin) {
    return;
  }

  try {

    const {
      error,
    } =
      await supabase
        .from("spp")
        .update({
          status:
            "Lunas",

          tanggal_bayar:
            getTodayWIBString(),

          dicatat_oleh:
            currentUser
              ? currentUser.id
              : null,
        })
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    await loadSpp();

  } catch (error) {

    console.error(
      "Error tandai lunas:",
      error
    );

    alert(
      "Gagal menandai lunas:\n\n" +
        error.message
    );
  }
}


// ============================================================
// HAPUS SPP
// ============================================================

async function hapusSpp(
  id
) {

  if (!supabase) {
    return;
  }

  if (
    !confirm(
      "Yakin ingin menghapus tagihan SPP ini?"
    )
  ) {
    return;
  }

  try {

    const {
      error,
    } =
      await supabase
        .from("spp")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    await loadSpp();

  } catch (error) {

    console.error(
      "Error hapus SPP:",
      error
    );

    alert(
      "Gagal menghapus tagihan:\n\n" +
        error.message
    );
  }
}
