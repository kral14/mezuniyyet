
import asyncio
import json
import requests
import websockets
import time

API_URL = "https://rust-api-xqiw.onrender.com"
# Correct WS URL for Render (wss + /api/ws)
WS_URL = "wss://rust-api-xqiw.onrender.com/api/ws"
import sys
import uuid

API_URL = "https://rust-api-xqiw.onrender.com"
WS_URL = "wss://rust-api-xqiw.onrender.com/api/ws"

def get_working_tenant():
    print("Searching for a WORKING tenant (with valid DB connection)...")
    candidates = []
    
    # 1. Gather Candidates
    for query in ["kral", "mezuniyyet", "test", "a"]:
        try:
            res = requests.get(f"{API_URL}/api/tenants/search/{query}")
            if res.status_code == 200:
                tenants = res.json()
                for t in tenants:
                    if t not in candidates: candidates.append(t)
        except: pass
    
    print(f"Found {len(candidates)} candidates. Probing...")
    
    # 2. Probe Each
    for t in candidates:
        print(f"Probing tenant: {t['name']} ({t['id']})...", end=" ")
        # Try a dummy register to check DB connection
        try:
            res = requests.post(f"{API_URL}/api/register", json={
                "username": "probe_check",
                "email": "probe@check.com",
                "password": "pass",
                "tenant_id": t['id'],
                "first_name": "Probe", "last_name": "Check", "father_name": "P",
                "phone": "000", "address": "addr", "birth_date": "2000-01-01", "fin_code": "PROBE",
                "department_id": 1, "position_id": 1
            }, headers={"X-Tenant-ID": str(t['id'])})
            
            # If 200 (Created) or 400 (User exists) => DB IS CONNECTED
            # If 404 (Not Found) or 500 (Internal) => DB ERROR
            if res.status_code in [200, 400] and "Failed to connect" not in res.text:
                print("✅ CONNECTED!")
                return t['id']
            else:
                print(f"❌ Failed ({res.status_code})")
        except Exception as e:
            print(f"❌ Error: {e}")
            
    print("❌ Could not find any tenant with a working database connection.")
    return None

def get_valid_metadata():
    try:
        # Depts
        res = requests.get(f"{API_URL}/api/dictionaries/departments")
        dept_id = 1
        if res.status_code == 200:
            data = res.json()
            if data and len(data) > 0:
                dept_id = data[0]['id']
        
        # Pos 
        res = requests.get(f"{API_URL}/api/dictionaries/positions")
        pos_id = 1
        if res.status_code == 200:
             data = res.json()
             if data and len(data) > 0:
                 pos_id = data[0]['id']

        return dept_id, pos_id
    except Exception as e:
        print(f"Metadata Fetch Error: {e}")
        return 1, 1 
        
    time.sleep(1)

def register_user(username_base, tenant_id, dept_id, pos_id):
    # Use unique email/username to avoid conflict
    import random
    suffix = random.randint(1000, 9999)
    email = f"{username_base}_{suffix}@test.com"
    username = f"{username_base}_{suffix}"
    
    print(f"Registering {username}...")
    
    # Register
    res = requests.post(f"{API_URL}/api/register", json={
        "username": username,
        "email": email,
        "password": "password123",
        "tenant_id": tenant_id,
        "first_name": username_base,
        "last_name": "Test",
        "father_name": "TestFather",
        "phone": "+994501234567",
        "address": "Test Address",
        "birth_date": "1990-01-01",
        "fin_code": f"FIN{suffix}",
        "birth_date": "1990-01-01",
        "fin_code": f"FIN{suffix}",
        "department_id": dept_id, 
        "position_id": pos_id
    }, headers={"X-Tenant-ID": str(tenant_id)})
    
    if res.status_code != 200:
        print(f"Register failed for {username}. Status: {res.status_code}")
        print(f"Response: {res.text}")
        if "exists" in res.text:
            pass 
        else:
            return None
    
    # Login
    res = requests.post(f"{API_URL}/api/login", json={
        "username": username,
        "email": email,
        "password": "password123",
        "tenant_id": tenant_id
    })
    
    if res.status_code == 200:
        try:
            return res.json()
        except:
             print(f"Login Valid (200) but invalid JSON. Body: {res.text}")
             return None

    print(f"Login failed: {res.text}")
    return None

