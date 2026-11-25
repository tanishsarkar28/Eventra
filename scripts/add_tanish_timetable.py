import json
import os
import time

user_id = "1795452976828"
user_email = "tanish@lpu.in"

timetable_path = os.path.join(os.getcwd(), 'data', 'timetable.json')

# Load existing slots if any
if os.path.exists(timetable_path):
    with open(timetable_path, 'r', encoding='utf-8') as f:
        try:
            existing_slots = json.load(f)
        except Exception:
            existing_slots = []
else:
    existing_slots = []

# Filter out any old slots for this user just in case
slots_to_keep = [s for s in existing_slots if s.get('userId') != user_id]

# The 25 slots from Tanish's LPU timetable
tanish_slots = [
    # MONDAY
    {
        "subject": "INT257 (Lecture)",
        "dayOfWeek": "Monday",
        "startTime": "10:20",
        "endTime": "11:10",
        "room": "33-612",
        "instructor": "K2P24RL"
    },
    {
        "subject": "INT257 (Lecture)",
        "dayOfWeek": "Monday",
        "startTime": "11:10",
        "endTime": "12:00",
        "room": "33-612",
        "instructor": "K2P24RL"
    },
    {
        "subject": "CSE408 (Lecture)",
        "dayOfWeek": "Monday",
        "startTime": "13:40",
        "endTime": "14:30",
        "room": "33-608",
        "instructor": "K2P24RL"
    },
    {
        "subject": "CSE408 (Lecture)",
        "dayOfWeek": "Monday",
        "startTime": "14:30",
        "endTime": "15:20",
        "room": "33-608",
        "instructor": "K2P24RL"
    },

    # TUESDAY
    {
        "subject": "INT257 (Practical)",
        "dayOfWeek": "Tuesday",
        "startTime": "13:40",
        "endTime": "14:30",
        "room": "33-508",
        "instructor": "K2P24RL"
    },
    {
        "subject": "INT257 (Practical)",
        "dayOfWeek": "Tuesday",
        "startTime": "14:30",
        "endTime": "15:20",
        "room": "33-508",
        "instructor": "K2P24RL"
    },
    {
        "subject": "PEA306 (Tutorial)",
        "dayOfWeek": "Tuesday",
        "startTime": "15:20",
        "endTime": "16:10",
        "room": "34-604",
        "instructor": "K2P24RL"
    },

    # WEDNESDAY
    {
        "subject": "INT252 (Lecture)",
        "dayOfWeek": "Wednesday",
        "startTime": "10:20",
        "endTime": "11:10",
        "room": "34-101",
        "instructor": "K2P24RL"
    },
    {
        "subject": "INT252 (Lecture)",
        "dayOfWeek": "Wednesday",
        "startTime": "11:10",
        "endTime": "12:00",
        "room": "34-101",
        "instructor": "K2P24RL"
    },
    {
        "subject": "MKT311 (Practical)",
        "dayOfWeek": "Wednesday",
        "startTime": "12:50",
        "endTime": "13:40",
        "room": "37-905",
        "instructor": "K3O2408"
    },
    {
        "subject": "PES390 (Lecture)",
        "dayOfWeek": "Wednesday",
        "startTime": "13:40",
        "endTime": "14:30",
        "room": "34-110",
        "instructor": "K2P24RL"
    },
    {
        "subject": "PEA306 (Lecture)",
        "dayOfWeek": "Wednesday",
        "startTime": "14:30",
        "endTime": "15:20",
        "room": "34-110",
        "instructor": "K2P24RL"
    },

    # THURSDAY
    {
        "subject": "INT252 (Practical)",
        "dayOfWeek": "Thursday",
        "startTime": "10:20",
        "endTime": "11:10",
        "room": "33-507Y",
        "instructor": "K2P24RL"
    },
    {
        "subject": "INT252 (Practical)",
        "dayOfWeek": "Thursday",
        "startTime": "11:10",
        "endTime": "12:00",
        "room": "33-507Y",
        "instructor": "K2P24RL"
    },
    {
        "subject": "MKT311 (Practical)",
        "dayOfWeek": "Thursday",
        "startTime": "12:50",
        "endTime": "13:40",
        "room": "37-905",
        "instructor": "K3O2408"
    },
    {
        "subject": "CSE408 (Lecture)",
        "dayOfWeek": "Thursday",
        "startTime": "13:40",
        "endTime": "14:30",
        "room": "34-101",
        "instructor": "K2P24RL"
    },
    {
        "subject": "PEA306 (Lecture)",
        "dayOfWeek": "Thursday",
        "startTime": "16:10",
        "endTime": "17:00",
        "room": "34-101",
        "instructor": "K2P24RL"
    },

    # FRIDAY
    {
        "subject": "CSE408 (Practical)",
        "dayOfWeek": "Friday",
        "startTime": "10:20",
        "endTime": "11:10",
        "room": "33-603",
        "instructor": "K2P24RL"
    },
    {
        "subject": "CSE408 (Practical)",
        "dayOfWeek": "Friday",
        "startTime": "11:10",
        "endTime": "12:00",
        "room": "33-603",
        "instructor": "K2P24RL"
    },
    {
        "subject": "MKT311 (Practical)",
        "dayOfWeek": "Friday",
        "startTime": "12:50",
        "endTime": "13:40",
        "room": "37-905",
        "instructor": "K3O2408"
    },
    {
        "subject": "PES390 (Lecture)",
        "dayOfWeek": "Friday",
        "startTime": "13:40",
        "endTime": "14:30",
        "room": "33-501",
        "instructor": "K2P24RL"
    },
    {
        "subject": "PES390 (Tutorial)",
        "dayOfWeek": "Friday",
        "startTime": "14:30",
        "endTime": "15:20",
        "room": "34-704",
        "instructor": "K2P24RL"
    },
    {
        "subject": "PES390 (Tutorial)",
        "dayOfWeek": "Friday",
        "startTime": "15:20",
        "endTime": "16:10",
        "room": "34-704",
        "instructor": "K2P24RL"
    },

    # SATURDAY
    {
        "subject": "PEAS01 (Lecture)",
        "dayOfWeek": "Saturday",
        "startTime": "09:30",
        "endTime": "10:20",
        "room": "33-510",
        "instructor": "9R042"
    },
    {
        "subject": "PEVS01 (Lecture)",
        "dayOfWeek": "Saturday",
        "startTime": "10:20",
        "endTime": "11:10",
        "room": "33-510",
        "instructor": "9R042"
    }
]

# Generate records
new_records = []
now_iso = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())

for i, slot in enumerate(tanish_slots):
    record = {
        "id": f"slot_{user_id}_{i+1}_{slot['dayOfWeek'][:3].lower()}_{slot['startTime'].replace(':', '')}",
        "userId": user_id,
        "subject": slot["subject"],
        "dayOfWeek": slot["dayOfWeek"],
        "startTime": slot["startTime"],
        "endTime": slot["endTime"],
        "room": slot["room"],
        "instructor": slot["instructor"],
        "createdAt": now_iso
    }
    new_records.append(record)

final_slots = slots_to_keep + new_records

with open(timetable_path, 'w', encoding='utf-8') as f:
    json.dump(final_slots, f, indent=2)

print(f"Successfully added {len(new_records)} timetable slots for {user_email} (ID: {user_id})")
