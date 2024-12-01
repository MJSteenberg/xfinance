use serde::{Deserialize, Serialize};
use std::path::Path;
use pdf_extract::extract_text;
use regex::Regex;
use std::fs::File;
use chrono::NaiveDate;
use csv;

#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub posting_date: String,
    pub transaction_date: String,
    pub description: String,
    pub money_in: Option<f64>,
    pub money_out: Option<f64>,
    pub balance: f64,
    pub category: Option<String>,
    pub transaction_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatementData {
    pub transactions: Vec<Transaction>,
    pub summary: StatementSummary,
    pub account_number: String,
    pub statement_period: StatementPeriod,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatementPeriod {
    pub from_date: String,
    pub to_date: String,
    pub print_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatementSummary {
    pub total_income: f64,
    pub total_expenses: f64,
    pub balance: f64,
    pub start_date: String,
    pub end_date: String,
}

pub fn process_pdf_content(file_path: &str) -> Result<StatementData, String> {
    // Extract text from PDF
    let text = extract_text(Path::new(file_path))
        .map_err(|e| format!("Failed to extract text from PDF: {}", e))?;

    // Debug: Print extracted text
    println!("Extracted text from PDF:");
    println!("------------------------");
    println!("{}", text);
    println!("------------------------");

    // Extract account number
    let account_number = extract_account_number(&text)?;
    
    // Extract statement period
    let statement_period = extract_statement_period(&text)?;

    // Parse transactions
    let transactions = parse_capitec_transactions(&text)?;

    // Calculate summary
    let (total_income, total_expenses) = transactions.iter()
        .fold((0.0, 0.0), |(income, expenses), t| {
            if t.money_in.is_some() {
                (income + t.money_in.unwrap(), expenses)
            } else if t.money_out.is_some() {
                (income, expenses + t.money_out.unwrap().abs())
            } else {
                (income, expenses)
            }
        });

    let balance = transactions.last()
        .map(|t| t.balance)
        .unwrap_or(0.0);

    Ok(StatementData {
        transactions,
        summary: StatementSummary {
            total_income,
            total_expenses,
            balance,
            start_date: statement_period.from_date.clone(),
            end_date: statement_period.to_date.clone(),
        },
        account_number,
        statement_period,
    })
}

pub fn process_csv_content(file_path: &str) -> Result<StatementData, String> {
    let file = File::open(file_path).map_err(|e| format!("Failed to open CSV file: {}", e))?;
    let mut rdr = csv::ReaderBuilder::new()
        .flexible(true)  // Allow flexible number of fields
        .trim(csv::Trim::All)  // Trim whitespace
        .from_reader(file);
    
    let mut transactions = Vec::new();
    let mut earliest_date: Option<String> = None;
    let mut latest_date: Option<String> = None;

    for result in rdr.records() {
        let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;
        
        // Skip rows that don't have enough fields
        if record.len() < 8 {
            continue;
        }

        // Try to get each field safely
        let posting_date = record.get(2).unwrap_or("").trim().to_string();
        let transaction_date = record.get(3).unwrap_or("").trim().to_string();
        let description = record.get(4).unwrap_or("").trim().to_string();
        let money_in = record.get(7)
            .and_then(|s| s.trim().parse::<f64>().ok());
        let money_out = record.get(8)
            .and_then(|s| s.trim().parse::<f64>().ok());
        let balance = record.get(10)
            .and_then(|s| s.trim().parse::<f64>().ok())
            .unwrap_or(0.0);

        // Update date range
        if let Some(date) = parse_date(&posting_date) {
            match earliest_date {
                None => earliest_date = Some(posting_date.clone()),
                Some(ref early) => {
                    if let Some(early_date) = parse_date(early) {
                        if date < early_date {
                            earliest_date = Some(posting_date.clone());
                        }
                    }
                }
            }

            match latest_date {
                None => latest_date = Some(posting_date.clone()),
                Some(ref late) => {
                    if let Some(late_date) = parse_date(late) {
                        if date > late_date {
                            latest_date = Some(posting_date.clone());
                        }
                    }
                }
            }
        }

        let transaction = Transaction {
            posting_date,
            transaction_date,
            description,
            money_in,
            money_out,
            balance,
            category: record.get(6).map(|s| s.trim().to_string()),
            transaction_type: "UNKNOWN".to_string(),
        };

        transactions.push(transaction);
    }

    Ok(StatementData {
        summary: StatementSummary {
            start_date: earliest_date.clone().unwrap_or_default(),
            end_date: latest_date.clone().unwrap_or_default(),
            total_income: transactions.iter().filter_map(|t| t.money_in).sum(),
            total_expenses: transactions.iter().filter_map(|t| t.money_out).sum(),
            balance: transactions.last().map(|t| t.balance).unwrap_or(0.0),
        },
        account_number: "CSV-IMPORT".to_string(),
        statement_period: StatementPeriod {
            from_date: earliest_date.unwrap_or_default(),
            to_date: latest_date.clone().unwrap_or_default(),
            print_date: latest_date.unwrap_or_default(),
        },
        transactions,
    })
}

fn parse_date(date_str: &str) -> Option<NaiveDate> {
    // Try DD/MM/YYYY format
    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%d/%m/%Y") {
        return Some(date);
    }
    
    // Try YYYY-MM-DD format
    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        return Some(date);
    }
    
    None
}

