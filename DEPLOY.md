# Cara upload NeoPussy ke GitHub & akses publik

Panduan ini memakai **GitHub Web Upload** (tanpa install apa pun). Ada juga opsi
GitHub Desktop di bagian akhir.

Ringkasan isi repo: **234 file, sekitar 15,7 MB**. Batas per upload web GitHub adalah
**100 file** dan **25 MB per file**, jadi upload dilakukan dalam **3 batch**.

---

## 1. Buat repository

1. Login ke <https://github.com> (buat akun kalau belum ada).
2. Klik **+** (kanan atas) lalu **New repository**.
3. Isi:
   - **Repository name**: `neopussy` (atau bebas)
   - **Visibility**: **Public** (wajib, GitHub Pages gratis hanya untuk repo publik)
   - **Jangan** centang "Add a README file" (kita sudah punya)
4. Klik **Create repository**.

---

## 2. Upload file (3 batch)

Di halaman repo kosong, klik **uploading an existing file** (atau **Add file >
Upload files**).

> Tips: drag & drop **folder** dari Windows Explorer ke kotak upload. Chrome/Edge
> mempertahankan struktur foldernya. Jangan drag isi folder satu per satu.

### Batch 1 - halaman + inti `includes` (76 file)

Dari folder `C:\Users\N3N0C\Documents\Default Project\webkitty-clone` drag:

| Yang di-drag | File |
| --- | --- |
| 9 file root: `*.html`, `README.md`, `DEPLOY.md`, `.nojekyll`, `.htaccess`, `web.config`, `serve.py` | 9 |
| `includes\css\` (folder) | 8 |
| `includes\assets\` (folder) | 6 |
| `includes\caches\` (folder, berisi 13 halaman + 13 `.manifest`) | 26 |
| `includes\js\` (folder) | 27 |

Klik **Commit changes**, pesan misal `batch 1: pages + core includes`, lalu
**Commit changes**.

### Batch 2 - payload + psfree (95 file)

**Add file > Upload files**, drag:

| Yang di-drag | File |
| --- | --- |
| `includes\payloads\` (folder) | 54 |
| `src\psfree-lapse\` (folder, ada subfolder) | 31 |
| `src\badhoist\` | 2 |
| `src\bpf-double-free\` | 8 |

Commit: `batch 2: payloads + psfree-lapse`.

### Batch 3 - sisa exploit chain (63 file)

| Yang di-drag | File |
| --- | --- |
| `src\kpatches\` (folder) | 26 |
| `src\cssfontface\` | 10 |
| `src\relapse\` | 6 |
| `src\slopkit\` | 7 |
| `src\slopkit-afterglow\` | 6 |
| `src\wobkot\` (folder, ada subfolder) | 8 |

Commit: `batch 3: remaining chains + kpatches`.

### `.nojekyll`

File `.nojekyll` (kosong, di root) sudah ada di folder lokal dan sudah ikut ter-upload
di batch 1 kalau Explorer menampilkan file tersembunyi. Kalau tidak muncul:

1. **Add file > Create new file**
2. Nama file: `.nojekyll`
3. Isi: kosongkan saja
4. **Commit changes**

File ini mematikan proses build Jekyll supaya semua folder (termasuk `src/`) disajikan
apa adanya.

---

## 3. Aktifkan GitHub Pages

1. Buka **Settings** repo, lalu menu kiri **Pages**.
2. **Source**: `Deploy from a branch`
3. **Branch**: `main`, folder `/ (root)`, lalu **Save**
4. Tunggu 1-2 menit, refresh halaman. Akan muncul:

```
https://<username>.github.io/neopussy/
```

Satu-satunya halaman yang perlu dibuka:

| URL | Isi |
| --- | --- |
| `https://<username>.github.io/neopussy/` atau `/index.html` | **Mode Simpel / 1-klik** |

`cache.html` dan `exploit.html` tetap ada di repo karena dipakai internal oleh engine
(AppCache dan barebone loader), bukan sebagai halaman yang dikunjungi. Varian
`index-neo.html` dan `index-original.html` sudah dihapus.

---

## 4. PENTING: Pages itu HTTPS, payload PS4 butuh HTTP

