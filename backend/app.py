from datetime import datetime
import os
from werkzeug.utils import secure_filename
from flask import send_from_directory
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin
from flask_cors import CORS
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from datetime import datetime, timedelta
from groq import Groq
import json

# 1. Setup Awal
load_dotenv()
print("DATABASE_URL:", os.environ.get('DATABASE_URL'))
app = Flask(__name__) 

# 2. Konfigurasi
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or "sqlite:///default.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY')

app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# 3. Inisialisasi Ekstensi
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
login_manager = LoginManager(app) # Masih kita siapkan, walau fokus di JWT

# setup upload image
UPLOAD_FOLDER = os.path.join(app.root_path, 'static/uploads')
PRODUCT_UPLOAD_FOLDER = os.path.join(app.root_path, 'static/uploads/products')
RAW_UPLOAD_FOLDER = os.path.join(app.root_path, 'static/uploads/inventories')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Izinkan React (port 5174) untuk mengakses API
# Kita tambahkan "Authorization" agar React bisa mengirim token
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:8080"}}, 
     supports_credentials=True, 
     expose_headers=["Authorization"])

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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
    profile_picture = db.Column(db.String(255), default=None)
    
    # Fungsi untuk menyimpan password (sudah di-hash)
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
    # Fungsi untuk cek password
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_json(self):
        # Buat full URL untuk avatar jika ada
        pp_url = None
        if self.profile_picture:
            pp_url = f"{request.host_url}static/uploads/{self.profile_picture}"
            
        return {
            'id': self.id,
            'nama': self.nama,
            'email': self.email,
            'role': self.role,
            'profile_picture': pp_url 
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
    image = db.Column(db.String(255), default=None)

    def to_json(self):
        img_url = None
        if self.image:
            img_url = f"{request.host_url}static/uploads/products/{self.image}"

        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'price': self.price,
            'cost': self.cost,
            'stock': self.stock,
            'minStock': self.minStock,
            'unit': self.unit,
            'image': img_url
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
    image = db.Column(db.String(255), default=None)

    def to_json(self):
        img_url = None
        if self.image:
            img_url = f"{request.host_url}static/uploads/inventories/{self.image}"

        return {
            "id": self.id,
            "name": self.name,
            "supplier": self.supplier,
            "price": self.price,
            "stock": self.stock,
            "minStock": self.minStock,
            "unit": self.unit,
            'image': img_url
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

    if request.content_type.startswith('multipart/form-data'):
        nama = request.form.get('nama')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Handle File Upload
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"user_{user.id}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                user.profile_picture = filename
    else:
        data = request.get_json()
        nama = data.get('nama')
        email = data.get('email')
        password = data.get('password')

    if nama:
        user.nama = nama

    if email and email != user.email:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email sudah digunakan'}), 400
        user.email = email

    if password:
        user.set_password(password)

    try:
        db.session.commit()
        return jsonify({
            'message': 'Profil berhasil diperbarui!',
            'user': user.to_json()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal menyimpan: {str(e)}'}), 500

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
    if request.content_type.startswith('multipart/form-data'):
        name = request.form.get('name')
        category = request.form.get('category')
        price = float(request.form.get('price', 0))
        cost = float(request.form.get('cost', 0))
        stock = int(request.form.get('stock', 0))
        minStock = int(request.form.get('minStock', 10))
        unit = request.form.get('unit', 'pcs')
        
        filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"prod_{name}_{file.filename}")
                file.save(os.path.join(PRODUCT_UPLOAD_FOLDER, filename))
    else:
        data = request.get_json()
        name = data['name']
        category = data['category']
        price = data['price']
        cost = data['cost']
        stock = data['stock']
        minStock = data.get('minStock', 10)
        unit = data.get('unit', 'pcs')
        filename = None

    new_product = Produk(
        name=name,
        category=category,
        price=price,
        cost=cost,
        stock=stock,
        minStock=minStock,
        unit=unit,
        image=filename
    )

    try:
        db.session.add(new_product)
        db.session.commit()
        return jsonify(new_product.to_json()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = Produk.query.get(id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if request.content_type.startswith('multipart/form-data'):
        # Handle Update dengan Gambar
        product.name = request.form.get('name', product.name)
        product.category = request.form.get('category', product.category)
        product.price = float(request.form.get('price', product.price))
        product.cost = float(request.form.get('cost', product.cost))
        product.stock = int(request.form.get('stock', product.stock))
        product.minStock = int(request.form.get('minStock', product.minStock))
        product.unit = request.form.get('unit', product.unit)

        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                # Hapus gambar lama jika perlu (opsional)
                filename = secure_filename(f"prod_{product.id}_{file.filename}")
                file.save(os.path.join(PRODUCT_UPLOAD_FOLDER, filename))
                product.image = filename
    else:
        # Handle Update Biasa (JSON)
        data = request.get_json()
        product.name = data.get('name', product.name)
        product.category = data.get('category', product.category)
        product.price = data.get('price', product.price)
        product.cost = data.get('cost', product.cost)
        product.stock = data.get('stock', product.stock)
        product.minStock = data.get('minStock', product.minStock)
        product.unit = data.get('unit', product.unit)

    try:
        db.session.commit()
        return jsonify(product.to_json()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Produk.query.get(id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if product.image:
        try:
            file_path = os.path.join(PRODUCT_UPLOAD_FOLDER, product.image)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"File {product.image} berhasil dihapus.")
            else:
                print(f"File {product.image} tidak ditemukan di disk.")
                
        except Exception as e:
            print(f"Gagal menghapus file gambar: {str(e)}")

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product and image deleted"}), 200

@app.route('/api/raw-materials', methods=['GET'])
def get_raw_materials():
    materials = RawMaterial.query.all()
    return jsonify([m.to_json() for m in materials]), 200

@app.route('/api/raw-materials', methods=['POST'])
def create_raw_material():
    if request.content_type.startswith('multipart/form-data'):
        name = request.form.get('name')
        supplier = request.form.get('supplier')
        price = float(request.form.get('price', 0))
        stock = int(request.form.get('stock', 0))
        minStock = int(request.form.get('minStock', 10))
        unit = request.form.get('unit', 'kg')
        
        filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"raw_{name}_{file.filename}")
                file.save(os.path.join(RAW_UPLOAD_FOLDER, filename))
    else:
        data = request.get_json()
        name = data['name']
        supplier = data['supplier']
        price = data['price']
        stock = data['stock']
        minStock = data.get('minStock', 10)
        unit = data.get('unit', 'kg')
        filename = None

    new_material = RawMaterial(
        name=name,
        supplier=supplier,
        price=price,
        stock=stock,
        minStock=minStock,
        unit=unit,
        image=filename
    )

    try:
        db.session.add(new_material)
        db.session.commit()
        return jsonify(new_material.to_json()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/raw-materials/<int:id>', methods=['PUT'])
def update_raw_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({"error": "Material not found"}), 404

    if request.content_type.startswith('multipart/form-data'):
        material.name = request.form.get('name', material.name)
        material.supplier = request.form.get('supplier', material.supplier)
        material.price = float(request.form.get('price', material.price))
        material.stock = int(request.form.get('stock', material.stock))
        material.minStock = int(request.form.get('minStock', material.minStock))
        material.unit = request.form.get('unit', material.unit)

        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"raw_{material.id}_{file.filename}")
                file.save(os.path.join(RAW_UPLOAD_FOLDER, filename))
                material.image = filename
    else:
        data = request.get_json()
        material.name = data.get('name', material.name)
        material.supplier = data.get('supplier', material.supplier)
        material.price = data.get('price', material.price)
        material.stock = data.get('stock', material.stock)
        material.minStock = data.get('minStock', material.minStock)
        material.unit = data.get('unit', material.unit)

    try:
        db.session.commit()
        return jsonify(material.to_json()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/raw-materials/<int:id>', methods=['DELETE'])
def delete_raw_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({"error": "Material not found"}), 404

    if material.image:
        try:
            file_path = os.path.join(RAW_UPLOAD_FOLDER, material.image)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"File {material.image} berhasil dihapus.")
        except Exception as e:
            print(f"Gagal menghapus file gambar: {str(e)}")

    db.session.delete(material)
    db.session.commit()
    return jsonify({"message": "Material deleted"}), 200


@app.route('/api/transactions', methods=['GET'])
def get_transactions():
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

@app.route('/api/analytics/ai-insights', methods=['GET'])
@jwt_required()
def get_ai_insights():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)
    
    transactions = Transaction.query.filter(
        Transaction.date >= start_date.date(),
        Transaction.date <= end_date.date(),
        Transaction.type == 'income'
    ).all()

    sales_by_date = {}
    sales_by_category = {}

    for t in transactions:
        d_str = t.date.strftime('%Y-%m-%d')
        sales_by_date[d_str] = sales_by_date.get(d_str, 0) + t.amount
        sales_by_category[t.category] = sales_by_category.get(t.category, 0) + t.amount

    sorted_dates = sorted(sales_by_date.keys())
    historical_data = [{"date": d, "amount": sales_by_date[d]} for d in sorted_dates]

    prompt = f"""
    You are a senior financial AI analyst for a cafe business. Analyze the following sales data deeply.

    Historical Sales (Last 90 Days): {json.dumps(historical_data)}
    Sales by Category: {json.dumps(sales_by_category)}

    TASKS:
    1. Predict sales for the NEXT 30 DAYS based on trend and seasonality (with realistic volatility).
    2. Provide 4 strategic recommendations based on the analyzed data.

    IMPORTANT RULES FOR PREDICTION:
    - **DO NOT** produce a perfectly repeating pattern or a smooth line. Real business is messy.
    - **ADD VOLATILITY**: Introduce random spikes and dips irregularly.
    - **VARIANCE**: Vary daily values by +/- 15% to 25% from the trend line.
    - Maintain the general weekly cycle (weekends usually higher), but make every week look SLIGHTLY DIFFERENT.

    IMPORTANT RULES FOR RECOMMENDATIONS (LANGUAGE & STYLE):
    - **LANGUAGE**: strictly **BAHASA INDONESIA**.
    - **NO GENERIC OPENINGS**: Do NOT start with generic phrases like "Untuk meningkatkan...", "Supaya...", or "Agar...".
    
    - **DYNAMIC EVIDENCE (THE "REASON-FIRST" RULE)**:
      Always start with the *observation* or *reason*, then follow with the *solution*. Adjust the evidence type based on the topic:
      
      A. **If discussing Revenue/High Sales/Low Sales**: 
         You MUST include the specific numbers (e.g., "Dengan kontribusi penjualan Kopi sebesar Rp X...", "Melihat pendapatan Snack yang hanya Rp Y...").
         
      B. **If discussing Operational/Trends/General Strategy**: 
         You can use qualitative observations without strict numbers (e.g., "Mengingat tren kunjungan selalu memuncak di akhir pekan...", "Karena variasi menu teh masih terbatas...").

    - **TONE**: Professional, insightful, and persuasive.

    OUTPUT FORMAT (JSON ONLY, no markdown, no extra text):
    {{
        "predictions": [
            {{"date": "YYYY-MM-DD", "predicted_amount": <number>}} 
        ],
        "recommendations": [
            {{
                "title": "<Judul Singkat & Menarik (Indonesian)>",
                "type": "<'success' | 'warning' | 'info'>",
                "description": "<[Alasan/Data/Observasi] + [Saran Strategis] (Indonesian)>"
            }}
        ]
    }}
    """

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", # atau llama-3.1-8b-instant
            messages=[
                {"role": "system", "content": "You are a helpful JSON-speaking data analyst assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        ai_response = json.loads(completion.choices[0].message.content)
        
        return jsonify({
            "historical": historical_data[-30:], 
            "predictions": ai_response['predictions'],
            "recommendations": ai_response['recommendations']
        }), 200

    except Exception as e:
        print(f"AI Error: {e}")
        if hasattr(e, 'response'):
             print(e.response)
        return jsonify({'error': 'Gagal menghasilkan analisis AI'}), 500


# --- Perintah CLI ---
@app.cli.command("create-db")
def create_db():
    with app.app_context():
        db.create_all()
        print("Database tables created/updated!")

if __name__ == '__main__':
    app.run(debug=True, port=5000)