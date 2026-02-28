require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/symptom-entries', require('./routes/symptomEntries'));
app.use('/api/expert-questions', require('./routes/expertQuestions'));
app.use('/api/blood-tests', require('./routes/bloodTests'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── Admin Panel (HTML) ────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Admin Paneli — Uzman Onay Ekranı</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f0f4f8; color: #1e293b; min-height: 100vh; }
  header { background: #1d4ed8; color: #fff; padding: 18px 32px; display: flex; align-items: center; gap: 12px; }
  header h1 { font-size: 18px; font-weight: 700; }
  .badge { background: #fbbf24; color: #78350f; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; }
  main { max-width: 900px; margin: 32px auto; padding: 0 16px; }
  #loginCard { background: #fff; border-radius: 16px; padding: 36px; max-width: 400px; margin: 60px auto; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  #loginCard h2 { font-size: 20px; font-weight: 700; margin-bottom: 24px; color: #1e293b; }
  label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; margin-top: 14px; }
  input[type=password] { width: 100%; padding: 12px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 15px; outline: none; }
  input[type=password]:focus { border-color: #1d4ed8; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 11px 22px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity .15s; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-primary { background: #1d4ed8; color: #fff; }
  .btn-success { background: #16a34a; color: #fff; }
  .btn-danger  { background: #dc2626; color: #fff; }
  .btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 8px; }
  #loginBtn { width: 100%; margin-top: 20px; }
  #error { color: #dc2626; font-size: 13px; margin-top: 10px; min-height: 18px; }
  #panel { display: none; }
  .section-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .count-badge { background: #eff6ff; color: #1d4ed8; font-size: 13px; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; padding: 12px 16px; text-align: left; }
  td { padding: 14px 16px; font-size: 14px; border-top: 1px solid #f1f5f9; vertical-align: middle; }
  tr:hover td { background: #f8fafc; }
  .status-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-pending  { background: #fef9c3; color: #854d0e; }
  .status-active   { background: #dcfce7; color: #166534; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .actions { display: flex; gap: 8px; }
  #empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 15px; display: none; }
  #loading { text-align: center; padding: 40px; color: #94a3b8; }
</style>
</head>
<body>
<header>
  <h1>🏥 Admin Paneli</h1>
  <span class="badge">Uzman Onay Ekranı</span>
</header>

<!-- Login -->
<div id="loginCard">
  <h2>Admin Girişi</h2>
  <label for="secret">Admin Şifresi</label>
  <input type="password" id="secret" placeholder="••••••••" />
  <div id="error"></div>
  <button class="btn btn-primary" id="loginBtn" onclick="adminLogin()">Giriş Yap</button>
</div>

<!-- Panel -->
<main id="panel">
  <div class="section-title">
    Uzman Başvuruları
    <span class="count-badge" id="countBadge">—</span>
  </div>
  <div id="loading">Yükleniyor...</div>
  <div id="empty">Henüz doktor kaydı yok.</div>
  <table id="doctorTable" style="display:none">
    <thead>
      <tr>
        <th>Ad Soyad</th>
        <th>E-posta</th>
        <th>Uzmanlık</th>
        <th>Hastane</th>
        <th>Durum</th>
        <th>Kayıt Tarihi</th>
        <th>İşlem</th>
      </tr>
    </thead>
    <tbody id="doctorList"></tbody>
  </table>
</main>

<script>
let adminToken = '';

async function adminLogin() {
  const secret = document.getElementById('secret').value.trim();
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('error');
  err.textContent = '';
  if (!secret) { err.textContent = 'Şifre boş olamaz.'; return; }
  btn.disabled = true;
  try {
    const r = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret })
    });
    const data = await r.json();
    if (!r.ok) { err.textContent = data.error || 'Hatalı şifre.'; return; }
    adminToken = data.token;
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('panel').style.display = 'block';
    loadDoctors();
  } catch(e) {
    err.textContent = 'Sunucuya bağlanılamadı.';
  } finally {
    btn.disabled = false;
  }
}

async function loadDoctors() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('doctorTable').style.display = 'none';
  document.getElementById('empty').style.display = 'none';
  const r = await fetch('/api/admin/doctors', { headers: { Authorization: 'Bearer ' + adminToken } });
  const doctors = await r.json();
  document.getElementById('loading').style.display = 'none';
  document.getElementById('countBadge').textContent = doctors.length;
  if (!doctors.length) { document.getElementById('empty').style.display = 'block'; return; }
  const tbody = document.getElementById('doctorList');
  tbody.innerHTML = doctors.map(d => \`
    <tr id="row-\${d._id}">
      <td><strong>\${esc(d.name)}</strong></td>
      <td>\${esc(d.email)}</td>
      <td>\${esc(d.specialty || '—')}</td>
      <td>\${esc(d.hospital  || '—')}</td>
      <td><span class="status-pill status-\${d.status}">\${statusLabel(d.status)}</span></td>
      <td>\${new Date(d.createdAt).toLocaleDateString('tr-TR')}</td>
      <td class="actions">
        \${d.status !== 'active'   ? \`<button class="btn btn-success btn-sm" onclick="action('\${d._id}','approve')">✓ Onayla</button>\` : ''}
        \${d.status !== 'rejected' ? \`<button class="btn btn-danger  btn-sm" onclick="action('\${d._id}','reject')">✗ Reddet</button>\` : ''}
      </td>
    </tr>
  \`).join('');
  document.getElementById('doctorTable').style.display = 'table';
}

async function action(id, type) {
  const r = await fetch(\`/api/admin/doctors/\${id}/\${type}\`, {
    method: 'PATCH', headers: { Authorization: 'Bearer ' + adminToken }
  });
  if (r.ok) loadDoctors();
  else alert('İşlem başarısız.');
}

function statusLabel(s) {
  return s === 'pending' ? '⏳ Onay Bekliyor' : s === 'active' ? '✅ Onaylı' : '❌ Reddedildi';
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.getElementById('secret').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
</script>
</body>
</html>`);
});

// ─── Seed initial experience data ─────────────────────────────────────────
async function seedExperiences() {
  const Experience = require('./models/Experience');
  const count = await Experience.countDocuments();
  if (count > 0) return;

  const seedData = [
    {
      title: 'Kemoterapi Sürecinde Güçlü Kalmak',
      summary: 'Kemoterapinin yan etkileriyle nasıl baş ettiğimi ve umudumu nasıl koruduğumu anlatıyorum.',
      content: 'Meme kanseri tanısı aldığımda dünyam başıma yıkıldı. Ancak doktorlarımın desteği ve ailemle birlikte bu süreci atlatmayı başardım.\n\nTedavi sürecinde en çok zorlandığım konu kemoterapi yan etkileri oldu. Özellikle bulantı ve yorgunluk günlük hayatımı çok etkiledi. Ama zamanla bunlarla başa çıkmayı öğrendim; bol su içmek, hafif egzersizler ve nefes teknikleri gerçekten yardımcı oldu.\n\nSaçlarımın dökülmesi psikolojik olarak ağır gelse de bunu zamanla kabullenmeyi öğrendim. Aile bireylerim yanımda olduğunda her şey çok daha katlanılır hale geldi.\n\nDiğer hastalara tavsiyem: Asla umudunuzu kaybetmeyin. Her gün küçük adımlarla ilerleyin. Destek gruplarına katılın, yalnız olmadığınızı bilin.',
      author: 'Ayşe H.',
      isSeeded: true,
    },
    {
      title: 'Erken Tanı Hayat Kurtardı',
      summary: 'Rutin kontrol sırasında tespit edilen kitlenin erken evrede yakalanması tedavi sürecimi nasıl kolaylaştırdı.',
      content: 'Rutin kontrol sırasında tespit edilen küçük bir kitle hayatımı değiştirdi. Erken tanı sayesinde tedavi süreci çok daha kolay geçti.\n\nDüzenli mamografi kontrollerimin olması sayesinde kanser erken evrede yakalandı. Doktorumun dediği gibi, erken tanı gerçekten hayat kurtarıyor. Tanı anında çok korktum ama "erken evre" kelimelerini duyunca derin bir nefes alabildim.\n\nCerrahi sonrası radyoterapi aldım. Yan etkileri beklediğimden hafif oldu. En önemli şey tedaviye pozitif yaklaşmak ve doktorunuza güvenmek.\n\nTüm kadınlara düzenli kontrollerini yaptırmalarını şiddetle tavsiye ediyorum.',
      author: 'Fatma K.',
      isSeeded: true,
    },
    {
      title: 'Destek Gruplarının Gücü',
      summary: 'Hasta destek grubuna katılmanın tedavi sürecime manevi katkısını paylaşıyorum.',
      content: 'Tanı aldığımda kendimi çok yalnız hissediyordum. Hasta destek grubuna katılmak en doğru kararlarımdan biri oldu.\n\nGrupta benzer deneyimleri yaşayan kadınlarla tanışmak moral ve motivasyonumu artırdı. Birbirimizin tedavi süreçlerini paylaşmak hem bilgilendirici hem de duygusal olarak rahatlatıcı oldu.\n\nPsikolojik destek almak da çok önemli. Profesyonel yardım almaktan çekinmeyin. Ruh sağlığınız fiziksel iyileşmenizi doğrudan etkiler.\n\nBugün hem fiziksel hem ruhsal olarak çok daha güçlüyüm.',
      author: 'Zeynep M.',
      isSeeded: true,
    },
  ];

  await Experience.insertMany(seedData);
  console.log('✅ Seed: Hasta deneyimleri veritabanına eklendi.');
}

// ─── Connect & Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Atlas bağlantısı başarılı');
    await seedExperiences();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend sunucu: http://localhost:${PORT}`);
      console.log(`🔧 Admin paneli: http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });
