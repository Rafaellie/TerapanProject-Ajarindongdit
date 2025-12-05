def test_register_success(client):
    response = client.post("/api/register", json={
        "nama": "Tes User",
        "email": "test@example.com",
        "password": "123456"
    })

    assert response.status_code == 201
    assert b"berhasil dibuat" in response.data


def test_register_existing_email(client):
    client.post("/api/register", json={
        "nama": "Tes",
        "email": "same@example.com",
        "password": "123"
    })

    response = client.post("/api/register", json={
        "nama": "Tes",
        "email": "same@example.com",
        "password": "123"
    })

    assert response.status_code == 400


def test_login_success(client):
    client.post("/api/register", json={
        "nama": "User",
        "email": "user@example.com",
        "password": "123456"
    })

    response = client.post("/api/login", json={
        "email": "user@example.com",
        "password": "123456"
    })

    data = response.get_json()

    assert response.status_code == 200
    assert "access_token" in data


def test_login_failed(client):
    response = client.post("/api/login", json={
        "email": "salah@example.com",
        "password": "xxx"
    })

    assert response.status_code == 401
