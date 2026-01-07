use crate::db::{get_all_offices, get_table_counts, Office, TableCounts};
use rusqlite::Connection;
use rusqlite::params;
use tauri::State;
use serde::{Deserialize, Serialize};
use serde_json;
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
    backlog_case_count: Option<i32>,
    overtime_value: Option<f64>,
    current_staff: Option<f64>,
    required_staff: Option<f64>,
    staffing_trend: Option<f64>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Check if record exists
    let exists: bool = conn.query_row(
        "SELECT COUNT(*) FROM monthly_ops WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| row.get::<_, i64>(0).map(|count| count > 0)
    ).map_err(|e| e.to_string())?;
    
    if exists {
        // Update existing record
        conn.execute(
            "UPDATE monthly_ops 
             SET backlog_case_count = ?1, 
                 overtime_value = ?2,
                 current_staff = ?3,
                 required_staff = ?4,
                 staffing_trend = ?5,
                 updated_at = CURRENT_TIMESTAMP
             WHERE office_id = ?6 AND year = ?7 AND month = ?8",
            params![
                backlog_case_count,
                overtime_value,
                current_staff,
                required_staff,
                staffing_trend,
                office_id,
                year,
                month
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        // Insert new record
        conn.execute(
            "INSERT INTO monthly_ops (
                office_id, year, month, 
                backlog_case_count, overtime_value,
                current_staff, required_staff, staffing_trend
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                office_id,
                year,
                month,
                backlog_case_count,
                overtime_value,
                current_staff,
                required_staff,
                staffing_trend,
            ],
        ).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// Get operations data including auto-calculated backlog and overtime
#[tauri::command]
pub fn get_operations_data(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Option<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get staffing data from monthly_ops
    let ops_result = conn.query_row(
        "SELECT current_staff, required_staff, staffing_trend
         FROM monthly_ops 
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| {
            Ok((
                row.get::<_, Option<f64>>(0)?,
                row.get::<_, Option<f64>>(1)?,
                row.get::<_, Option<f64>>(2)?,
            ))
        }
    );
    
    let (current_staff, required_staff, staffing_trend) = match ops_result {
        Ok(data) => data,
        Err(rusqlite::Error::QueryReturnedNoRows) => (None, None, None),
        Err(e) => return Err(e.to_string()),
    };
    
    // Auto-calculate backlog from monthly_volume (average of weekly data)
    let backlog_case_count: Option<i32> = conn.query_row(
        "SELECT CAST(AVG(
            lab_setups + lab_fixed_cases + lab_over_denture + lab_processes + lab_finishes +
            clinic_wax_tryin + clinic_delivery + clinic_outside_lab + clinic_on_hold
         ) AS INTEGER)
         FROM weekly_volume
         WHERE office_id = ?1 AND year = ?2 
         AND week_number >= (?3 - 1) * 4 + 1 AND week_number <= ?3 * 4",
        params![office_id, year, month],
        |row| row.get(0)
    ).ok();
    
    // Auto-calculate overtime from monthly_financials
    let overtime_value: Option<f64> = conn.query_row(
        "SELECT overtime_exp
         FROM monthly_financials
         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
        params![office_id, year, month],
        |row| row.get(0)
    ).ok().flatten();
    
    // If we have any data, return it
    if current_staff.is_some() || required_staff.is_some() || staffing_trend.is_some() 
        || backlog_case_count.is_some() || overtime_value.is_some() {
        Ok(Some(serde_json::json!({
            "backlog_case_count": backlog_case_count,
            "overtime_value": overtime_value,
            "current_staff": current_staff,
            "required_staff": required_staff,
            "staffing_trend": staffing_trend,
        })))
    } else {
        Ok(None)
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
    pub lab_setups: i32,
    pub lab_fixed_cases: i32,
    pub lab_over_denture: i32,
    pub lab_processes: i32,
    pub lab_finishes: i32,
    pub clinic_wax_tryin: i32,
    pub clinic_delivery: i32,
    pub clinic_outside_lab: i32,
    pub clinic_on_hold: i32,
    pub immediate_units: i32,
    pub economy_units: i32,
    pub economy_plus_units: i32,
    pub premium_units: i32,
    pub ultimate_units: i32,
    pub repair_units: i32,
    pub reline_units: i32,
    pub partial_units: i32,
    pub retry_units: i32,
    pub remake_units: i32,
    pub bite_block_units: i32,
    pub total_weekly_units: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeeklyVolumeData {
    pub id: Option<i64>,
    pub office_id: i64,
    pub year: i32,
    pub week_number: i32,
    pub lab_setups: i32,
    pub lab_fixed_cases: i32,
    pub lab_over_denture: i32,
    pub lab_processes: i32,
    pub lab_finishes: i32,
    pub clinic_wax_tryin: i32,
    pub clinic_delivery: i32,
    pub clinic_outside_lab: i32,
    pub clinic_on_hold: i32,
    pub immediate_units: i32,
    pub economy_units: i32,
    pub economy_plus_units: i32,
    pub premium_units: i32,
    pub ultimate_units: i32,
    pub repair_units: i32,
    pub reline_units: i32,
    pub partial_units: i32,
    pub retry_units: i32,
    pub remake_units: i32,
    pub bite_block_units: i32,
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
    lab_setups: i32,
    lab_fixed_cases: i32,
    lab_over_denture: i32,
    lab_processes: i32,
    lab_finishes: i32,
    clinic_wax_tryin: i32,
    clinic_delivery: i32,
    clinic_outside_lab: i32,
    clinic_on_hold: i32,
    immediate_units: i32,
    economy_units: i32,
    economy_plus_units: i32,
    premium_units: i32,
    ultimate_units: i32,
    repair_units: i32,
    reline_units: i32,
    partial_units: i32,
    retry_units: i32,
    remake_units: i32,
    bite_block_units: i32,
    total_weekly_units: i32,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO monthly_volume (
            office_id, year, month, backlog_in_lab, backlog_in_clinic,
            lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
            clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
            immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
            repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units,
            total_weekly_units
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26)
        ON CONFLICT(office_id, year, month) DO UPDATE SET
            backlog_in_lab = excluded.backlog_in_lab,
            backlog_in_clinic = excluded.backlog_in_clinic,
            lab_setups = excluded.lab_setups,
            lab_fixed_cases = excluded.lab_fixed_cases,
            lab_over_denture = excluded.lab_over_denture,
            lab_processes = excluded.lab_processes,
            lab_finishes = excluded.lab_finishes,
            clinic_wax_tryin = excluded.clinic_wax_tryin,
            clinic_delivery = excluded.clinic_delivery,
            clinic_outside_lab = excluded.clinic_outside_lab,
            clinic_on_hold = excluded.clinic_on_hold,
            immediate_units = excluded.immediate_units,
            economy_units = excluded.economy_units,
            economy_plus_units = excluded.economy_plus_units,
            premium_units = excluded.premium_units,
            ultimate_units = excluded.ultimate_units,
            repair_units = excluded.repair_units,
            reline_units = excluded.reline_units,
            partial_units = excluded.partial_units,
            retry_units = excluded.retry_units,
            remake_units = excluded.remake_units,
            bite_block_units = excluded.bite_block_units,
            total_weekly_units = excluded.total_weekly_units",
        params![
            office_id, year, month, backlog_in_lab, backlog_in_clinic,
            lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
            clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
            immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
            repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units,
            total_weekly_units
        ],
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
        "SELECT id, office_id, year, month, backlog_in_lab, backlog_in_clinic,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units,
                total_weekly_units
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
                lab_setups: row.get(6)?,
                lab_fixed_cases: row.get(7)?,
                lab_over_denture: row.get(8)?,
                lab_processes: row.get(9)?,
                lab_finishes: row.get(10)?,
                clinic_wax_tryin: row.get(11)?,
                clinic_delivery: row.get(12)?,
                clinic_outside_lab: row.get(13)?,
                clinic_on_hold: row.get(14)?,
                immediate_units: row.get(15)?,
                economy_units: row.get(16)?,
                economy_plus_units: row.get(17)?,
                premium_units: row.get(18)?,
                ultimate_units: row.get(19)?,
                repair_units: row.get(20)?,
                reline_units: row.get(21)?,
                partial_units: row.get(22)?,
                retry_units: row.get(23)?,
                remake_units: row.get(24)?,
                bite_block_units: row.get(25)?,
                total_weekly_units: row.get(26)?,
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
        "SELECT id, office_id, year, month, backlog_in_lab, backlog_in_clinic,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units,
                total_weekly_units
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
                lab_setups: row.get(6)?,
                lab_fixed_cases: row.get(7)?,
                lab_over_denture: row.get(8)?,
                lab_processes: row.get(9)?,
                lab_finishes: row.get(10)?,
                clinic_wax_tryin: row.get(11)?,
                clinic_delivery: row.get(12)?,
                clinic_outside_lab: row.get(13)?,
                clinic_on_hold: row.get(14)?,
                immediate_units: row.get(15)?,
                economy_units: row.get(16)?,
                economy_plus_units: row.get(17)?,
                premium_units: row.get(18)?,
                ultimate_units: row.get(19)?,
                repair_units: row.get(20)?,
                reline_units: row.get(21)?,
                partial_units: row.get(22)?,
                retry_units: row.get(23)?,
                remake_units: row.get(24)?,
                bite_block_units: row.get(25)?,
                total_weekly_units: row.get(26)?,
            })
        },
    );
    
    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Get weekly volume records for drill-down view
