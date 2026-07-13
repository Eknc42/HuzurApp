import json

with open('/Users/azizekinci/.gemini/antigravity/brain/7c547be7-9507-4667-ae7a-c4de580ef5b4/.system_generated/logs/transcript_full.jsonl', 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            step = entry.get("step_index", 0)
            if step > 971:
                continue
            if entry.get("type") == "USER_INPUT":
                content = entry.get("content", "")
                if "<file path=" in content:
                    # just print paths
                    import re
                    paths = re.findall(r'<file path="([^"]+)">', content)
                    if paths:
                        print(f"Step {step}: Attached {paths}")
                        for path in paths:
                            if "Mushaf" in path or "QuranPage" in path or "SurahDetail" in path:
                                print(f"FOUND {path} at step {step}!")
                                match = re.search(f'<file path="{path}">\\n(.*?)\\n</file>', content, re.DOTALL)
                                if match:
                                    with open(path, 'w') as out_f:
                                        out_f.write(match.group(1))
                                        print(f"Restored {path}")
        except Exception:
            pass
