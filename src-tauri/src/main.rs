#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;
mod pdf_processor;
mod state;

use std::sync::RwLock;
use commands::{
    register, 
    login, 
    store_document, 
    get_user_documents, 
    list_users, 
    process_statement,
    get_db_path,
    store_statement_data,
    get_user_transactions,
    get_user_statements,
    get_statement_transactions,
};
use state::AppState;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path_resolver()
                .app_data_dir()
                .expect("Failed to get app data directory");
            
            std::fs::create_dir_all(&app_dir)
                .expect("Failed to create app data directory");
            
            let db_path = app_dir.join("finance.db");
            let db = db::Database::new(&db_path)
                .expect("Failed to initialize database");
            
            app.manage(AppState {
                db: RwLock::new(db),
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            register,
            login,
            store_document,
            get_user_documents,
            list_users,
            process_statement,
            get_db_path,
            store_statement_data,
            get_user_transactions,
            get_user_statements,
            get_statement_transactions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}