# Gantariku — Struktur Modular

Struktur ini memisahkan:
- `index.html` — kerangka halaman
- `css/style.css` — seluruh styling
- `js/` — modul per fungsi

Urutan script di `index.html` sengaja dibuat berjenjang:
Supabase → state/config → autentikasi/utilitas → fitur → shell aplikasi.

Tidak ada database baru di versi ini. Ini adalah refactor dari `index (12).html`.
