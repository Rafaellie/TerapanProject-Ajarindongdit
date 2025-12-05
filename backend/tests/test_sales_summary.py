def create_user_and_token(client):
    client.post("/api/register", json={
        "nama": "Sales User",
        "email": "sales@example.com",
        "password": "pass"
    })

    login = client.post("/api/login", json={
        "email": "sales@example.com",
        "password": "pass"
    })

    return login.get_json()["access_token"]

def test_sales_summary(client):
    token = create_user_and_token(client)

    response = client.get(
        "/api/sales-summary",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()

    assert "labels" in data
    assert "datasets" in data