#[tauri::command]
pub fn get_weekly_volume_records(
    db: State<DbConnection>,
    office_id: i64,
    year: i32,
    month: i32,
) -> Result<Vec<WeeklyVolumeData>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Calculate week range for this month
    let (week_start, week_end) = match month {
        1 => (1, 4), 2 => (5, 8), 3 => (9, 13), 4 => (14, 17),
        5 => (18, 22), 6 => (23, 26), 7 => (27, 30), 8 => (31, 35),
        9 => (36, 39), 10 => (40, 43), 11 => (44, 48), 12 => (49, 53),
        _ => return Err("Invalid month".to_string()),
    };
    
    let mut stmt = conn.prepare(
        "SELECT id, office_id, year, week_number,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units
         FROM weekly_volume
         WHERE office_id = ?1 AND year = ?2 AND week_number BETWEEN ?3 AND ?4
         ORDER BY week_number ASC"
    ).map_err(|e| e.to_string())?;
    
    let weekly_records = stmt.query_map(
        params![office_id, year, week_start, week_end],
        |row| {
            Ok(WeeklyVolumeData {
                id: row.get(0)?,
                office_id: row.get(1)?,
                year: row.get(2)?,
                week_number: row.get(3)?,
                lab_setups: row.get(4)?,
                lab_fixed_cases: row.get(5)?,
                lab_over_denture: row.get(6)?,
                lab_processes: row.get(7)?,
                lab_finishes: row.get(8)?,
                clinic_wax_tryin: row.get(9)?,
                clinic_delivery: row.get(10)?,
                clinic_outside_lab: row.get(11)?,
                clinic_on_hold: row.get(12)?,
                immediate_units: row.get(13)?,
                economy_units: row.get(14)?,
                economy_plus_units: row.get(15)?,
                premium_units: row.get(16)?,
                ultimate_units: row.get(17)?,
                repair_units: row.get(18)?,
                reline_units: row.get(19)?,
                partial_units: row.get(20)?,
                retry_units: row.get(21)?,
                remake_units: row.get(22)?,
                bite_block_units: row.get(23)?,
            })
        },
    ).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(weekly_records)
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
    start_year: i32,
    start_month: i32,
    end_year: i32,
    end_month: i32,
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
    
    // Check if this is a single month or multi-month period
    let is_single_month = start_year == end_year && start_month == end_month;
    
    for office in offices {
        let (office_id, office_name, model, dfo) = office.map_err(|e| e.to_string())?;
        
        // Get financial data - use actual values for single month, SUM for multi-month
        let (financial_query, calc_percentages) = if is_single_month {
            (
                "SELECT 
                    revenue,
                    lab_exp_with_outside,
                    personnel_exp,
                    overtime_exp,
                    year,
                    month
                 FROM monthly_financials
                 WHERE office_id = ?1
                   AND year = ?2 AND month = ?3",
                true
            )
        } else {
            (
                "SELECT 
                    SUM(revenue),
                    SUM(lab_exp_with_outside),
                    SUM(personnel_exp),
                    SUM(overtime_exp),
                    MAX(year),
                    MAX(month)
                 FROM monthly_financials
                 WHERE office_id = ?1
                   AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                false
            )
        };
        
        let financial_result = if is_single_month {
            conn.query_row(
                financial_query,
                params![office_id, start_year, start_month],
                |row| {
                    Ok((
                        row.get::<_, Option<f64>>(0)?,  // revenue
                        row.get::<_, Option<f64>>(1)?,  // lab_exp_with_outside
                        row.get::<_, Option<f64>>(2)?,  // personnel_exp
                        row.get::<_, Option<f64>>(3)?,  // overtime_exp
                        row.get::<_, Option<i32>>(4)?,  // year
                        row.get::<_, Option<i32>>(5)?,  // month
                    ))
                },
            )
        } else {
            conn.query_row(
                financial_query,
                params![office_id, start_year, start_month, end_year, end_month],
                |row| {
                    Ok((
                        row.get::<_, Option<f64>>(0)?,  // SUM(revenue)
                        row.get::<_, Option<f64>>(1)?,  // SUM(lab_exp_with_outside)
                        row.get::<_, Option<f64>>(2)?,  // SUM(personnel_exp)
                        row.get::<_, Option<f64>>(3)?,  // SUM(overtime_exp)
                        row.get::<_, Option<i32>>(4)?,  // MAX(year)
                        row.get::<_, Option<i32>>(5)?,  // MAX(month)
                    ))
                },
            )
        };
        
        let (revenue, lab_exp, personnel_exp, overtime_exp, has_financial) = match financial_result {
            Ok((Some(rev), Some(lab), Some(pers), Some(ot), _, _)) => {
                (Some(rev), Some(lab), Some(pers), Some(ot), true)
            },
            Ok((Some(rev), Some(lab), Some(pers), None, _, _)) => {
                (Some(rev), Some(lab), Some(pers), None, true)
            },
            Ok((Some(rev), Some(lab), None, None, _, _)) => {
                (Some(rev), Some(lab), None, None, true)
            },
            Ok((Some(rev), None, None, None, _, _)) => {
                (Some(rev), None, None, None, true)
            },
            Ok((None, _, _, _, _, _)) => (None, None, None, None, false),
            Ok(_) => {
                // Partial data - treat as no financial data
                (None, None, None, None, false)
            },
            Err(_) => (None, None, None, None, false),
        };
        
        // Calculate percentages only for single month periods
        let (lab_exp_percent, personnel_percent, overtime_percent) = if calc_percentages {
            // Calculate percentages for single month
            let lab_pct = if let (Some(rev), Some(lab)) = (revenue, lab_exp) {
                if rev > 0.0 {
                    Some((lab / rev) * 100.0)
                } else {
                    None
                }
            } else {
                None
            };
            
            let pers_pct = if let (Some(rev), Some(pers)) = (revenue, personnel_exp) {
                if rev > 0.0 {
                    Some((pers / rev) * 100.0)
                } else {
                    None
                }
            } else {
                None
            };
            
            let ot_pct = if let (Some(rev), Some(ot)) = (revenue, overtime_exp) {
                if rev > 0.0 {
                    Some((ot / rev) * 100.0)
                } else {
                    None
                }
            } else {
                None
            };
            
            (lab_pct, pers_pct, ot_pct)
        } else {
            // Multi-month period: no percentages
            (None, None, None)
        };
        
        // Get operations data - use actual value for single month, AVG for multi-month
        let operations_query = if is_single_month {
            "SELECT backlog_case_count 
             FROM monthly_ops 
             WHERE office_id = ?1 AND year = ?2 AND month = ?3"
        } else {
            "SELECT AVG(backlog_case_count)
             FROM monthly_ops 
             WHERE office_id = ?1
               AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)"
        };
        
        let (backlog_count, has_operations) = if is_single_month {
            match conn.query_row(
                operations_query,
                params![office_id, start_year, start_month],
                |row| row.get::<_, Option<i32>>(0),
            ) {
                Ok(Some(count)) => (Some(count), true),
                Ok(None) => (None, false),
                Err(_) => (None, false),
            }
        } else {
            match conn.query_row(
                operations_query,
                params![office_id, start_year, start_month, end_year, end_month],
                |row| row.get::<_, Option<f64>>(0),
            ) {
                Ok(Some(avg)) => (Some(avg.round() as i32), true),
                Ok(None) => (None, false),
                Err(_) => (None, false),
            }
        };
        
        // Check for volume data in date range
        let has_volume = conn.query_row(
             "SELECT 1 FROM monthly_volume
             WHERE office_id = ?1
               AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)
             LIMIT 1",
            params![office_id, start_year, start_month, end_year, end_month],
            |_row| Ok(true),
        ).unwrap_or(false);
        
        // Check for notes in date range
        let has_notes = conn.query_row(
             "SELECT 1 FROM notes_actions
             WHERE office_id = ?1
               AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)
             LIMIT 1",
            params![office_id, start_year, start_month, end_year, end_month],
            |_row| Ok(true),
        ).unwrap_or(false);
        
        // Determine latest month with any data (across all time, not just range)
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

