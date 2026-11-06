# Tests for email receipts (Resend), donation reconstruction, and admin reminders
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
TEST_EMAIL = "delivered@resend.dev"
CREATED = []


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"username": "donas", "password": "Seinao10@@"})
    if r.status_code != 200:
        pytest.skip("login failed")
    return r.json()["token"]


@pytest.fixture(scope="module")
def pix_code():
    r = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": 98})
    assert r.status_code == 200
    return r.json()["pix_code"]


@pytest.fixture(scope="module", autouse=True)
def cleanup(token):
    yield
    for did in CREATED:
        requests.delete(f"{BASE_URL}/api/admin/donations/{did}", headers={"Authorization": f"Bearer {token}"})


# Admin login
def test_login(token):
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"username": "donas", "password": "Seinao10@@"})
    d = r.json()
    assert d["username"] == "donas" and isinstance(d["token"], str)


def test_login_invalid():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"username": "donas", "password": "x"})
    assert r.status_code == 401


# Receipt email for non-anonymous donation
def test_create_named_donation_sends_email(pix_code):
    r = requests.post(f"{BASE_URL}/api/admin/donations", json={
        "value": 98, "pix_code": pix_code, "donor_name": "TEST_Doador",
        "donor_email": TEST_EMAIL, "device": "Desktop", "origin": "TEST"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    CREATED.append(d["donation_id"])
    assert d["email_sent"] is True
    # reconstruction
    g = requests.get(f"{BASE_URL}/api/admin/donation/{d['donation_id']}")
    assert g.status_code == 200
    gd = g.json()
    assert gd["value"] == 98 and gd["pix_code"] == pix_code and gd["donor_name"] == "TEST_Doador"
    assert "_id" not in gd


# Anonymous donation => no email
def test_create_anonymous_donation_no_email(pix_code):
    r = requests.post(f"{BASE_URL}/api/admin/donations", json={
        "value": 98, "pix_code": pix_code, "donor_name": "", "donor_email": "", "origin": "TEST"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    CREATED.append(d["donation_id"])
    assert d["email_sent"] is False


# Email present but name empty => no email (per implementation)
def test_email_without_name_no_email(pix_code):
    r = requests.post(f"{BASE_URL}/api/admin/donations", json={
        "value": 10, "pix_code": pix_code, "donor_name": "", "donor_email": TEST_EMAIL, "origin": "TEST"}, timeout=60)
    d = r.json()
    CREATED.append(d["donation_id"])
    assert d["email_sent"] is False


def test_get_unknown_donation_404():
    r = requests.get(f"{BASE_URL}/api/admin/donation/does-not-exist-999")
    assert r.status_code == 404


# Reminders
def test_send_reminders_requires_auth():
    r = requests.post(f"{BASE_URL}/api/admin/send-reminders")
    assert r.status_code in (401, 403)


def test_send_reminders_invalid_token():
    r = requests.post(f"{BASE_URL}/api/admin/send-reminders", headers={"Authorization": "Bearer bad"})
    assert r.status_code == 401


def test_send_reminders_dedupe(token, pix_code):
    # create second donation with same email -> should still count once
    r = requests.post(f"{BASE_URL}/api/admin/donations", json={
        "value": 20, "pix_code": pix_code, "donor_name": "TEST_Doador2",
        "donor_email": TEST_EMAIL, "origin": "TEST"}, timeout=60)
    CREATED.append(r.json()["donation_id"])
    r = requests.post(f"{BASE_URL}/api/admin/send-reminders",
                      headers={"Authorization": f"Bearer {token}"}, timeout=120)
    assert r.status_code == 200
    d = r.json()
    assert set(d.keys()) >= {"sent", "failed", "total_recipients"}
    emails = requests.get(f"{BASE_URL}/api/admin/donations", headers={"Authorization": f"Bearer {token}"}).json()
    unique = {e["donor_email"].strip() for e in emails if e.get("donor_email")}
    assert d["total_recipients"] == len(unique)
    assert d["sent"] + d["failed"] == d["total_recipients"]
    assert d["failed"] == 0
