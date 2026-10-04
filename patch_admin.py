import re

with open('src/components/admin/AdminDashboard.tsx', 'r') as f:
    content = f.read()

import_stat = "import { isSuratKeteranganRequired } from '../../shared/registrationRules';\n"
if "isSuratKeteranganRequired" not in content:
    content = content.replace("import { CheckCircle2,", import_stat + "import { CheckCircle2,")

pattern = re.compile(r"!\(item\.category === 'UMUM' && key === 'suratKeterangan'\)")
content = pattern.sub("!( !isSuratKeteranganRequired(item.category) && key === 'suratKeterangan' )", content)

pattern2 = re.compile(r"!\(inspectDocsItem\.category === 'UMUM' && key === 'suratKeterangan'\)")
content = pattern2.sub("!( !isSuratKeteranganRequired(inspectDocsItem.category) && key === 'suratKeterangan' )", content)

# Check if there is an export logic handling it
# Let's search for "UMUM" around "suratKeterangan"
# Actually, wait, the user asked to display "-" or "Tidak wajib"
# Let's see how export works.

with open('src/components/admin/AdminDashboard.tsx', 'w') as f:
    f.write(content)
