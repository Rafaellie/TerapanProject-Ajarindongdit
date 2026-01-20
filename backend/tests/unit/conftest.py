import os
import sys
import pytest
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, BASE_DIR)

from app import app, db

@pytest.fixture(scope="session")
def app_instance():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    app.config["SECRET_KEY"] = "testing-secret"
    app.config["JWT_SECRET_KEY"] = "testing-secret"

    return app

@pytest.fixture()
def client(app_instance):

    with app_instance.app_context():
        db.create_all()

        client = app_instance.test_client()

        yield client

        db.session.remove()
        db.drop_all()
