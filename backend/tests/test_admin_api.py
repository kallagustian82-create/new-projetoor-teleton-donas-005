"""
Backend API tests for ParaQuemDoar Admin Panel
Tests: Authentication, Donations CRUD, PIX Config, Stats, PIX Generation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
INVALID_USERNAME = "invalid_user"
INVALID_PASSWORD = "wrong_password"


class TestAdminLogin:
    """Authentication endpoint tests"""
    
    def test_login_with_correct_credentials(self):
        """POST /api/admin/login with correct credentials returns JWT token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain 'token'"
        assert "username" in data, "Response should contain 'username'"
        assert data["username"] == ADMIN_USERNAME
        assert len(data["token"]) > 0, "Token should not be empty"
        print(f"✓ Login successful, token length: {len(data['token'])}")
    
    def test_login_with_incorrect_credentials(self):
        """POST /api/admin/login with wrong credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": INVALID_USERNAME,
            "password": INVALID_PASSWORD
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_login_with_wrong_password(self):
        """POST /api/admin/login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrong_password"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong password correctly rejected with 401")


@pytest.fixture
def auth_token():
    """Get authentication token for protected endpoints"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(auth_token):
    """Return headers with Bearer token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestDonations:
    """Donations CRUD endpoint tests"""
    
    def test_get_donations_with_valid_token(self, auth_headers):
        """GET /api/admin/donations with valid token returns list of donations"""
        response = requests.get(f"{BASE_URL}/api/admin/donations", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} donations")
    
    def test_get_donations_without_token(self):
        """GET /api/admin/donations without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/admin/donations")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Protected endpoint correctly rejects request without token")
    
    def test_create_donation_public_endpoint(self):
        """POST /api/admin/donations creates donation without auth (public endpoint)"""
        test_pix_code = "TEST_PIX_CODE_12345"
        response = requests.post(f"{BASE_URL}/api/admin/donations", json={
            "value": 25.50,
            "pix_code": test_pix_code
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "donation_id" in data, "Response should contain 'donation_id'"
        assert data["value"] == 25.50, f"Value should be 25.50, got {data['value']}"
        assert data["pix_code"] == test_pix_code
        assert data["copied"] == False, "New donation should have copied=False"
        assert "created_at" in data, "Response should contain 'created_at'"
        print(f"✓ Donation created with ID: {data['donation_id']}")
        return data["donation_id"]
    
    def test_update_donation_mark_as_copied(self):
        """PATCH /api/admin/donations/{donation_id} marks donation as copied"""
        # First create a donation
        create_response = requests.post(f"{BASE_URL}/api/admin/donations", json={
            "value": 10.00,
            "pix_code": "TEST_PIX_CODE_FOR_UPDATE"
        })
        assert create_response.status_code == 200
        donation_id = create_response.json()["donation_id"]
        
        # Now update it
        update_response = requests.patch(f"{BASE_URL}/api/admin/donations/{donation_id}", json={
            "copied": True
        })
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert "message" in data
        print(f"✓ Donation {donation_id} marked as copied")
    
    def test_update_nonexistent_donation(self):
        """PATCH /api/admin/donations/{invalid_id} returns 404"""
        response = requests.patch(f"{BASE_URL}/api/admin/donations/nonexistent_id_12345", json={
            "copied": True
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Update nonexistent donation returns 404")


class TestStats:
    """Stats endpoint tests"""
    
    def test_get_stats_with_valid_token(self, auth_headers):
        """GET /api/admin/stats with valid token returns statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_value" in data, "Response should contain 'total_value'"
        assert "total_donations" in data, "Response should contain 'total_donations'"
        assert "copied_count" in data, "Response should contain 'copied_count'"
        
        # Validate data types
        assert isinstance(data["total_value"], (int, float)), "total_value should be numeric"
        assert isinstance(data["total_donations"], int), "total_donations should be integer"
        assert isinstance(data["copied_count"], int), "copied_count should be integer"
        
        print(f"✓ Stats: total_value={data['total_value']}, total_donations={data['total_donations']}, copied_count={data['copied_count']}")
    
    def test_get_stats_without_token(self):
        """GET /api/admin/stats without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Stats endpoint correctly requires authentication")


class TestPixConfig:
    """PIX key configuration endpoint tests"""
    
    def test_get_pix_config_with_valid_token(self, auth_headers):
        """GET /api/admin/config with valid token returns PIX key config"""
        response = requests.get(f"{BASE_URL}/api/admin/config", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pix_key" in data, "Response should contain 'pix_key'"
        print(f"✓ PIX key configured: {'Yes' if data['pix_key'] else 'No'}")
    
    def test_get_pix_config_without_token(self):
        """GET /api/admin/config without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/admin/config")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Config endpoint correctly requires authentication")
    
    def test_update_pix_key(self, auth_headers):
        """PUT /api/admin/config/pix-key updates PIX key"""
        # First get current key
        get_response = requests.get(f"{BASE_URL}/api/admin/config", headers=auth_headers)
        original_key = get_response.json().get("pix_key", "")
        
        # Update to test key
        test_key = "test_pix_key_12345@email.com"
        update_response = requests.put(f"{BASE_URL}/api/admin/config/pix-key", 
                                       json={"pix_key": test_key},
                                       headers=auth_headers)
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/admin/config", headers=auth_headers)
        assert verify_response.json()["pix_key"] == test_key, "PIX key should be updated"
        
        # Restore original key
        if original_key:
            requests.put(f"{BASE_URL}/api/admin/config/pix-key", 
                        json={"pix_key": original_key},
                        headers=auth_headers)
        
        print(f"✓ PIX key updated and verified")
    
    def test_update_pix_key_without_token(self):
        """PUT /api/admin/config/pix-key without token returns 401/403"""
        response = requests.put(f"{BASE_URL}/api/admin/config/pix-key", 
                               json={"pix_key": "test_key"})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Config update endpoint correctly requires authentication")


