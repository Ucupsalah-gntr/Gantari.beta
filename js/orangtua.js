// ============================================================
// GANTARIKU — HALAMAN ORANG TUA
// ============================================================

// Satu akun orang tua bisa memiliki beberapa anak.
let anakOrangTuaList = [];
let anakTerpilihId = null;



// ============================================================
// BUKTI PEMBAYARAN — STORAGE PRIVATE
// ============================================================
function getBuktiPathOrtu(value) {
  if (!value) return null;
  const text = String(value);
  const marker = "/storage/v1/object/public/bukti-pembayaran/";
  const markerSign = "/storage/v1/object/sign/bukti-pembayaran/";
  if (text.includes(marker)) return decodeURIComponent(text.split(marker)[1].split("?")[0]);
  if (text.includes(markerSign)) return decodeURIComponent(text.split(markerSign)[1].split("?")[0]);
  return text;
}

async function getBuktiSignedUrlOrtu(value, expiresIn = 600) {
  if (!supabase || !value) return null;
  const path = getBuktiPathOrtu(value);
  const { data, error } = await supabase
    .storage
    .from("bukti-pembayaran")
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.error("Gagal membuka bukti pembayaran:", error);
    return null;
  }
  return data?.signedUrl || null;
}

// ============================================================
// LOAD ANAK ORANG TUA
// ============================================================

async function pastikanAnakOrangTuaDimuat() {
  if (!supabase || !currentUser) return;
  if (anakOrangTuaList.length > 0) return;

  const { data, error } = await supabase
    .from("siswa")
    .select("id, nama, nis, kelas, tahun_ajaran")
    .eq("orang_tua_id", currentUser.id)
    .order("nama", { ascending: true });

  if (error) {
    console.error(
      "Error load daftar anak:",
      error
    );
    return;
  }

  anakOrangTuaList = data || [];

  if (
    !anakTerpilihId &&
    anakOrangTuaList.length > 0
  ) {
    anakTerpilihId =
      anakOrangTuaList[0].id;
  }
}


function anakYangDipilih() {
  return (
    anakOrangTuaList.find(
      (a) =>
        String(a.id) ===
        String(anakTerpilihId)
    ) ||
    anakOrangTuaList[0] ||
    null
  );
}


// ============================================================
// PILIH ANAK
// ============================================================

function renderPilihAnakHtml() {
  if (anakOrangTuaList.length <= 1) {
    return "";
  }

  const opsi =
    anakOrangTuaList
      .map(
        (a) => `
          <option
            value="${a.id}"
            ${
              String(a.id) ===
              String(anakTerpilihId)
                ? "selected"
                : ""
            }
          >
            ${a.nama} — ${a.kelas || "-"}
          </option>
        `
      )
      .join("");

  return `
    <div
      class="controls"
      style="margin-bottom:16px;"
    >
      <select
        id="pilihAnak"
        onchange="window.__app.gantiAnak(this.value)"
      >
        ${opsi}
      </select>
    </div>
  `;
}


function gantiAnak(id) {
  anakTerpilihId = id;
  renderView();
}


// ============================================================
// RINGKASAN ANAK
// ============================================================

function renderRingkasanAnak() {
  return `
    <div id="pilihAnakWrap"></div>

    <div id="ringkasanAnakBody">
      <div class="empty">
        Memuat data anak...
      </div>
    </div>
  `;
}


