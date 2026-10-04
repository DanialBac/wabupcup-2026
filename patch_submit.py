import re

with open('src/context/TournamentContext.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"// Optimistically register in state and IndexedDB\s+setRegistrations\(prev => \[currentReg, \.\.\.prev\.filter\(r => r\.id !== currentReg\.id\)\]\);\s+idbSaveRegistration\(currentReg\)\.catch\(\(\) => \{\}\);\s+// Send payload safely to backend API and await server response\s+try \{\s+const apiPayload = prepareRegistrationForApi\(currentReg\);\s+const serverSaved = await ApiService\.createRegistration\(apiPayload\);\s+if \(serverSaved && serverSaved\.id\) \{\s+currentReg = \{\s+\.\.\.currentReg,\s+\.\.\.serverSaved,\s+// Preserve local documents if server payload trimmed binaries\s+documents: currentReg\.documents \|\| serverSaved\.documents,\s+\};\s+// Reconcile state and storage with server-confirmed registration\s+setRegistrations\(prev => \[currentReg, \.\.\.prev\.filter\(r => r\.id !== currentReg\.id && r\.id !== generatedId\)\]\);\s+idbSaveRegistration\(currentReg\)\.catch\(\(\) => \{\}\);\s+\}\s+\} catch \(err\) \{\s+console\.warn\('Could not persist new registration to backend, using local copy:', err\);\s+\}\s+// Update category count\s+setCategories\(prev => \{\s+const next = prev\.map\(c =>\s+c\.id === data\.category\s+\? \{ \.\.\.c, registeredTeamsCount: c\.registeredTeamsCount \+ 1 \}\s+: c\s+\);\s+const updatedCat = next\.find\(c => c\.id === data\.category\);\s+if \(updatedCat\) \{\s+ApiService\.saveCategory\(updatedCat\)\.catch\(\(\) => \{\}\);\s+\}\s+return next;\s+\}\);\s+return currentReg;", re.DOTALL)

new_code = """// Optimistically register in state and IndexedDB
    setRegistrations(prev => [currentReg, ...prev.filter(r => r.id !== currentReg.id)]);
    idbSaveRegistration(currentReg).catch(() => {});

    // Optimistically update category count
    setCategories(prev => prev.map(c =>
      c.id === data.category
        ? { ...c, registeredTeamsCount: (c.registeredTeamsCount || 0) + 1 }
        : c
    ));

    // Send payload safely to backend API and await server response
    try {
      const apiPayload = prepareRegistrationForApi(currentReg);
      const serverSaved = await ApiService.createRegistration(apiPayload);
      if (serverSaved && serverSaved.id) {
        currentReg = {
          ...currentReg,
          ...serverSaved,
          // Preserve local documents if server payload trimmed binaries
          documents: currentReg.documents || serverSaved.documents,
        };
        // Reconcile state and storage with server-confirmed registration
        setRegistrations(prev => [currentReg, ...prev.filter(r => r.id !== currentReg.id && r.id !== generatedId)]);
        idbSaveRegistration(currentReg).catch(() => {});
        return currentReg;
      }
    } catch (err) {
      console.error('Registration failed, rolling back optimistic updates:', err);
      // Revert optimistic updates
      setRegistrations(prev => prev.filter(r => r.id !== currentReg.id));
      idbDeleteRegistration(currentReg.id).catch(() => {});
      setCategories(prev => prev.map(c =>
        c.id === data.category
          ? { ...c, registeredTeamsCount: Math.max(0, (c.registeredTeamsCount || 0) - 1) }
          : c
      ));
      throw err; // Propagate the error so the UI can catch it (409, 503)
    }

    return currentReg;"""

content = pattern.sub(new_code, content)

with open('src/context/TournamentContext.tsx', 'w') as f:
    f.write(content)