// Bulk import financial data from Excel
#[tauri::command]
pub fn import_bulk_financials(
    db: State<DbConnection>,
    file_path: String,
) -> Result<ImportSummary, String> {
    use calamine::{open_workbook, Reader, Xlsx, Data};
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Open the Excel file
    let mut workbook: Xlsx<_> = open_workbook(&file_path)
        .map_err(|e| format!("Failed to open Excel file: {}", e))?;
    
    // Get the monthly_financials sheet
    let sheet = workbook
        .worksheet_range("monthly_financials")
        .map_err(|e| format!("Failed to read sheet 'monthly_financials': {}", e))?;
    
    let mut rows_processed = 0;
    let mut rows_inserted = 0;
    let mut rows_updated = 0;
    let mut warnings = Vec::new();
    
    // Helper function to get i64 from cell
    fn get_i64(cell: &Data) -> Option<i64> {
        match cell {
            Data::Int(i) => Some(*i),
            Data::Float(f) => Some(*f as i64),
            Data::String(s) => s.trim().parse::<i64>().ok(),
            _ => None,
        }
    }
    
    // Helper function to get f64 from cell
    fn get_f64(cell: &Data) -> Option<f64> {
        match cell {
            Data::Int(i) => Some(*i as f64),
            Data::Float(f) => Some(*f),
            Data::String(s) => s.trim().parse::<f64>().ok(),
            _ => None,
        }
    }
    
    // Skip header row, start from row 1
    for (idx, row) in sheet.rows().enumerate().skip(1) {
        rows_processed += 1;
        
        // Parse row data
        let office_id = match row.get(0).and_then(|v| get_i64(v)) {
            Some(id) => id,
            None => {
                warnings.push(format!("Row {}: Missing or invalid office_id", idx + 2));
                continue;
            }
        };
        
        let year = match row.get(1).and_then(|v| get_i64(v)) {
            Some(y) => y as i32,
            None => {
                warnings.push(format!("Row {}: Missing or invalid year", idx + 2));
                continue;
            }
        };
        
        let month = match row.get(2).and_then(|v| get_i64(v)) {
            Some(m) => m as i32,
            None => {
                warnings.push(format!("Row {}: Missing or invalid month", idx + 2));
                continue;
            }
        };
        
        // Validate month range
        if month < 1 || month > 12 {
            warnings.push(format!("Row {}: Invalid month {} (must be 1-12)", idx + 2, month));
            continue;
        }
        
        // Parse financial fields (allow 0 or NULL)
        let revenue = row.get(3).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let lab_exp_no_outside = row.get(4).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let lab_exp_with_outside = row.get(5).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let teeth_supplies = row.get(6).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let lab_supplies = row.get(7).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let lab_hub = row.get(8).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let lss_expense = row.get(9).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let personnel_exp = row.get(10).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let overtime_exp = row.get(11).and_then(|v| get_f64(v)).unwrap_or(0.0);
        let bonus_exp = row.get(12).and_then(|v| get_f64(v)).unwrap_or(0.0);
        // Note: column 13 (outside_lab_spend) is ignored - LabPulse auto-calculates this
        
        // Check if record exists
        let exists = conn.query_row(
            "SELECT COUNT(*) FROM monthly_financials WHERE office_id = ?1 AND year = ?2 AND month = ?3",
            params![office_id, year, month],
            |row| row.get::<_, i64>(0),
        ).unwrap_or(0) > 0;
        
        // Calculate outside_lab_spend (auto-calculated)
        let outside_lab_spend = lab_exp_with_outside - lab_exp_no_outside;
        
        // Insert or update
        let result = conn.execute(
            "INSERT INTO monthly_financials (
                office_id, year, month, revenue, lab_exp_no_outside, lab_exp_with_outside,
                outside_lab_spend, teeth_supplies, lab_supplies, lab_hub, lss_expense, 
                personnel_exp, overtime_exp, bonus_exp
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
                bonus_exp = excluded.bonus_exp,
                updated_at = CURRENT_TIMESTAMP",
            params![
                office_id, year, month, revenue, lab_exp_no_outside, lab_exp_with_outside,
                outside_lab_spend, teeth_supplies, lab_supplies, lab_hub, lss_expense, 
                personnel_exp, overtime_exp, bonus_exp
            ],
        );
        
        match result {
            Ok(_) => {
                if exists {
                    rows_updated += 1;
                } else {
                    rows_inserted += 1;
                }
            }
            Err(e) => {
                warnings.push(format!("Row {}: Failed to import - {}", idx + 2, e));
            }
        }
    }
    
    // Log import
    conn.execute(
        "INSERT INTO import_log (import_type, filename, rows_processed, rows_inserted, rows_updated, warnings) VALUES ('bulk_financials', ?1, ?2, ?3, ?4, ?5)",
        params![
            file_path,
            rows_processed,
            rows_inserted,
            rows_updated,
            serde_json::to_string(&warnings).unwrap_or_default()
        ],
    ).ok(); // Don't fail if logging fails
    
    Ok(ImportSummary {
        filename: file_path.split('\\').last().or_else(|| file_path.split('/').last()).unwrap_or(&file_path).to_string(),
        rows_processed,
        rows_inserted,
        rows_updated,
        warnings,
    })
}

