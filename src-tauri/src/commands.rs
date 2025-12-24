use crate::db::{get_all_offices, get_table_counts, Office, TableCounts};
use rusqlite::Connection;
use tauri::State;
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

