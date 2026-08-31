import { Router, Request, Response } from 'express';
import { Database, getMySqlStatus, runFullSchemaInit, initDatabaseConnection } from './db';
import { RegistrationItem, MatchItem, CategoryDetail, SponsorItem } from '../src/types';

export const apiRouter = Router();

// 1. Health & Database Status
apiRouter.get('/health', async (req: Request, res: Response) => {
  const status = getMySqlStatus();
  res.json({
    status: 'online',
    system: 'WabupCup 2026 Full-Stack Engine',
    timestamp: new Date().toISOString(),
    database: status,
  });
});

// 2. Database Init / Migration Trigger
apiRouter.post('/database/init', async (req: Request, res: Response) => {
  try {
    const result = await runFullSchemaInit();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database init failed' });
  }
});

// 3. Test & Reconnect Database
apiRouter.post('/database/reconnect', async (req: Request, res: Response) => {
  try {
    const connected = await initDatabaseConnection();
    const status = getMySqlStatus();
    res.json({
      success: connected,
      status,
      error: !connected ? (status.error || 'Tidak dapat terhubung ke MySQL server. Periksa konfigurasi .env') : undefined,
    });
  } catch (err: any) {
    const status = getMySqlStatus();
    res.json({
      success: false,
      error: err?.message || 'Gagal memeriksa koneksi database',
      status,
    });
  }
});

// 3b. Configure & Connect Database dynamically (TiDB Cloud / Custom MySQL)
apiRouter.post('/database/connect', async (req: Request, res: Response) => {
  try {
    const config = req.body || {};
    const connected = await initDatabaseConnection(config);
    const status = getMySqlStatus();
    if (connected) {
      res.json({
        success: true,
        message: 'Koneksi database MySQL/TiDB Cloud berhasil terhubung dan tabel telah tersinkronisasi!',
        status,
      });
    } else {
      res.json({
        success: false,
        error: status.error || 'Gagal terhubung ke MySQL dengan konfigurasi yang diberikan. Periksa kredensial/koneksi.',
        status,
      });
    }
  } catch (err: any) {
    res.json({
      success: false,
      error: err?.message || 'Terjadi kesalahan saat menghubungkan database',
      status: getMySqlStatus(),
    });
  }
});

// 4. Export Complete SQL Dump
apiRouter.get('/database/export-sql', async (req: Request, res: Response) => {
  try {
    const sqlDump = await Database.exportFullSqlDump();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="wabupcup_2026_backup.sql"');
    res.send(sqlDump);
  } catch (err: any) {
    res.status(500).send(`-- Error generating SQL dump: ${err?.message}`);
  }
});

// 5. Config
apiRouter.get('/config', async (req: Request, res: Response) => {
  const config = await Database.getConfig();
  res.json(config);
});

