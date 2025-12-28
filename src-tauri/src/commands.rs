use crate::db::{get_all_offices, get_table_counts, Office, TableCounts};
use rusqlite::Connection;
use rusqlite::params;
use tauri::State;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct DbConnection(pub Mutex<Connection>);

#[tauri::command]
pub fn get_db_table_counts(db: State<DbConnection>) -> Result<TableCounts, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_table_counts(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_offices(db: State<DbConnection>) -> Result<Vec<Office>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_all_offices(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    let db_path = app_dir.join("labpulse.db");
    Ok(db_path.to_string_lossy().to_string())
}

use crate::imports::{import_offices, import_staff, import_contacts, ImportSummary};

#[tauri::command]
pub fn import_offices_file(db: State<DbConnection>, file_path: String) -> Result<ImportSummary, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    import_offices(&file_path, &conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_staff_file(db: State<DbConnection>, file_path: String) -> Result<ImportSummary, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    import_staff(&file_path, &conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_contacts_file(db: State<DbConnection>, file_path: String) -> Result<ImportSummary, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    import_contacts(&file_path, &conn).map_err(|e| e.to_string())
}

// Financial data structure
#[derive(Debug, Serialize, Deserialize)]
pub struct FinancialData {
    pub id: Option<i64>,
    pub office_id: i64,
    pub year: i32,
    pub month: i32,
    pub revenue: f64,
    pub lab_exp_no_outside: f64,
    pub lab_exp_with_outside: f64,
    pub outside_lab_spend: f64,
    pub teeth_supplies: f64,
    pub lab_supplies: f64,
    pub lab_hub: f64,
    pub lss_expense: f64,
    pub personnel_exp: f64,
    pub overtime_exp: f64,
    pub bonus_exp: f64,
}

// Save or update financial data
#[tauri::command]
pub fn save_financial_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
    revenue: f64,
    lab_exp_no_outside: f64,
    lab_exp_with_outside: f64,
    outside_lab_spend: f64,
    teeth_supplies: f64,
    lab_supplies: f64,
    lab_hub: f64,
    lss_expense: f64,
    personnel_exp: f64,
    overtime_exp: f64,
    bonus_exp: f64,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO monthly_financials (
            office_id, year, month, revenue, lab_exp_no_outside,
            lab_exp_with_outside, outside_lab_spend, teeth_supplies,
            lab_supplies, lab_hub, lss_expense, personnel_exp, overtime_exp, bonus_exp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
        ON CONFLICT(office_id, year, month) DO UPDATE SET
            revenue = excluded.revenue,
            lab_exp_no_outside = excluded.lab_exp_no_outside,
            lab_exp_with_outside = excluded.lab_exp_with_outside,
            outside_lab_spend = excluded.outside_lab_spend,
            teeth_supplies = excluded.teeth_supplies,
            lab_supplies = excluded.lab_supplies,
            lab_hub = excluded.lab_hub,
            lss_expense = excluded.lss_expense,
            personnel_exp = excluded.personnel_exp,
            overtime_exp = excluded.overtime_exp,
            bonus_exp = excluded.bonus_exp",
        params![
            office_id, year, month, revenue, lab_exp_no_outside,
            lab_exp_with_outside, outside_lab_spend, teeth_supplies,
            lab_supplies, lab_hub, lss_expense, personnel_exp, overtime_exp, bonus_exp
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok("Financial data saved successfully".to_string())
}

// Get financial data for specific office/month
#[tauri::command]
pub fn get_financial_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<FinancialData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT id, office_id, year, month, revenue, lab_exp_no_outside,
                lab_exp_with_outside, outside_lab_spend, teeth_supplies,
                lab_supplies, lab_hub, lss_expense, personnel_exp, overtime_exp, bonus_exp
         FROM monthly_financials
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| {
            Ok(FinancialData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                revenue: row.get(4)?,
                lab_exp_no_outside: row.get(5)?,
                lab_exp_with_outside: row.get(6)?,
                outside_lab_spend: row.get(7)?,
                teeth_supplies: row.get(8)?,
                lab_supplies: row.get(9)?,
                lab_hub: row.get(10)?,
                lss_expense: row.get(11)?,
                personnel_exp: row.get(12)?,
                overtime_exp: row.get(13)?,
                bonus_exp: row.get(14)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Get previous month's financial data (for comparison)
#[tauri::command]
pub fn get_previous_month_financial(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<FinancialData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Calculate previous month
    let (prev_year, prev_month) = if month == 1 {
        (year - 1, 12)
    } else {
        (year, month - 1)
    };
    
    let result = conn.query_row(
        "SELECT id, office_id, year, month, revenue, lab_exp_no_outside,
                lab_exp_with_outside, outside_lab_spend, teeth_supplies,
                lab_supplies, lab_hub, lss_expense, personnel_exp, overtime_exp, bonus_exp
         FROM monthly_financials
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, prev_year, prev_month],
        |row| {
            Ok(FinancialData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                revenue: row.get(4)?,
                lab_exp_no_outside: row.get(5)?,
                lab_exp_with_outside: row.get(6)?,
                outside_lab_spend: row.get(7)?,
                teeth_supplies: row.get(8)?,
                lab_supplies: row.get(9)?,
                lab_hub: row.get(10)?,
                lss_expense: row.get(11)?,
                personnel_exp: row.get(12)?,
                overtime_exp: row.get(13)?,
                bonus_exp: row.get(14)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Operations data structure
#[derive(Debug, Serialize, Deserialize)]
pub struct OperationsData {
    pub id: Option<i64>,
    pub office_id: i64,
    pub year: i32,
    pub month: i32,
    pub backlog_case_count: i32,
    pub overtime_value: f64,
    pub labor_model_value: f64,
}

// Save or update operations data
#[tauri::command]
pub fn save_operations_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
    backlog_case_count: i32,
    overtime_value: f64,
    labor_model_value: f64,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO monthly_ops (
            office_id, year, month, backlog_case_count, overtime_value, labor_model_value
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ON CONFLICT(office_id, year, month) DO UPDATE SET
            backlog_case_count = excluded.backlog_case_count,
            overtime_value = excluded.overtime_value,
            labor_model_value = excluded.labor_model_value",
        params![office_id, year, month, backlog_case_count, overtime_value, labor_model_value],
    ).map_err(|e| e.to_string())?;
    
    Ok("Operations data saved successfully".to_string())
}

// Get operations data for specific office/month
#[tauri::command]
pub fn get_operations_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<OperationsData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT id, office_id, year, month, backlog_case_count, overtime_value, labor_model_value
         FROM monthly_ops
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| {
            Ok(OperationsData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                backlog_case_count: row.get(4)?,
                overtime_value: row.get(5)?,
                labor_model_value: row.get(6)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Get previous month's operations data
#[tauri::command]
pub fn get_previous_month_operations(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<OperationsData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Calculate previous month
    let (prev_year, prev_month) = if month == 1 {
        (year - 1, 12)
    } else {
        (year, month - 1)
    };
    
    let result = conn.query_row(
        "SELECT id, office_id, year, month, backlog_case_count, overtime_value, labor_model_value
         FROM monthly_ops
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, prev_year, prev_month],
        |row| {
            Ok(OperationsData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                backlog_case_count: row.get(4)?,
                overtime_value: row.get(5)?,
                labor_model_value: row.get(6)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Volume data structure
#[derive(Debug, Serialize, Deserialize)]
pub struct VolumeData {
    pub id: Option<i64>,
    pub office_id: i64,
    pub year: i32,
    pub month: i32,
    pub backlog_in_lab: i32,
    pub backlog_in_clinic: i32,
    pub total_weekly_units: i32,
}

// Save or update volume data
#[tauri::command]
pub fn save_volume_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
    backlog_in_lab: i32,
    backlog_in_clinic: i32,
    total_weekly_units: i32,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO monthly_volume (
            office_id, year, month, backlog_in_lab, backlog_in_clinic, total_weekly_units
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ON CONFLICT(office_id, year, month) DO UPDATE SET
            backlog_in_lab = excluded.backlog_in_lab,
            backlog_in_clinic = excluded.backlog_in_clinic,
            total_weekly_units = excluded.total_weekly_units",
        params![office_id, year, month, backlog_in_lab, backlog_in_clinic, total_weekly_units],
    ).map_err(|e| e.to_string())?;
    
    Ok("Volume data saved successfully".to_string())
}

// Get volume data for specific office/month
#[tauri::command]
pub fn get_volume_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<VolumeData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT id, office_id, year, month, backlog_in_lab, backlog_in_clinic, total_weekly_units
         FROM monthly_volume
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| {
            Ok(VolumeData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                backlog_in_lab: row.get(4)?,
                backlog_in_clinic: row.get(5)?,
                total_weekly_units: row.get(6)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Get previous month's volume data
#[tauri::command]
pub fn get_previous_month_volume(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<VolumeData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Calculate previous month
    let (prev_year, prev_month) = if month == 1 {
        (year - 1, 12)
    } else {
        (year, month - 1)
    };
    
    let result = conn.query_row(
        "SELECT id, office_id, year, month, backlog_in_lab, backlog_in_clinic, total_weekly_units
         FROM monthly_volume
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, prev_year, prev_month],
        |row| {
            Ok(VolumeData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                backlog_in_lab: row.get(4)?,
                backlog_in_clinic: row.get(5)?,
                total_weekly_units: row.get(6)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Save or update note
#[tauri::command]
pub fn save_note(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
    note_text: String,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO notes_actions (office_id, year, month, note_text)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(office_id, year, month) DO UPDATE SET
             note_text = excluded.note_text,
             updated_at = CURRENT_TIMESTAMP",
        params![office_id, year, month, note_text],
    ).map_err(|e| e.to_string())?;
    
    Ok("Note saved successfully".to_string())
}

// Get notes for specific office/month
#[tauri::command]
pub fn get_notes(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT note_text FROM notes_actions
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| row.get(0),
    );
    
    match result {
        Ok(note_text) => Ok(Some(note_text)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Dashboard office summary structure
#[derive(Debug, Serialize, Deserialize)]
pub struct OfficeSummary {
    pub office_id: i64,
    pub office_name: String,
    pub model: String,
    pub dfo: Option<String>,
    pub latest_month: Option<i32>,
    pub latest_year: Option<i32>,
    pub revenue: Option<f64>,
    pub lab_exp_percent: Option<f64>,
    pub personnel_percent: Option<f64>,
    pub overtime_percent: Option<f64>,
    pub backlog_count: Option<i32>,
    pub has_financial: bool,
    pub has_operations: bool,
    pub has_volume: bool,
    pub has_notes: bool,
}

// Get dashboard data for all offices
#[tauri::command]
pub fn get_dashboard_data(
    db: State<DbConnection>,
    year: i32,
    month: i32,
) -> Result<Vec<OfficeSummary>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get all offices
    let mut stmt = conn.prepare(
        "SELECT office_id, office_name, model, dfo FROM offices ORDER BY office_id"
    ).map_err(|e| e.to_string())?;
    
    let offices = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?,
        ))
    }).map_err(|e| e.to_string())?;
    
    let mut summaries = Vec::new();
    
    for office in offices {
        let (office_id, office_name, model, dfo) = office.map_err(|e| e.to_string())?;
        
        // Get financial data
        let financial_result = conn.query_row(
            "SELECT revenue, lab_exp_with_outside, personnel_exp, overtime_exp
             FROM monthly_financials
             WHERE office_id = ?1 AND year = ?2 AND month = ?3",
            params![office_id, year, month],
            |row| {
                Ok((
                    row.get::<_, f64>(0)?,
                    row.get::<_, f64>(1)?,
                    row.get::<_, f64>(2)?,
                    row.get::<_, f64>(3)?,
                ))
            },
        );
        
        let (revenue, lab_exp, personnel_exp, overtime_exp, has_financial) = match financial_result {
            Ok((rev, lab, pers, ot)) => (Some(rev), Some(lab), Some(pers), Some(ot), true),
            Err(_) => (None, None, None, None, false),
        };
        
        // Calculate percentages
        let lab_exp_percent = if let (Some(rev), Some(lab)) = (revenue, lab_exp) {
            if rev > 0.0 { Some((lab / rev) * 100.0) } else { None }
        } else { None };
        
        let personnel_percent = if let (Some(rev), Some(pers)) = (revenue, personnel_exp) {
            if rev > 0.0 { Some((pers / rev) * 100.0) } else { None }
        } else { None };
        
        let overtime_percent = if let (Some(rev), Some(ot)) = (revenue, overtime_exp) {
            if rev > 0.0 { Some((ot / rev) * 100.0) } else { None }
        } else { None };
        
        // Get operations data
        let operations_result = conn.query_row(
            "SELECT backlog_case_count FROM monthly_ops
             WHERE office_id = ?1 AND year = ?2 AND month = ?3",
            params![office_id, year, month],
            |row| row.get::<_, i32>(0),
        );
        
        let (backlog_count, has_operations) = match operations_result {
            Ok(count) => (Some(count), true),
            Err(_) => (None, false),
        };
        
        // Check for volume data
        let has_volume = conn.query_row(
            "SELECT 1 FROM monthly_volume
             WHERE office_id = ?1 AND year = ?2 AND month = ?3",
            params![office_id, year, month],
            |_row| Ok(true),
        ).unwrap_or(false);
        
        // Check for notes
        let has_notes = conn.query_row(
            "SELECT 1 FROM notes_actions
             WHERE office_id = ?1 AND year = ?2 AND month = ?3",
            params![office_id, year, month],
            |_row| Ok(true),
        ).unwrap_or(false);
        
        // Determine latest month with any data
        let latest_data = conn.query_row(
            "SELECT year, month FROM (
                SELECT year, month FROM monthly_financials WHERE office_id = ?1
                UNION
                SELECT year, month FROM monthly_ops WHERE office_id = ?1
                UNION
                SELECT year, month FROM monthly_volume WHERE office_id = ?1
             ) ORDER BY year DESC, month DESC LIMIT 1",
            params![office_id],
            |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)),
        );
        
        let (latest_year, latest_month) = match latest_data {
            Ok((y, m)) => (Some(y), Some(m)),
            Err(_) => (None, None),
        };
        
        summaries.push(OfficeSummary {
            office_id,
            office_name,
            model,
            dfo,
            latest_month,
            latest_year,
            revenue,
            lab_exp_percent,
            personnel_percent,
            overtime_percent,
            backlog_count,
            has_financial,
            has_operations,
            has_volume,
            has_notes,
        });
    }
    
    Ok(summaries)
}

