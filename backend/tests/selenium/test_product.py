import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from tests.selenium.utils import (
    FRONTEND_URL, 
    TEST_NAME, 
    TEST_EMAIL, 
    TEST_PASSWORD, 
    helper_register, 
    helper_login,
    delete_test_user
)

@pytest.fixture(autouse=True)
def setup_product_test(driver):
    print(f"\n[SETUP] Membuat user baru: {TEST_EMAIL}...")
    helper_register(driver, TEST_NAME, TEST_EMAIL, TEST_PASSWORD)
    helper_login(driver, TEST_EMAIL, TEST_PASSWORD)
    
    yield
    delete_test_user(TEST_EMAIL)

def select_shadcn_option(driver, trigger_id, option_text):
    trigger = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.ID, trigger_id))
    )
    trigger.click()
    
    option_xpath = f"//div[@role='option']//span[contains(text(), '{option_text}')]"
    option = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, option_xpath))
    )
    option.click()

def test_product_crud_flow(driver):
    PRODUCT_NAME_AWAL = "Kopi Gula Aren"
    PRODUCT_NAME_EDIT = "Kopi Luwak"
    
    ID_EDIT_BTN = f"edit-btn-{PRODUCT_NAME_AWAL.replace(' ', '-')}"
    ID_DELETE_BTN = f"delete-btn-{PRODUCT_NAME_EDIT.replace(' ', '-')}"

    print("\nCreate Product")
    driver.get(f"{FRONTEND_URL}/products") 
    
    add_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "add-product-btn"))
    )
    add_btn.click()

    time.sleep(1) 

    # Isi Form 
    name_input = WebDriverWait(driver, 5).until(
        EC.visibility_of_element_located((By.ID, "product-name"))
    )
    name_input.clear()
    name_input.send_keys(PRODUCT_NAME_AWAL)

    driver.find_element(By.ID, "product-price").send_keys("20000")
    driver.find_element(By.ID, "product-cost").send_keys("10000")
    
    # Select Category
    select_shadcn_option(driver, "product-category-trigger", "Coffee")

    driver.find_element(By.ID, "product-stock").send_keys("100")

    # Submit
    driver.find_element(By.ID, "product-submit-btn").click()

    # Validasi
    WebDriverWait(driver, 5).until(
        EC.invisibility_of_element_located((By.ID, "product-name"))
    )
    time.sleep(1) 
    assert PRODUCT_NAME_AWAL in driver.page_source
    print("Create Product Berhasil")


    print("\nUpdate Produk")

    # Klik Edit
    edit_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, ID_EDIT_BTN))
    )
    # Scroll dan Klik
    driver.execute_script("arguments[0].scrollIntoView(true);", edit_btn)
    edit_btn.click()

    # Tunggu Form Terisi
    name_input_edit = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "product-name"))
    )
    
    WebDriverWait(driver, 10).until(
        lambda d: name_input_edit.get_attribute("value") != ""
    )

    # Edit Data
    name_input_edit.clear()
    name_input_edit.send_keys(PRODUCT_NAME_EDIT)

    # Submit Update
    driver.find_element(By.ID, "product-submit-btn").click()

    # Validasi
    WebDriverWait(driver, 10).until(
        EC.invisibility_of_element_located((By.ID, "product-name"))
    )
    time.sleep(1)
    
    page_source = driver.page_source
    assert PRODUCT_NAME_AWAL not in page_source
    assert PRODUCT_NAME_EDIT in page_source
    print("Edit Product Berhasil")


    print("\nDelete Produk")

    try:
        WebDriverWait(driver, 5).until(
            EC.invisibility_of_element_located((By.CSS_SELECTOR, "div[data-state='closed']"))
        )
    except:
        pass 
    time.sleep(1) 

    # Klik Delete
    delete_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, ID_DELETE_BTN))
    )
    
    driver.execute_script("arguments[0].scrollIntoView(true);", delete_btn)
    time.sleep(0.5) 
    driver.execute_script("arguments[0].click();", delete_btn)

    # Konfirmasi Delete
    confirm_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "confirm-delete-btn"))
    )
    
    try:
        confirm_btn.click()
    except:
        driver.execute_script("arguments[0].click();", confirm_btn)

    WebDriverWait(driver, 10).until(
        EC.invisibility_of_element_located((By.ID, "confirm-delete-btn"))
    )
    
    time.sleep(2)
    driver.refresh()
    
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "add-product-btn"))
    )
    
    assert PRODUCT_NAME_EDIT not in driver.page_source
    print("Delete Product Berhasil")