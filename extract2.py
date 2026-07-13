import json

with open('/Users/azizekinci/.gemini/antigravity/brain/7c547be7-9507-4667-ae7a-c4de580ef5b4/.system_generated/logs/transcript_full.jsonl', 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            step = entry.get("step_index", 0)
            if step > 971:
                continue
                
            if entry.get("type") == "PLANNER_RESPONSE" and "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["name"] == "write_to_file" or call["name"] == "write_file":
                        args = call.get("args", {})
                        target = args.get("TargetFile", "")
                        if "Mushaf" in target or "QuranPage" in target or "SurahDetail" in target:
                            print(f"Found {target} at step {step}")
                            with open(target, 'w') as out_f:
                                out_f.write(args.get("CodeContent", ""))
        except Exception:
            pass
