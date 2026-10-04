import re

with open('server/routes.ts', 'r') as f:
    content = f.read()

pattern = re.compile(r"apiRouter\.delete\('/registrations/:id', async \(req: Request, res: Response\) => \{.*?\n\}\);\n", re.DOTALL)

new_delete = """apiRouter.delete('/registrations/:id', async (req: Request, res: Response) => {
  try {
    const regId = req.params.id;
    // We need to find the registration first to get its category_id and status
    const registrations = await Database.getRegistrations();
    const reg = registrations.find(r => r.id === regId);
    
    if (!reg) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.query("BEGIN PESSIMISTIC");
      // Hanya kurangi kuota jika status pendaftar masuk dalam daftar yang dihitung
      if (COUNTED_STATUSES.includes(reg.status)) {
        await conn.query(
          `UPDATE categories SET registered_teams_count = GREATEST(0, registered_teams_count - 1) WHERE id = ?`,
          [reg.category] // The property is reg.category in RegistrationItem type
        );
      }
      
      await conn.query(`DELETE FROM registrations WHERE id = ?`, [regId]);
      await conn.commit();
      
      // Also invoke memStore cleanup via db.ts if needed, but since we are modifying directly,
      // Database.deleteRegistration should be updated or we can just call it (but it might delete again which is a no-op).
      // Actually Database.deleteRegistration handles memory store deletion.
      await Database.deleteRegistration(regId).catch(() => {});
      
    } catch (e) {
      await conn.rollback().catch(() => {});
      throw e;
    } finally {
      conn.release();
    }
    
    res.json({ success: true, id: regId });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});
"""

content = pattern.sub(new_delete, content)

with open('server/routes.ts', 'w') as f:
    f.write(content)
