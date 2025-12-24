// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;
mod imports;

use tauri::Manager;
use commands::DbConnection;
use std::sync::Mutex;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database on app startup
            let app_handle = app.handle().clone();
            match db::init_db(&app_handle) {
                Ok(conn) => {
                    println!("✓ Database initialized successfully");
                    
                    // Get and print database path for debugging
                    let app_dir = app_handle.path().app_data_dir()
                        .expect("Failed to get app data dir");
                    let db_path = app_dir.join("labpulse.db");
                    println!("✓ Database location: {}", db_path.display());
                    
                    // Store connection in app state for commands to use
                    app.manage(DbConnection(Mutex::new(conn)));
                },
                Err(e) => {
                    eprintln!("✗ Failed to initialize database: {}", e);
                    return Err(e.into());
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_db_table_counts,
            commands::get_offices,
            commands::get_db_path,
            commands::import_offices_file,
            commands::import_staff_file,
            commands::import_contacts_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
