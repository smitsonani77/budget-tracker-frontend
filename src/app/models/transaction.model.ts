export interface Transaction {
  _id?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: {
    income?: { [category: string]: number };
    expense?: { [category: string]: number };
  };
}
