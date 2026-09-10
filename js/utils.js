// ============================================================
      // UTILITIES
      // ============================================================
      // Kolom absensi.status di database hanya menerima kode huruf
      // (H/I/S/A), jadi semua penyimpanan/pembacaan pakai kode ini.
      // Untuk tampilan, kode dipetakan ke label Bahasa Indonesia di sini.
      const ABSEN_STATUS_LABELS = { H: "Hadir", I: "Izin", S: "Sakit", A: "Alpa" };

      function labelStatusAbsensi(kode) {
        return ABSEN_STATUS_LABELS[kode] || kode || "-";
      }

      function statusBadgeAbsensi(status) {
        const map = { H: "badge-good", I: "badge-warn", S: "badge-sick", A: "badge-bad" };
        return map[status] || "badge-muted";
      }

      function formatRupiah(angka) {
        const n = Number(angka) || 0;
        return "Rp " + n.toLocaleString("id-ID");
      }

      function namaBulan(bulanNum) {
        const nama = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];
        return nama[(Number(bulanNum) || 1) - 1] || "-";
      }

      async function loadKelasOptions(selectId) {
        const select = document.getElementById(selectId);
        if (!select || !supabase) return;

        try {
          const { data, error } = await supabase.from("siswa").select("kelas");
          if (error) throw error;

          const kelasUnik = [...new Set((data || []).map((s) => s.kelas).filter(Boolean))].sort();
          select.innerHTML =
            `<option value="">Pilih kelas...</option>` +
            kelasUnik.map((k) => `<option value="${k}">${k}</option>`).join("");
        } catch (error) {
          console.error("Error load kelas:", error);
        }
      }

      function updateTodayChip() {
        const today = new Date();
        const options = { day: "numeric", month: "short", year: "numeric" };
        const formatted = today.toLocaleDateString("id-ID", options);
        document.getElementById("todayChip").textContent = formatted;
      }
