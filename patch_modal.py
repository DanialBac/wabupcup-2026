import re

with open('src/components/admin/PdfViewerModal.tsx', 'r') as f:
    content = f.read()

# Import lazy and Suspense
if "import React," not in content and "import React" not in content:
    content = "import React, { Suspense } from 'react';\n" + content
elif "import React" in content:
    content = content.replace("import React, { useState", "import React, { useState, Suspense")

if "VirtualizedPDFViewer" not in content:
    content = content.replace("import { CheckCircle,", "const VirtualizedPDFViewer = React.lazy(() => import('./VirtualizedPDFViewer'));\nimport { CheckCircle,")

# Replace iframe with VirtualizedPDFViewer
pattern = re.compile(r"<iframe\s+src=\{`\$\{effectiveSource\}#toolbar=1&navpanes=0`\}\s+className=\"w-full h-full border-0 rounded-xl bg-white\"\s+title=\{`\$\{documentTitle\} - \$\{teamName\}`\}\s+/>")
replacement = """<Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-red-500" /><p className="text-sm mt-3 text-slate-400">Menyiapkan Viewer...</p></div>}>
                <VirtualizedPDFViewer url={effectiveSource} fileId={effectiveSource.split('?')[0] || effectiveSource} />
              </Suspense>"""

content = pattern.sub(replacement, content)

with open('src/components/admin/PdfViewerModal.tsx', 'w') as f:
    f.write(content)
