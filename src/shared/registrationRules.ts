export function isSuratKeteranganRequired(categoryIdOrName: string): boolean {
  if (!categoryIdOrName) return true;
  // If the category is UMUM, surat keterangan is optional
  const normalized = categoryIdOrName.trim().toUpperCase();
  if (normalized === 'UMUM') {
    return false;
  }
  return true;
}