async function loadRingkasanAnak() {
  const wrap =
    document.getElementById(
      "pilihAnakWrap"
    );

  const body =
    document.getElementById(
      "ringkasanAnakBody"
    );

  if (!body || !supabase) return;

  await pastikanAnakOrangTuaDimuat();

  if (wrap) {
    wrap.innerHTML =
      renderPilihAnakHtml();
  }

  if (
    anakOrangTuaList.length === 0
  ) {
    body.innerHTML = `
      <div class="empty">
        Belum ada data siswa yang terhubung
        dengan akun ini. Hubungi admin sekolah
        untuk menautkannya.
      </div>
    `;
    return;
  }

  const anak = anakYangDipilih();

  try {
    const today = getNowWIB();

    const bulanIni =
      today.getMonth() + 1;

    const tahunIni =
      today.getFullYear();

    const bulanStr =
      String(bulanIni).padStart(
        2,
        "0"
      );

    const hariTerakhir =
      new Date(
        tahunIni,
        bulanIni,
        0
      ).getDate();

    const {
      data: absensiBulanIni,
      error: absensiError
    } = await supabase
      .from("absensi")
      .select("status")
      .eq("siswa_id", anak.id)
      .gte(
        "tanggal",
        `${tahunIni}-${bulanStr}-01`
      )
      .lte(
        "tanggal",
        `${tahunIni}-${bulanStr}-${String(
          hariTerakhir
        ).padStart(2, "0")}`
      );

    if (absensiError) {
      throw absensiError;
    }

    const hitung = {
      H: 0,
      I: 0,
      S: 0,
      A: 0
    };

    (absensiBulanIni || [])
      .forEach((a) => {
        if (
          hitung[a.status] !==
          undefined
        ) {
          hitung[a.status]++;
        }
      });

    const {
      data: sppBulanIni,
      error: sppError
    } = await supabase
      .from("spp")
      .select(
        "status, nominal, bukti_bayar_url"
      )
      .eq(
        "siswa_id",
        anak.id
      )
      .eq(
        "bulan",
        bulanIni
      )
      .eq(
        "tahun",
        tahunIni
      )
      .maybeSingle();

    if (sppError) {
      throw sppError;
    }

    body.innerHTML = `
      <div class="section">

        <div class="section-head">
          <h2>${anak.nama}</h2>
        </div>

        <div class="section-body">

          <p
            style="
              margin:0 0 18px;
              color:var(--ink-soft);
            "
          >
            NIS: ${anak.nis || "-"}
            &middot;
            Kelas: ${anak.kelas || "-"}
            &middot;
            Tahun Ajaran:
            ${anak.tahun_ajaran || "-"}
          </p>

          <div class="stat-row">

            <div class="stat c-teal">
              <div class="num">
                ${hitung.H}
              </div>
              <div class="lbl">
                Hadir — ${namaBulan(bulanIni)}
              </div>
            </div>

            <div class="stat c-warn">
              <div class="num">
                ${hitung.I}
              </div>
              <div class="lbl">
                Izin — ${namaBulan(bulanIni)}
              </div>
            </div>

            <div class="stat c-sick">
              <div class="num">
                ${hitung.S}
              </div>
              <div class="lbl">
                Sakit — ${namaBulan(bulanIni)}
              </div>
            </div>

            <div class="stat c-bad">
              <div class="num">
                ${hitung.A}
              </div>
              <div class="lbl">
                Alpa — ${namaBulan(bulanIni)}
              </div>
            </div>

          </div>

          <div
            style="
              margin-top:20px;
              display:flex;
              align-items:center;
              gap:10px;
              flex-wrap:wrap;
            "
          >

            <span
              class="badge ${
                sppBulanIni
                  ? sppBulanIni.status ===
                    "Lunas"
                    ? "badge-good"
                    : sppBulanIni.status ===
                      "Menunggu Verifikasi"
                    ? "badge-warn"
                    : "badge-bad"
                  : "badge-muted"
              }"
            >
              SPP
              ${namaBulan(bulanIni)}
              ${tahunIni}:
              ${
                sppBulanIni
                  ? sppBulanIni.status
                  : "Belum ada tagihan"
              }
            </span>

            ${
              sppBulanIni
                ? `
                  <span
                    style="
                      color:var(--ink-soft);
                      font-size:13px;
                    "
                  >
                    ${formatRupiah(
                      sppBulanIni.nominal
                    )}
                  </span>
                `
                : ""
            }

          </div>

        </div>
      </div>
    `;
  } catch (error) {
    console.error(
      "Error load ringkasan anak:",
      error
    );

    body.innerHTML = `
      <div
        class="empty"
        style="color:#E11D48;"
      >
        Gagal memuat ringkasan anak.
      </div>
    `;
  }
}


// ============================================================
// KEHADIRAN ANAK
// ============================================================

