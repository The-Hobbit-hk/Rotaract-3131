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
                    db.run(`CREATE TABLE IF NOT EXISTS registry (rotary_id TEXT PRIMARY KEY, name TEXT, club TEXT)`, async () => {
                        await seedRegistry();
                        isInitialized = true;
                        resolve();
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
        await client.query(`CREATE TABLE IF NOT EXISTS registry (rotary_id TEXT PRIMARY KEY, name TEXT, club TEXT)`);
        
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
        ["Rtr Prajwal Rajendra Bande", "Rotaract Club of Daund College", "11093273"],
        ["Shreeraj Nilkanth", "Rotaract Club of Panvel Industrial Town", "12000502"],
        ["Sarthak Manish Ambhore", "Rotaract Club of DY Patil College of Engineering", "12186196"],
        ["Rtr.Jayesh Chavan", "Rotaract Club of Pune City Fortune", "12224980"],
        ["Aruna Suresh", "Rotaract Club of Viman Nagar", "12170441"],
        ["prem Bansode", "Rotaract Club of Daund College", "10767145"],
        ["Rtr. Shrushti Shirore", "Rotaract Club of Pune Sinhagad Road", "12223932"],
        ["Pranav Gandhi", "Rotaract Club of Bibwewadi Pune", "12224094"],
        ["Rtr. Rajas", "Rotaract Club of Pune City Fortune", "11303190"],
        ["Chinmayee Anant Bartakke", "Rotaract Club of Viman Nagar", "12170444"],
        ["Ashi Agarwal", "Rotaract Club of ROAR NIBM", "11763775"],
        ["PHF. Rtr. Aslam Dhanani", "Rotaract Club of Aundh", "12135651"],
        ["Omkar P", "Rotaract Club of Pune City Fortune", "11891333"],
        ["Rtr. Pratham Pokharkar", "Rotaract Club of Pune Aurora", "11815224"],
        ["Rtr. Pranav Pisal", "Rotaract Club of Genba Sopanrao Moze College of Engineering", "12159320"],
        ["Prerna Bhilare", "Rotaract Club of Sinhgad College of Pharmacy", "12022291"],
        ["Vageesh Baheti", "Rotaract Club of Pune Mideast", "11835327"],
        ["Vaishnavi Kedari", "Rotaract Club of Symbiosis Skills and Professional University", "12384797"],
        ["Vedant Chirmade", "Rotaract Club of Genba Sopanrao Moze College of Engineering", "12159318"],
        ["Rtr. Vedant Chaudhari", "Rotaract Club of Genba Sopanrao Moze College of Engineering", "12159316"],
        ["Rtr. Salvin padvi", "Rotaract Club of Rajarshi Shahu College of Engineering- Tathawade", "12069414"],
        ["Shreyas Pathak", "Rotaract Club of Pune Mideast", "11007467"],
        ["Shrawani Shendkar", "Rotaract Club of Genba Sopanrao Moze College of Engineering", "12178897"],
        ["Rohit Kumbhar", "Rotaract Club of Bavdhan Pioneers", "10964797"],
        ["Abhishek Sachchidanand Dixit", "Rotaract Club of Vibrants", "12401193"],
        ["Rtr. Hamid Abdul Shaikh", "Rotaract Club of Aundh Smartcity", "10549416"],
        ["Sanjana Pawar", "Rotaract Club of Vibrants", "11641713"],
        ["Rtr Digvijay Lad", "Rotaract Club of Pune City Fortune", "11751959"],
        ["Rtr. Aniket Atul Sardar", "Rotaract Club of Khopoli", "12349119"],
        ["Rtr.Aditya Verma", "Rotaract Club of Symbiosis Skills and Professional University", "11595227"],
        ["PHF RTR ADV SATTYAJEET KARALE PATIL", "Rotaract Club of Pune Samrajya", "10286501"],
        ["PHF. Rtr. Dr. Karishma Awari", "Rotaract Club of Pune Shaniwarwada", "9843452"],
        ["Rtr. Atharvh Devdhar", "Rotaract Club of Pune Shaniwarwada", "11421551"],
        ["Rtr. Dr. Aishwarya Patil", "Rotaract Club of Pune Shaniwarwada", "11492286"],
        ["PHF Rtr Harshvardhan Kale", "Rotaract Club of Bavdhan Pioneers", "10843281"],
        ["Rtr. Suraj Surkutla", "Rotaract Club of Pune Vishwam", "10786128"],
        ["Rtr.Samrudhi Khade", "Rotaract Club of Pune Zenith", "11598405"],
        ["Rtr.Janhavi Yeole", "Rotaract Club of Pune Zenith", "11889397"],
        ["Rtr. Rohan Puri", "Rotaract Club of Khopoli", "11254610"],
        ["Disha Daga", "Rotaract Club of Bibwewadi Pune", "11170853"]
    ];

    if (isPostgres) {
        const values = [];
        const placeholders = [];
        members.forEach((m, i) => {
            values.push(...m);
            placeholders.push(`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`);
        });
        const sql = `INSERT INTO registry (name, club, rotary_id) VALUES ${placeholders.join(',')} ON CONFLICT (rotary_id) DO NOTHING`;
        await pool.query(sql, values);
    } else {
        return new Promise((resolve) => {
            const stmt = db.prepare(`INSERT OR IGNORE INTO registry (name, club, rotary_id) VALUES (?, ?, ?)`);
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
            const resReg = await pool.query('SELECT name, club FROM registry WHERE rotary_id = $1', [userId]);
            regData = resReg.rows[0];
        } else {
            regData = await new Promise((resolve, reject) => {
                db.get('SELECT name, club FROM registry WHERE rotary_id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
            });
        }

        if (regData) {
            return res.json({ data: { prof_name: regData.name, prof_club: regData.club }, prefilled: true });
        }
        res.json({ data: {} });
    } catch (e) { next(e); }
});

app.get('/api/admin/data', async (req, res, next) => {
    try {
        await ensureDbReady();
        let rows;
        if (isPostgres) {
            const resData = await pool.query('SELECT id, data, last_seen FROM users');
            rows = resData.rows;
        } else {
            rows = await new Promise((resolve, reject) => {
                db.all('SELECT id, data, last_seen FROM users', (err, rows) => err ? reject(err) : resolve(rows));
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

// Final Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
});

app.listen(port, () => console.log(`Server live on ${port}`));
