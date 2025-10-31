# TerapanProject-Ajarindongdit

# 💻 Sistem Pencatatan Keuangan & Analisis Penjualan UMKM

## 📘 Deskripsi Proyek
Proyek ini merupakan sistem **berbasis web** yang dirancang untuk membantu pelaku **UMKM** dalam mencatat transaksi keuangan dan menganalisis penjualan secara **otomatis dan real-time**.  

Sistem ini membantu pemilik usaha untuk:
- Mencatat pemasukan dan pengeluaran harian secara otomatis  
- Melihat laporan keuangan harian, bulanan, hingga tahunan  
- Menganalisis tren penjualan dan pengeluaran terbesar menggunakan metode **AI/statistik**  
- Menampilkan **dashboard interaktif** dengan notifikasi cerdas  
- Mendapatkan pengingat stok produk dan bahan baku  

Dengan sistem ini, pelaku UMKM dapat mengambil keputusan bisnis berdasarkan **data aktual (data-driven decision making)** tanpa perlu menghitung laporan secara manual.

### 🔧 Teknologi yang Digunakan
| Komponen | Teknologi |
|-----------|------------|
| **Backend** | Python Flask |
| **Frontend** | ReactJS |
| **Database** | PostgreSQL |
| **Desain UI/UX** | Figma |
| **Manajemen Proyek** | Odoo Project (Agile/Scrum) |

---

## 🧩 Struktur Folder Proyek
```
.
├── backend/                   # Server-side (Flask API)
│   ├── app.py                 # File utama backend
│   ├── models/                # Model database
│   ├── routes/                # Endpoint/route API
│   ├── static/                # File statis (jika ada)
│   ├── templates/             # Template HTML (opsional)
│   ├── config.py              # Konfigurasi Flask & database
│   ├── requirements.txt       # Daftar dependensi Python
│   └── tests/                 # Unit & integration test
│
├── frontend/                  # Client-side (ReactJS)
│   ├── src/                   # Source code React
│   │   ├── components/        # Komponen UI
│   │   ├── pages/             # Halaman utama
│   │   ├── services/          # API handler (axios/fetch)
│   │   └── App.js             # File utama React
│   ├── public/                # File publik (index.html, favicon, dll)
│   ├── package.json           # Dependensi dan script React
│   └── README.md              # Dokumentasi frontend
│
├── database/                  # File SQL atau skema database
│   └── schema.sql
│
├── .env                       # Variabel lingkungan (DB credentials, API key)
├── docker-compose.yml          # (Opsional) Setup containerisasi
└── README.md                  # Dokumentasi utama proyek
```

---

## ⚙️ Cara Menjalankan Proyek

### 1. Clone Repository
```bash
git clone https://github.com/username/nama-proyek.git
cd nama-proyek
```

---

### 2. Jalankan Backend (Flask)
#### a. Masuk ke folder backend
```bash
cd backend
```
#### b. Buat virtual environment dan aktifkan
```bash
python -m venv venv
source venv/bin/activate     # macOS/Linux
venv\Scripts\activate        # Windows
```
#### c. Instal dependensi
```bash
pip install -r requirements.txt
```
#### d. Jalankan server Flask
```bash
python app.py
```
Backend berjalan di:  
👉 `http://127.0.0.1:5000/`

---

### 3. Jalankan Frontend (ReactJS)
#### a. Masuk ke folder frontend
```bash
cd ../frontend
```
#### b. Instal dependensi
```bash
npm install
```
#### c. Jalankan aplikasi
```bash
npm start
```
Frontend berjalan di:  
👉 `http://localhost:3000/`

---

### 4. Konfigurasi Database (PostgreSQL)
Buat database baru dan sesuaikan file `.env` atau `config.py` dengan kredensial berikut:
```
DB_HOST=localhost
DB_NAME=umkm_db
DB_USER=postgres
DB_PASS=yourpassword
DB_PORT=5432
```

---

## 🧾 Penjelasan File `requirements.txt`

File `requirements.txt` berisi dependensi Python yang dibutuhkan untuk menjalankan backend Flask. Berikut penjelasan tiap library:

| Library | Fungsi |
|----------|--------|
| **Flask** | Framework utama backend berbasis Python untuk membangun API dan routing server. |
| **psycopg2-binary** | Driver untuk koneksi antara Flask dan database PostgreSQL. |
| **Flask-SQLAlchemy** | ORM (Object Relational Mapper) untuk mengelola tabel dan query database dengan sintaks Python. |
| **Flask-Login** | Mengatur sistem autentikasi dan sesi login pengguna. |
| **flask-cors** | Mengaktifkan Cross-Origin Resource Sharing (CORS) agar backend bisa diakses dari frontend (ReactJS). |
| **python-dotenv** | Mengelola variabel lingkungan dari file `.env` untuk konfigurasi aman (seperti password database atau secret key). |
| **Flask-JWT-Extended** | Mengatur sistem autentikasi berbasis token (JSON Web Token) untuk API yang aman. |
| **Flask-Bcrypt** | Meng-hash password pengguna sebelum disimpan ke database untuk keamanan. |
| **pandas** | Mengelola dan memproses data tabular (CSV, Excel) untuk analisis penjualan. |
| **scikit-learn** | Library machine learning untuk analisis tren atau prediksi penjualan. |
| **spacy** | Library NLP (Natural Language Processing) untuk analisis teks, misalnya dari data deskripsi produk atau feedback pelanggan. |

---

### 5. Testing (Opsional)
Untuk menjalankan unit test dan integration test:
```bash
pytest
```

---