fn extract_account_number(text: &str) -> Result<String, String> {
    let account_pattern = Regex::new(r"Account\s*Number:\s*(\d+)")
        .map_err(|_| "Failed to create account number regex".to_string())?;
    
    println!("Searching for account number in text: {}", text); // Debug print
    
    account_pattern.captures(text)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
        .ok_or_else(|| "Could not find account number".to_string())
}

fn extract_statement_period(text: &str) -> Result<StatementPeriod, String> {
    let date_pattern = Regex::new(r"From Date:\s*(\d{2}/\d{2}/\d{4}).*?To Date:\s*(\d{2}/\d{2}/\d{4}).*?Print Date:\s*(\d{2}/\d{2}/\d{4})")
        .map_err(|_| "Failed to create statement period regex".to_string())?;
    
    println!("Searching for dates in text: {}", text); // Debug print
    
    if let Some(cap) = date_pattern.captures(text) {
        Ok(StatementPeriod {
            from_date: cap.get(1).map(|m| m.as_str().to_string()).unwrap(),
            to_date: cap.get(2).map(|m| m.as_str().to_string()).unwrap(),
            print_date: cap.get(3).map(|m| m.as_str().to_string()).unwrap(),
        })
    } else {
        // Try alternative format
        let alt_pattern = Regex::new(r"From\s+Date:\s*(\d{2}/\d{2}/\d{4})\s*To\s+Date:\s*(\d{2}/\d{2}/\d{4})\s*Print\s+Date:\s*(\d{2}/\d{2}/\d{4})")
            .map_err(|_| "Failed to create alternative statement period regex".to_string())?;
            
        if let Some(cap) = alt_pattern.captures(text) {
            Ok(StatementPeriod {
                from_date: cap.get(1).map(|m| m.as_str().to_string()).unwrap(),
                to_date: cap.get(2).map(|m| m.as_str().to_string()).unwrap(),
                print_date: cap.get(3).map(|m| m.as_str().to_string()).unwrap(),
            })
        } else {
            Err("Could not find statement period in expected format".to_string())
        }
    }
}

fn parse_capitec_transactions(text: &str) -> Result<Vec<Transaction>, String> {
    let mut transactions = Vec::new();
    
    // Updated pattern to handle transactions with and without transaction date
    let transaction_pattern = Regex::new(r"(\d{2}/\d{2}/\d{4})\s+(?:(\d{2}/\d{2}/\d{4})\s+)?([^0-9\n].*?)\s+(-\d+\.\d{2}|\d+\.\d{2})\s+(\d+(?:[\s,]\d{3})*\.\d{2})")
        .map_err(|e| format!("Failed to create transaction regex: {}", e))?;

    println!("\n=== Transaction Parsing Debug ===");
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('*') || trimmed.starts_with("Available Balance:") { 
            continue; 
        }
        
        println!("\nProcessing line: {}", trimmed);
        
        if let Some(cap) = transaction_pattern.captures(trimmed) {
            println!("Match found! Groups:");
            println!("  Posting Date: {}", cap.get(1).map_or("", |m| m.as_str()));
            println!("  Transaction Date: {}", cap.get(2).map_or(cap.get(1).map_or("", |m| m.as_str()), |m| m.as_str()));
            println!("  Description: {}", cap.get(3).map_or("", |m| m.as_str().trim()));
            println!("  Amount: {}", cap.get(4).map_or("", |m| m.as_str()));
            println!("  Balance: {}", cap.get(5).map_or("", |m| m.as_str()));
            
            let amount = cap.get(4)
                .map(|m| m.as_str().replace(",", "").parse::<f64>().unwrap_or(0.0))
                .unwrap_or(0.0);

            transactions.push(Transaction {
                posting_date: cap.get(1).map(|m| m.as_str().to_string()).unwrap(),
                transaction_date: cap.get(2)
                    .map(|m| m.as_str().to_string())
                    .unwrap_or_else(|| cap.get(1).map(|m| m.as_str().to_string()).unwrap()),
                description: cap.get(3).map(|m| m.as_str().trim().to_string()).unwrap(),
                money_in: if amount > 0.0 { Some(amount) } else { None },
                money_out: if amount < 0.0 { Some(-amount) } else { None },
                balance: cap.get(5).map(|m| m.as_str().replace([',', ' '], "").parse::<f64>().unwrap_or(0.0)).unwrap(),
                category: None,
                transaction_type: if amount > 0.0 { "credit".to_string() } else { "debit".to_string() },
            });
        } else {
            println!("No match found. Regex pattern didn't match line format.");
        }
    }

    println!("\nFound {} transactions", transactions.len());
    println!("=== End Transaction Parsing ===\n");

    if transactions.is_empty() {
        return Err("No transactions found in the statement".to_string());
    }

    // Sort transactions by posting date
    transactions.sort_by(|a, b| {
        let parse_date = |date: &str| -> chrono::NaiveDate {
            chrono::NaiveDate::parse_from_str(date, "%d/%m/%Y").unwrap_or_else(|_| chrono::NaiveDate::from_ymd_opt(1970, 1, 1).unwrap())
        };
        parse_date(&b.posting_date).cmp(&parse_date(&a.posting_date))
    });

    Ok(transactions)
}