// Bulk import weekly volume data from Excel
#[tauri::command]
pub fn import_bulk_weekly_volume(
    db: State<DbConnection>,
    file_path: String,
) -> Result<ImportSummary, String> {
    use calamine::{open_workbook, Reader, Xlsx, Data};
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Open the Excel file
    let mut workbook: Xlsx<_> = open_workbook(&file_path)
        .map_err(|e| format!("Failed to open Excel file: {}", e))?;
    
    // Get the first sheet (Sheet1)
    let sheet = workbook
        .worksheet_range_at(0)
        .ok_or("No worksheets found in file")?
        .map_err(|e| format!("Failed to read sheet: {}", e))?;
    
    let mut rows_processed = 0;
    let mut weekly_inserted = 0;
    let mut weekly_skipped = 0;
    let mut monthly_updated = 0;
    let mut warnings = Vec::new();
    
    // Helper function to get integer from cell
    let get_i64 = |data: &Data| -> Option<i64> {
        match data {
            Data::Int(i) => Some(*i),
            Data::Float(f) => Some(*f as i64),
            Data::String(s) => s.parse::<i64>().ok(),
            Data::Bool(b) => Some(if *b { 1 } else { 0 }),
            _ => None,
        }
    };
    
    // Skip header row (row 0), start from row 1
    for (idx, row) in sheet.rows().enumerate().skip(1) {
        rows_processed += 1;
        
        // Parse row data based on column positions
        // Processed format: Column 0: office_id, Column 1: year, Column 2: month, Column 3: week_number
        let office_id = match row.get(0).and_then(get_i64) {
            Some(id) => id,
            None => {
                warnings.push(format!("Row {}: Missing or invalid office ID", idx + 1));
                continue;
            }
        };

        let year = match row.get(1).and_then(get_i64) {
            Some(y) => y as i32,
            None => {
                warnings.push(format!("Row {}: Missing or invalid year", idx + 1));
                continue;
            }
        };

        // Month is in column 2 but we'll calculate it from week_number, so just read week_number
        let week_number = match row.get(3).and_then(get_i64) {
            Some(w) => w as i32,
            None => {
                warnings.push(format!("Row {}: Missing or invalid week number", idx + 1));
                continue;
            }
        };

        if week_number < 1 || week_number > 53 {
            warnings.push(format!("Row {}: Invalid week number {} (must be 1-53)", idx + 1, week_number));
            continue;
        }
        
        // Parse all volume fields - processed file starts at column 6
        let lab_setups = row.get(6).and_then(get_i64).unwrap_or(0) as i32;
        let lab_fixed_cases = row.get(7).and_then(get_i64).unwrap_or(0) as i32;
        let lab_over_denture = row.get(8).and_then(get_i64).unwrap_or(0) as i32;
        let lab_processes = row.get(9).and_then(get_i64).unwrap_or(0) as i32;
        let lab_finishes = row.get(10).and_then(get_i64).unwrap_or(0) as i32;
        
        let clinic_wax_tryin = row.get(11).and_then(get_i64).unwrap_or(0) as i32;
        let clinic_delivery = row.get(12).and_then(get_i64).unwrap_or(0) as i32;
        let clinic_outside_lab = row.get(13).and_then(get_i64).unwrap_or(0) as i32;
        let clinic_on_hold = row.get(14).and_then(get_i64).unwrap_or(0) as i32;
        
        let immediate_units = row.get(15).and_then(get_i64).unwrap_or(0) as i32;
        let economy_units = row.get(16).and_then(get_i64).unwrap_or(0) as i32;
        let economy_plus_units = row.get(17).and_then(get_i64).unwrap_or(0) as i32;
        let premium_units = row.get(18).and_then(get_i64).unwrap_or(0) as i32;
        let ultimate_units = row.get(19).and_then(get_i64).unwrap_or(0) as i32;
        let repair_units = row.get(20).and_then(get_i64).unwrap_or(0) as i32;
        let reline_units = row.get(21).and_then(get_i64).unwrap_or(0) as i32;
        let partial_units = row.get(22).and_then(get_i64).unwrap_or(0) as i32;
        let retry_units = row.get(23).and_then(get_i64).unwrap_or(0) as i32;
        let remake_units = row.get(24).and_then(get_i64).unwrap_or(0) as i32;
        let bite_block_units = row.get(25).and_then(get_i64).unwrap_or(0) as i32;
        
        // Check if weekly record already exists
        let exists = conn.query_row(
            "SELECT COUNT(*) FROM weekly_volume WHERE office_id = ?1 AND year = ?2 AND week_number = ?3",
            params![office_id, year, week_number],
            |row| row.get::<_, i64>(0),
        ).unwrap_or(0) > 0;
        
        if exists {
            weekly_skipped += 1;
            continue; // Skip duplicate weeks
        }
        
        // Insert weekly record
        let result = conn.execute(
            "INSERT INTO weekly_volume (
                office_id, year, week_number,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23)",
            params![
                office_id, year, week_number,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units
            ],
        );
        
        match result {
            Ok(_) => weekly_inserted += 1,
            Err(e) => {
                warnings.push(format!("Row {}: Failed to insert weekly record - {}", idx + 1, e));
                continue;
            }
        }
    }
    
    // After importing weekly data, aggregate to monthly
    // This recalculates monthly_volume from all weekly records
    monthly_updated = aggregate_weekly_to_monthly(&conn)?;
    
    // Log the import
    conn.execute(
        "INSERT INTO import_log (import_type, filename, rows_processed, rows_inserted, rows_updated)
         VALUES ('weekly_volume', ?1, ?2, ?3, ?4)",
        params![
            file_path.split('\\').last().or_else(|| file_path.split('/').last()).unwrap_or(&file_path),
            rows_processed,
            weekly_inserted,
            monthly_updated
        ],
    ).map_err(|e| format!("Failed to log import: {}", e))?;
    
    Ok(ImportSummary {
        filename: file_path.split('\\').last().or_else(|| file_path.split('/').last()).unwrap_or(&file_path).to_string(),
        rows_processed,
        rows_inserted: weekly_inserted,
        rows_updated: monthly_updated as usize,
        warnings,
    })
}

