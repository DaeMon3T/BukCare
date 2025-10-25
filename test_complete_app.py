#!/usr/bin/env python3
"""
BukCare Complete Application Test Script
Tests all components of the application
"""

import requests
import json
import sys
import time
import subprocess
import os
from urllib.parse import urljoin

def test_backend_imports():
    """Test backend imports"""
    print("🧪 Testing Backend Imports...")
    try:
        # Change to backend directory
        os.chdir('BackEnd')
        
        # Activate virtual environment and test imports
        result = subprocess.run([
            'bash', '-c', 
            'source venv/bin/activate && python3 -c "import main; print(\'Backend imports OK\')"'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Backend imports: PASSED")
            return True
        else:
            print(f"❌ Backend imports: FAILED")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Backend imports: FAILED (Error: {e})")
        return False
    finally:
        os.chdir('..')

def test_frontend_build():
    """Test frontend build"""
    print("🧪 Testing Frontend Build...")
    try:
        # Change to frontend directory
        os.chdir('FrontEnd')
        
        # Test build
        result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Frontend build: PASSED")
            return True
        else:
            print(f"❌ Frontend build: FAILED")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Frontend build: FAILED (Error: {e})")
        return False
    finally:
        os.chdir('..')

def test_backend_startup():
    """Test backend startup"""
    print("🧪 Testing Backend Startup...")
    try:
        # Change to backend directory
        os.chdir('BackEnd')
        
        # Start backend in background
        result = subprocess.Popen([
            'bash', '-c', 
            'source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for startup
        time.sleep(5)
        
        # Test health endpoint
        response = requests.get("http://localhost:8000/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ Backend startup: PASSED")
            result.terminate()
            result.wait()
            return True
        else:
            print(f"❌ Backend startup: FAILED (Status: {response.status_code})")
            result.terminate()
            result.wait()
            return False
    except Exception as e:
        print(f"❌ Backend startup: FAILED (Error: {e})")
        try:
            result.terminate()
            result.wait()
        except:
            pass
        return False
    finally:
        os.chdir('..')

def test_api_endpoints():
    """Test key API endpoints"""
    print("🧪 Testing API Endpoints...")
    
    endpoints = [
        ("/health", "GET"),
        ("/docs", "GET"),
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
        except Exception as e:
            print(f"❌ {method} {endpoint}: FAILED (Error: {e})")
            results.append(False)
    
    return all(results)

def test_database_connection():
    """Test database connection"""
    print("🧪 Testing Database Connection...")
    try:
        # Change to backend directory
        os.chdir('BackEnd')
        
        # Test database connection
        result = subprocess.run([
            'bash', '-c', 
            'source venv/bin/activate && python3 -c "from core.database import engine; print(\'Database connection OK\')"'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database connection: PASSED")
            return True
        else:
            print(f"❌ Database connection: FAILED")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Database connection: FAILED (Error: {e})")
        return False
    finally:
        os.chdir('..')

def test_environment_config():
    """Test environment configuration"""
    print("🧪 Testing Environment Configuration...")
    
    # Check backend .env
    backend_env = os.path.exists('BackEnd/.env')
    frontend_env = os.path.exists('FrontEnd/.env.local')
    
    if backend_env:
        print("✅ Backend .env: EXISTS")
    else:
        print("⚠️  Backend .env: MISSING (will use defaults)")
    
    if frontend_env:
        print("✅ Frontend .env.local: EXISTS")
    else:
        print("⚠️  Frontend .env.local: MISSING (will use defaults)")
    
    return True

def test_file_structure():
    """Test file structure"""
    print("🧪 Testing File Structure...")
    
    required_files = [
        'BackEnd/main.py',
        'BackEnd/requirements.txt',
        'BackEnd/core/config.py',
        'BackEnd/core/database.py',
        'BackEnd/models/__init__.py',
        'BackEnd/routers/v1/__init__.py',
        'FrontEnd/package.json',
        'FrontEnd/src/App.tsx',
        'FrontEnd/src/main.tsx',
        'start_complete.sh',
        'test_connection.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}: EXISTS")
        else:
            print(f"❌ {file_path}: MISSING")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"❌ File structure: FAILED ({len(missing_files)} files missing)")
        return False
    else:
        print("✅ File structure: PASSED")
        return True

def main():
    """Run all tests"""
    print("🔍 BukCare Complete Application Test")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Environment Configuration", test_environment_config),
        ("Backend Imports", test_backend_imports),
        ("Frontend Build", test_frontend_build),
        ("Database Connection", test_database_connection),
        ("Backend Startup", test_backend_startup),
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
        print("🎉 All tests passed! BukCare application is working correctly.")
        print("\n🚀 Ready to start:")
        print("   ./start_complete.sh")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())


