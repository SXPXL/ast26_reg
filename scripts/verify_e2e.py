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

    # 2. Test Admin Login with 'admin' and '1234'
    login_res = req('/auth/login', method='POST', data={'username': 'admin', 'password': '1234'})
    token = login_res['access_token']
    print(f"2. Admin login successful. Role: {login_res['user']['role']}")
    assert login_res['user']['role'] == 'ADMIN'

    # 3. Test Participant Online Registration with course_and_semester and team validation
    reg_online = req('/registrations', method='POST', data={
        'event_id': ev['id'],
        'primary_name': 'Aarav Patel',
        'primary_email': 'aarav@patel.com',
        'primary_phone': '9876543210',
        'college_name': 'Marian College of Engineering',
        'course_and_semester': 'B.Tech CSE, Sem 6',
        'team_name': 'CyberTitans' if ev['event_type'] == 'TEAM' else None,
        'team_members': [{
            'full_name': 'Rohan Das',
            'email': 'rohan@patel.com',
            'phone': '9876543219',
            'college_name': 'Marian College of Engineering',
            'course_and_semester': 'B.Tech CSE, Sem 6',
        }] if ev['event_type'] == 'TEAM' else [],
        'payment_mode': 'ONLINE'
    })
    print(f"3. Online registration created: {reg_online['registration_code']} | Status: {reg_online['payment_status']}")
    assert reg_online['registration_code'].startswith('ATHRA-2026-')

    # 4. Test Volunteer Manual Offline Registration (instantly marked SUCCESS)
    reg_offline = req('/registrations', method='POST', data={
        'event_id': ev['id'],
        'primary_name': 'Pooja Nair',
        'primary_email': 'pooja@nair.com',
        'primary_phone': '9876543211',
        'college_name': 'Govt Engineering College',
        'course_and_semester': 'B.Tech EEE, Sem 4',
        'team_name': 'VoltNinjas' if ev['event_type'] == 'TEAM' else None,
        'team_members': [{
            'full_name': 'Sanjay Kumar',
            'email': 'sanjay@nair.com',
            'phone': '9876543218',
            'college_name': 'Govt Engineering College',
            'course_and_semester': 'B.Tech EEE, Sem 4',
        }] if ev['event_type'] == 'TEAM' else [],
        'payment_mode': 'OFFLINE'
    })
    print(f"4. Offline spot registration created: {reg_offline['registration_code']} | Status: {reg_offline['payment_status']} | Mode: {reg_offline['payment_mode']}")
    assert reg_offline['payment_status'] == 'SUCCESS'
    assert reg_offline['payment_mode'] == 'OFFLINE'

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
