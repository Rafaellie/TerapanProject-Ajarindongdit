import sys
import os
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, '../../'))
sys.path.append(backend_root)

from app import app, db, User

FRONTEND_URL = "http://localhost:8080"

TIMESTAMP = int(time.time())
TEST_NAME = f"User Test {TIMESTAMP}"
TEST_EMAIL = f"user_{TIMESTAMP}@test.com"
TEST_PASSWORD = "password123"

def helper_register(driver, nama, email, password):
    driver.get(f"{FRONTEND_URL}/register")
    
    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "nama"))
    ).send_keys(nama)
    
    driver.find_element(By.ID, "email").send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.ID, "confirmPassword").send_keys(password)
    
    driver.find_element(By.ID, "submit").click()
    
    WebDriverWait(driver, 10).until(EC.url_contains("/login"))

def helper_login(driver, email, password):
    if "/login" not in driver.current_url:
        driver.get(f"{FRONTEND_URL}/login")
    
    try:
        WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.ID, "email"))
        ).send_keys(email)
        
        driver.find_element(By.ID, "password").send_keys(password)
        driver.find_element(By.ID, "submit").click()
        
        WebDriverWait(driver, 10).until(
            lambda d: "/login" not in d.current_url
        )
    except Exception as e:
        print(f"Login warning: {e}")

def delete_test_user(email):
    print(f"\nMenghapus user: {email} dari database...")
    
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            try:
                db.session.delete(user)
                db.session.commit()
                print("User berhasil dihapus.")
            except Exception as e:
                db.session.rollback()
                print(f"Gagal menghapus user")
        else:
            print("User tidak ditemukan")