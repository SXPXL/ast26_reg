import urllib.request
import json

BASE = 'http://127.0.0.1:8000/api/v1'

def req(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode('utf-8') if data else None
    r = urllib.request.Request(f'{BASE}{url}', data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("HTTP ERROR:", e.code, e.read().decode('utf-8'))
        raise e

def main():
    print("==================================================")
    print("  ASTHRA 26 FULL SYSTEM END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Test Events
    events = req('/events')
    print('1. Events retrieved count:', len(events))
    assert len(events) > 0, "No events returned"
    ev = events[0]
    print(f"   Event: {ev['title']} | Type: {ev['event_type']} | Fee: Rs.{ev['registration_fee']}")

    # 2. Test Admin Login
    try:
        login_res = req('/auth/login', method='POST', data={'username': 'admin', 'password': 'Admin@12345'})
    except Exception:
        login_res = req('/auth/login', method='POST', data={'username': 'admin', 'password': '1234'})
    token = login_res['access_token']
    print(f"2. Admin login successful. Role: {login_res['user']['role']}")
    assert login_res['user']['role'] == 'ADMIN'

    # 3. Test Participant Online Registration with course_and_semester and team validation
    import time
    ts = int(time.time())
    reg_online = req('/registrations', method='POST', data={
        'event_id': ev['id'],
        'primary_name': f'Aarav Patel {ts}',
        'primary_email': f'aarav_{ts}@patel.com',
        'primary_phone': '9876543210',
        'college_name': 'Marian College of Engineering',
        'course_and_semester': 'B.Tech CSE, Sem 6',
        'team_name': f'CyberTitans_{ts}' if ev['event_type'] == 'TEAM' else None,
        'team_members': [{
            'full_name': 'Rohan Das',
            'email': f'rohan_{ts}@patel.com',
            'phone': '9876543219',
            'college_name': 'Marian College of Engineering',
            'course_and_semester': 'B.Tech CSE, Sem 6',
        }] if ev['event_type'] == 'TEAM' else [],
        'payment_mode': 'ONLINE'
    })
    print(f"3. Online registration created: {reg_online['registration_code']} | Status: {reg_online['payment_status']}")
    assert len(reg_online['registration_code']) == 6

    # 4. Security Check: Unauthenticated Offline Spot Registration MUST be blocked (403)
    unauth_blocked = False
    try:
        req('/registrations', method='POST', data={
            'event_id': ev['id'],
            'primary_name': 'Hacker Unauth',
            'primary_email': f'hacker_{ts}@bypass.com',
            'primary_phone': '9876543299',
            'college_name': 'Unknown College',
            'course_and_semester': 'B.Tech CSE, Sem 6',
            'team_name': f'HackTeam_{ts}' if ev['event_type'] == 'TEAM' else None,
            'team_members': [{
                'full_name': 'Teammate Hacker',
                'email': f'tm_hack_{ts}@bypass.com',
                'phone': '9876543298',
                'college_name': 'Unknown College',
                'course_and_semester': 'B.Tech CSE, Sem 6',
            }] if ev['event_type'] == 'TEAM' else [],
            'payment_mode': 'OFFLINE'
        })
    except urllib.error.HTTPError as e:
        if e.code == 403:
            unauth_blocked = True
            print("4a. [SECURITY PASSED] Unauthenticated offline spot registration blocked with 403 Forbidden.")
    assert unauth_blocked, "Security vulnerability: Unauthenticated user was able to register OFFLINE for free!"

    # 4b. Test Authenticated Volunteer/Admin Manual Offline Registration (instantly marked SUCCESS)
    reg_offline = req('/registrations', method='POST', data={
        'event_id': ev['id'],
        'primary_name': f'Pooja Nair {ts}',
        'primary_email': f'pooja_{ts}@nair.com',
        'primary_phone': '9876543211',
        'college_name': 'Govt Engineering College',
        'course_and_semester': 'B.Tech EEE, Sem 4',
        'team_name': f'VoltNinjas_{ts}' if ev['event_type'] == 'TEAM' else None,
        'team_members': [{
            'full_name': 'Sanjay Kumar',
            'email': f'sanjay_{ts}@nair.com',
            'phone': '9876543218',
            'college_name': 'Govt Engineering College',
            'course_and_semester': 'B.Tech EEE, Sem 4',
        }] if ev['event_type'] == 'TEAM' else [],
        'payment_mode': 'OFFLINE'
    }, token=token)
    print(f"4b. Authenticated offline spot registration created: {reg_offline['registration_code']} | Status: {reg_offline['payment_status']} | Mode: {reg_offline['payment_mode']}")
    assert reg_offline['payment_status'] == 'SUCCESS'
    assert reg_offline['payment_mode'] == 'OFFLINE'

    # 4c. Security Check: Unverified Fake Webhook MUST be rejected with 401
    webhook_blocked = False
    try:
        req('/payments/webhook', method='POST', data={
            'type': 'PAYMENT_SUCCESS_WEBHOOK',
            'data': {'order': {'order_id': 'FAKE_ORDER'}}
        })
    except urllib.error.HTTPError as e:
        if e.code == 401:
            webhook_blocked = True
            print("4c. [SECURITY PASSED] Unsigned Cashfree webhook rejected with 401 Unauthorized.")
    assert webhook_blocked, "Security vulnerability: Unsigned webhook was accepted!"

    # 4d. Security Check: Public Volunteer Role Escalation Prevention
    esc_reg = req('/auth/register', method='POST', data={
        'email': f'user_esc_{ts}@fest.com',
        'full_name': 'Privilege Escalation Attempt',
        'password': 'Password@123',
        'role': 'VOLUNTEER'
    })
    print(f"4d. [SECURITY PASSED] Public registration with role='VOLUNTEER' resulted in assigned role: {esc_reg['role']}")
    assert esc_reg['role'] == 'PARTICIPANT', f"Role escalation failed: assigned {esc_reg['role']} instead of PARTICIPANT!"

    # 5. Test Attendance Check-in Toggle
    reg_id = reg_offline['registration_id']
    att_res = req(f'/registrations/{reg_id}/attendance', method='PATCH', data={'attendance_status': 'PRESENT'}, token=token)
    print(f"5. Attendance marked present: {att_res['attendance_status']} | Attended at: {att_res['attended_at']}")
    assert att_res['attendance_status'] == 'PRESENT'

    # 6. Test Admin List Registrations with Filter
    filter_offline = req('/registrations?payment_mode=OFFLINE', token=token)
    print(f"6. Admin filtered registrations by OFFLINE: count = {len(filter_offline)}")
    assert len(filter_offline) >= 1

    # 7. Test Admin Stats
    stats = req('/admin/stats/overview', token=token)
    print("7. Overview Stats:")
    print(f"   Total Revenue: Rs.{stats['total_revenue']}")
    print(f"   Offline Revenue: Rs.{stats['offline_revenue']}")
    print(f"   Online Revenue: Rs.{stats['online_revenue']}")
    print(f"   Checked In: {stats['total_checked_in']} / {stats['total_confirmed_registrations']}")

    print("\n>>> ALL WORKFLOW TESTS PASSED CLEANLY WITH 100% SUCCESS! <<<")

if __name__ == '__main__':
    main()
