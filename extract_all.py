import json

files_to_recover = {
    "/Users/azizekinci/Projects/HuzurApp/src/screens/QuranPageScreen.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/screens/MushafPageScreen.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/screens/SurahDetailScreen.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/screens/QuranScreen.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/components/ListItem.js": None,
    "/Users/azizekinci/Projects/HuzurApp/App.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/theme/colors.js": None,
    "/Users/azizekinci/Projects/HuzurApp/src/theme/typography.js": None,
}

# We want the content as it was before step ~970.
# The transcript has "write_to_file" or "view_file" or "multi_replace_file_content".
# Actually, the easiest way to get the exact state is to parse the transcript up to step 970
# and reconstruct the files by applying the replacements, OR just find the last time it was fully outputted.
# Wait, applying replacements is hard. Let's just find the last time we read or wrote the ENTIRE file.
# A "view_file" without start/end lines gives the entire file. "write_to_file" gives the entire file.

with open('/Users/azizekinci/.gemini/antigravity/brain/7c547be7-9507-4667-ae7a-c4de580ef5b4/.system_generated/logs/transcript_full.jsonl', 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            step = entry.get("step_index", 0)
            if step > 971:
                continue
                
            # Check for view_file response
            if entry.get("type") == "TOOL_RESPONSE" and "view_file" in entry.get("content", ""):
                # This is tricky because content is just a string.
                content = entry.get("content", "")
                if "File Path: `" in content:
                    path = content.split("File Path: `file://")[1].split("`")[0]
                    if path in files_to_recover and "Showing lines" not in content.split("\n")[5]:
                        # It's a full file view!
                        # The lines have "<line_number>: " prefix.
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
