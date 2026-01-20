import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.selenium.utils import FRONTEND_URL, TEST_EMAIL, TEST_PASSWORD, delete_test_user

@pytest.fixture(scope="module", autouse=True)
def cleanup_auth_user():
    yield
    delete_test_user(TEST_EMAIL)

def test_register(driver):
    driver.get(f"{FRONTEND_URL}/register")
    
    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "nama"))
    ).send_keys("User Auth Test")
    
    driver.find_element(By.ID, "email").send_keys(TEST_EMAIL)
    driver.find_element(By.ID, "password").send_keys(TEST_PASSWORD)
    driver.find_element(By.ID, "confirmPassword").send_keys(TEST_PASSWORD)
    
    driver.find_element(By.ID, "submit").click()
    
    WebDriverWait(driver, 10).until(EC.url_contains("/login"))
    assert "/login" in driver.current_url

def test_login(driver):
    driver.get(f"{FRONTEND_URL}/login")
    
    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "email"))
    ).send_keys(TEST_EMAIL)
    
    driver.find_element(By.ID, "password").send_keys(TEST_PASSWORD)
    driver.find_element(By.ID, "submit").click()
    
    WebDriverWait(driver, 10).until(
        lambda d: d.current_url.endswith("/") or "/dashboard" in d.current_url
    )