// Helper function to aggregate weekly data to monthly
fn aggregate_weekly_to_monthly(conn: &Connection) -> Result<i32, String> {
    // Get all unique office/year/month combinations from weekly data
    let mut stmt = conn.prepare(
        "SELECT DISTINCT office_id, year,
                CASE 
                    WHEN week_number <= 4 THEN 1
                    WHEN week_number <= 8 THEN 2
                    WHEN week_number <= 13 THEN 3
                    WHEN week_number <= 17 THEN 4
                    WHEN week_number <= 22 THEN 5
                    WHEN week_number <= 26 THEN 6
                    WHEN week_number <= 30 THEN 7
                    WHEN week_number <= 35 THEN 8
                    WHEN week_number <= 39 THEN 9
                    WHEN week_number <= 43 THEN 10
                    WHEN week_number <= 48 THEN 11
                    ELSE 12
                END as month
         FROM weekly_volume
         ORDER BY office_id, year, month"
    ).map_err(|e| e.to_string())?;
    
    let office_months: Vec<(i64, i32, i32)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    let mut updated = 0;
    
    for (office_id, year, month) in office_months {
        // Calculate week range for this month
        let (week_start, week_end) = match month {
            1 => (1, 4), 2 => (5, 8), 3 => (9, 13), 4 => (14, 17),
            5 => (18, 22), 6 => (23, 26), 7 => (27, 30), 8 => (31, 35),
            9 => (36, 39), 10 => (40, 43), 11 => (44, 48), 12 => (49, 53),
            _ => continue,
        };
        
        // Average all weekly records for this month
        let monthly_data = conn.query_row(
            "SELECT 
                COALESCE(AVG(lab_setups), 0), COALESCE(AVG(lab_fixed_cases), 0), COALESCE(AVG(lab_over_denture), 0), 
                COALESCE(AVG(lab_processes), 0), COALESCE(AVG(lab_finishes), 0),
                COALESCE(AVG(clinic_wax_tryin), 0), COALESCE(AVG(clinic_delivery), 0), COALESCE(AVG(clinic_outside_lab), 0), COALESCE(AVG(clinic_on_hold), 0),
                COALESCE(AVG(immediate_units), 0), COALESCE(AVG(economy_units), 0), COALESCE(AVG(economy_plus_units), 0), 
                COALESCE(AVG(premium_units), 0), COALESCE(AVG(ultimate_units), 0), COALESCE(AVG(repair_units), 0), 
                COALESCE(AVG(reline_units), 0), COALESCE(AVG(partial_units), 0), COALESCE(AVG(retry_units), 0), 
                COALESCE(AVG(remake_units), 0), COALESCE(AVG(bite_block_units), 0)
             FROM weekly_volume
             WHERE office_id = ?1 AND year = ?2 AND week_number BETWEEN ?3 AND ?4",
            params![office_id, year, week_start, week_end],
            |row| {
                Ok((
                    row.get::<_, f64>(0)?.round() as i32, row.get::<_, f64>(1)?.round() as i32, row.get::<_, f64>(2)?.round() as i32,
                    row.get::<_, f64>(3)?.round() as i32, row.get::<_, f64>(4)?.round() as i32, row.get::<_, f64>(5)?.round() as i32,
                    row.get::<_, f64>(6)?.round() as i32, row.get::<_, f64>(7)?.round() as i32, row.get::<_, f64>(8)?.round() as i32,
                    row.get::<_, f64>(9)?.round() as i32, row.get::<_, f64>(10)?.round() as i32, row.get::<_, f64>(11)?.round() as i32,
                    row.get::<_, f64>(12)?.round() as i32, row.get::<_, f64>(13)?.round() as i32, row.get::<_, f64>(14)?.round() as i32,
                    row.get::<_, f64>(15)?.round() as i32, row.get::<_, f64>(16)?.round() as i32, row.get::<_, f64>(17)?.round() as i32,
                    row.get::<_, f64>(18)?.round() as i32, row.get::<_, f64>(19)?.round() as i32,
                ))
            },
        ).map_err(|e| e.to_string())?;
        
        let (lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
             clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
             immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
             repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units) = monthly_data;
        
        // Calculate totals
        let backlog_in_lab = lab_setups + lab_fixed_cases + lab_over_denture + lab_processes + lab_finishes;
        let backlog_in_clinic = clinic_wax_tryin + clinic_delivery + clinic_outside_lab + clinic_on_hold;
        let total_weekly_units = immediate_units + economy_units + economy_plus_units + premium_units + 
                                 ultimate_units + repair_units + reline_units + partial_units + 
                                 retry_units + remake_units + bite_block_units;
        
        // Insert or update monthly record
        conn.execute(
            "INSERT INTO monthly_volume (
                office_id, year, month, backlog_in_lab, backlog_in_clinic,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units,
                total_weekly_units
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26)
            ON CONFLICT(office_id, year, month) DO UPDATE SET
                backlog_in_lab = excluded.backlog_in_lab,
                backlog_in_clinic = excluded.backlog_in_clinic,
                lab_setups = excluded.lab_setups,
                lab_fixed_cases = excluded.lab_fixed_cases,
                lab_over_denture = excluded.lab_over_denture,
                lab_processes = excluded.lab_processes,
                lab_finishes = excluded.lab_finishes,
                clinic_wax_tryin = excluded.clinic_wax_tryin,
                clinic_delivery = excluded.clinic_delivery,
                clinic_outside_lab = excluded.clinic_outside_lab,
                clinic_on_hold = excluded.clinic_on_hold,
                immediate_units = excluded.immediate_units,
                economy_units = excluded.economy_units,
                economy_plus_units = excluded.economy_plus_units,
                premium_units = excluded.premium_units,
                ultimate_units = excluded.ultimate_units,
                repair_units = excluded.repair_units,
                reline_units = excluded.reline_units,
                partial_units = excluded.partial_units,
                retry_units = excluded.retry_units,
                remake_units = excluded.remake_units,
                bite_block_units = excluded.bite_block_units,
                total_weekly_units = excluded.total_weekly_units",
            params![
                office_id, year, month, backlog_in_lab, backlog_in_clinic,
                lab_setups, lab_fixed_cases, lab_over_denture, lab_processes, lab_finishes,
                clinic_wax_tryin, clinic_delivery, clinic_outside_lab, clinic_on_hold,
                immediate_units, economy_units, economy_plus_units, premium_units, ultimate_units,
                repair_units, reline_units, partial_units, retry_units, remake_units, bite_block_units,
                total_weekly_units
            ],
        ).map_err(|e| e.to_string())?;
        
        updated += 1;
    }
    
    Ok(updated)
}

