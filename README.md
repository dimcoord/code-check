# Koderium - Platform Review & Penilaian Tugas Coding (C++ & Java)

Koderium adalah aplikasi berbasis web yang dibangun dengan **Next.js (App Router)**, **CodeMirror**, **Supabase**, dan **Judge0** untuk memfasilitasi Dosen dan Asisten Dosen (TA) dalam mengelola kelas, mengadministrasikan akun mahasiswa, menugaskan soal pemrograman, menguji kode program secara otomatis, serta memberikan ulasan dan penilaian (grading) terhadap tugas mahasiswa.

---

## Fitur Utama

### 1. Peran & Akses Pengguna (Role-Based Access Control)
- **Dosen & Asisten (TA)**:
  - **Manajemen Akun Mahasiswa**: Membuat akun mahasiswa baru dengan email universitas resmi dan kata sandi awal, memperbarui data profil (NIM, Nama, Email), serta menghapus akun mahasiswa.
  - **Manajemen Kelas**: Membuat kelas praktikum baru, membagikan kode kelas unik, dan mengelola enrollment mahasiswa.
  - **Manajemen Tugas**: Membuat tugas baru dengan spesifikasi bahasa (C++, Java, atau keduanya), starter code awal (CodeMirror), tenggat waktu (deadline), bobot skor maksimum, serta test case evaluasi (stdin & expected stdout).
  - **Review & Grading Submisi**: Meninjau source code yang disubmit mahasiswa di editor CodeMirror (read-only dengan syntax highlighting), menguji ulang kode dengan test case tambahan secara live melalui runner Judge0, serta memberikan skor angka (0-100) dan catatan evaluasi/feedback.
- **Mahasiswa**:
  - **Login Mandiri**: Masuk menggunakan email universitas dan kata sandi yang telah didaftarkan oleh dosen/asisten.
  - **Pilihan Metode Submisi**:
    - Mengetik/menempelkan source code langsung pada **CodeMirror editor**.
    - Mengunggah file source code langsung (`.cpp`, `.cc`, `.java`), yang otomatis dimuat ke dalam editor.
  - **Uji Coba Kode (Test Run)**: Menguji kode program secara live dengan masukan custom atau sample test case sebelum dikumpulkan.
  - **Pantau Hasil Evaluasi & Nilai**: Melihat status kompilasi Judge0 (*Accepted*, *Wrong Answer*, *Compilation Error*, dsb.), nilai tugas, serta catatan feedback dari dosen/asisten.

---

## Prasyarat & Konfigurasi

### 1. Pengaturan Database Supabase
Jalankan skrip SQL yang tersedia pada file [`supabase/schema.sql`](supabase/schema.sql) di dalam **SQL Editor** pada dasbor Supabase Anda. Skrip ini akan membuat:
- Tabel `profiles`, `classes`, `class_enrollments`, `assignments`, dan `submissions`.
- Row Level Security (RLS) policies.
- Trigger otomatis untuk sinkronisasi akun `auth.users` ke `profiles`.

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu isi variabel sesuai kredensial Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Diperlukan untuk pembuatan akun mahasiswa oleh dosen/TA
API_URL=http://localhost:2358 # Endpoint API Judge0
```

---

## Menjalankan Aplikasi

1. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
2. Buka peramban di [http://localhost:3000](http://localhost:3000).

3. **Build untuk Produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## Lisensi
Hak Cipta © 2026 Koderium.
