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
    !count ||
    !panel
  ) {
    return;
  }

  const items = [];

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
    // 1. PEMBAYARAN MENUNGGU VERIFIKASI
    //    Tidak dibatasi bulan berjalan.
    // ========================================================

    const {
      data: pembayaranPending,
      error: pendingError
    } = await supabase
      .from("spp")
      .select(`
        id,
        bulan,
        tahun,
        nominal,
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


    // Batasi tampilan supaya panel tidak terlalu panjang
    const pending =
      pembayaranPending || [];

    pending
      .slice(0, 5)
      .forEach(
        (spp) => {

          items.push({
            type: "payment",
            text:
              `🔔 ${spp.siswa?.nama || "Siswa"} ` +
              `mengirim bukti SPP ` +
              `${namaBulan(spp.bulan)} ${spp.tahun} ` +
              `sebesar ${formatRupiah(spp.nominal)}.`,
            sppId:
              spp.id
          });

        }
      );


    // ========================================================
    // 2. SPP BELUM LUNAS BULAN BERJALAN
    //    Ini hanya warning, bukan pembayaran baru.
    // ========================================================

    const {
      data: sppBulanIni,
      error: sppError
    } = await supabase
      .from("spp")
      .select("id,status")
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

    const jumlahBelumBayar =
      (
        sppBulanIni ||
        []
      ).length;

    if (
      jumlahBelumBayar > 0
    ) {

      items.push({
        type: "warning",
        text:
          `💳 ${jumlahBelumBayar} tagihan SPP ` +
          `${namaBulan(bulan)} ${tahun} belum lunas.`
      });

    }


    // ========================================================
    // 3. ABSENSI GURU
    // ========================================================

    const {
      data: absensiGuru,
      error: guruAbsenError
    } = await supabase
      .from("absensi_guru")
      .select("guru_id")
      .eq(
        "tanggal",
        tanggal
      );

    if (guruAbsenError) {
      throw guruAbsenError;
    }

    const {
      count: jumlahGuru,
      error: guruCountError
    } = await supabase
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

    if (guruCountError) {
      throw guruCountError;
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

      items.push({
        type: "warning",
        text:
          `👩‍🏫 ${guruBelumAbsen} guru/pelatih ` +
          `belum mengisi absensi hari ini.`
      });

    }


    // ========================================================
    // 4. ABSENSI SISWA
    // ========================================================

    const {
      data: absensiSiswa,
      error: siswaAbsenError
    } = await supabase
      .from("absensi")
      .select("siswa_id")
      .eq(
        "tanggal",
        tanggal
      );

    if (siswaAbsenError) {
      throw siswaAbsenError;
    }

    const {
      count: jumlahSiswa,
      error: siswaCountError
    } = await supabase
      .from("siswa")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      );

    if (siswaCountError) {
      throw siswaCountError;
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

      items.push({
        type: "warning",
        text:
          `📋 ${siswaBelumAbsen} siswa ` +
          `belum memiliki absensi hari ini.`
      });

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
        "
      >
        Notifikasi gagal dimuat
      </div>

      <div
        class="notif-item"
      >
        Silakan coba lagi.
      </div>
    `;

    return;
  }


  // ==========================================================
  // JUMLAH NOTIFIKASI
  //
  // Yang dianggap "notifikasi" adalah seluruh item.
  // ==========================================================

  count.textContent =
    items.length;

  count.style.display =
    items.length
      ? "inline-flex"
      : "none";


  // ==========================================================
  // ISI PANEL
  // ==========================================================

  if (
    items.length === 0
  ) {

    panel.innerHTML = `
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

    return;
  }


  panel.innerHTML = `
    <div
      style="
        font-weight:700;
        margin-bottom:8px;
      "
    >
      Perlu Perhatian
    </div>

    ${items
      .map(
        (item) => {

          if (
            item.type ===
            "payment"
          ) {

            return `
              <div
                class="notif-item"
                style="
                  cursor:pointer;
                "
                onclick="
                  window.__app.goTo('spp');
                  setTimeout(
                    () => {
                      window.__app.loadSpp();
                    },
                    100
                  );
                "
              >

                <div>
                  ${item.text}
                </div>

                <div
                  style="
                    margin-top:5px;
                    font-size:11px;
                    color:var(--primary-dark);
                    font-weight:600;
                  "
                >
                  Buka Monitoring SPP →
                </div>

              </div>
            `;

          }

          return `
            <div class="notif-item">
              ${item.text}
            </div>
          `;
        }
      )
      .join("")}
  `;
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
