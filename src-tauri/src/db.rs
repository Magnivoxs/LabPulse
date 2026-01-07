use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::Manager;

// Database initialization and migrations
pub fn init_db(app_handle: &tauri::AppHandle) -> Result<Connection> {
    let app_dir = app_handle.path().app_data_dir()
        .expect("Failed to get app data directory");
    
    std::fs::create_dir_all(&app_dir)
        .expect("Failed to create app data directory");
    
    let db_path = app_dir.join("labpulse.db");
    let conn = Connection::open(db_path)?;
    
    // Run migrations
    run_migrations(&conn)?;
    
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<()> {
    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    // Create offices table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS offices (
            office_id INTEGER PRIMARY KEY,
            office_name TEXT NOT NULL,
            model TEXT NOT NULL CHECK(model IN ('PO', 'PLLC')),
            address TEXT,
            phone TEXT,
            managing_dentist TEXT,
            dfo TEXT,
            standardization_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    
    // Create staff table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS staff (
            staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            hire_date DATE,
            UNIQUE(office_id, name),
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create office_contacts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS office_contacts (
            contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create monthly_financials table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS monthly_financials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
            revenue REAL,
            lab_exp_no_outside REAL,
            lab_exp_with_outside REAL,
            outside_lab_spend REAL,
            teeth_supplies REAL,
            lab_supplies REAL,
            lab_hub REAL NOT NULL DEFAULT 0,
            lss_expense REAL NOT NULL DEFAULT 0,
            personnel_exp REAL,
            overtime_exp REAL,
            bonus_exp REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(office_id, year, month),
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create monthly_ops table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS monthly_ops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
            backlog_case_count INTEGER,
            overtime_value REAL,
            labor_model_value REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(office_id, year, month),
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create monthly_volume table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS monthly_volume (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
            backlog_in_lab INTEGER NOT NULL DEFAULT 0,
            backlog_in_clinic INTEGER NOT NULL DEFAULT 0,
            lab_setups INTEGER NOT NULL DEFAULT 0,
            lab_fixed_cases INTEGER NOT NULL DEFAULT 0,
            lab_over_denture INTEGER NOT NULL DEFAULT 0,
            lab_processes INTEGER NOT NULL DEFAULT 0,
            lab_finishes INTEGER NOT NULL DEFAULT 0,
            clinic_wax_tryin INTEGER NOT NULL DEFAULT 0,
            clinic_delivery INTEGER NOT NULL DEFAULT 0,
            clinic_outside_lab INTEGER NOT NULL DEFAULT 0,
            clinic_on_hold INTEGER NOT NULL DEFAULT 0,
            immediate_units INTEGER NOT NULL DEFAULT 0,
            economy_units INTEGER NOT NULL DEFAULT 0,
            economy_plus_units INTEGER NOT NULL DEFAULT 0,
            premium_units INTEGER NOT NULL DEFAULT 0,
            ultimate_units INTEGER NOT NULL DEFAULT 0,
            repair_units INTEGER NOT NULL DEFAULT 0,
            reline_units INTEGER NOT NULL DEFAULT 0,
            partial_units INTEGER NOT NULL DEFAULT 0,
            retry_units INTEGER NOT NULL DEFAULT 0,
            remake_units INTEGER NOT NULL DEFAULT 0,
            bite_block_units INTEGER NOT NULL DEFAULT 0,
            total_weekly_units INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(office_id, year, month),
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create weekly_volume table for detailed weekly tracking
    conn.execute(
        "CREATE TABLE IF NOT EXISTS weekly_volume (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            week_number INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 53),
            lab_setups INTEGER NOT NULL DEFAULT 0,
            lab_fixed_cases INTEGER NOT NULL DEFAULT 0,
            lab_over_denture INTEGER NOT NULL DEFAULT 0,
            lab_processes INTEGER NOT NULL DEFAULT 0,
            lab_finishes INTEGER NOT NULL DEFAULT 0,
            clinic_wax_tryin INTEGER NOT NULL DEFAULT 0,
            clinic_delivery INTEGER NOT NULL DEFAULT 0,
            clinic_outside_lab INTEGER NOT NULL DEFAULT 0,
            clinic_on_hold INTEGER NOT NULL DEFAULT 0,
            immediate_units INTEGER NOT NULL DEFAULT 0,
            economy_units INTEGER NOT NULL DEFAULT 0,
            economy_plus_units INTEGER NOT NULL DEFAULT 0,
            premium_units INTEGER NOT NULL DEFAULT 0,
            ultimate_units INTEGER NOT NULL DEFAULT 0,
            repair_units INTEGER NOT NULL DEFAULT 0,
            reline_units INTEGER NOT NULL DEFAULT 0,
            partial_units INTEGER NOT NULL DEFAULT 0,
            retry_units INTEGER NOT NULL DEFAULT 0,
            remake_units INTEGER NOT NULL DEFAULT 0,
            bite_block_units INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(office_id, year, week_number),
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create notes_actions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
            note_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(office_id, year, month),
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )",
        [],
    )?;
    
    // Create import_log table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS import_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            import_type TEXT NOT NULL,
            filename TEXT,
            rows_processed INTEGER,
            rows_inserted INTEGER,
            rows_updated INTEGER,
            warnings TEXT,
            imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    
    // Create alerts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT CHECK(severity IN ('warning', 'critical')),
            message TEXT NOT NULL,
            is_dismissed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_staff_office ON staff(office_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_contacts_office ON office_contacts(office_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_financials_office_date ON monthly_financials(office_id, year, month)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ops_office_date ON monthly_ops(office_id, year, month)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_volume_office_date ON monthly_volume(office_id, year, month)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_weekly_volume_office_date ON weekly_volume(office_id, year, week_number)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_office_date ON notes_actions(office_id, year, month)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_office_date ON alerts(office_id, year, month)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON alerts(is_dismissed)", [])?;
    
    // Migration: Add staffing tracking columns to monthly_ops table
    // Check if columns exist before adding (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
    let has_current_staff: bool = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('monthly_ops') WHERE name='current_staff'",
        [],
        |row| row.get::<_, i64>(0).map(|count| count > 0)
    ).unwrap_or(false);
    
    if !has_current_staff {
        conn.execute("ALTER TABLE monthly_ops ADD COLUMN current_staff REAL", [])?;
        conn.execute("ALTER TABLE monthly_ops ADD COLUMN required_staff REAL", [])?;
        conn.execute("ALTER TABLE monthly_ops ADD COLUMN staffing_trend REAL", [])?;
    }
    
    Ok(())
}

// Data structures
#[derive(Debug, Serialize, Deserialize)]
pub struct Office {
    pub office_id: i64,
    pub office_name: String,
    pub model: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub managing_dentist: Option<String>,
    pub dfo: Option<String>,
    pub standardization_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableCounts {
    pub offices: i64,
    pub staff: i64,
    pub contacts: i64,
    pub financials: i64,
    pub ops: i64,
    pub volume: i64,
    pub notes: i64,
    pub alerts: i64,
}

// DAL Functions
pub fn get_table_counts(conn: &Connection) -> Result<TableCounts> {
    let offices: i64 = conn.query_row("SELECT COUNT(*) FROM offices", [], |row| row.get(0))?;
    let staff: i64 = conn.query_row("SELECT COUNT(*) FROM staff", [], |row| row.get(0))?;
    let contacts: i64 = conn.query_row("SELECT COUNT(*) FROM office_contacts", [], |row| row.get(0))?;
    let financials: i64 = conn.query_row("SELECT COUNT(*) FROM monthly_financials", [], |row| row.get(0))?;
    let ops: i64 = conn.query_row("SELECT COUNT(*) FROM monthly_ops", [], |row| row.get(0))?;
    let volume: i64 = conn.query_row("SELECT COUNT(*) FROM monthly_volume", [], |row| row.get(0))?;
    let notes: i64 = conn.query_row("SELECT COUNT(*) FROM notes_actions", [], |row| row.get(0))?;
    let alerts: i64 = conn.query_row("SELECT COUNT(*) FROM alerts", [], |row| row.get(0))?;
    
    Ok(TableCounts {
        offices,
        staff,
        contacts,
        financials,
        ops,
        volume,
        notes,
        alerts,
    })
}

pub fn get_all_offices(conn: &Connection) -> Result<Vec<Office>> {
    let mut stmt = conn.prepare(
        "SELECT office_id, office_name, model, address, phone, managing_dentist, dfo, standardization_status 
         FROM offices ORDER BY office_name"
    )?;
    
    let offices = stmt.query_map([], |row| {
        Ok(Office {
            office_id: row.get(0)?,
            office_name: row.get(1)?,
            model: row.get(2)?,
            address: row.get(3)?,
            phone: row.get(4)?,
            managing_dentist: row.get(5)?,
            dfo: row.get(6)?,
            standardization_status: row.get(7)?,
        })
    })?;
    
    offices.collect()
}

