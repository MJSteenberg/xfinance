use serde::Deserialize;
use tauri::State;
use crate::pdf_processor::{process_pdf_content, process_csv_content, StatementData, Transaction};
use crate::state::AppState;
use crate::db::{User, Document, Statement};

#[derive(Debug, serde::Serialize)]
pub struct CommandResponse<T: serde::Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: serde::Serialize> CommandResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

#[tauri::command]
pub fn process_statement(
    _state: State<'_, AppState>,
    file_path: String,
) -> Result<CommandResponse<StatementData>, String> {
    let path = std::path::Path::new(&file_path);
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    let result = match extension.as_str() {
        "pdf" => process_pdf_content(&file_path),
        "csv" => process_csv_content(&file_path),
        _ => Err("Unsupported file format. Please upload a PDF or CSV file.".to_string())
    };

    match result {
        Ok(statement_data) => Ok(CommandResponse::success(statement_data)),
        Err(e) => Ok(CommandResponse::error(e)),
    }
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[tauri::command]
pub async fn register(
    state: State<'_, AppState>,
    request: RegisterRequest,
) -> Result<CommandResponse<User>, String> {
    let db = state.db.write().unwrap();
    match db.create_user(&request.username, &request.password) {
        Ok(user) => Ok(CommandResponse::success(user)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn login(
    state: State<'_, AppState>,
    request: LoginRequest,
) -> Result<CommandResponse<User>, String> {
    let db = state.db.read().unwrap();
    match db.authenticate_user(&request.username, &request.password) {
        Ok(user) => Ok(CommandResponse::success(user)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn store_document(
    state: State<'_, AppState>,
    user_id: String,
    file_path: String,
) -> Result<CommandResponse<Document>, String> {
    let db = state.db.write().unwrap();
    let filename = std::path::PathBuf::from(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    match db.store_document(&user_id, &filename, &file_path) {
        Ok(doc) => Ok(CommandResponse::success(doc)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn get_user_documents(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<CommandResponse<Vec<Document>>, String> {
    let db = state.db.read().unwrap();
    match db.get_user_documents(&user_id) {
        Ok(docs) => Ok(CommandResponse::success(docs)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn list_users(
    state: State<'_, AppState>,
) -> Result<CommandResponse<Vec<User>>, String> {
    let db = state.db.read().unwrap();
    match db.list_users() {
        Ok(users) => Ok(CommandResponse::success(users)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn get_db_path(
    app_handle: tauri::AppHandle,
) -> Result<CommandResponse<String>, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?;
    
    let db_path = app_dir.join("finance.db");
    let path_str = db_path
        .to_str()
        .ok_or_else(|| "Failed to convert path to string".to_string())?
        .to_string();
    
    Ok(CommandResponse::success(path_str))
}

#[tauri::command]
pub async fn store_statement_data(
    state: State<'_, AppState>,
    user_id: String,
    file_path: String,
    start_date: String,
    end_date: String,
    transactions: Vec<Transaction>,
) -> Result<CommandResponse<()>, String> {
    let db = state.db.write().unwrap();
    match db.store_statement(&user_id, &file_path, &start_date, &end_date)
        .and_then(|statement_id| db.store_transactions(&statement_id, &transactions))
    {
        Ok(_) => Ok(CommandResponse::success(())),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn get_user_transactions(
    state: State<'_, AppState>,
    user_id: String,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<CommandResponse<Vec<Transaction>>, String> {
    let db = state.db.read().unwrap();
    match db.get_user_transactions(&user_id, start_date, end_date) {
        Ok(transactions) => Ok(CommandResponse::success(transactions)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn get_user_statements(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<CommandResponse<Vec<Statement>>, String> {
    let db = state.db.read().unwrap();
    match db.get_user_statements(&user_id) {
        Ok(statements) => Ok(CommandResponse::success(statements)),
        Err(e) => Ok(CommandResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn get_statement_transactions(
    state: State<'_, AppState>,
    statement_id: String,
) -> Result<CommandResponse<Vec<Transaction>>, String> {
    println!("Fetching transactions for statement: {}", statement_id);
    let db = state.db.read().unwrap();
    match (*db).get_statement_transactions(&statement_id) {
        Ok(transactions) => {
            println!("Found {} transactions", transactions.len());
            println!("First few transactions: {:?}", &transactions.iter().take(3).collect::<Vec<_>>());
            Ok(CommandResponse::success(transactions))
        },
        Err(e) => {
            println!("Error fetching transactions: {}", e);
            Ok(CommandResponse::error(e.to_string()))
        },
    }
}