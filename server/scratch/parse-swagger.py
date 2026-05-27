import json
import os

filepath = r'C:\Users\gabrielt\.gemini\antigravity\brain\7fe650f9-9126-4f6a-a12d-041a9b0f2750\.system_generated\steps\359\content.md'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    # Buscamos donde empieza el JSON {
    start_line = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('{'):
            start_line = i
            break
    json_str = "".join(lines[start_line:])
    data = json.loads(json_str)

print("--- ALL DASHBOARD REPORTS ---")
for p in data['paths'].keys():
    if '/reports/' in p:
        print(p.replace('/reports/', ''))
