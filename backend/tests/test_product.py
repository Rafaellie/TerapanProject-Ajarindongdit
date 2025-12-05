def test_get_products(client):
    response = client.get("/api/products")
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1  # otomatis menambah 1 produk contoh
