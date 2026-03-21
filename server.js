const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database Configuration Logic
const isPostgres = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const isVercel = !!process.env.VERCEL;
let db; // SQLite instance
let pool; // Postgres pool
let isInitialized = false;

// Initialize Postgres if available
if (isPostgres) {
    const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    console.log('Postgres Detected. Initializing pool...');
    pool = new Pool({
        connectionString: connStr.includes('?') ? connStr.split('?')[0] : connStr,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Function to ensure DB tables exist
async function ensureDbReady() {
    if (isInitialized) return;

    if (!isPostgres) {
        if (isVercel) throw new Error("POSTGRES_URL is missing. SQLite is not supported on Vercel.");
        
        // Local SQLite Initialization
        return new Promise((resolve, reject) => {
            try {
                const sqlite3 = require('sqlite3');
                db = new sqlite3.Database('./database.sqlite', async (err) => {
                    if (err) return reject(err);
                    db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
                    db.run(`CREATE TABLE IF NOT EXISTS registry (rotary_id TEXT PRIMARY KEY, name TEXT, club TEXT)`, () => {
                        db.all("PRAGMA table_info(registry)", (err, rows) => {
                            const hasPosition = rows && rows.some(r => r.name === 'position');
                            if (!hasPosition) {
                                db.run("ALTER TABLE registry ADD COLUMN position TEXT", async () => {
                                    await seedRegistry();
                                    isInitialized = true;
                                    resolve();
                                });
                            } else {
                                seedRegistry().then(() => {
                                    isInitialized = true;
                                    resolve();
                                });
                            }
                        });
                    });
                });
            } catch (e) { reject(new Error("sqlite3 module not found")); }
        });
    }

    // Cloud Postgres Initialization
    let client;
    try {
        client = await pool.connect();
        await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await client.query(`CREATE TABLE IF NOT EXISTS registry (rotary_id TEXT PRIMARY KEY, name TEXT, club TEXT, position TEXT)`);
        
        // Check if position column exists in Postgres
        const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='registry' AND column_name='position'");
        if (colRes.rowCount === 0) {
            await client.query("ALTER TABLE registry ADD COLUMN position TEXT");
        }
        
        const countRes = await client.query('SELECT COUNT(*) FROM registry');
        if (parseInt(countRes.rows[0].count) < 30) {
            console.log('Cloud seeding required...');
            await seedRegistry();
        }
        isInitialized = true;
        console.log('Postgres ready.');
    } catch (err) {
        throw new Error(`Cloud DB Connect Fail: ${err.message}`);
    } finally {
        if (client) client.release();
    }
}

async function seedRegistry() {
    const members = [
        ["Rtr Prajwal Rajendra Bande", "11093273", "District Officer Interact Rotaract Relations"],
        ["Shreeraj Nilkanth", "12000502", "District team - Public relation"],
        ["Sarthak Manish Ambhore", "12186196", "District Officer No portfolio"],
        ["Rtr.Jayesh Chavan", "12224980", "District Club Service Director"],
        ["Aruna Suresh", "12170441", "Sergeant-at-Arms"],
        ["prem Bansode", "10767145", "DZR"],
        ["Rtr. Shrushti Shirore", "12223932", "Assistant Zonal Representative"],
        ["Pranav Gandhi", "12224094", "Co-DISD"],
        ["Rtr. Rajas", "11303190", "DZR"],
        ["Chinmayee Anant Bartakke", "12170444", "Diversity Equity Inclusion Representative"],
        ["Ashi Agarwal", "11763775", "District Coordinator Events"],
        ["PHF. Rtr. Aslam Dhanani", "12135651", "District Community Service Director"],
        ["Omkar P", "11891333", "Membership Director"],
        ["Rtr. Pratham Pokharkar", "11815224", "District Zonal Representative"],
        ["Rtr. Pranav Pisal", "12159320", "Ryla Chairperson"],
        ["Prerna Bhilare", "12022291", "AZR - Assistant Zonal Representative"],
        ["Vageesh Baheti", "11835327", "AZR"],
        ["Vaishnavi Kedari", "12384797", "Co Community Service Director"],
        ["Vedant Chirmade", "12159318", "DZR"],
        ["Rtr. Vedant Chaudhari", "12159316", "District Zonal Representative"],
        ["Rtr. Salvin padvi", "12069414", "District Public Relationship officer"],
        ["Shreyas Pathak", "11007467", "District Sergeant-at-Arms"],
        ["Shrawani Shendkar", "12178897", "District Public Image Director"],
        ["Rohit Kumbhar", "10964797", "AZR"],
        ["Abhishek Sachchidanand Dixit", "12401193", "District Editor"],
        ["Rtr. Hamid Abdul Shaikh", "10549416", "Event Secretary"],
        ["Sanjana Pawar", "11641713", "World Rotaract Week Chairperson"],
        ["Rtr Digvijay Lad", "11751959", "Trek Convenor"],
        ["Rtr. Aniket Atul Sardar", "12349119", "Zonal Representative- Zone 1"],
        ["Rtr.Aditya Verma", "11595227", "AZR"],
        ["PHF RTR ADV SATTYAJEET KARALE PATIL", "10286501", "District Legal Advisor"],
        ["PHF. Rtr. Dr. Karishma Awari", "9843452", "DRRE"],
        ["Rtr. Atharvh Devdhar", "11421551", "District Club Advisor"],
        ["Rtr. Dr. Aishwarya Patil", "11492286", "District Secretary- Reporting"],
        ["PHF Rtr Harshvardhan Kale", "10843281", "District General Secretary Elect"],
        ["Rtr. Suraj Surkutla", "10786128", "District Secretary - Administration"],
        ["Rtr.Samrudhi Khade", "11598405", "District Professionnel director"],
        ["Rtr.Janhavi Yeole", "11889397", "DPRO"],
        ["Rtr. Rohan Puri", "11254610", "Zonal Advisor - Zone 1"],
        ["Disha Daga", "11170853", "District Secretary - Protocols"],
        ["Rtr. Harshal Nikam", "12346183", "District Editor"],
        ["PHF Rtr. Sharvindu Jogdand", "11207152", "District Treasurer"],
        ["PHF Rtr. Bhushan Parkhi", "11990300", "District Zonal Representative"],
        ["Rtr. Talha Shaikh", "11221346", "Co-PAO"],
        ["Sumedh Gite", "10856109", "Azr"],
        ["Rtr. Dr. Ashlesha Deshpande", "11004224", "District Club Advisor"],
        ["Devsharan singh", "11982352", "District Website Admin Coordinator"],
        ["Rtr. Ishan Malawade", "11310222", "District Director - International Service"],
        ["Adhishree Thakar", "1075076075", "District RRRO"],
        ["Vedant Prashant Buge", "12344119", "District Director - Without Portfolio"],
        ["Rtr. Faizan Tamboli", "9732322", "District Director - Communications"],
        ["Gaurav Manish Golecha", "11965097", "District Officer – Professional Assistance"],
        ["Drishti Singh", "10288754", "District Learning Facilitator"]
    ];

    if (isPostgres) {
        const values = [];
        const placeholders = [];
        members.forEach((m, i) => {
            values.push(...m);
            placeholders.push(`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`);
        });
        const sql = `INSERT INTO registry (name, rotary_id, position) VALUES ${placeholders.join(',')} ON CONFLICT (rotary_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position`;
        await pool.query(sql, values);
    } else {
        return new Promise((resolve) => {
            const stmt = db.prepare(`INSERT INTO registry (name, rotary_id, position) VALUES (?, ?, ?) ON CONFLICT(rotary_id) DO UPDATE SET name = excluded.name, position = excluded.position`);
            members.forEach(m => stmt.run(m));
            stmt.finalize(() => resolve());
        });
    }
}

// Routes
app.get('/api/test', (req, res) => res.json({ status: 'Online', isVercel }));

app.get('/api/debug/registry', async (req, res, next) => {
    try {
        await ensureDbReady();
        const sql = 'SELECT COUNT(*) as count FROM registry';
        let result;
        if (isPostgres) {
            const resData = await pool.query(sql);
            result = { count: resData.rows[0].count };
        } else {
            result = await new Promise((resolve, reject) => {
                db.get(sql, (err, row) => err ? reject(err) : resolve(row));
            });
        }
        res.json({ ...result, isPostgres, isInitialized });
    } catch (e) { next(e); }
});

app.post('/api/save', async (req, res, next) => {
    try {
        await ensureDbReady();
        const { userId, data } = req.body;
        const jsonData = JSON.stringify(data);
        if (isPostgres) {
            await pool.query('INSERT INTO users (id, data, last_seen) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data, last_seen = EXCLUDED.last_seen', [userId, jsonData]);
        } else {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO users (id, data, last_seen) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, last_seen = excluded.last_seen', [userId, jsonData], (err) => err ? reject(err) : resolve());
            });
        }
        res.json({ message: 'Saved' });
    } catch (e) { next(e); }
});

app.get('/api/load/:userId', async (req, res, next) => {
    try {
        await ensureDbReady();
        const { userId } = req.params;
        let userData;
        
        if (isPostgres) {
            const resData = await pool.query('SELECT data FROM users WHERE id = $1', [userId]);
            userData = resData.rows[0];
        } else {
            userData = await new Promise((resolve, reject) => {
                db.get('SELECT data FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
            });
        }

        if (userData && userData.data) {
            const parsed = JSON.parse(userData.data);
            if (Object.keys(parsed).length > 2) return res.json({ data: parsed });
        }

        // Registry fallback
        let regData;
        if (isPostgres) {
            const resReg = await pool.query('SELECT name, club, position FROM registry WHERE rotary_id = $1', [userId]);
            regData = resReg.rows[0];
        } else {
            regData = await new Promise((resolve, reject) => {
                db.get('SELECT name, club, position FROM registry WHERE rotary_id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
            });
        }

        if (regData) {
            return res.json({ data: { prof_name: regData.name, prof_club: regData.club, prof_pos: regData.position }, prefilled: true });
        }
        res.json({ data: {} });
    } catch (e) { next(e); }
});

app.get('/api/admin/data', async (req, res, next) => {
    try {
        await ensureDbReady();
        let rows;
        if (isPostgres) {
            const resData = await pool.query('SELECT u.id, u.data, u.last_seen, r.name as reg_name, r.club as reg_club FROM users u LEFT JOIN registry r ON u.id = r.rotary_id');
            rows = resData.rows;
        } else {
            rows = await new Promise((resolve, reject) => {
                db.all('SELECT u.id, u.data, u.last_seen, r.name as reg_name, r.club as reg_club FROM users u LEFT JOIN registry r ON u.id = r.rotary_id', (err, rows) => err ? reject(err) : resolve(rows));
            });
        }
        res.json({ users: rows.map(r => ({ ...r, data: r.data ? JSON.parse(r.data) : {} })) });
    } catch (e) { next(e); }
});

app.post('/api/heartbeat', async (req, res, next) => {
    try {
        await ensureDbReady();
        const { userId } = req.body;
        if (isPostgres) {
            await pool.query('INSERT INTO users (id, last_seen) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_seen = EXCLUDED.last_seen', [userId]);
        } else {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO users (id, last_seen) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen', [userId], (err) => err ? reject(err) : resolve());
            });
        }
        res.json({ ok: true });
    } catch (e) { next(e); }
});

app.post('/api/activity/force', async (req, res, next) => {
    try {
        await ensureDbReady();
        const { userId, status } = req.body;
        const timestamp = (status === 'active') ? 'CURRENT_TIMESTAMP' : "'2000-01-01 00:00:00'";
        
        if (isPostgres) {
            await pool.query(`INSERT INTO users (id, last_seen) VALUES ($1, ${timestamp}) ON CONFLICT(id) DO UPDATE SET last_seen = ${timestamp}`, [userId]);
        } else {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO users (id, last_seen) VALUES (?, ${timestamp}) ON CONFLICT(id) DO UPDATE SET last_seen = ${timestamp}`, [userId], (err) => err ? reject(err) : resolve());
            });
        }
        res.json({ ok: true, status });
    } catch (e) { next(e); }
});

// Final Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
});

app.listen(port, () => console.log(`Server live on ${port}`));