function renderAbsenAnak() {
  const today = getNowWIB();

  const todayStr =
    getTodayWIBString();

  const awalBulanStr =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;

  return `
    <div id="pilihAnakWrap"></div>

    <div class="section">

      <div class="section-head">

        <h2>Kehadiran Anak</h2>

        <div class="controls">

          <input
            type="date"
            id="absenAnakDari"
            value="${awalBulanStr}"
          >

          <input
            type="date"
            id="absenAnakSampai"
            value="${todayStr}"
          >

          <button
            class="btn secondary"
            onclick="window.__app.loadAbsenAnak()"
          >
            Tampilkan
          </button>

        </div>

      </div>

      <div class="section-body">

        <table>

          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>

          <tbody id="daftarAbsenAnak">

            <tr>
              <td
                colspan="3"
                style="text-align:center;"
              >
                Memuat data...
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  `;
}


async function loadAbsenAnak() {
  const wrap =
    document.getElementById(
      "pilihAnakWrap"
    );

  const tbody =
    document.getElementById(
      "daftarAbsenAnak"
    );

  if (!tbody || !supabase) return;

  await pastikanAnakOrangTuaDimuat();

  if (wrap) {
    wrap.innerHTML =
      renderPilihAnakHtml();
  }

  if (
    anakOrangTuaList.length === 0
  ) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="3"
          style="text-align:center;"
        >
          Belum ada data siswa yang
          terhubung dengan akun ini.
        </td>
      </tr>
    `;
    return;
  }

  const anak =
    anakYangDipilih();

  const dari =
    document.getElementById(
      "absenAnakDari"
    )?.value;

  const sampai =
    document.getElementById(
      "absenAnakSampai"
    )?.value;

  if (!dari || !sampai) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="3"
          style="text-align:center;"
        >
          Pilih rentang tanggal terlebih dahulu.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td
        colspan="3"
        style="text-align:center;"
      >
        Memuat data...
      </td>
    </tr>
  `;

  try {
    const {
      data,
      error
    } = await supabase
      .from("absensi")
      .select(
        "tanggal, status, keterangan"
      )
      .eq(
        "siswa_id",
        anak.id
      )
      .gte(
        "tanggal",
        dari
      )
      .lte(
        "tanggal",
        sampai
      )
      .order(
        "tanggal",
        {
          ascending: false
        }
      );

    if (error) throw error;

    if (
      !data ||
      data.length === 0
    ) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="3"
            style="text-align:center;"
          >
            Tidak ada data absensi
            pada rentang ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML =
      data
        .map(
          (a) => `
            <tr>

              <td>
                ${a.tanggal || "-"}
              </td>

              <td>
                <span
                  class="badge ${statusBadgeAbsensi(
                    a.status
                  )}"
                >
                  ${labelStatusAbsensi(
                    a.status
                  )}
                </span>
              </td>

              <td>
                ${a.keterangan || "-"}
              </td>

            </tr>
          `
        )
        .join("");

  } catch (error) {

    console.error(
      "Error load absen anak:",
      error
    );

    tbody.innerHTML = `
      <tr>
        <td
          colspan="3"
          style="
            text-align:center;
            color:#E11D48;
          "
        >
          Gagal memuat data absensi.
        </td>
      </tr>
    `;
  }
}


// ============================================================
// STATUS SPP ANAK
// ============================================================

function renderSppAnak() {

  const tahunSekarang =
    getNowWIB().getFullYear();

  const tahunOptions =
    `<option value="">
       Semua tahun
     </option>` +

    [
      tahunSekarang,
      tahunSekarang - 1,
      tahunSekarang - 2
    ]
      .map(
        (t) =>
          `
          <option
            value="${t}"
            ${
              t === tahunSekarang
                ? "selected"
                : ""
            }
          >
            ${t}
          </option>
          `
      )
      .join("");

  return `
    <div id="pilihAnakWrap"></div>

    <div class="section">

      <div class="section-head">

        <h2>Status SPP</h2>

        <div class="controls">

          <select id="sppAnakTahun">
            ${tahunOptions}
          </select>

          <button
            class="btn secondary"
            onclick="window.__app.loadSppAnak()"
          >
            Tampilkan
          </button>

        </div>

      </div>

      <div class="section-body">

        <table>

          <thead>

            <tr>
              <th>Bulan</th>
              <th>Tahun</th>
              <th class="num">Nominal</th>
              <th>Status</th>
              <th>Tanggal Bayar</th>
              <th>Aksi</th>
            </tr>

          </thead>

          <tbody id="daftarSppAnak">

            <tr>
              <td
                colspan="6"
                style="text-align:center;"
              >
                Memuat data...
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  `;
}


