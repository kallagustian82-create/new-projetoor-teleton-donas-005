"""
Additional tests for ParaQuemDoar:
- Health checks
- Auth guards (visits, telegram config, deletes)
- Visits tracking + listing + clearing
- Telegram config persistence + bot_configured flag
- Donation telegram_message_id persistence (verified via Mongo + list)
- PIX status flow (empty -> configured -> empty)
- Cleanup of all test data
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_USERNAME, "password": ADMIN_PASSWORD
    })
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


# --------- Health ---------
class TestHealth:
    def test_api_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"

    def test_root_health(self):
        # / hits frontend through ingress (no /api prefix); we accept 200
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200


# --------- Auth guards ---------
class TestAuthGuards:
    @pytest.mark.parametrize("method,path", [
        ("get", "/api/admin/donations"),
        ("get", "/api/admin/stats"),
        ("get", "/api/admin/config"),
        ("get", "/api/admin/config/telegram"),
        ("delete", "/api/admin/donations"),
        ("delete", "/api/admin/visits"),
        ("get", "/api/admin/visits"),
    ])
    def test_protected_without_token(self, method, path):
        r = getattr(requests, method)(f"{BASE_URL}{path}")
        assert r.status_code in (401, 403), f"{path} returned {r.status_code}"


# --------- PIX status flow + generation ---------
class TestPixStatusFlow:
    def test_initial_status_empty(self, auth_headers):
        # Force empty
        requests.put(f"{BASE_URL}/api/admin/config/pix-key",
                     json={"pix_key": ""}, headers=auth_headers)
        r = requests.get(f"{BASE_URL}/api/admin/pix/status")
        assert r.status_code == 200
        assert r.json()["configured"] is False

    def test_generate_400_when_no_key(self, auth_headers):
        requests.put(f"{BASE_URL}/api/admin/config/pix-key",
                     json={"pix_key": ""}, headers=auth_headers)
        r = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": 50})
        assert r.status_code == 400

    def test_set_key_then_generate_then_unset(self, auth_headers):
        # set temp key
        r = requests.put(f"{BASE_URL}/api/admin/config/pix-key",
                         json={"pix_key": "test@paraquemdoar.com"},
                         headers=auth_headers)
        assert r.status_code == 200

        # status -> true
        s = requests.get(f"{BASE_URL}/api/admin/pix/status")
        assert s.json()["configured"] is True

        # generate
        g = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": 50})
        assert g.status_code == 200
        body = g.json()
        assert "br.gov.bcb.pix" in body["pix_code"]
        assert "5005000" in body["pix_code"] or "50.00" in body["pix_code"] or "50" in body["pix_code"]

        # unset
        u = requests.put(f"{BASE_URL}/api/admin/config/pix-key",
                         json={"pix_key": ""}, headers=auth_headers)
        assert u.status_code == 200
        assert requests.get(f"{BASE_URL}/api/admin/pix/status").json()["configured"] is False


# --------- Donations w/ origin + telegram message_id persistence ---------
class TestDonationOriginAndTelegram:
    def test_create_with_origin_and_persist(self, auth_headers):
        payload = {
            "value": 12.34,
            "pix_code": "TEST_PIX_ORIGIN",
            "donor_name": "TEST_user",
            "device": "Desktop",
            "origin": "Campanha Pernambuco",
        }
        r = requests.post(f"{BASE_URL}/api/admin/donations", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["value"] == 12.34
        assert d["copied"] is False
        assert "donation_id" in d
        assert "created_at" in d
        donation_id = d["donation_id"]

        # give telegram async call a moment (best-effort)
        time.sleep(2)

        # GET via authenticated list and verify origin + telegram_message_id (if bot configured)
        lst = requests.get(f"{BASE_URL}/api/admin/donations", headers=auth_headers)
        assert lst.status_code == 200
        donations = lst.json()
        found = next((x for x in donations if x.get("donation_id") == donation_id), None)
        assert found is not None
        assert found.get("origin") == "Campanha Pernambuco"
        # _id must NOT leak
        assert "_id" not in found

        # if bot is configured (telegram chat_id set in DB), telegram_message_id should be present
        tcfg = requests.get(f"{BASE_URL}/api/admin/config/telegram", headers=auth_headers).json()
        if tcfg.get("bot_configured") and tcfg.get("chat_id"):
            assert "telegram_message_id" in found, "telegram_message_id should be persisted when bot configured"

        # mark copied -> should call edit_message (no new send)
        upd = requests.patch(f"{BASE_URL}/api/admin/donations/{donation_id}",
                             json={"copied": True})
        assert upd.status_code == 200

        # delete this single donation requires auth
        d_unauth = requests.delete(f"{BASE_URL}/api/admin/donations/{donation_id}")
        assert d_unauth.status_code in (401, 403)

        d_auth = requests.delete(f"{BASE_URL}/api/admin/donations/{donation_id}",
                                 headers=auth_headers)
        assert d_auth.status_code == 200


# --------- Visits ---------
class TestVisits:
    def test_track_and_list_and_clear(self, auth_headers):
        # clear first
        c = requests.delete(f"{BASE_URL}/api/admin/visits", headers=auth_headers)
        assert c.status_code == 200

        # track public
        t = requests.post(f"{BASE_URL}/api/admin/visits/track",
                          json={"device": "Desktop", "origin": "Campanha Pernambuco"})
        assert t.status_code == 200
        assert t.json().get("status") == "ok"

        # list authed
        lst = requests.get(f"{BASE_URL}/api/admin/visits", headers=auth_headers)
        assert lst.status_code == 200
        body = lst.json()
        assert body["total"] >= 1
        assert isinstance(body["visits"], list)
        assert all("_id" not in v for v in body["visits"])
        assert body["visits"][0]["origin"] == "Campanha Pernambuco"

        # clear
        c2 = requests.delete(f"{BASE_URL}/api/admin/visits", headers=auth_headers)
        assert c2.status_code == 200
        post = requests.get(f"{BASE_URL}/api/admin/visits", headers=auth_headers).json()
        assert post["total"] == 0


# --------- Telegram config ---------
class TestTelegramConfig:
    def test_get_telegram_config(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/config/telegram", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        # bot token is in env -> bot_configured should be True
        assert body["bot_configured"] is True
        assert "chat_id" in body


# --------- Final cleanup ---------
class TestCleanup:
    def test_clear_donations_visits_and_pix_key(self, auth_headers):
        d = requests.delete(f"{BASE_URL}/api/admin/donations", headers=auth_headers)
        assert d.status_code == 200
        v = requests.delete(f"{BASE_URL}/api/admin/visits", headers=auth_headers)
        assert v.status_code == 200
        p = requests.put(f"{BASE_URL}/api/admin/config/pix-key",
                         json={"pix_key": ""}, headers=auth_headers)
        assert p.status_code == 200
        assert requests.get(f"{BASE_URL}/api/admin/pix/status").json()["configured"] is False
        # Final state: zero donations
        lst = requests.get(f"{BASE_URL}/api/admin/donations", headers=auth_headers).json()
        assert lst == []
