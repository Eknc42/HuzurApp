import json

files_to_recover = {
    "/Users/azizekinci/Projects/HuzurApp/src/screens/QuranScreen.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/components/ListItem.js": None,
    "/Users/azizekinci/Projects/HuzurApp/App.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/theme/colors.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/theme/typography.js": None,
}

with open('/Users/azizekinci/.gemini/antigravity/brain/7c547be7-9507-4667-ae7a-c4de580ef5b4/.system_generated/logs/transcript_full.jsonl', 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            step = entry.get("step_index", 0)
            if step > 900:  # Before the redesign started
                break
                
            # Check for view_file response
            if entry.get("type") == "TOOL_RESPONSE" and "view_file" in entry.get("content", ""):
                content = entry.get("content", "")
                if "File Path: `" in content:
                    path = content.split("File Path: `file://")[1].split("`")[0]
                    if path in files_to_recover and "Showing lines" not in content.split("\n")[5]:
                        lines = content.split("The following code has been modified to include a line number before every line")[1].split("\n")[1:]
                        if lines and "The above content shows the entire, complete file contents" in lines[-1]:
                            lines = lines[:-1]
                        
                        clean_lines = []
                        for l in lines:
                            if ": " in l:
                                clean_lines.append(l.split(": ", 1)[1])
                            else:
                                clean_lines.append(l)
                                
                        files_to_recover[path] = "\n".join(clean_lines)

            # Check for write_to_file
            if entry.get("type") == "PLANNER_RESPONSE" and "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["name"] == "write_to_file":
                        path = call["args"].get("TargetFile")
                        if path in files_to_recover:
                            files_to_recover[path] = call["args"].get("CodeContent")
                            
        except Exception as e:
            pass

for path, content in files_to_recover.items():
    if content:
        print(f"Recovered {path} (length: {len(content)})")
        with open(path, 'w') as f:
            f.write(content)
    else:
        print(f"Failed to recover {path}")
