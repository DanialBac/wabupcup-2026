import re

with open('server/routes.ts', 'r') as f:
    content = f.read()

import_stat = "import { isSuratKeteranganRequired } from '../src/shared/registrationRules';\n"
if "isSuratKeteranganRequired" not in content:
    content = content.replace("import { COUNTED_STATUSES } from '../src/shared/constants';", "import { COUNTED_STATUSES } from '../src/shared/constants';\n" + import_stat)

pattern = re.compile(r"    const categoryId = data\.category;")
new_code = """    const categoryId = data.category;
    
    // Server-side validation for Surat Keterangan
    if (isSuratKeteranganRequired(categoryId)) {
      if (!data.documents || !data.documents.suratKeterangan) {
        return res.status(400).json({ error: 'Surat Keterangan wajib diunggah untuk kategori ini.' });
      }
    }"""

content = pattern.sub(new_code, content)

with open('server/routes.ts', 'w') as f:
    f.write(content)