async def listen_for_signal(ws, target_type, timeout=5):
    try:
        while True:
            msg = await asyncio.wait_for(ws.recv(), timeout=timeout)
            data = json.loads(msg)
            print(f"Received Signal: {data.get('type')}")
            if data.get('type') == target_type:
                return data
    except asyncio.TimeoutError:
        return None

async def run_test():
    TENANT = get_working_tenant()
    if not TENANT:
        sys.exit(1)

    DEPT_ID, POS_ID = get_valid_metadata()

    print("--- 1. Setup Users ---")
    sender = register_user("sender", TENANT, DEPT_ID, POS_ID)
    recipient = register_user("recipient", TENANT, DEPT_ID, POS_ID)
    
    if not sender or not recipient:
        print("Failed to setup users.")
        return

    sender_token = sender['token']
    recipient_token = recipient['token']
    sender_id = sender['user']['id']
    recipient_id = recipient['user']['id']
    
    print(f"Sender ID: {sender_id}, Recipient ID: {recipient_id}")
    
    # Need to wait a bit for friend discovery or just send?
    # Backend allows sending to anyone in same tenant usually.
    
    print("\n--- 2. Scenario A: Instant Delivery (Both Online) ---")
    async with websockets.connect(f"{WS_URL}?token={sender_token}") as ws_sender:
        async with websockets.connect(f"{WS_URL}?token={recipient_token}") as ws_recipient:
             # ... rest of logic (Scenario A)
            print("Both Connected to WS.")
            
            # Send Message (REST)
            print("Sending Message 1...")
            res = requests.post(f"{API_URL}/api/chat/messages", json={
                "recipient_id": recipient_id,
                "message": "Hello Online World"
            }, headers={"Authorization": f"Bearer {sender_token}", "X-Tenant-ID": TENANT})
            
            msg1_id = res.json().get('id')
            
            # Check backend instant response
            if res.json().get('is_delivered') == True:
                print("✅ REST Response confirms is_delivered=True")
            else:
                 print("⚠️ REST Response says is_delivered=False (Check WS)")

            # Check for WS Signal on Sender
            signal = await listen_for_signal(ws_sender, "MESSAGE_DELIVERED")
            if signal:
                print("✅ Recieved MESSAGE_DELIVERED signal (Instant)!")
            else:
                print("❌ Failed to receive instant delivery signal.")

    print("\n--- 3. Scenario B: Offline Sync (Recipient Offline) ---")
    async with websockets.connect(f"{WS_URL}?token={sender_token}") as ws_sender:
        print("Sender Connected. Recipient is OFF-LINE.")
        
        # Send Message 2
        print("Sending Message 2...")
        res = requests.post(f"{API_URL}/api/chat/messages", json={
            "recipient_id": recipient_id,
            "message": "Hello Offline World"
        }, headers={"Authorization": f"Bearer {sender_token}", "X-Tenant-ID": TENANT})
        
        msg2_id = res.json().get('id')
        
        # Verify NO signal immediately
        signal = await listen_for_signal(ws_sender, "MESSAGE_DELIVERED", timeout=2)
        if signal:
            print("❌ Unexpectedly received DELIVERED signal while user confirmed offline!")
        else:
            print("✅ Correctly received NO signal (User is offline).")
            
        print("Now Connecting Recipient...")
        async with websockets.connect(f"{WS_URL}?token={recipient_token}") as ws_recipient:
            print("Recipient Connected.")
            # Expect Signal on Sender now
            signal = await listen_for_signal(ws_sender, "MESSAGE_DELIVERED", timeout=5)
            if signal:
                 print(f"✅ Received MESSAGE_DELIVERED signal after Sync! Payload: {signal}")
                 if msg2_id in signal['payload']['message_ids']:
                     print("✅ Message ID matches!")
                 else:
                     print("⚠️ Message ID mismatch in payload.")
            else:
                print("❌ Failed to receive sync delivery signal.")

if __name__ == "__main__":
    asyncio.run(run_test())
