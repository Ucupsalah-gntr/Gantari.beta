// ============================================================
      // VIEW: DASBOR
      // ============================================================
      function renderDasbor() {
        const nama = currentUser?.nama || "Pengelola Gantari";
        return `
          <div class="dash-welcome"><div><h2>Selamat datang, ${nama} &#128155;</h2><p>Yuk lihat kabar Gantari hari ini. Dashboard diringkas supaya tetap nyaman meski siswa sudah ratusan.</p></div><div class="dash-welcome-mark">&#x1FA70;</div></div>
          <div class="dash-summary">
            <div class="dash-mini"><div class="dash-mini-top"><div class="dash-mini-label">Siswa aktif</div><span>&#128103;</span></div><div class="dash-mini-num" id="dashTotalSiswa">&#8211;</div><div class="dash-mini-sub">semua siswa terdaftar</div></div>
            <div class="dash-mini"><div class="dash-mini-top"><div class="dash-mini-label">Kehadiran hari ini</div><span>&#127799;</span></div><div class="dash-mini-num" id="dashPersenHadir">&#8211;</div><div class="dash-mini-sub" id="dashHadirSub">Belum ada data</div><div class="dash-progress"><span id="dashHadirProgress"></span></div></div>
            <div class="dash-mini"><div class="dash-mini-top"><div class="dash-mini-label">Pemasukan bulan ini</div><span>&#128155;</span></div><div class="dash-mini-num" id="dashPemasukan">&#8211;</div><div class="dash-mini-sub" id="dashPemasukanSub">SPP lunas</div></div>
          </div>
          <div class="stat-row"><div class="stat c-teal"><div class="num" id="statHadir">&#8211;</div><div class="lbl">Hadir hari ini</div></div><div class="stat c-good"><div class="num" id="statLunas">&#8211;</div><div class="lbl" id="lblLunas">Lunas SPP</div></div><div class="stat c-bad"><div class="num" id="statBelumBayar">&#8211;</div><div class="lbl" id="lblBelumBayar">Belum bayar</div></div><div class="stat c-pink"><div class="num" id="statTunggakan">&#8211;</div><div class="lbl">Total tunggakan</div></div></div>
          <div class="dash-two-col"><div class="section" id="perhatianSection"><div class="section-head"><h2>&#10024; Perlu Perhatian</h2><span class="badge badge-muted" id="perhatianStatus">Memuat...</span></div><div class="section-body" id="perhatianBody"><div class="empty">Memuat kondisi terbaru...</div></div></div><div class="section"><div class="section-head"><h2>&#128140; Ringkasan Hari Ini</h2></div><div class="section-body"><div class="dash-list"><div class="dash-list-item"><div class="dash-list-main"><div class="dash-list-title">Fokus utama</div><div class="dash-list-sub">Perhatikan pembayaran, absensi, dan perkembangan.</div></div><span class="dash-pill">Hari ini</span></div><div class="dash-list-item"><div class="dash-list-main"><div class="dash-list-title">Perkembangan anak</div><div class="dash-list-sub">Data disusun per siswa agar tetap ringan saat jumlah murid bertambah.</div></div><span class="dash-pill">&#127793;</span></div><div class="dash-list-item"><div class="dash-list-main"><div class="dash-list-title">Data keluarga</div><div class="dash-list-sub">Orang tua hanya melihat informasi anak yang terhubung ke akunnya.</div></div><span class="dash-pill">Aman</span></div></div></div></div></div>
          <div class="section"><div class="section-head"><h2>&#128200; Kondisi Kelas</h2><span class="badge badge-muted" id="dashKelasCount">Memuat...</span></div><div class="section-body dash-class-table"><table><thead><tr><th>Kelas</th><th class="num">Siswa</th><th class="num">Hadir</th><th class="num">Tercatat</th><th class="num">Kehadiran</th><th class="num">SPP Lunas</th></tr></thead><tbody id="tbodyKondisiKelas"><tr><td colspan="6" style="text-align:center;">Memuat kondisi kelas...</td></tr></tbody></table></div></div>`;
      }

      async function loadDasbor() {
        if (!supabase || currentUserRole !== "admin") return;
        const today=new Date(), todayStr=today.toISOString().slice(0,10), bulanIni=today.getMonth()+1, tahunIni=today.getFullYear();
        const lblLunas=document.getElementById("lblLunas"), lblBelumBayar=document.getElementById("lblBelumBayar");
        if(lblLunas)lblLunas.textContent=`Lunas SPP — ${namaBulan(bulanIni)}`; if(lblBelumBayar)lblBelumBayar.textContent=`Belum bayar — ${namaBulan(bulanIni)}`;
        try{
          const [{data:siswaData,count:totalSiswa},{data:absensiHariIni,error:absensiError},{data:sppBulanIni,error:sppError}]=await Promise.all([
            supabase.from("siswa").select("id,nama,kelas",{count:"exact"}).order("nama"),
            supabase.from("absensi").select("status,siswa_id,siswa:siswa_id(nama,kelas)").eq("tanggal",todayStr),
            supabase.from("spp").select("status,nominal,siswa_id,siswa:siswa_id(kelas)").eq("bulan",bulanIni).eq("tahun",tahunIni)
          ]); if(absensiError)throw absensiError; if(sppError)throw sppError;
          const siswa=siswaData||[], total=totalSiswa||siswa.length, hadirCount=(absensiHariIni||[]).filter(a=>a.status==="H").length, persenHadir=total?Math.round(hadirCount/total*100):0;
          document.getElementById("dashTotalSiswa")?.replaceChildren(document.createTextNode(String(total))); document.getElementById("statHadir")?.replaceChildren(document.createTextNode(`${hadirCount}/${total}`)); document.getElementById("dashPersenHadir")?.replaceChildren(document.createTextNode(`${persenHadir}%`));
          const sh=document.getElementById("dashHadirSub"); if(sh)sh.textContent=`${hadirCount} dari ${total} siswa tercatat hadir`; const pr=document.getElementById("dashHadirProgress"); if(pr)pr.style.width=`${persenHadir}%`;
          const lunas=(sppBulanIni||[]).filter(s=>s.status==="Lunas"), belumBayar=(sppBulanIni||[]).filter(s=>s.status!=="Lunas"), tunggakan=belumBayar.reduce((sum,s)=>sum+(Number(s.nominal)||0),0), pemasukan=lunas.reduce((sum,s)=>sum+(Number(s.nominal)||0),0);
          document.getElementById("statLunas")?.replaceChildren(document.createTextNode(String(lunas.length))); document.getElementById("statBelumBayar")?.replaceChildren(document.createTextNode(String(belumBayar.length))); document.getElementById("statTunggakan")?.replaceChildren(document.createTextNode(formatRupiah(tunggakan))); document.getElementById("dashPemasukan")?.replaceChildren(document.createTextNode(formatRupiah(pemasukan)));
          const sp=document.getElementById("dashPemasukanSub"); if(sp)sp.textContent=`${lunas.length} tagihan SPP lunas · ${namaBulan(bulanIni)}`;
          const classMap={}; siswa.forEach(s=>{const k=s.kelas||"Tanpa Kelas"; classMap[k]??={total:0,hadir:0,tercatat:0,lunas:0}; classMap[k].total++;});
          (absensiHariIni||[]).forEach(a=>{const k=a.siswa?.kelas||"Tanpa Kelas"; classMap[k]??={total:0,hadir:0,tercatat:0,lunas:0}; classMap[k].tercatat++; if(a.status==="H")classMap[k].hadir++;});
          (sppBulanIni||[]).forEach(a=>{const k=a.siswa?.kelas||"Tanpa Kelas"; classMap[k]??={total:0,hadir:0,tercatat:0,lunas:0}; if(a.status==="Lunas")classMap[k].lunas++;});
          const entries=Object.entries(classMap).sort((a,b)=>a[0].localeCompare(b[0],'id')), tbody=document.getElementById("tbodyKondisiKelas");
          if(tbody)tbody.innerHTML=entries.length?entries.map(([k,v])=>{const pct=v.total?Math.round(v.hadir/v.total*100):0;return `<tr><td><div class="dash-class-name">${k}</div><div class="dash-class-sub">${v.total} siswa</div></td><td class="num">${v.total}</td><td class="num">${v.hadir}</td><td class="num">${v.tercatat}</td><td class="num"><span class="dash-score">${pct}%</span></td><td class="num">${v.lunas}</td></tr>`}).join(""):`<tr><td colspan="6" style="text-align:center;">Belum ada data kelas.</td></tr>`;
          const kc=document.getElementById("dashKelasCount"); if(kc)kc.textContent=`${entries.length} kelas`;
        }catch(error){console.error("Error load dasbor:",error);}
      }

      async function loadPerhatian() {
        if (!supabase || currentUserRole !== "admin") return;
        const body = document.getElementById("perhatianBody");
        const status = document.getElementById("perhatianStatus");
        if (!body) return;

        try {
          const now = new Date();
          const bulan = now.getMonth() + 1;
          const tahun = now.getFullYear();
          const todayStr = now.toISOString().slice(0, 10);

          const [{ data: siswa }, { data: spp }, { data: absensi }, { data: guru }, { data: absensiGuru }] = await Promise.all([
            supabase.from("siswa").select("id, nama, kelas"),
            supabase.from("spp").select("siswa_id, status, nominal").eq("bulan", bulan).eq("tahun", tahun),
            supabase.from("absensi").select("siswa_id, status").eq("tanggal", todayStr),
            supabase.from("pengguna").select("id, nama").eq("role", "guru"),
            supabase.from("absensi_guru").select("guru_id").eq("tanggal", todayStr),
          ]);

          const tagihanBelum = (spp || []).filter(x => x.status !== "Lunas").length;
          const siswaIds = new Set((absensi || []).map(x => x.siswa_id));
          const belumAbsenSiswa = (siswa || []).filter(x => !siswaIds.has(x.id));
          const guruIds = new Set((absensiGuru || []).map(x => x.guru_id));
          const belumAbsenGuru = (guru || []).filter(x => !guruIds.has(x.id));

          const items = [];
          if (tagihanBelum > 0) items.push(`<div style="padding:10px 12px;border-radius:10px;background:var(--bad-soft);margin-bottom:8px;">💳 <strong>${tagihanBelum}</strong> tagihan SPP ${namaBulan(bulan)} belum lunas.</div>`);
          if (belumAbsenSiswa.length > 0) items.push(`<div style="padding:10px 12px;border-radius:10px;background:var(--warn-soft);margin-bottom:8px;">👧 <strong>${belumAbsenSiswa.length}</strong> siswa belum tercatat absensinya hari ini.</div>`);
          if (belumAbsenGuru.length > 0) items.push(`<div style="padding:10px 12px;border-radius:10px;background:var(--primary-soft);margin-bottom:8px;">👩‍🏫 <strong>${belumAbsenGuru.length}</strong> guru/pelatih belum mengisi absensi hari ini.</div>`);

          if (items.length === 0) {
            body.innerHTML = `<div style="padding:12px;border-radius:10px;background:var(--good-soft);color:var(--good);font-weight:600;">🎉 Semua terlihat aman. Tidak ada hal penting yang perlu ditindaklanjuti.</div>`;
            if (status) { status.textContent = "Aman"; status.className = "badge badge-good"; }
          } else {
            body.innerHTML = items.join("");
            if (status) { status.textContent = `${items.length} perhatian`; status.className = "badge badge-warn"; }
          }
        } catch (error) {
          console.error("Error load perhatian:", error);
          body.innerHTML = `<div class="empty" style="color:#E11D48;">Belum bisa memuat ringkasan perhatian.</div>`;
          if (status) status.textContent = "Tidak tersedia";
        }
      }
