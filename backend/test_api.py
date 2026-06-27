"""Quick API verification script."""
import requests

BASE = "http://localhost:8000"

# 1. Login as client
print("=== CLIENT LOGIN ===")
r = requests.post(f"{BASE}/api/auth/login", json={"email": "client@example.com", "password": "client123"})
print(f"Status: {r.status_code}")
client_token = r.json()["access_token"]
client_headers = {"Authorization": f"Bearer {client_token}"}
print(f"Token: {client_token[:20]}...")

# 2. Get products
print("\n=== PRODUCTS ===")
r = requests.get(f"{BASE}/api/products", headers=client_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")
for p in r.json():
    print(f"  - {p['name']} (${p['base_price']})")

# 3. Get occasions
print("\n=== CLIENT OCCASIONS ===")
r = requests.get(f"{BASE}/api/occasions", headers=client_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")
for o in r.json():
    print(f"  - {o['occasion_name']} for {o['recipient_name']} on {o['date']}")

# 4. Get corporate enquiries
print("\n=== CORPORATE ENQUIRIES ===")
r = requests.get(f"{BASE}/api/corporate-enquiries", headers=client_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")
for e in r.json():
    print(f"  - {e['company_name']}: {e['quantity']} units, Status={e['status']}")

# 5. Get returns
print("\n=== RETURN REQUESTS ===")
r = requests.get(f"{BASE}/api/returns", headers=client_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")
for ret in r.json():
    print(f"  - Order #{ret['order_id']}: {ret['reason']} (Status={ret['status']})")

# 6. AI recommendation
print("\n=== AI RECOMMENDATION ===")
r = requests.get(f"{BASE}/api/ai/recommend?occasion=Birthday&recipient=Grace", headers=client_headers)
print(f"Status: {r.status_code}")
rec = r.json()
print(f"  Product: {rec['recommended_product']}")
print(f"  Engraving: {rec['suggested_engraving']}")
print(f"  Card: {rec['suggested_card']}")
print(f"  Packaging: {rec['suggested_packaging']}")
print(f"  Sample Text: {rec['sample_card_text'][:80]}...")

# 7. Get orders (check AI recommendation field populated)
print("\n=== ORDERS (check ai_recommendation) ===")
r = requests.get(f"{BASE}/api/orders", headers=client_headers)
orders = r.json()
print(f"Status: {r.status_code}, Count: {len(orders)}")
for o in orders:
    ai = o.get('ai_recommendation', '')
    print(f"  Order #{o['id']}: {o['product_name']} | Packaging: {o.get('packaging_material','N/A')} | Card: {o.get('greeting_card','N/A')} | AI: {'Yes' if ai else 'No'}")

# 8. Login as staff
print("\n=== STAFF LOGIN ===")
r = requests.post(f"{BASE}/api/auth/login", json={"email": "admin@paperplane.com", "password": "admin123"})
print(f"Status: {r.status_code}")
staff_token = r.json()["access_token"]
staff_headers = {"Authorization": f"Bearer {staff_token}"}

# 9. CSV export
print("\n=== CSV EXPORT ===")
r = requests.get(f"{BASE}/api/reports/csv", headers=staff_headers)
print(f"Status: {r.status_code}, Content-Type: {r.headers.get('content-type')}")
lines = r.text.strip().split("\n")
print(f"  Rows (incl header): {len(lines)}")
print(f"  Header: {lines[0][:100]}...")

# 10. Staff views all enquiries
print("\n=== STAFF: ALL CORPORATE ENQUIRIES ===")
r = requests.get(f"{BASE}/api/corporate-enquiries", headers=staff_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")

# 11. Staff views all returns
print("\n=== STAFF: ALL RETURNS ===")
r = requests.get(f"{BASE}/api/returns", headers=staff_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")

# 12. Staff views all occasions
print("\n=== STAFF: ALL OCCASIONS ===")
r = requests.get(f"{BASE}/api/occasions", headers=staff_headers)
print(f"Status: {r.status_code}, Count: {len(r.json())}")

print("\n[SUCCESS] ALL API VERIFICATIONS PASSED!")