class TestPixGeneration:
    """PIX code generation endpoint tests (public endpoints)"""
    
    def test_generate_pix_code(self):
        """GET /api/admin/pix/generate?value=25.00 returns valid PIX code"""
        response = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": 25.00})
        
        # May return 400 if PIX key not configured
        if response.status_code == 400:
            print("⚠ PIX key not configured in admin panel - skipping PIX generation test")
            pytest.skip("PIX key not configured")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pix_code" in data, "Response should contain 'pix_code'"
        assert "pix_key" in data, "Response should contain 'pix_key'"
        assert len(data["pix_code"]) > 0, "PIX code should not be empty"
        
        # Validate PIX code format (EMV BR Code starts with specific pattern)
        pix_code = data["pix_code"]
        assert pix_code.startswith("0002"), f"PIX code should start with EMV format indicator, got: {pix_code[:10]}"
        
        print(f"✓ PIX code generated, length: {len(pix_code)}")
    
    def test_generate_pix_with_different_values(self):
        """Test PIX generation with various amounts"""
        test_values = [1.00, 50.00, 100.00, 999.99]
        
        for value in test_values:
            response = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": value})
            if response.status_code == 400:
                pytest.skip("PIX key not configured")
            
            assert response.status_code == 200, f"Failed for value {value}: {response.text}"
            data = response.json()
            assert "pix_code" in data
            print(f"✓ PIX code generated for value R$ {value}")
    
    def test_generate_pix_invalid_value(self):
        """GET /api/admin/pix/generate with invalid value returns 422"""
        response = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": -10})
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Invalid PIX value correctly rejected")
    
    def test_generate_pix_missing_value(self):
        """GET /api/admin/pix/generate without value parameter returns 422"""
        response = requests.get(f"{BASE_URL}/api/admin/pix/generate")
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Missing value parameter correctly rejected")
    
    def test_pix_status_endpoint(self):
        """GET /api/admin/pix/status returns configuration status"""
        response = requests.get(f"{BASE_URL}/api/admin/pix/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "configured" in data, "Response should contain 'configured'"
        assert isinstance(data["configured"], bool), "'configured' should be boolean"
        print(f"✓ PIX status: configured={data['configured']}")


class TestIntegration:
    """Integration tests for full donation flow"""
    
    def test_full_donation_flow(self, auth_headers):
        """Test complete donation flow: generate PIX -> create donation -> mark copied"""
        # 1. Generate PIX code
        pix_response = requests.get(f"{BASE_URL}/api/admin/pix/generate", params={"value": 15.00})
        if pix_response.status_code == 400:
            pytest.skip("PIX key not configured")
        
        assert pix_response.status_code == 200
        pix_code = pix_response.json()["pix_code"]
        print(f"1. PIX code generated")
        
        # 2. Create donation
        donation_response = requests.post(f"{BASE_URL}/api/admin/donations", json={
            "value": 15.00,
            "pix_code": pix_code
        })
        assert donation_response.status_code == 200
        donation_id = donation_response.json()["donation_id"]
        print(f"2. Donation created: {donation_id}")
        
        # 3. Mark as copied
        update_response = requests.patch(f"{BASE_URL}/api/admin/donations/{donation_id}", json={
            "copied": True
        })
        assert update_response.status_code == 200
        print(f"3. Donation marked as copied")
        
        # 4. Verify in donations list
        donations_response = requests.get(f"{BASE_URL}/api/admin/donations", headers=auth_headers)
        assert donations_response.status_code == 200
        donations = donations_response.json()
        
        # Find our donation
        found_donation = next((d for d in donations if d.get("donation_id") == donation_id), None)
        assert found_donation is not None, "Created donation should be in list"
        assert found_donation["copied"] == True, "Donation should be marked as copied"
        print(f"4. Donation verified in list with copied=True")
        
        # 5. Verify stats
        stats_response = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers)
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["total_donations"] >= 1, "Should have at least 1 donation"
        print(f"5. Stats verified: {stats['total_donations']} total donations")
        
        print("✓ Full donation flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
