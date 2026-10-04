import re
import glob

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace <img with <img loading="lazy" if it doesn't already have loading="lazy"
    # Need to be careful not to add it twice
    pattern = re.compile(r"<img(?!\s+loading=)")
    new_content = pattern.sub(r'<img loading="lazy"', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)

for filepath in glob.glob('src/**/*.tsx', recursive=True):
    patch_file(filepath)

