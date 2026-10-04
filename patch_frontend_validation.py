import re

with open('src/components/RegistrationForm.tsx', 'r') as f:
    content = f.read()

import_stat = "import { isSuratKeteranganRequired } from '../shared/registrationRules';\n"
if "isSuratKeteranganRequired" not in content:
    content = content.replace("import { RegistrationItem, TournamentCategory } from '../types';", "import { RegistrationItem, TournamentCategory } from '../types';\n" + import_stat)

# Find where it checks `if (!isUmum && !docs.suratKeterangan)`
pattern = re.compile(r"if \(\!isUmum && \!docs\.suratKeterangan\) \{")
new_code = """if (isSuratKeteranganRequired(category) && !docs.suratKeterangan) {"""
content = pattern.sub(new_code, content)

# Now, we specifically target the 1st document section `1. SURAT KETERANGAN`
pattern2 = re.compile(r"(Surat Keterangan Kepala Desa\/Lurah \(PDF\)\s*\}?\s*)(<span className=\"text-red-500\">\*</span>)", re.DOTALL)

def repl(match):
    return match.group(1) + """{isSuratKeteranganRequired(category) && <span className="text-red-500">*</span>}"""

content = pattern2.sub(repl, content)

with open('src/components/RegistrationForm.tsx', 'w') as f:
    f.write(content)
