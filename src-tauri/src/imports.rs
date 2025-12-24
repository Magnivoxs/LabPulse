use calamine::{open_workbook, Reader, Xlsx, Data};
use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportSummary {
    pub filename: String,
    pub rows_processed: usize,
    pub rows_inserted: usize,
    pub rows_updated: usize,
    pub warnings: Vec<String>,
}

// Helper function to normalize office ID (strip leading zeros)
fn normalize_office_id(raw_id: &str) -> Option<i64> {
    raw_id.trim().parse::<i64>().ok()
}

// Helper function to get string from cell, trimming whitespace
fn get_string(cell: &calamine::Data) -> String {
    match cell {
        calamine::Data::String(s) => s.trim().to_string(),
        calamine::Data::Int(i) => i.to_string(),
        calamine::Data::Float(f) => f.to_string(),
        _ => String::new(),
    }
}

// Helper function to get optional string
fn get_optional_string(cell: &calamine::Data) -> Option<String> {
    let s = get_string(cell);
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

// Import offices from Office_list.xlsx
pub fn import_offices(file_path: &str, conn: &Connection) -> SqlResult<ImportSummary> {
    let mut summary = ImportSummary {
        filename: file_path.to_string(),
        rows_processed: 0,
        rows_inserted: 0,
        rows_updated: 0,
        warnings: Vec::new(),
    };

    let mut workbook: Xlsx<_> = open_workbook(file_path)
        .map_err(|e| rusqlite::Error::InvalidQuery)?;

    if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
        // Skip header row, start from row 1 (0-indexed)
        for (idx, row) in range.rows().enumerate().skip(1) {
            summary.rows_processed += 1;

            // Column mapping from Office_list.xlsx:
            // A=Office ID, B=Office Name, C=Model, D=Address, E=Phone, 
            // F=Managing Dentist, G=DFO, H=Standardization Status

            if row.len() < 3 {
                summary.warnings.push(format!("Row {}: Insufficient columns", idx + 2));
                continue;
            }

            // Normalize office ID
            let office_id = match normalize_office_id(&get_string(&row[0])) {
                Some(id) => id,
                None => {
                    summary.warnings.push(format!("Row {}: Invalid office ID", idx + 2));
                    continue;
                }
            };

            let office_name = get_string(&row[1]);
            let model = get_string(&row[2]).to_uppercase();
            
            // Validate model
            if model != "PO" && model != "PLLC" {
                summary.warnings.push(format!(
                    "Row {}: Invalid model '{}', expected PO or PLLC", 
                    idx + 2, model
                ));
                continue;
            }

            let address = if row.len() > 3 { get_optional_string(&row[3]) } else { None };
            let phone = if row.len() > 4 { get_optional_string(&row[4]) } else { None };
            let managing_dentist = if row.len() > 5 { get_optional_string(&row[5]) } else { None };
            let dfo = if row.len() > 6 { get_optional_string(&row[6]) } else { None };
            let standardization_status = if row.len() > 7 { 
                get_optional_string(&row[7]) 
            } else { 
                None 
            };

            // Upsert office
            let affected = conn.execute(
                "INSERT INTO offices (office_id, office_name, model, address, phone, managing_dentist, dfo, standardization_status, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, CURRENT_TIMESTAMP)
                 ON CONFLICT(office_id) DO UPDATE SET
                    office_name = excluded.office_name,
                    model = excluded.model,
                    address = excluded.address,
                    phone = excluded.phone,
                    managing_dentist = excluded.managing_dentist,
                    dfo = excluded.dfo,
                    standardization_status = excluded.standardization_status,
                    updated_at = CURRENT_TIMESTAMP",
                rusqlite::params![office_id, office_name, model, address, phone, managing_dentist, dfo, standardization_status],
            )?;

            if affected > 0 {
                summary.rows_inserted += 1;
            }
        }
    }

    // Log import
    conn.execute(
        "INSERT INTO import_log (import_type, filename, rows_processed, rows_inserted, rows_updated, warnings)
         VALUES ('offices', ?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            file_path,
            summary.rows_processed,
            summary.rows_inserted,
            summary.rows_updated,
            serde_json::to_string(&summary.warnings).unwrap_or_default()
        ],
    )?;

    Ok(summary)
}

