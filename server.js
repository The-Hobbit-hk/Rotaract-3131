const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database Configuration
const isPostgres = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const isVercel = !!process.env.VERCEL;
let db; 
let pool; 

if (isPostgres) {
    console.log('Using PostgreSQL Database (Cloud)');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let isInitialized = false;

// Global Error Handler for detailed diagnostics
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: err.message,
        stack: isVercel ? 'Hidden' : err.stack 
    });
});

if (!isPostgres && !isVercel) {
    try {
        const sqlite3 = require('sqlite3');
        console.log('Using SQLite Database (Local)');
        db = new sqlite3.Database('./database.sqlite', (err) => {
            if (err) console.error('SQLite connection error:', err.message);
            else {
                db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
                db.run(`CREATE TABLE IF NOT EXISTS registry (rotary_id TEXT PRIMARY KEY, name TEXT, club TEXT)`, () => seedRegistry());
            }
        });
    } catch (e) {
        console.warn('SQLite failed to load (expected on Vercel if DB not configured)');
    }
}

async function ensureDbReady() {
    if (isInitialized) return;
    if (!isPostgres) {
        if (isVercel) throw new Error("POSTGRES_URL is missing in Vercel settings.");
        isInitialized = true;
        return;
    }

    try {
        const client = await pool.connect();
        try {
            await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            await client.query(`CREATE TABLE IF NOT EXISTS registry (rotary_id TEXT PRIMARY KEY, name TEXT, club TEXT)`);
            const check = await client.query('SELECT COUNT(*) FROM registry');
            if (parseInt(check.rows[0].count) < 30) {
                await seedRegistry();
            }
            isInitialized = true;
        } finally {
            client.release();
        }
    } catch (err) {
        throw new Error(`Database connection failed. Verify your POSTGRES_URL. Error: ${err.message}`);
    }
}

app.get('/api/test-db', async (req, res) => {
    try {
        await ensureDbReady();
        res.json({ status: 'Connected', isPostgres, env: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        // High-speed multi-row insert for PostgreSQL
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

// Helper for DB calls
async function dbQuery(sql, params = []) {
    if (isPostgres) {
        let count = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++count}`);
        const res = await pool.query(pgSql, params);
        return { rows: res.rows, row: res.rows[0] };
    } else {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows, row: rows[0] });
            });
        });
    }
}

async function dbRun(sql, params = []) {
    if (isPostgres) {
        let count = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++count}`);
        await pool.query(pgSql, params);
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
}

// API: Heartbeat
app.post('/api/heartbeat', async (req, res) => {
    await ensureDbReady();
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    try {
        if (isPostgres) {
            await pool.query('INSERT INTO users (id, last_seen) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_seen = EXCLUDED.last_seen', [userId]);
        } else {
            await dbRun('INSERT INTO users (id, last_seen) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen', [userId]);
        }
        res.json({ message: 'Heartbeat received' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API: Save User Data
app.post('/api/save', async (req, res) => {
    await ensureDbReady();
    const { userId, data } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    const jsonData = JSON.stringify(data);
    try {
        if (isPostgres) {
            await pool.query('INSERT INTO users (id, data, last_seen) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data, last_seen = EXCLUDED.last_seen', [userId, jsonData]);
        } else {
            await dbRun('INSERT INTO users (id, data, last_seen) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, last_seen = excluded.last_seen', [userId, jsonData]);
        }
        res.json({ message: 'Progress saved successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API: Load User Data
app.get('/api/load/:userId', async (req, res) => {
    await ensureDbReady();
    const userId = req.params.userId;
    try {
        // Track activity
        if (isPostgres) await pool.query('INSERT INTO users (id, last_seen) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_seen = EXCLUDED.last_seen', [userId]);
        else await dbRun('INSERT INTO users (id, last_seen) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen', [userId]);

        const user = await dbQuery('SELECT data FROM users WHERE id = ?', [userId]);
        
        if (user.row && user.row.data) {
            const parsedData = JSON.parse(user.row.data);
            if (Object.keys(parsedData).length > 2) {
                return res.json({ data: parsedData });
            }
        }

        const reg = await dbQuery('SELECT name, club FROM registry WHERE rotary_id = ?', [userId]);
        if (reg.row) {
            return res.json({ 
                data: { prof_name: reg.row.name, prof_club: reg.row.club }, 
                prefilled: true 
            });
        }
        
        res.json({ data: {} });
    } catch (err) { 
        console.error('API Load Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
});

// API: Admin Get All Data
app.get('/api/admin/data', async (req, res) => {
    await ensureDbReady();
    try {
        const { rows } = await dbQuery('SELECT id, data, last_seen FROM users');
        const parsedRows = rows.map(r => ({
            id: r.id,
            data: r.data ? JSON.parse(r.data) : {},
            last_seen: r.last_seen
        }));
        res.json({ users: parsedRows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Diagnostic Endpoint (Hidden)
app.get('/api/debug/registry', async (req, res) => {
    await ensureDbReady();
    try {
        const check = await dbQuery('SELECT COUNT(*) as count FROM registry');
        const sample = await dbQuery('SELECT * FROM registry LIMIT 5');
        res.json({ 
            count: check.row ? check.row.count : 0,
            isPostgres: isPostgres,
            sample: sample.rows,
            isInitialized: isInitialized,
            postgresUrlPrefix: (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").substring(0, 15)
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
