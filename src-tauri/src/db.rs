// src-tauri/src/db.rs
use rusqlite::{Result, params};
use std::path::Path;
use bcrypt::{hash, verify, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use thiserror::Error;
use crate::pdf_processor::Transaction;
use r2d2_sqlite::SqliteConnectionManager;
use r2d2::Pool;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("Connection pool error: {0}")]
    Pool(#[from] r2d2::Error),
    #[error("Password hashing error: {0}")]
    Bcrypt(#[from] bcrypt::BcryptError),
    #[error("Authentication failed")]
    AuthError,
    #[error("Date parsing error: {0}")]
    DateError(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub user_id: String,
    pub filename: String,
    pub file_path: String,
    pub uploaded_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Statement {
    pub id: String,
    pub user_id: String,
    pub file_path: String,
    pub start_date: String,
    pub end_date: String,
    pub uploaded_at: String,
}

#[allow(dead_code)]
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, DbError> {
        let manager = SqliteConnectionManager::file(path);
        let pool = Pool::new(manager)?;
        
        let conn = pool.get()?;
        
        // Create tables if they don't exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS statements (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                document_id TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                statement_id TEXT NOT NULL,
                posting_date TEXT NOT NULL,
                transaction_date TEXT NOT NULL,
                description TEXT NOT NULL,
                money_in TEXT,
                money_out TEXT,
                balance TEXT NOT NULL,
                category TEXT,
                transaction_type TEXT NOT NULL,
                FOREIGN KEY (statement_id) REFERENCES statements(id)
            )",
            [],
        )?;

        Ok(Database { pool })
    }

    pub fn list_users(&self) -> Result<Vec<User>, DbError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, username, created_at FROM users ORDER BY created_at DESC"
        )?;
        
        let users = stmt.query_map([], |row| {
            let created_at_str: String = row.get(2)?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                    0,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                ))?
                .with_timezone(&Utc);

            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                created_at,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(users)
    }

    pub fn create_user(&self, username: &str, password: &str) -> Result<User, DbError> {
        let password_hash = hash(password.as_bytes(), DEFAULT_COST)?;
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        self.pool.get()?.execute(
            "INSERT INTO users (id, username, password_hash, created_at) VALUES (?1, ?2, ?3, ?4)",
            [&user_id, username, &password_hash, &now.to_rfc3339()],
        )?;

        Ok(User {
            id: user_id,
            username: username.to_string(),
            created_at: now,
        })
    }

    pub fn authenticate_user(&self, username: &str, password: &str) -> Result<User, DbError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, password_hash, created_at FROM users WHERE username = ?1"
        )?;
        
        let (id, hash, created_at): (String, String, String) = stmt.query_row([username], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
            ))
        }).map_err(|_| DbError::AuthError)?;

        if !verify(password.as_bytes(), &hash)? {
            return Err(DbError::AuthError);
        }

        let created_at = match DateTime::parse_from_rfc3339(&created_at) {
            Ok(dt) => dt.with_timezone(&Utc),
            Err(e) => return Err(DbError::DateError(e.to_string())),
        };

        Ok(User {
            id,
            username: username.to_string(),
            created_at,
        })
    }

    pub fn store_document(&self, user_id: &str, filename: &str, file_path: &str) -> Result<Document, DbError> {
        let doc_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        self.pool.get()?.execute(
            "INSERT INTO documents (id, user_id, filename, file_path, uploaded_at) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                &doc_id,
                user_id,
                filename,
                file_path,
                &now.to_rfc3339(),
            ],
        )?;

        Ok(Document {
            id: doc_id,
            user_id: user_id.to_string(),
            filename: filename.to_string(),
            file_path: file_path.to_string(),
            uploaded_at: now,
        })
    }

    pub fn get_user_documents(&self, user_id: &str) -> Result<Vec<Document>, DbError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, filename, file_path, uploaded_at 
             FROM documents 
             WHERE user_id = ?1 
             ORDER BY uploaded_at DESC"
        )?;

        let docs = stmt.query_map([user_id], |row| {
            let uploaded_at_str: String = row.get(3)?;
            let uploaded_at = DateTime::parse_from_rfc3339(&uploaded_at_str)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                    0,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                ))?
                .with_timezone(&Utc);

            Ok(Document {
                id: row.get(0)?,
                user_id: user_id.to_string(),
                filename: row.get(1)?,
                file_path: row.get(2)?,
                uploaded_at,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(docs)
    }

    pub fn store_statement(
        &self,
        user_id: &str,
        file_path: &str,
        start_date: &str,
        end_date: &str,
    ) -> Result<String, DbError> {
        let mut conn = self.pool.get()?;
        let tx = conn.transaction()?;

        // First store the document
        let document_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO documents (id, user_id, filename, file_path) VALUES (?, ?, ?, ?)",
            params![
                &document_id,
                user_id,
                Path::new(file_path).file_name().and_then(|n| n.to_str()).unwrap_or("unknown"),
                file_path,
            ],
        )?;

        // Then store the statement
        let statement_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO statements (id, user_id, document_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
            params![&statement_id, user_id, &document_id, start_date, end_date],
        )?;

        tx.commit()?;
        Ok(statement_id)
    }

    pub fn store_transactions(&self, statement_id: &str, transactions: &[Transaction]) -> Result<(), DbError> {
        let mut conn = self.pool.get()?;
        let tx = conn.transaction()?;

        let mut stmt = tx.prepare(
            "INSERT INTO transactions (
                id, 
                statement_id, 
                posting_date,
                transaction_date,
                description, 
                money_in,
                money_out,
                balance,
                category,
                transaction_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )?;

        for transaction in transactions {
            let transaction_id = Uuid::new_v4().to_string();
            stmt.execute(params![
                &transaction_id,
                statement_id,
                &transaction.posting_date,
                &transaction.transaction_date,
                &transaction.description,
                &transaction.money_in.map(|v| v.to_string()),
                &transaction.money_out.map(|v| v.to_string()),
                &transaction.balance.to_string(),
                &transaction.category.as_deref().unwrap_or_default(),
                &transaction.transaction_type,
            ])?;
        }

        drop(stmt);
        tx.commit()?;
        Ok(())
    }

    pub fn get_user_transactions(&self, user_id: &str, start_date: Option<String>, end_date: Option<String>) -> Result<Vec<Transaction>, DbError> {
        println!("Getting transactions with dates: start={:?}, end={:?}", start_date, end_date);
        
        let conn = self.pool.get()?;
        
        let mut query = String::from(
            "SELECT 
                t.posting_date,
                t.transaction_date,
                t.description,
                t.money_in,
                t.money_out,
                t.balance,
                t.category,
                t.transaction_type
            FROM transactions t
            JOIN statements s ON t.statement_id = s.id
            WHERE s.user_id = ?"
        );
        
        let mut params: Vec<&str> = vec![user_id];
        
        if let Some(start) = &start_date {
            query.push_str(" AND substr(t.transaction_date, 1, 10) >= ?");
            params.push(start);
            println!("Added start date filter: {}", start);
        }
        
        if let Some(end) = &end_date {
            query.push_str(" AND substr(t.transaction_date, 1, 10) <= ?");
            params.push(end);
            println!("Added end date filter: {}", end);
        }
        
        query.push_str(" ORDER BY substr(t.transaction_date, 1, 10) DESC, substr(t.transaction_date, 12) DESC");
        
        println!("Final SQL query: {}", query);
        println!("Query parameters: {:?}", params);
        
        let mut stmt = conn.prepare(&query)?;
        
        let transactions = stmt.query_map(rusqlite::params_from_iter(params), |row| {
            Ok(Transaction {
                posting_date: row.get(0)?,
                transaction_date: row.get(1)?,
                description: row.get(2)?,
                money_in: row.get::<_, Option<String>>(3)?.map(|s| s.parse().unwrap_or(0.0)),
                money_out: row.get::<_, Option<String>>(4)?.map(|s| s.parse().unwrap_or(0.0)),
                balance: row.get::<_, String>(5)?.parse().unwrap_or(0.0),
                category: row.get(6)?,
                transaction_type: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        println!("Found {} transactions", transactions.len());
        Ok(transactions)
    }

    pub fn get_user_statements(&self, user_id: &str) -> Result<Vec<Statement>, DbError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, document_id, start_date, end_date, uploaded_at 
             FROM statements 
             WHERE user_id = ? 
             ORDER BY uploaded_at DESC"
        )?;

        let statements = stmt.query_map([user_id], |row| {
            Ok(Statement {
                id: row.get(0)?,
                user_id: row.get(1)?,
                file_path: row.get(2)?,
                start_date: row.get(3)?,
                end_date: row.get(4)?,
                uploaded_at: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(statements)
    }

    pub fn get_statement_transactions(&self, statement_id: &str) -> Result<Vec<Transaction>, DbError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare(
            "SELECT posting_date, transaction_date, description, money_in, money_out, balance, category, transaction_type
             FROM transactions 
             WHERE statement_id = ? 
             ORDER BY strftime('%Y-%m-%d', replace(posting_date, '/', '-')) DESC"
        )?;

        let transactions = stmt.query_map([statement_id], |row| {
            Ok(Transaction {
                posting_date: row.get(0)?,
                transaction_date: row.get(1)?,
                description: row.get(2)?,
                money_in: row.get::<_, Option<String>>(3)?.map(|s| s.parse().unwrap_or(0.0)),
                money_out: row.get::<_, Option<String>>(4)?.map(|s| s.parse().unwrap_or(0.0)),
                balance: row.get::<_, String>(5)?.parse().unwrap_or(0.0),
                category: row.get(6)?,
                transaction_type: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(transactions)
    }
}