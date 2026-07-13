import re

with open('src/theme/typography.js', 'r') as f:
    code = f.result = f.read()

# Add color: Colors.textPrimary to standard typography
for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'body', 'caption', 'button', 'label']:
    code = re.sub(rf"(\s+{tag}:\s*{{[^}}]*)(?=\n\s+}})", r"\1,\n    color: Colors.textPrimary", code)

# Add color: Colors.textArabic to arabic typography
for tag in ['arabicLarge', 'arabicMedium', 'arabicSmall']:
    code = re.sub(rf"(\s+{tag}:\s*{{[^}}]*)(?=\n\s+}})", r"\1,\n    color: Colors.textArabic", code)

with open('src/theme/typography.js', 'w') as f:
    f.write(code)