// Get rankings for offices based on metric and time period
#[tauri::command]
pub fn get_office_rankings(
    db: State<DbConnection>,
    metric: String,
    start_year: i32,
    start_month: i32,
    end_year: i32,
    end_month: i32,
) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Check if single month or multi-month period
    let is_single_month = start_year == end_year && start_month == end_month;
    
    // Get all offices first
    let mut stmt = conn.prepare(
        "SELECT office_id, office_name, address, model, dfo FROM offices ORDER BY office_id"
    ).map_err(|e| e.to_string())?;
    
    let offices: Vec<(i64, String, String, String, String)> = stmt
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    let mut rankings = Vec::new();
    
    for (office_id, office_name, address, _model, dfo) in offices {
        let value: Option<f64> = match metric.as_str() {
            "revenue" => {
                if is_single_month {
                    conn.query_row(
                        "SELECT revenue FROM monthly_financials WHERE office_id = ?1 AND year = ?2 AND month = ?3",
                        params![office_id, start_year, start_month],
                        |row| row.get(0),
                    ).ok()
                } else {
                    conn.query_row(
                        "SELECT SUM(revenue) FROM monthly_financials 
                         WHERE office_id = ?1 AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                        params![office_id, start_year, start_month, end_year, end_month],
                        |row| row.get(0),
                    ).ok()
                }
            },
            
            "lab_expense_percent" => {
                if is_single_month {
                    // Calculate percentage for single month
                    let result = conn.query_row(
                        "SELECT revenue, lab_exp_with_outside FROM monthly_financials 
                         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
                        params![office_id, start_year, start_month],
                        |row| Ok((row.get::<_, Option<f64>>(0)?, row.get::<_, Option<f64>>(1)?)),
                    ).ok();
                    
                    if let Some((Some(rev), Some(lab))) = result {
                        if rev > 0.0 {
                            Some((lab / rev) * 100.0)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None // No percentages for multi-month
                }
            },
            
            "personnel_expense_percent" => {
                if is_single_month {
                    let result = conn.query_row(
                        "SELECT revenue, personnel_exp FROM monthly_financials 
                         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
                        params![office_id, start_year, start_month],
                        |row| Ok((row.get::<_, Option<f64>>(0)?, row.get::<_, Option<f64>>(1)?)),
                    ).ok();
                    
                    if let Some((Some(rev), Some(pers))) = result {
                        if rev > 0.0 {
                            Some((pers / rev) * 100.0)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None // No percentages for multi-month
                }
            },
            
            "total_weekly_units" => {
                if is_single_month {
                    conn.query_row(
                        "SELECT AVG(total_weekly_units) FROM monthly_volume 
                         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
                        params![office_id, start_year, start_month],
                        |row| row.get(0),
                    ).ok()
                } else {
                    conn.query_row(
                        "SELECT AVG(total_weekly_units) FROM monthly_volume 
                         WHERE office_id = ?1 AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                        params![office_id, start_year, start_month, end_year, end_month],
                        |row| row.get(0),
                    ).ok()
                }
            },
            
            "backlog_in_lab" => {
                if is_single_month {
                    conn.query_row(
                        "SELECT AVG(backlog_in_lab) FROM monthly_volume 
                         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
                        params![office_id, start_year, start_month],
                        |row| row.get(0),
                    ).ok()
                } else {
                    conn.query_row(
                        "SELECT AVG(backlog_in_lab) FROM monthly_volume 
                         WHERE office_id = ?1 AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                        params![office_id, start_year, start_month, end_year, end_month],
                        |row| row.get(0),
                    ).ok()
                }
            },
            
            "backlog_in_clinic" => {
                if is_single_month {
                    conn.query_row(
                        "SELECT AVG(backlog_in_clinic) FROM monthly_volume 
                         WHERE office_id = ?1 AND year = ?2 AND month = ?3",
                        params![office_id, start_year, start_month],
                        |row| row.get(0),
                    ).ok()
                } else {
                    conn.query_row(
                        "SELECT AVG(backlog_in_clinic) FROM monthly_volume 
                         WHERE office_id = ?1 AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                        params![office_id, start_year, start_month, end_year, end_month],
                        |row| row.get(0),
                    ).ok()
                }
            },
            
            "data_completeness" => {
                // Calculate data completeness percentage
                let period_months = if is_single_month {
                    1
                } else {
                    // Calculate number of months in range
                    let mut count = 0;
                    let mut y = start_year;
                    let mut m = start_month;
                    while y < end_year || (y == end_year && m <= end_month) {
                        count += 1;
                        m += 1;
                        if m > 12 {
                            m = 1;
                            y += 1;
                        }
                    }
                    count
                };
                
                let financial_count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM monthly_financials 
                     WHERE office_id = ?1 AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                    params![office_id, start_year, start_month, end_year, end_month],
                    |row| row.get(0),
                ).unwrap_or(0);
                
                let volume_count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM monthly_volume 
                     WHERE office_id = ?1 AND (year * 100 + month) BETWEEN (?2 * 100 + ?3) AND (?4 * 100 + ?5)",
                    params![office_id, start_year, start_month, end_year, end_month],
                    |row| row.get(0),
                ).unwrap_or(0);
                
                let total_possible = period_months * 2; // 2 data types (financial + volume)
                let total_actual = financial_count + volume_count;
                
                Some((total_actual as f64 / total_possible as f64) * 100.0)
            },
            
            _ => None,
        };
        
        rankings.push(serde_json::json!({
            "office_id": office_id,
            "office_name": office_name,
            "address": address,
            "dfo": dfo,
            "value": value,
        }));
    }
    
    Ok(rankings)
}

// Get all offices for directory
#[tauri::command]
pub fn get_directory_offices(db: State<DbConnection>) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT office_id, office_name, address, phone, managing_dentist, dfo, model, standardization_status 
         FROM offices 
         ORDER BY office_id"
    ).map_err(|e| e.to_string())?;
    
    let offices = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "office_id": row.get::<_, i64>(0)?,
            "office_name": row.get::<_, String>(1)?,
            "address": row.get::<_, Option<String>>(2)?,
            "phone": row.get::<_, Option<String>>(3)?,
            "managing_dentist": row.get::<_, Option<String>>(4)?,
            "dfo": row.get::<_, String>(5)?,
            "model": row.get::<_, String>(6)?,
            "standardization_status": row.get::<_, Option<String>>(7)?,
        }))
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(offices)
}