Ini bukan masalah konfigurasi, tapi batasan browser:

- `includes/js/deliverPayload.js` mengirim payload ke `http://<ip-ps4>:9020` (binloader)
  dan `http://<ip-ps4>:9021` (elfldr).
- **GitHub Pages selalu HTTPS** dan tidak bisa dimatikan.
- Browser (apalagi browser PS4) memblokir request **HTTP dari halaman HTTPS**
  (mixed content), jadi payload tidak terkirim. Kode aslinya mendeteksi ini lewat
  `isHttps()` dan jatuh ke fallback atau memunculkan peringatan.
- Proses **caching firmware** (`cache.html`) juga memakai AppCache yang lebih bisa
  diandalkan lewat HTTP biasa. Kalau tetap memakai Pages, cek dulu bahwa
  `https://<user>.github.io/<repo>/includes/caches/manifest/9xx.manifest` dikirim dengan
  `Content-Type: text/cache-manifest`. Kalau tidak, PS4 akan menampilkan **"Cache error"**.
  Host HTTP sendiri lebih aman: jalankan `python serve.py` di PC/LAN (sudah mengirim MIME
  yang benar), atau pasang `.htaccess` / `web.config` / aturan nginx yang sudah disediakan
  di root repo.

Artinya:

| Kebutuhan | Host yang cocok |
| --- | --- |
| Sekadar pamer UI / portofolio / akses dari mana saja | **GitHub Pages** |
| Benar-benar dipakai jailbreak dari PS4 | **HTTP biasa**: LAN (`python -m http.server`), PC/VPS dengan nginx, Firebase Hosting, atau domain sendiri via Cloudflare dengan **Always Use HTTPS = OFF** |

Pada **build 10**, tidak ada lagi redirect HTTPS→HTTP yang melempar PS4 ke situs
ArabPixel:

| File | Baris | Status |
| --- | --- | --- |
| `index.html` | ~85–104 | Redirect ke `webkitty.arabpixel.net` sudah dihapus. Diganti catatan di kartu NeoPussy. |
| `index.html` | ~207, ~583 | Tautan "host kedua" dinonaktifkan (`href="#"` + `return false`). |
| `index.html` | ~1302 | Kredit ArabPixel kini teks biasa, bukan tautan ke host lama. |

Kalau memakai host HTTP sendiri (mis. `http://kitty.domainkamu.com` atau
`http://<IP-PC>:8099/`), tidak ada URL hardcoded yang perlu diganti. Cara menjalankan
payload tetap seperti di atas: jalankan server HTTP biasa dan buka alamat itu di
browser PS4.

---

## 5. Etika, kredit, dan risiko

- Semua kode exploit, payload HEN (`GoldHEN`, `nexHEN`, `PS4HEN`), ELF homebrew/Linux
  adalah karya **ArabPixel dan kontributor masing-masing**. Repo ini hanya mirror +
  skin. **Jangan hapus kredit** di README/About dan jangan mengklaim sebagai milik sendiri.
- Tidak ada file `LICENSE` di mirror; jangan menambahkan lisensi yang mengklaim
  kepemilikan atas kode orang lain.
- Jailbreak bisa melanggar ToS PSN dan membatalkan garansi. Sertakan disclaimer
  "use at your own risk" (sudah ada di README).
- GitHub bisa menandai repo berisi binary payload/jailbreak sebagai konten sensitif.
  Kalau khawatir, set repo jadi public hanya saat diperlukan, atau host di server sendiri.

---

## Alternatif: GitHub Desktop (lebih cepat, sekali drag)

1. Install <https://desktop.github.com/> lalu login.
2. **File > Add local repository**, pilih
   `C:\Users\N3N0C\Documents\Default Project\webkitty-clone`,
   lalu muncul dialog "create a repository", klik itu.
3. Isi description, klik **Create repository**, lalu **Publish repository**
   (hapus centang "Keep this code private").
4. Lanjut ke langkah **3** di atas untuk mengaktifkan Pages.

Keuntungan: tidak ada batas 100 file/commit, `.nojekyll` dan file tersembunyi ikut
terkirim, dan update berikutnya cukup **Commit > Push**.
