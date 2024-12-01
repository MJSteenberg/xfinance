use std::sync::RwLock;
use crate::db::Database;

pub struct AppState {
    pub db: RwLock<Database>,
}