// Import staff from full_staff_list_per_office.xlsx
pub fn import_staff(file_path: &str, conn: &Connection) -> SqlResult<ImportSummary> {
    let mut summary = ImportSummary {
        filename: file_path.to_string(),
        rows_processed: 0,
        rows_inserted: 0,
        rows_updated: 0,
        warnings: Vec::new(),
    };

    let mut workbook: Xlsx<_> = open_workbook(file_path)
        .map_err(|e| rusqlite::Error::InvalidQuery)?;

    if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
        // Skip header (row 0) and blank row (row 1), start from row 2
        for (idx, row) in range.rows().enumerate().skip(2) {
            summary.rows_processed += 1;

            // Column mapping: A=Practice ID, B=Name, C=Job Title, D=Hire Date
            if row.len() < 3 {
                summary.warnings.push(format!("Row {}: Insufficient columns", idx + 3));
                continue;
            }

            let office_id = match normalize_office_id(&get_string(&row[0])) {
                Some(id) => id,
                None => {
                    summary.warnings.push(format!("Row {}: Invalid office ID", idx + 3));
                    continue;
                }
            };

            let name = get_string(&row[1]);
            let mut job_title = get_string(&row[2]);
            
            // Normalize job title: strip "ADDL " prefix
            if job_title.starts_with("ADDL ") {
                job_title = job_title[5..].to_string();
            }

            let hire_date = if row.len() > 3 { get_optional_string(&row[3]) } else { None };

            // Check if office exists
            let office_exists: bool = conn.query_row(
                "SELECT 1 FROM offices WHERE office_id = ?1",
                [office_id],
                |_| Ok(true),
            ).unwrap_or(false);

            if !office_exists {
                summary.warnings.push(format!(
                    "Row {}: Office ID {} not found in offices table",
                    idx + 3, office_id
                ));
                continue;
            }

            // Insert staff (check for duplicates by office_id + name)
            match conn.execute(
                "INSERT INTO staff (office_id, name, job_title, hire_date)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(office_id, name) DO UPDATE SET
                    job_title = excluded.job_title,
                    hire_date = excluded.hire_date",
                rusqlite::params![office_id, name, job_title, hire_date],
            ) {
                Ok(_) => summary.rows_inserted += 1,
                Err(e) => summary.warnings.push(format!("Row {}: {}", idx + 3, e)),
            }
        }
    }

    // Log import
    conn.execute(
        "INSERT INTO import_log (import_type, filename, rows_processed, rows_inserted, rows_updated, warnings)
         VALUES ('staff', ?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            file_path,
            summary.rows_processed,
            summary.rows_inserted,
            summary.rows_updated,
            serde_json::to_string(&summary.warnings).unwrap_or_default()
        ],
    )?;

    Ok(summary)
}

// Import contacts from Lab_manager_Contact_List.xlsx
pub fn import_contacts(file_path: &str, conn: &Connection) -> SqlResult<ImportSummary> {
    let mut summary = ImportSummary {
        filename: file_path.to_string(),
        rows_processed: 0,
        rows_inserted: 0,
        rows_updated: 0,
        warnings: Vec::new(),
    };

    let mut workbook: Xlsx<_> = open_workbook(file_path)
        .map_err(|e| rusqlite::Error::InvalidQuery)?;

    if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
        // Skip header row
        for (idx, row) in range.rows().enumerate().skip(1) {
            summary.rows_processed += 1;

            // Column mapping: A=Office ID, B=Office Name, C=Name, D=Phone
            if row.len() < 3 {
                summary.warnings.push(format!("Row {}: Insufficient columns", idx + 2));
                continue;
            }

            let office_id = match normalize_office_id(&get_string(&row[0])) {
                Some(id) => id,
                None => {
                    summary.warnings.push(format!("Row {}: Invalid office ID", idx + 2));
                    continue;
                }
            };

            let name = get_string(&row[2]);
            let phone = if row.len() > 3 { get_optional_string(&row[3]) } else { None };
            let role = "Lab Manager".to_string();

            // Check if office exists
            let office_exists: bool = conn.query_row(
                "SELECT 1 FROM offices WHERE office_id = ?1",
                [office_id],
                |_| Ok(true),
            ).unwrap_or(false);

            if !office_exists {
                summary.warnings.push(format!(
                    "Row {}: Office ID {} not found in offices table",
                    idx + 2, office_id
                ));
                continue;
            }

            // Insert contact
            match conn.execute(
                "INSERT INTO office_contacts (office_id, role, name, phone)
                 VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![office_id, role, name, phone],
            ) {
                Ok(_) => summary.rows_inserted += 1,
                Err(e) => summary.warnings.push(format!("Row {}: {}", idx + 2, e)),
            }
        }
    }

    // Log import
    conn.execute(
        "INSERT INTO import_log (import_type, filename, rows_processed, rows_inserted, rows_updated, warnings)
         VALUES ('contacts', ?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            file_path,
            summary.rows_processed,
            summary.rows_inserted,
            summary.rows_updated,
            serde_json::to_string(&summary.warnings).unwrap_or_default()
        ],
    )?;

    Ok(summary)
}