apiRouter.put('/config', async (req: Request, res: Response) => {
  try {
    const updated = await Database.updateConfig(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 6. Categories
apiRouter.get('/categories', async (req: Request, res: Response) => {
  const categories = await Database.getCategories();
  res.json(categories);
});

apiRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const saved = await Database.saveCategory(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const saved = await Database.saveCategory(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    await Database.deleteCategory(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 7. Registrations
apiRouter.get('/registrations', async (req: Request, res: Response) => {
  const list = await Database.getRegistrations();
  res.json(list);
});

apiRouter.post('/registrations', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Auto generate reg code if not present
    const existing = await Database.getRegistrations();
    const count = existing.filter(r => r.category === data.category).length + 1;
    const regCode = data.regCode || `WBC-${data.category}-${String(count).padStart(3, '0')}`;
    const id = data.id || `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newReg: RegistrationItem = {
      ...data,
      id,
      regCode,
      registrationDate: data.registrationDate || formattedDate,
      status: data.status || 'PENDING_PAYMENT',
      paymentStatus: data.paymentStatus || 'UNPAID',
      lastUpdated: formattedDate,
    };

    const saved = await Database.saveRegistration(newReg);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.put('/registrations/:id', async (req: Request, res: Response) => {
  try {
    const saved = await Database.saveRegistration(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.patch('/registrations/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;
    const list = await Database.getRegistrations();
    const item = list.find(r => r.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    const updated: RegistrationItem = {
      ...item,
      status,
      rejectionReason: reason !== undefined ? reason : item.rejectionReason,
      adminNotes: notes !== undefined ? notes : item.adminNotes,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    await Database.saveRegistration(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.patch('/registrations/:id/payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const list = await Database.getRegistrations();
    const item = list.find(r => r.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    const newStatus = paymentStatus === 'PAID' && item.status === 'PENDING_PAYMENT' ? 'APPROVED' : item.status;
    const updated: RegistrationItem = {
      ...item,
      paymentStatus,
      status: newStatus,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    await Database.saveRegistration(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/registrations/:id', async (req: Request, res: Response) => {
  try {
    await Database.deleteRegistration(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 8. Matches & Live Score
apiRouter.get('/matches', async (req: Request, res: Response) => {
  const matches = await Database.getMatches();
  res.json(matches);
});

apiRouter.post('/matches', async (req: Request, res: Response) => {
  try {
    const id = req.body.id || `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const saved = await Database.saveMatch({ ...req.body, id });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.put('/matches/:id', async (req: Request, res: Response) => {
  try {
    const saved = await Database.saveMatch(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/matches/:id', async (req: Request, res: Response) => {
  try {
    await Database.deleteMatch(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 9. Sponsors
apiRouter.get('/sponsors', async (req: Request, res: Response) => {
  const list = await Database.getSponsors();
  res.json(list);
});

apiRouter.post('/sponsors', async (req: Request, res: Response) => {
  try {
    const id = req.body.id || `sp-${Date.now()}`;
    const saved = await Database.saveSponsor({ ...req.body, id });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.put('/sponsors/:id', async (req: Request, res: Response) => {
  try {
    const saved = await Database.saveSponsor(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/sponsors/:id', async (req: Request, res: Response) => {
  try {
    await Database.deleteSponsor(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 10. Admin Users & Auth
apiRouter.get('/admins', async (req: Request, res: Response) => {
  try {
    const admins = await Database.getAdmins();
    res.json(admins);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/admins', async (req: Request, res: Response) => {
  try {
    const { username, fullName, role, email, phone, avatarColor, password } = req.body;
    if (!username || !fullName) {
      return res.status(400).json({ error: 'Username dan Nama Lengkap wajib diisi' });
    }
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');
    const newAdmin = {
      id: `adm-${Date.now()}`,
      username: cleanUsername,
      fullName: fullName.trim(),
      role: role || 'PANITIA',
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      avatarColor: avatarColor || 'bg-red-600',
      createdAt: new Date().toISOString().split('T')[0],
      password: password || 'admin123',
    };
    const saved = await Database.saveAdmin(newAdmin, password);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal menambahkan admin' });
  }
});

apiRouter.put('/admins/:id', async (req: Request, res: Response) => {
  try {
    const { username, fullName, role, email, phone, avatarColor, password } = req.body;
    const existingList = await Database.getAdmins();
    const target = existingList.find(a => a.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Admin tidak ditemukan' });
    }
    const updatedAdmin = {
      ...target,
      username: username ? username.toLowerCase().trim() : target.username,
      fullName: fullName !== undefined ? fullName.trim() : target.fullName,
      role: role || target.role,
      email: email !== undefined ? email.trim() : target.email,
      phone: phone !== undefined ? phone.trim() : target.phone,
      avatarColor: avatarColor || target.avatarColor,
      password: password || target.password,
    };
    const saved = await Database.saveAdmin(updatedAdmin, password);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal memperbarui admin' });
  }
});

apiRouter.delete('/admins/:id', async (req: Request, res: Response) => {
  try {
    const success = await Database.deleteAdmin(req.params.id);
    if (!success) {
      return res.status(400).json({ error: 'Akun Superadmin utama tidak dapat dihapus demi keamanan sistem.' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal menghapus admin' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const admins = await Database.getAdmins();
    const user = admins.find(a => a.username.toLowerCase() === (username || '').trim().toLowerCase());
    
    if (user) {
      // Check password match (supports custom password, demo passwords, or default admin123)
      const validPass =
        (user.password && user.password === password) ||
        password === 'admin123' ||
        password === 'panitia2026' ||
        password === 'admin' ||
        password === '123456';

      if (validPass) {
        return res.json({ success: true, user });
      }
    }
    res.status(401).json({ success: false, message: 'Username atau password salah' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal proses login' });
  }
});
