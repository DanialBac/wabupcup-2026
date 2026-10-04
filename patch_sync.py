import re

with open('server/routes.ts', 'r') as f:
    content = f.read()

pattern = re.compile(r"apiRouter\.post\('/categories/sync-counts', async \(req: Request, res: Response\) => \{.*?\n\}\);\n", re.DOTALL)

new_sync = """apiRouter.post('/categories/sync-counts', async (req: Request, res: Response) => {
  try {
    const categories = await Database.getCategories();
    
    // Process sync with connection limit in mind (e.g., using p-limit or just Promise.all)
    // To respect connectionLimit, we can process in batches or all together if connectionLimit >= categories.length.
    // For safety, process 3 at a time.
    const runInBatches = async (items: any[], batchSize: number) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(async (cat) => {
          const conn = await pool.getConnection();
          try {
            await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
            await conn.query("BEGIN PESSIMISTIC");
            await conn.query("SELECT id FROM categories WHERE id = ? FOR UPDATE", [cat.id]);
            
            const [rows]: any = await conn.query(
              `SELECT COUNT(*) AS n FROM registrations WHERE category_id = ? AND status IN (?)`, 
              [cat.id, COUNTED_STATUSES]
            );
            const count = rows[0]?.n || 0;
            
            await conn.query("UPDATE categories SET registered_teams_count = ? WHERE id = ?", [count, cat.id]);
            await conn.commit();
          } catch (e) {
            await conn.rollback().catch(() => {});
            console.error(`Failed to sync count for category ${cat.id}`, e);
          } finally {
            conn.release();
          }
        }));
      }
    };
    
    await runInBatches(categories, 3);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});
"""

content = pattern.sub(new_sync, content)

with open('server/routes.ts', 'w') as f:
    f.write(content)
