import re

with open('server/routes.ts', 'r') as f:
    content = f.read()

# 1. We need to add COUNTED_STATUSES import from constants.
import_stat = "import { COUNTED_STATUSES } from '../src/shared/constants';\n"
if "COUNTED_STATUSES" not in content:
    content = content.replace("import { Database } from './db';", "import { Database } from './db';\nimport { COUNTED_STATUSES } from '../src/shared/constants';\nimport { pool } from './config';")

# 2. Rewrite POST /registrations
# We will use regex to find the route and replace it
pattern_post_reg = re.compile(r"apiRouter\.post\('/registrations', async \(req: Request, res: Response\) => \{.*?\n\}\);\n", re.DOTALL)

new_post_reg = """apiRouter.post('/registrations', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data || !data.teamName || !data.category || !data.coachName || !data.coachPhone) {
      return res.status(400).json({
        error: 'Data tidak lengkap. Field wajib: teamName, category, coachName, coachPhone.',
      });
    }

    const categoryId = data.category;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Fallback generate code and ID
    const candidateCode = typeof data.regCode === 'string' ? data.regCode.trim().toUpperCase() : '';
    const regCode = candidateCode || `REG-${Date.now().toString().slice(-6)}`;
    const candidateId = typeof data.id === 'string' ? data.id.trim() : '';
    const id = candidateId || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newReg = {
      ...data,
      id,
      regCode,
      registrationDate: data.registrationDate || formattedDate,
      status: data.status || 'PENDING_PAYMENT',
      paymentStatus: data.paymentStatus || 'UNPAID',
      lastUpdated: formattedDate,
    };

    let attempt = 0;
    while (attempt < 3) {
      const conn = await pool.getConnection();
      try {
        await conn.query("SET SESSION innodb_lock_wait_timeout = 5");
        await conn.query("BEGIN PESSIMISTIC");
        
        // Cek Kuota & Kurangi Slot
        const [resUpdate]: any = await conn.execute(
          `UPDATE categories SET registered_teams_count = registered_teams_count + 1 WHERE id = ? AND registered_teams_count < max_teams`, 
          [categoryId]
        );
        
        if (resUpdate.affectedRows === 0) {
          await conn.rollback(); 
          return res.status(409).json({ error: 'QUOTA_FULL', message: 'Mohon maaf, pendaftaran ditolak karena kuota untuk kategori ini telah terisi penuh.' });
        }
        
        // Simpan Data
        await conn.execute(
          `INSERT INTO registrations (
            id, reg_code, category_id, team_name, team_logo, institution_name,
            coach_name, coach_phone, coach_email, player_count, official_count,
            registration_date, status, payment_status, payment_amount,
            rejection_reason, admin_notes, documents_json, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newReg.id, newReg.regCode, newReg.category, newReg.teamName, newReg.teamLogo || null, newReg.institutionName,
            newReg.coachName, newReg.coachPhone, newReg.coachEmail || '', newReg.playerCount, newReg.officialCount,
            newReg.registrationDate, newReg.status, newReg.paymentStatus, newReg.paymentAmount,
            newReg.rejectionReason || null, newReg.adminNotes || null, JSON.stringify(newReg.documents || {}), newReg.lastUpdated,
          ]
        );
        
        await conn.commit();
        break; // Sukses, keluar dari loop
      } catch (err: any) {
        await conn.rollback().catch(() => {});
        const errCode = err?.errno || err?.code;
        if ([9007, 8002, 1213, 1205].includes(Number(errCode)) || errCode === 'ER_LOCK_WAIT_TIMEOUT') {
          attempt++;
          if (attempt >= 3) {
            return res.status(503).json({ error: 'BUSY_RETRY', message: 'Sistem sedang sibuk. Silakan coba lagi.' });
          }
          await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
        } else {
          throw err;
        }
      } finally {
        conn.release();
      }
    }

    res.status(201).json(newReg);
  } catch (err: any) {
    console.error('[API] Error in POST /api/registrations:', err);
    res.status(500).json({ error: err?.message || 'Gagal menyimpan pendaftaran' });
  }
});
"""

content = pattern_post_reg.sub(new_post_reg, content)

with open('server/routes.ts', 'w') as f:
    f.write(content)
