import re

with open('src/context/TournamentContext.tsx', 'r') as f:
    content = f.read()

import_stat = "import { clearPdfCache } from '../hooks/usePdfLoader';\n"
if "clearPdfCache" not in content:
    content = content.replace("import { Database }", import_stat + "import { Database }")

pattern = re.compile(r"const logoutAdmin = \(\) => \{\n    setCurrentAdmin\(null\);\n    if \(typeof window !== 'undefined'\) \{\n      localStorage\.removeItem\('wabupcup_current_admin'\);\n    \}\n  \};")
new_code = """const logoutAdmin = () => {
    setCurrentAdmin(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wabupcup_current_admin');
    }
    clearPdfCache().catch(() => {});
  };"""

content = pattern.sub(new_code, content)

with open('src/context/TournamentContext.tsx', 'w') as f:
    f.write(content)
