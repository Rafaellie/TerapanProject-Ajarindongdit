from datetime import datetime
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
print("DATABASE_URL:", os.environ.get('DATABASE_URL'))
app = Flask(__name__) 

# 2. Konfigurasi
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or "sqlite:///default.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY')

# 3. Inisialisasi Ekstensi
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
login_manager = LoginManager(app) # Masih kita siapkan, walau fokus di JWT

# Izinkan React (port 5174) untuk mengakses API
# Kita tambahkan "Authorization" agar React bisa mengirim token
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:8080"}}, 
     supports_credentials=True, 
     expose_headers=["Authorization"])

# CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True, expose_headers=["Authorization"])


# --- Model Database ---

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin):
    __tablename__ = 'users'
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

    # nama_produk jadi name
    name = db.Column(db.String(100), nullable=False)

    # kategori (Coffee, Tea, Snack, dsb)
    category = db.Column(db.String(50), nullable=False)

    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=False)

    stock = db.Column(db.Integer, default=0)
    minStock = db.Column(db.Integer, default=10)

    unit = db.Column(db.String(20), default='pcs')

    def to_json(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'price': self.price,
            'cost': self.cost,
            'stock': self.stock,
            'minStock': self.minStock,
            'unit': self.unit,
        }

class RawMaterial(db.Model):
    __tablename__ = 'raw_materials'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    supplier = db.Column(db.String(100))
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    minStock = db.Column(db.Integer, default=10)
    unit = db.Column(db.String(20), default='kg')

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "supplier": self.supplier,
            "price": self.price,
            "stock": self.stock,
            "minStock": self.minStock,
            "unit": self.unit
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)        # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    product_id = db.Column(db.Integer)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_json(self):
        return {
            "id": self.id,
            "type": self.type,
            "amount": self.amount,
            "category": self.category,
            "description": self.description,
            "product_id": self.product_id,
            "date": self.date.isoformat() if self.date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


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
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token), 200

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    data = request.get_json()

    if 'nama' in data:
        user.nama = data['nama']

    if 'email' in data and data['email'] != user.email:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email sudah digunakan oleh user lain'}), 400
        user.email = data['email']

    if 'password' in data and data['password']:
        user.set_password(data['password'])

    try:
        db.session.commit()
        return jsonify({
            'message': 'Profil berhasil diperbarui!',
            'user': user.to_json()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal menyimpan perubahan: {str(e)}'}), 500

@app.route('/api/sales-summary', methods=['GET'])
@jwt_required() 
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

@app.route('/api/test')
def test_api():
    return jsonify({'message': 'Halo! Backend Flask terhubung!'})

@app.route('/api/products')
def get_products():
    try:
        products = Produk.query.all()
        return jsonify([p.to_json() for p in products]), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Gagal mengambil data.'}), 500
    
@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.get_json()

    new_product = Produk(
        name=data['name'],
        category=data['category'],
        price=data['price'],
        cost=data['cost'],
        stock=data['stock'],
        minStock=data.get('minStock', 10),
        unit=data.get('unit', 'pcs')
    )

    db.session.add(new_product)
    db.session.commit()
    return jsonify(new_product.to_json()), 201

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = Produk.query.get(id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json()

    product.name = data.get('name', product.name)
    product.category = data.get('category', product.category)
    product.price = data.get('price', product.price)
    product.cost = data.get('cost', product.cost)
    product.stock = data.get('stock', product.stock)
    product.minStock = data.get('minStock', product.minStock)
    product.unit = data.get('unit', product.unit)

    db.session.commit()
    return jsonify(product.to_json()), 200

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Produk.query.get(id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200

@app.route('/api/raw-materials', methods=['GET'])
def get_raw_materials():
    materials = RawMaterial.query.all()
    return jsonify([m.to_json() for m in materials]), 200

@app.route('/api/raw-materials', methods=['POST'])
def create_raw_material():
    data = request.get_json()

    new_material = RawMaterial(
        name=data['name'],
        supplier=data['supplier'],
        price=data['price'],
        stock=data['stock'],
        minStock=data.get('minStock', 10),
        unit=data.get('unit', 'kg')
    )

    db.session.add(new_material)
    db.session.commit()

    return jsonify(new_material.to_json()), 201

@app.route('/api/raw-materials/<int:id>', methods=['PUT'])
def update_raw_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({"error": "Material not found"}), 404

    data = request.get_json()

    material.name = data.get('name', material.name)
    material.supplier = data.get('supplier', material.supplier)
    material.price = data.get('price', material.price)
    material.stock = data.get('stock', material.stock)
    material.minStock = data.get('minStock', material.minStock)
    material.unit = data.get('unit', material.unit)

    db.session.commit()
    return jsonify(material.to_json()), 200

@app.route('/api/raw-materials/<int:id>', methods=['DELETE'])
def delete_raw_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({"error": "Material not found"}), 404

    db.session.delete(material)
    db.session.commit()

    return jsonify({"message": "Material deleted"}), 200


@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    # optional: support query params ?start=YYYY-MM-DD&end=YYYY-MM-DD
    start = request.args.get('start')
    end = request.args.get('end')
    q = Transaction.query
    if start:
        q = q.filter(Transaction.date >= datetime.fromisoformat(start).date())
    if end:
        q = q.filter(Transaction.date <= datetime.fromisoformat(end).date())
    transactions = q.order_by(Transaction.date.desc()).all()
    return jsonify([t.to_json() for t in transactions]), 200

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.get_json()
    # required validation
    t_type = data.get('type')
    amount = data.get('amount')
    date_str = data.get('date')  # expect YYYY-MM-DD
    if not t_type or amount is None or not date_str:
        return jsonify({'error': 'Missing required fields (type, amount, date)'}), 400
    try:
        tx_date = datetime.fromisoformat(date_str).date()
    except Exception:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    new_tx = Transaction(
        type=t_type,
        amount=float(amount),
        category=data.get('category'),
        description=data.get('description'),
        product_id=data.get('product_id'),
        date=tx_date
    )
    db.session.add(new_tx)
    db.session.commit()
    return jsonify(new_tx.to_json()), 201

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    tx = Transaction.query.get(id)
    if not tx:
        return jsonify({'error': 'Transaction not found'}), 404
    data = request.get_json()
    if 'type' in data: tx.type = data['type']
    if 'amount' in data: tx.amount = float(data['amount'])
    if 'category' in data: tx.category = data['category']
    if 'description' in data: tx.description = data['description']
    if 'product_id' in data: tx.product_id = data['product_id']
    if 'date' in data:
        try:
            tx.date = datetime.fromisoformat(data['date']).date()
        except Exception:
            return jsonify({'error': 'Invalid date format'}), 400
    db.session.commit()
    return jsonify(tx.to_json()), 200

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    tx = Transaction.query.get(id)
    if not tx:
        return jsonify({'error': 'Transaction not found'}), 404
    db.session.delete(tx)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted'}), 200


# --- Perintah CLI ---
@app.cli.command("create-db")
def create_db():
    with app.app_context():
        db.create_all()
        print("Database tables created/updated!")

if __name__ == '__main__':
    app.run(debug=True, port=5000)