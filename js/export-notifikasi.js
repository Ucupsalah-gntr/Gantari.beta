// ============================================================
      // UTILITAS: EXPORT & NOTIFIKASI
      // ============================================================
      function downloadCsv(filename, rows) {
        const csv = rows.map(row => row.map(v => { const x = String(v ?? "").replace(/"/g, '""'); return `"${x}"`; }).join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }

      async function exportSppCsv() {
        if (!supabase) return alert("Supabase belum terhubung.");
        const bulan = Number(document.getElementById("filterBulanSpp")?.value);
        const tahun = Number(document.getElementById("filterTahunSpp")?.value);
        const status = document.getElementById("filterStatusSpp")?.value;
        let query = supabase.from("spp").select("nominal,status,tanggal_bayar,siswa:siswa_id(nama,kelas,nis)").eq("bulan", bulan).eq("tahun", tahun).order("created_at", {ascending:false});
        if (status) query = query.eq("status", status);
        const {data,error}=await query; if(error) return alert("Gagal export SPP: " + error.message);
        const rows=[["Nama","NIS","Kelas","Nominal","Status","Tanggal Bayar"]];
        (data||[]).forEach(x=>rows.push([x.siswa?.nama||"",x.siswa?.nis||"",x.siswa?.kelas||"",x.nominal||0,x.status||"",x.tanggal_bayar||""]));
        downloadCsv(`gantariku-spp-${tahun}-${String(bulan).padStart(2,"0")}.csv`,rows);
      }

      async function exportAbsensiGuruCsv() {
        if (!supabase) return alert("Supabase belum terhubung.");
        const dari=document.getElementById("guruAbsenTanggalDari")?.value, sampai=document.getElementById("guruAbsenTanggalSampai")?.value, status=document.getElementById("guruAbsenStatus")?.value;
        let query=supabase.from("absensi_guru").select("tanggal,status,keterangan,guru:guru_id(nama,email)").gte("tanggal",dari).lte("tanggal",sampai).order("tanggal",{ascending:false});
        if(status) query=query.eq("status",status);
        const {data,error}=await query; if(error) return alert("Gagal export absensi guru: "+error.message);
        const rows=[["Tanggal","Guru/Pelatih","Email","Status","Keterangan"]];
        (data||[]).forEach(x=>rows.push([x.tanggal||"",x.guru?.nama||"",x.guru?.email||"",x.status||"",x.keterangan||""]));
        downloadCsv(`gantariku-absensi-guru-${dari}-${sampai}.csv`,rows);
      }

      async function exportRekapAbsensiCsv() {
        if (!supabase) return alert("Supabase belum terhubung.");
        const dari=document.getElementById("rekapDari")?.value, sampai=document.getElementById("rekapSampai")?.value, kelas=document.getElementById("rekapKelas")?.value;
        const {data,error}=await supabase.from("absensi").select("tanggal,status,keterangan,siswa:siswa_id(nama,nis,kelas)").gte("tanggal",dari).lte("tanggal",sampai).order("tanggal",{ascending:false});
        if(error) return alert("Gagal export rekap absensi: "+error.message);
        const hasil=(data||[]).filter(x=>!kelas || x.siswa?.kelas===kelas);
        const rows=[["Tanggal","Nama","NIS","Kelas","Status","Keterangan"]];
        hasil.forEach(x=>rows.push([x.tanggal||"",x.siswa?.nama||"",x.siswa?.nis||"",x.siswa?.kelas||"",x.status||"",x.keterangan||""]));
        downloadCsv(`gantariku-rekap-absensi-${dari}-${sampai}.csv`,rows);
      }

      function toggleNotifikasi(){
        const p=document.getElementById("notifPanel"); if(!p)return; p.classList.toggle("show"); if(p.classList.contains("show")) loadNotifikasi();
      }

      async function loadNotifikasi(){
        const p=document.getElementById("notifPanel"), c=document.getElementById("notifCount"); if(!p||!supabase||currentUserRole!=="admin") return;
        const items=[];
        try{
          const now=new Date(), b=now.getMonth()+1, t=now.getFullYear(), ds=now.toISOString().slice(0,10);
          const {data:spp}=await supabase.from("spp").select("id").eq("bulan",b).eq("tahun",t).neq("status","Lunas");
          if((spp||[]).length) items.push(`💳 ${spp.length} tagihan SPP bulan ${namaBulan(b)} belum lunas.`);
          const {data:ag}=await supabase.from("absensi_guru").select("guru_id").eq("tanggal",ds);
          const {count:gc}=await supabase.from("pengguna").select("id",{count:"exact",head:true}).eq("role","guru");
          const recorded=new Set((ag||[]).map(x=>x.guru_id));
          if(gc && recorded.size<gc) items.push(`👩‍🏫 ${gc-recorded.size} guru/pelatih belum mengisi absensi hari ini.`);
          const {data:a}=await supabase.from("absensi").select("siswa_id").eq("tanggal",ds);
          const {count:sc}=await supabase.from("siswa").select("id",{count:"exact",head:true});
          if(sc && (a||[]).length<sc) items.push(`📋 Masih ada siswa yang belum memiliki absensi hari ini.`);
        }catch(e){console.error(e)}
        c.textContent=items.length; c.style.display=items.length?"inline-block":"none";
        p.innerHTML=items.length?`<div style="font-weight:700;margin-bottom:6px;">Perlu Perhatian</div>${items.map(x=>`<div class="notif-item">${x}</div>`).join("")}`:`<div style="font-weight:700;">Semua aman ✨</div><div class="notif-item">Belum ada hal yang perlu ditindaklanjuti.</div>`;
      }

      function getRoleLabel(role) {
        const map = { admin: "Admin Sekolah", guru: "Guru", ortu: "Orang Tua" };
        return map[role] || role;
      }
