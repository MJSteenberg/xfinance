export interface Transaction {
    posting_date: string;
    transaction_date: string;
    description: string;
    money_in: number | null;
    money_out: number | null;
    balance: number;
    category: string | null;
    transaction_type: string;
}
  
  export interface StatementSummary {
    total_income: number;
    total_expenses: number;
    balance: number;
    start_date: string;
    end_date: string;
  }
  
  export interface StatementData {
    transactions: Transaction[];
    summary: StatementSummary;
  }