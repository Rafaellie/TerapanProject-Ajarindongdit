import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin
from flask_cors import CORS
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager

# 1. Setup Awal
load_dotenv()
app = Flask(__name__)

# 2. Konfigurasi
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY') # Bisa disamakan

# 3. Inisialisasi Ekstensi
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
login_manager = LoginManager(app) # Masih kita siapkan, walau fokus di JWT

# Izinkan React (port 5174) untuk mengakses API
# Kita tambahkan "Authorization" agar React bisa mengirim token
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:5174"}}, 
     supports_credentials=True, 
     expose_headers=["Authorization"])

# --- Model Database ---

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin):
    __tablename__ = 'user' # Sesuai ERD (hal 34)
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), default='user')
    
    # Fungsi untuk menyimpan password (sudah di-hash)
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
    # Fungsi untuk cek password
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_json(self):
        return {
            'id': self.id,
            'nama': self.nama,
            'email': self.email,
            'role': self.role
        }

class Produk(db.Model):
    __tablename__ = 'produk'
    id = db.Column(db.Integer, primary_key=True)
    nama_produk = db.Column(db.String(100), nullable=False)
    harga = db.Column(db.Float, nullable=False)
    stok = db.Column(db.Integer, default=0)

    def to_json(self):
        return {
            'id': self.id,
            'nama_produk': self.nama_produk,
            'harga': self.harga,
            'stok': self.stok
        }

# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    
    # Cek apakah email sudah terdaftar
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email sudah terdaftar'}), 400
        
    # Buat user baru
    new_user = User(
        nama=data.get('nama'),
        email=email,
        role='user' # Default
    )
    new_user.set_password(data.get('password')) # Simpan password yang sudah di-hash
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': f'User {new_user.nama} berhasil dibuat!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal mendaftar: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    # Cek user & password
    if not user or not user.check_password(password):
        return jsonify({'error': 'Email atau password salah'}), 401
        
    # Jika benar, buat "tiket" (token)
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'Login berhasil!',
        'access_token': access_token,
        'user': user.to_json()
    }), 200

@app.route('/api/sales-summary', methods=['GET'])
@jwt_required() # Kita amankan juga endpoint ini
def get_sales_summary():
    # --- INI HANYA DATA CONTOH ---
    # Nantinya, Anda akan mengambil data ini dari database
    # dengan query SQL/SQLAlchemy

    # Contoh data dari Laporan Proyek (Analisis Penjualan)
    data = {
        'labels': ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
        'datasets': [
            {
                'label': 'Penjualan (Rp)',
                'data': [120000, 190000, 300000, 500000, 230000, 700000, 450000],
                'backgroundColor': 'rgba(75, 192, 192, 0.6)',
                'borderColor': 'rgba(75, 192, 192, 1)',
                'borderWidth': 1
            }
        ]
    }
    return jsonify(data), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required() # Ini mengamankan endpoint. Harus ada token!
def get_profile():
    # Ambil ID user dari "tiket" (token)
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404
        
    return jsonify(user.to_json()), 200

# --- Endpoint Lama (Masih ada) ---
@app.route('/api/test')
def test_api():
    return jsonify({'message': 'Halo! Backend Flask terhubung!'})

@app.route('/api/products')
def get_products():
    try:
        products = Produk.query.all()
        if not products:
            print("Database kosong. Menambahkan produk contoh...")
            contoh_produk = Produk(nama_produk="Produk Contoh", harga=10000, stok=50)
            db.session.add(contoh_produk)
            db.session.commit()
            products = [contoh_produk]
            
        return jsonify([p.to_json() for p in products])
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Gagal mengambil data. Pastikan tabel sudah dibuat.'}), 500

# --- Perintah CLI ---
@app.cli.command("create-db")
def create_db():
    with app.app_context():
        db.create_all()
        print("Database tables created/updated!")

if __name__ == '__main__':
    app.run(debug=True, port=5000)