#!/usr/bin/env python3
"""
BukCare Connection Test Script
Tests the connection between frontend and backend
"""

import requests
import json
import sys
import time
from urllib.parse import urljoin

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check: PASSED")
            return True
        else:
            print(f"❌ Backend health check: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend health check: FAILED (Error: {e})")
        return False

def test_backend_docs():
    """Test backend API documentation"""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API docs: ACCESSIBLE")
            return True
        else:
            print(f"❌ Backend API docs: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend API docs: FAILED (Error: {e})")
        return False

def test_cors_headers():
    """Test CORS headers"""
    try:
        response = requests.options(
            "http://localhost:8000/api/v1/auth/signin",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=5
        )
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
        }
        
        if cors_headers["Access-Control-Allow-Origin"]:
            print("✅ CORS headers: CONFIGURED")
            print(f"   Allow-Origin: {cors_headers['Access-Control-Allow-Origin']}")
            return True
        else:
            print("❌ CORS headers: MISSING")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ CORS test: FAILED (Error: {e})")
        return False

def test_frontend_connection():
    """Test if frontend is accessible"""
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: ACCESSIBLE")
            return True
        else:
            print(f"❌ Frontend: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend: NOT ACCESSIBLE (Error: {e})")
        return False

def test_api_endpoints():
    """Test key API endpoints"""
    endpoints = [
        ("/api/v1/auth/signin", "POST"),
        ("/api/v1/doctors", "GET"),
        ("/api/v1/appointments", "GET"),
    ]
    
    results = []
    for endpoint, method in endpoints:
        try:
            url = f"http://localhost:8000{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, json={}, timeout=5)
            
            if response.status_code in [200, 401, 422]:  # 401/422 are expected for auth endpoints
                print(f"✅ {method} {endpoint}: RESPONDING")
                results.append(True)
            else:
                print(f"❌ {method} {endpoint}: FAILED (Status: {response.status_code})")
                results.append(False)
        except requests.exceptions.RequestException as e:
            print(f"❌ {method} {endpoint}: FAILED (Error: {e})")
            results.append(False)
    
    return all(results)

def main():
    """Run all connection tests"""
    print("🔍 BukCare Connection Test")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Backend API Docs", test_backend_docs),
        ("CORS Configuration", test_cors_headers),
        ("Frontend Accessibility", test_frontend_connection),
        ("API Endpoints", test_api_endpoints),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Testing {test_name}...")
        result = test_func()
        results.append(result)
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = sum(results)
    total = len(results)
    
    for i, (test_name, _) in enumerate(tests):
        status = "✅ PASSED" if results[i] else "❌ FAILED"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend and frontend are properly connected.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
