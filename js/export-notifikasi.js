function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((v) => {
          const x = String(v ?? "")
            .replace(/"/g, '""');

          return `"${x}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    500
  );
}


// ============================================================
// EXPORT SPP
// ============================================================

async function exportSppCsv() {
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

  const status =
    document.getElementById(
      "filterStatusSpp"
    )?.value;

  let query =
    supabase
      .from("spp")
      .select(
        "nominal,status,tanggal_bayar,siswa:siswa_id(nama,kelas,nis)"
      )
      .eq("bulan", bulan)
      .eq("tahun", tahun)
      .order(
        "created_at",
        {
          ascending: false,
        }
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
  } = await query;

  if (error) {
    return alert(
      "Gagal export SPP: " +
        error.message
    );
  }

  const rows = [
    [
      "Nama",
      "NIS",
      "Kelas",
      "Nominal",
      "Status",
      "Tanggal Bayar",
    ],
  ];

  (data || []).forEach(
    (x) =>
      rows.push([
        x.siswa?.nama || "",
        x.siswa?.nis || "",
        x.siswa?.kelas || "",
        x.nominal || 0,
        x.status || "",
        x.tanggal_bayar || "",
      ])
  );

  downloadCsv(
    `gantariku-spp-${tahun}-${String(
      bulan
    ).padStart(2, "0")}.csv`,
    rows
  );
}


// ============================================================
// EXPORT ABSENSI GURU
// ============================================================

async function exportAbsensiGuruCsv() {
  if (!supabase) {
    return alert(
      "Supabase belum terhubung."
    );
  }

  const dari =
    document.getElementById(
      "guruAbsenTanggalDari"
    )?.value;

  const sampai =
    document.getElementById(
      "guruAbsenTanggalSampai"
    )?.value;

  const status =
    document.getElementById(
      "guruAbsenStatus"
    )?.value;

  let query =
    supabase
      .from("absensi_guru")
      .select(
        "tanggal,status,keterangan,guru:guru_id(nama,email)"
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
          ascending: false,
        }
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
  } = await query;

  if (error) {
    return alert(
      "Gagal export absensi guru: " +
        error.message
    );
  }

  const rows = [
    [
      "Tanggal",
      "Guru/Pelatih",
      "Email",
      "Status",
      "Keterangan",
    ],
  ];

  (data || []).forEach(
    (x) =>
      rows.push([
        x.tanggal || "",
        x.guru?.nama || "",
        x.guru?.email || "",
        x.status || "",
        x.keterangan || "",
      ])
  );

  downloadCsv(
    `gantariku-absensi-guru-${dari}-${sampai}.csv`,
    rows
  );
}


// ============================================================
// EXPORT REKAP ABSENSI
// ============================================================

async function exportRekapAbsensiCsv() {
  if (!supabase) {
    return alert(
      "Supabase belum terhubung."
    );
  }

  const dari =
    document.getElementById(
      "rekapDari"
    )?.value;

  const sampai =
    document.getElementById(
      "rekapSampai"
    )?.value;

  const kelas =
    document.getElementById(
      "rekapKelas"
    )?.value;

  const {
    data,
    error,
  } =
    await supabase
      .from("absensi")
      .select(
        "tanggal,status,keterangan,siswa:siswa_id(nama,nis,kelas)"
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
          ascending: false,
        }
      );

  if (error) {
    return alert(
      "Gagal export rekap absensi: " +
        error.message
    );
  }

  const hasil =
    (data || []).filter(
      (x) =>
        !kelas ||
        x.siswa?.kelas ===
          kelas
    );

  const rows = [
    [
      "Tanggal",
      "Nama",
      "NIS",
      "Kelas",
      "Status",
      "Keterangan",
    ],
  ];

  hasil.forEach(
    (x) =>
      rows.push([
        x.tanggal || "",
        x.siswa?.nama || "",
        x.siswa?.nis || "",
        x.siswa?.kelas || "",
        x.status || "",
        x.keterangan || "",
      ])
  );

  downloadCsv(
    `gantariku-rekap-absensi-${dari}-${sampai}.csv`,
    rows
  );
}


// ============================================================
// NOTIFIKASI
// ============================================================

let gantarikuRealtimeChannel =
  null;

let notifikasiRefreshTimer =
  null;


// ------------------------------------------------------------
// Toggle panel
// ------------------------------------------------------------

function toggleNotifikasi() {
  const panel =
    document.getElementById(
      "notifPanel"
    );

  if (!panel) return;

  panel.classList.toggle(
    "show"
  );

  if (
    panel.classList.contains(
      "show"
    )
  ) {
    loadNotifikasi();
  }
}


// ------------------------------------------------------------
// Load notifikasi
// ------------------------------------------------------------

async function loadNotifikasi() {

  const panel =
    document.getElementById("notifPanel");

  const count =
    document.getElementById("notifCount");

  if (
    !supabase ||
    currentUserRole !== "admin" ||
    !panel ||
    !count
  ) {
    return;
  }

  const pembayaran = [];
  const perhatian = [];

  try {

    const now =
      getNowWIB();

    const bulan =
      now.getMonth() + 1;

    const tahun =
      now.getFullYear();

    const tanggal =
      getTodayWIBString();


    // ========================================================
    // A. PEMBAYARAN YANG MENUNGGU VERIFIKASI
    // ========================================================

    const {
      data: pending,
      error: pendingError
    } =
      await supabase
        .from("spp")
        .select(`
          id,
          bulan,
          tahun,
          nominal,
          updated_at,
          siswa:siswa_id (
            nama,
            kelas
          )
        `)
        .eq(
          "status",
          "Menunggu Verifikasi"
        )
        .order(
          "updated_at",
          {
            ascending: false
          }
        );

    if (pendingError) {
      throw pendingError;
    }

    (pending || [])
      .slice(0, 10)
      .forEach(
        (spp) => {

          pembayaran.push({
            id:
              spp.id,

            bulan:
              Number(spp.bulan),

            tahun:
              Number(spp.tahun),

            nama:
              spp.siswa?.nama ||
              "Siswa",

            kelas:
              spp.siswa?.kelas ||
              "-",

            nominal:
              spp.nominal ||
              0,

            waktu:
              spp.updated_at
          });

        }
      );


    // ========================================================
    // B. SPP BULAN BERJALAN
    //    Ini PERHATIAN, bukan notifikasi pembayaran baru.
    // ========================================================

    const {
      data: sppBelumBayar,
      error: sppError
    } =
      await supabase
        .from("spp")
        .select("id")
        .eq(
          "bulan",
          bulan
        )
        .eq(
          "tahun",
          tahun
        )
        .eq(
          "status",
          "Belum Bayar"
        );

    if (sppError) {
      throw sppError;
    }

    if (
      (sppBelumBayar || [])
        .length > 0
    ) {

      perhatian.push(
        `💳 ${
          sppBelumBayar.length
        } tagihan SPP ${namaBulan(
          bulan
        )} ${tahun} belum lunas.`
      );

    }


    // ========================================================
    // C. ABSENSI GURU
    // ========================================================

    const {
      data: absensiGuru,
      error: agError
    } =
      await supabase
        .from("absensi_guru")
        .select("guru_id")
        .eq(
          "tanggal",
          tanggal
        );

    if (agError) {
      throw agError;
    }


    const {
      count: jumlahGuru,
      error: guruError
    } =
      await supabase
        .from("pengguna")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "role",
          "guru"
        );

    if (guruError) {
      throw guruError;
    }


    const guruSudahAbsen =
      new Set(
        (
          absensiGuru ||
          []
        ).map(
          (x) =>
            x.guru_id
        )
      );


    const guruBelumAbsen =
      Math.max(
        0,
        (jumlahGuru || 0) -
        guruSudahAbsen.size
      );


    if (
      guruBelumAbsen > 0
    ) {

      perhatian.push(
        `👩‍🏫 ${
          guruBelumAbsen
        } guru/pelatih belum mengisi absensi hari ini.`
      );

    }


    // ========================================================
    // D. ABSENSI SISWA
    // ========================================================

    const {
      data: absensiSiswa,
      error: asError
    } =
      await supabase
        .from("absensi")
        .select("siswa_id")
        .eq(
          "tanggal",
          tanggal
        );

    if (asError) {
      throw asError;
    }


    const {
      count: jumlahSiswa,
      error: siswaError
    } =
      await supabase
        .from("siswa")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        );

    if (siswaError) {
      throw siswaError;
    }


    const jumlahAbsenSiswa =
      (
        absensiSiswa ||
        []
      ).length;

    const siswaBelumAbsen =
      Math.max(
        0,
        (jumlahSiswa || 0) -
        jumlahAbsenSiswa
      );


    if (
      siswaBelumAbsen > 0
    ) {

      perhatian.push(
        `📋 ${
          siswaBelumAbsen
        } siswa belum memiliki absensi hari ini.`
      );

    }


  } catch (error) {

    console.error(
      "Error load notifikasi:",
      error
    );

    count.textContent = "!";
    count.style.display =
      "inline-flex";

    panel.innerHTML = `
      <div
        style="
          font-weight:700;
          color:var(--bad);
          margin-bottom:6px;
        "
      >
        Notifikasi gagal dimuat
      </div>

      <div class="notif-item">
        Silakan coba lagi.
      </div>
    `;

    return;
  }


  // ==========================================================
  // BADGE
  // HANYA menghitung pembayaran pending.
  // ==========================================================

  count.textContent =
    pembayaran.length;

  count.style.display =
    pembayaran.length > 0
      ? "inline-flex"
      : "none";


  // ==========================================================
  // PANEL
  // ==========================================================

  let html = "";


  // ----------------------------------------------------------
  // PEMBAYARAN
  // ----------------------------------------------------------

  if (
    pembayaran.length > 0
  ) {

    html += `
      <div
        style="
          font-weight:700;
          margin-bottom:10px;
        "
      >
        Pembayaran Menunggu Verifikasi
      </div>
    `;


    pembayaran.forEach(
      (item) => {

        html += `
          <div
            class="notif-item notif-payment"
            onclick="
              window.__app.bukaPembayaranDariNotifikasi(
                '${item.id}',
                ${item.bulan},
                ${item.tahun}
              )
            "
          >

            <div
              style="
                font-weight:600;
                line-height:1.4;
              "
            >
              🔔 ${item.nama}
            </div>

            <div
              style="
                font-size:12px;
                margin-top:3px;
                color:var(--ink-soft);
              "
            >
              SPP ${
                namaBulan(
                  item.bulan
                )
              } ${
                item.tahun
              }
              ·
              ${formatRupiah(
                item.nominal
              )}
            </div>

            <div
              style="
                margin-top:7px;
                color:var(--primary-dark);
                font-size:11px;
                font-weight:700;
              "
            >
              Periksa pembayaran →
            </div>

          </div>
        `;

      }
    );

  }


  // ----------------------------------------------------------
  // PERHATIAN
  // ----------------------------------------------------------

  if (
    perhatian.length > 0
  ) {

    html += `
      <div
        style="
          font-weight:700;
          margin-top:14px;
          margin-bottom:6px;
          padding-top:10px;
          border-top:1px solid var(--line);
        "
      >
        Perlu Perhatian
      </div>
    `;


    perhatian.forEach(
      (item) => {

        html += `
          <div class="notif-item">
            ${item}
          </div>
        `;

      }
    );

  }


  // ----------------------------------------------------------
  // TIDAK ADA APA-APA
  // ----------------------------------------------------------

  if (
    pembayaran.length === 0 &&
    perhatian.length === 0
  ) {

    html = `
      <div
        style="
          font-weight:700;
          margin-bottom:6px;
        "
      >
        Semua aman ✨
      </div>

      <div class="notif-item">
        Belum ada hal yang perlu ditindaklanjuti.
      </div>
    `;

  }


  panel.innerHTML =
    html;
}
function bukaPembayaranDariNotifikasi(
  sppId,
  bulan,
  tahun
) {

  // Tutup panel
  const panel =
    document.getElementById(
      "notifPanel"
    );

  if (panel) {
    panel.classList.remove(
      "show"
    );
  }

  // Pindah ke Monitoring SPP
  window.__app.goTo(
    "spp"
  );

  // Tunggu view selesai dirender
  setTimeout(
    () => {

      const filterBulan =
        document.getElementById(
          "filterBulanSpp"
        );

      const filterTahun =
        document.getElementById(
          "filterTahunSpp"
        );

      const filterStatus =
        document.getElementById(
          "filterStatusSpp"
        );


      if (filterBulan) {
        filterBulan.value =
          String(bulan);
      }

      if (filterTahun) {
        filterTahun.value =
          String(tahun);
      }

      if (filterStatus) {
        filterStatus.value =
          "Menunggu Verifikasi";
      }


      // Muat ulang data sesuai
      // pembayaran yang diklik
      loadSpp();


      // Setelah tabel selesai,
      // cari row/tagihan tersebut
      setTimeout(
        () => {

          const row =
            document.querySelector(
              `[data-spp-id="${sppId}"]`
            );

          if (row) {
            row.scrollIntoView({
              behavior:
                "smooth",
              block:
                "center"
            });

            row.style.outline =
              "3px solid #8B5CF6";

            setTimeout(
              () => {
                row.style.outline =
                  "";
              },
              2200
            );
          }

        },
        300
      );

    },
    100
  );
}

// ============================================================
// REFRESH NOTIFIKASI DENGAN DEBOUNCE
// ============================================================

function jadwalkanRefreshNotifikasi() {

  clearTimeout(
    notifikasiRefreshTimer
  );

  notifikasiRefreshTimer =
    setTimeout(
      () => {
        loadNotifikasi();
      },
      350
    );
}


// ============================================================
// START REALTIME
// ============================================================

function startRealtimeNotifications() {

  if (
    !supabase ||
    currentUserRole !== "admin"
  ) {
    return;
  }

  // Jangan membuat subscription baru
  // kalau sudah ada yang aktif.
  if (gantarikuRealtimeChannel) {
    console.log(
      "Gantariku Realtime sudah aktif."
    );
    return;
  }

  console.log(
    "Memulai Gantariku Realtime..."
  );

  const channel =
    supabase
      .channel(
        "gantariku-admin-realtime"
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spp"
        },
        () => {
          console.log(
            "Realtime: perubahan SPP"
          );

          jadwalkanRefreshNotifikasi();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi"
        },
        () => {
          console.log(
            "Realtime: perubahan absensi siswa"
          );

          jadwalkanRefreshNotifikasi();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi_guru"
        },
        () => {
          console.log(
            "Realtime: perubahan absensi guru"
          );

          jadwalkanRefreshNotifikasi();
        }
      );

  // Simpan channel SEBELUM subscribe.
  // Dengan demikian pemanggilan kedua
  // langsung berhenti di guard di atas.
  gantarikuRealtimeChannel =
    channel;

  channel.subscribe(
    (status) => {
      console.log(
        "Gantariku Realtime:",
        status
      );

      if (
        status ===
          "CHANNEL_ERROR" ||
        status ===
          "TIMED_OUT"
      ) {
        gantarikuRealtimeChannel =
          null;
      }
    }
  );
}


// ============================================================
// STOP REALTIME
// ============================================================

function stopRealtimeNotifications() {

  if (
    gantarikuRealtimeChannel &&
    supabase
  ) {

    supabase.removeChannel(
      gantarikuRealtimeChannel
    );
  }

  gantarikuRealtimeChannel =
    null;
}



// ============================================================
// ROLE LABEL
// ============================================================

function getRoleLabel(role) {

  const map = {
    admin: "Admin Sekolah",
    guru: "Guru",
    ortu: "Orang Tua",
  };

  return (
    map[role] ||
    role
  );
}