// Get detailed information for a specific office
#[tauri::command]
pub fn get_directory_office_details(
    db: State<DbConnection>,
    office_id: i64,
) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get office information
    let office = conn.query_row(
        "SELECT office_id, office_name, address, phone, managing_dentist, dfo, model, standardization_status 
         FROM offices 
         WHERE office_id = ?1",
        params![office_id],
        |row| {
            Ok(serde_json::json!({
                "office_id": row.get::<_, i64>(0)?,
                "office_name": row.get::<_, String>(1)?,
                "address": row.get::<_, Option<String>>(2)?,
                "phone": row.get::<_, Option<String>>(3)?,
                "managing_dentist": row.get::<_, Option<String>>(4)?,
                "dfo": row.get::<_, String>(5)?,
                "model": row.get::<_, String>(6)?,
                "standardization_status": row.get::<_, Option<String>>(7)?,
            }))
        }
    ).map_err(|e| e.to_string())?;
    
    // Get staff for this office
    let mut stmt = conn.prepare(
        "SELECT name, job_title, hire_date 
         FROM staff 
         WHERE office_id = ?1 
         ORDER BY hire_date"
    ).map_err(|e| e.to_string())?;
    
    let staff: Vec<serde_json::Value> = stmt.query_map(params![office_id], |row| {
        Ok(serde_json::json!({
            "name": row.get::<_, String>(0)?,
            "position": row.get::<_, String>(1)?, // Map job_title to position for frontend
            "hire_date": row.get::<_, Option<String>>(2)?,
        }))
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    // Get lab manager contact
    let lab_manager = conn.query_row(
        "SELECT name, email, phone 
         FROM lab_manager_contacts 
         WHERE office_id = ?1",
        params![office_id],
        |row| {
            Ok(serde_json::json!({
                "name": row.get::<_, String>(0)?,
                "email": row.get::<_, String>(1)?,
                "phone": row.get::<_, String>(2)?,
            }))
        }
    ).ok(); // Use .ok() to return None if not found instead of error
    
    // Combine all data
    Ok(serde_json::json!({
        "office": office,
        "staff": staff,
        "lab_manager": lab_manager,
    }))
}

// Get submission compliance data with metrics
#[tauri::command]
pub fn get_compliance_data(db: State<DbConnection>) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get all offices
    let mut stmt = conn.prepare(
        "SELECT office_id, office_name, dfo FROM offices ORDER BY office_id"
    ).map_err(|e| e.to_string())?;
    
    let offices: Vec<(i64, String, String)> = stmt
        .query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    let mut compliance_data = Vec::new();
    
    for (office_id, office_name, dfo) in offices {
        // Get all submissions for this office
        let mut stmt = conn.prepare(
            "SELECT year, week_number, submitted 
             FROM submission_compliance 
             WHERE office_id = ?1 
             ORDER BY year, week_number"
        ).map_err(|e| e.to_string())?;
        
        let submissions: Vec<(i32, i32, i32)> = stmt
            .query_map(params![office_id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        
        if submissions.is_empty() {
            continue;
        }
        
        // Calculate metrics
        let total_weeks = submissions.len();
        let submitted_weeks = submissions.iter().filter(|(_, _, s)| *s == 1).count();
        let compliance_rate = (submitted_weeks as f64 / total_weeks as f64) * 100.0;
        
        // Calculate current streak (from most recent backwards)
        let mut current_streak = 0;
        for (_, _, submitted) in submissions.iter().rev() {
            if *submitted == 1 {
                current_streak += 1;
            } else {
                break;
            }
        }
        
        // Calculate longest streak
        let mut longest_streak = 0;
        let mut temp_streak = 0;
        for (_, _, submitted) in &submissions {
            if *submitted == 1 {
                temp_streak += 1;
                longest_streak = longest_streak.max(temp_streak);
            } else {
                temp_streak = 0;
            }
        }
        
        // Get recent submissions (last 10 weeks with data, oldest to newest)
        // Filter out future weeks where no backlog data exists
        let mut recent_with_data: Vec<i32> = Vec::new();

        for (year, week_number, submitted) in submissions.iter().rev() {
            // Check if actual backlog data exists for this week
            let has_data = conn.query_row(
                "SELECT COUNT(*) FROM weekly_volume WHERE office_id = ?1 AND year = ?2 AND week_number = ?3",
                params![office_id, year, week_number],
                |row| row.get::<_, i64>(0)
            ).unwrap_or(0) > 0;
            
            if has_data {
                recent_with_data.push(*submitted);
                if recent_with_data.len() >= 10 {
                    break;
                }
            }
        }

        // Reverse to get chronological order (oldest to newest)
        recent_with_data.reverse();
        let recent_submissions = recent_with_data;
        
        compliance_data.push(serde_json::json!({
            "office_id": office_id,
            "office_name": office_name,
            "dfo": dfo,
            "total_weeks": total_weeks,
            "submitted_weeks": submitted_weeks,
            "compliance_rate": compliance_rate,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "recent_submissions": recent_submissions,
        }));
    }
    
    Ok(compliance_data)
}