// ============================================================
// LOAD SPP ANAK
// ============================================================

async function loadSppAnak() {

  const wrap =
    document.getElementById(
      "pilihAnakWrap"
    );

  const tbody =
    document.getElementById(
      "daftarSppAnak"
    );

  if (!tbody || !supabase) return;

  await pastikanAnakOrangTuaDimuat();

  if (wrap) {
    wrap.innerHTML =
      renderPilihAnakHtml();
  }

  if (
    anakOrangTuaList.length === 0
  ) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          style="text-align:center;"
        >
          Belum ada data siswa yang
          terhubung dengan akun ini.
        </td>
      </tr>
    `;
    return;
  }

  const anak =
    anakYangDipilih();

  const tahun =
    document.getElementById(
      "sppAnakTahun"
    )?.value;

  tbody.innerHTML = `
    <tr>
      <td
        colspan="6"
        style="text-align:center;"
      >
        Memuat data...
      </td>
    </tr>
  `;

  try {

    let query =
      supabase
        .from("spp")
        .select(
          `
          id,
          bulan,
          tahun,
          nominal,
          status,
          tanggal_bayar,
          bukti_bayar_url
          `
        )
        .eq(
          "siswa_id",
          anak.id
        );

    if (tahun) {
      query =
        query.eq(
          "tahun",
          Number(tahun)
        );
    }

    const {
      data,
      error
    } = await query
      .order(
        "tahun",
        {
          ascending: false
        }
      )
      .order(
        "bulan",
        {
          ascending: false
        }
      );

    if (error) throw error;

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
            Belum ada data SPP.
          </td>
        </tr>
      `;
      return;
    }

    const dataWithSigned = await Promise.all(
      data.map(async (s) => ({
        ...s,
        buktiSignedUrl: s.bukti_bayar_url
          ? await getBuktiSignedUrlOrtu(s.bukti_bayar_url)
          : null,
      }))
    );

    tbody.innerHTML =
      dataWithSigned
        .map(
          (s) => {

            let aksi = "-";

            if (
              s.status ===
              "Belum Bayar"
            ) {
              aksi = `
                <button
                  class="btn small"
                  onclick="window.__app.pilihBuktiSpp('${s.id}')"
                >
                  📎 Kirim Bukti
                </button>

                <input
                  type="file"
                  id="fileSpp_${s.id}"
                  accept="image/jpeg,image/png,application/pdf"
                  style="display:none;"
                  onchange="window.__app.uploadBuktiSpp('${s.id}', this.files[0])"
                >
              `;
            }

            if (
              s.status ===
              "Menunggu Verifikasi"
            ) {
              aksi = `
                <span
                  style="
                    font-size:12px;
                    color:var(--ink-soft);
                  "
                >
                  Bukti sudah dikirim,
                  menunggu verifikasi admin.
                </span>

                ${
                  s.bukti_bayar_url
                    ? `
                      <div style="margin-top:5px;">
                        <a
                          href="${s.buktiSignedUrl}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat bukti
                        </a>
                      </div>
                    `
                    : ""
                }
              `;
            }

            if (
              s.status ===
              "Lunas"
            ) {
              aksi = `
                <span
                  style="
                    font-size:12px;
                    color:#15803D;
                  "
                >
                  ✓ Pembayaran terverifikasi
                </span>
              `;
            }

            return `
              <tr>

                <td>
                  ${namaBulan(s.bulan)}
                </td>

                <td>
                  ${s.tahun}
                </td>

                <td class="num">
                  ${formatRupiah(s.nominal)}
                </td>

                <td>

                  <span
                    class="badge ${
                      s.status ===
                      "Lunas"
                        ? "badge-good"
                        : s.status ===
                          "Menunggu Verifikasi"
                        ? "badge-warn"
                        : "badge-bad"
                    }"
                  >
                    ${s.status}
                  </span>

                </td>

                <td>
                  ${s.tanggal_bayar || "-"}
                </td>

                <td>
                  ${aksi}
                </td>

              </tr>
            `;
          }
        )
        .join("");

  } catch (error) {

    console.error(
      "Error load SPP anak:",
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
// PILIH FILE BUKTI
// ============================================================

function pilihBuktiSpp(id) {

  const input =
    document.getElementById(
      `fileSpp_${id}`
    );

  if (!input) return;

  input.click();
}


// ============================================================
// UPLOAD BUKTI PEMBAYARAN
// ============================================================

async function uploadBuktiSpp(
  sppId,
  file
) {

  if (!file) return;

  if (!supabase) {
    alert(
      "Supabase belum terhubung."
    );
    return;
  }

  // Maksimal 5 MB
  const maxSize =
    5 * 1024 * 1024;

  if (file.size > maxSize) {
    alert(
      "Ukuran file maksimal 5 MB."
    );
    return;
  }

  const tipeDiizinkan = [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ];

  if (
    !tipeDiizinkan.includes(
      file.type
    )
  ) {
    alert(
      "File harus berupa JPG, PNG, atau PDF."
    );
    return;
  }

  try {

    // Ambil data SPP yang dipilih
    const {
      data: spp,
      error: sppError
    } = await supabase
      .from("spp")
      .select(
        `
        id,
        siswa_id,
        bulan,
        tahun,
        status
        `
      )
      .eq(
        "id",
        sppId
      )
      .single();

    if (sppError) {
      throw sppError;
    }

    if (
      !spp ||
      spp.status !==
        "Belum Bayar"
    ) {
      alert(
        "Tagihan ini tidak dapat menerima bukti pembayaran."
      );
      return;
    }

    // Pastikan SPP memang milik anak akun ini
    await pastikanAnakOrangTuaDimuat();

    const anak = anakOrangTuaList.find(
      (a) =>
        String(a.id) ===
        String(spp.siswa_id)
    );

    if (!anak) {
      alert(
        "Anda tidak memiliki akses ke tagihan ini."
      );
      return;
    }

    const extension =
      file.name.includes(".")
        ? file.name
            .split(".")
            .pop()
            .toLowerCase()
        : "bin";

    const safeName =
      `spp-${spp.tahun}-${String(
        spp.bulan
      ).padStart(2, "0")}-${Date.now()}.${extension}`;

    const folder =
      currentUser.id;

    const filePath =
      `${folder}/${safeName}`;

    // Upload
    const {
      error: uploadError
    } = await supabase
      .storage
      .from("bukti-pembayaran")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // Simpan PATH file, bukan URL publik.
    const {
      error: updateError
    } = await supabase
      .from("spp")
      .update({
        bukti_bayar_url:
          filePath,
        status:
          "Menunggu Verifikasi"
      })
      .eq(
        "id",
        sppId
      );

    if (updateError) {
      // Bersihkan file bila update DB gagal
      await supabase
        .storage
        .from("bukti-pembayaran")
        .remove([
          filePath
        ]);

      throw updateError;
    }

    alert(
      "✅ Bukti pembayaran berhasil dikirim.\n\n" +
      "Status SPP sekarang: Menunggu Verifikasi."
    );

    await loadSppAnak();

  } catch (error) {

    console.error(
      "Error upload bukti:",
      error
    );

    alert(
      "Gagal mengirim bukti pembayaran:\n\n" +
      (
        error?.message ||
        "Terjadi kesalahan."
      )
    );
  }
}

async function debugAksesPembayaran() {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      alert("Session login tidak ditemukan.");
      return;
    }

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from("pengguna")
      .select("id,user_id,nama,email,role")
      .eq("user_id", user.id)
      .single();

    if (profileError) throw profileError;

    const {
      data: anak,
      error: anakError
    } = await supabase
      .from("siswa")
      .select("id,nama,orang_tua_id")
      .eq(
        "orang_tua_id",
        profile.id
      );

    if (anakError) throw anakError;

    console.log("AUTH USER:", user);
    console.log("PROFILE:", profile);
    console.log("ANAK:", anak);

    alert(
      "HASIL DEBUG\n\n" +
      "Login: " + user.email + "\n" +
      "Nama: " + profile.nama + "\n" +
      "Role: " + profile.role + "\n" +
      "ID Profil: " + profile.id + "\n" +
      "Jumlah anak: " + (anak || []).length
    );

  } catch (error) {
    console.error(
      "DEBUG PEMBAYARAN:",
      error
    );

    alert(
      "DEBUG GAGAL:\n\n" +
      (error?.message || error)
    );
  }
}


