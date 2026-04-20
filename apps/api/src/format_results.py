import sys, json
data = json.load(sys.stdin)['data']
for s in data:
    st = s.get('sourceType', 'UNKNOWN')
    title = s.get('title', '')[:60]
    print(f"{st:20s} {title}")
