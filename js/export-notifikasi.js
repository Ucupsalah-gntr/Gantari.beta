// ============================================================
// GANTARIKU — EXPORT & NOTIFIKASI REALTIME
// ============================================================


// ============================================================
// EXPORT CSV
// ============================================================

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
    document.getElementById(
      "notifPanel"
    );

  const count =
    document.getElementById(
      "notifCount"
    );

  if (
    !panel ||
    !count ||
    !supabase ||
    currentUserRole !== "admin"
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


    // --------------------------------------------------------
    // SPP BULAN INI
    // --------------------------------------------------------

    const {
      data: spp,
    } =
      await supabase
        .from("spp")
        .select(
          "id,status"
        )
        .eq(
          "bulan",
          bulan
        )
        .eq(
          "tahun",
          tahun
        );


    const semuaSpp =
      spp || [];

    const belumBayar =
      semuaSpp.filter(
        (x) =>
          x.status ===
          "Belum Bayar"
      ).length;

    const menunggu =
      semuaSpp.filter(
        (x) =>
          x.status ===
          "Menunggu Verifikasi"
      ).length;


    if (menunggu > 0) {
      items.push(
        `🔔 ${menunggu} pembayaran SPP menunggu verifikasi.`
      );
    }

    if (belumBayar > 0) {
      items.push(
        `💳 ${belumBayar} tagihan SPP ${namaBulan(
          bulan
        )} belum lunas.`
      );
    }


    // --------------------------------------------------------
    // ABSENSI GURU
    // --------------------------------------------------------

    const {
      data: absensiGuru,
    } =
      await supabase
        .from(
          "absensi_guru"
        )
        .select(
          "guru_id"
        )
        .eq(
          "tanggal",
          tanggal
        );

    const {
      count: jumlahGuru,
    } =
      await supabase
        .from("pengguna")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "role",
          "guru"
        );

    const recordedGuru =
      new Set(
        (
          absensiGuru ||
          []
        ).map(
          (x) =>
            x.guru_id
        )
      );

    if (
      jumlahGuru &&
      recordedGuru.size <
        jumlahGuru
    ) {
      items.push(
        `👩‍🏫 ${
          jumlahGuru -
          recordedGuru.size
        } guru/pelatih belum mengisi absensi hari ini.`
      );
    }


    // --------------------------------------------------------
    // ABSENSI SISWA
    // --------------------------------------------------------

    const {
      data: absensiSiswa,
    } =
      await supabase
        .from("absensi")
        .select(
          "siswa_id"
        )
        .eq(
          "tanggal",
          tanggal
        );

    const {
      count: jumlahSiswa,
    } =
      await supabase
        .from("siswa")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        );

    if (
      jumlahSiswa &&
      (
        absensiSiswa ||
        []
      ).length <
        jumlahSiswa
    ) {
      items.push(
        "📋 Masih ada siswa yang belum memiliki absensi hari ini."
      );
    }

  } catch (error) {

    console.error(
      "Error load notifikasi:",
      error
    );

  }


  count.textContent =
    items.length;

  count.style.display =
    items.length
      ? "inline-block"
      : "none";


  panel.innerHTML =
    items.length
      ? `
        <div
          style="
            font-weight:700;
            margin-bottom:6px;
          "
        >
          Perlu Perhatian
        </div>

        ${items
          .map(
            (item) =>
              `
                <div class="notif-item">
                  ${item}
                </div>
              `
          )
          .join("")}
      `
      : `
        <div
          style="font-weight:700;"
        >
          Semua aman ✨
        </div>

        <div class="notif-item">
          Belum ada hal yang perlu ditindaklanjuti.
        </div>
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
    currentUserRole !==
      "admin"
  ) {
    return;
  }


  // Hindari subscription ganda.
  stopRealtimeNotifications();


  gantarikuRealtimeChannel =
    supabase
      .channel(
        "gantariku-admin-realtime"
      )

      // ------------------------------------------------------
      // SPP
      // ------------------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spp",
        },
        (payload) => {

          console.log(
            "Realtime SPP:",
            payload.eventType
          );

          jadwalkanRefreshNotifikasi();
        }
      )

      // ------------------------------------------------------
      // ABSENSI SISWA
      // ------------------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi",
        },
        () => {
          jadwalkanRefreshNotifikasi();
        }
      )

      // ------------------------------------------------------
      // ABSENSI GURU
      // ------------------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi_guru",
        },
        () => {
          jadwalkanRefreshNotifikasi();
        }
      )

      .subscribe(
        (status) => {

          console.log(
            "Gantariku Realtime:",
            status
          );

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
  gantarikuRealtimeChannel = supabase
  .channel("gantariku-admin-realtime")

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "spp"
    },
    () => {
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
      jadwalkanRefreshNotifikasi();
    }
  )

  .subscribe();
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
