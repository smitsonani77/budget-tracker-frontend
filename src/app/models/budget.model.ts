export interface Budget {
  _id?: string;
  user: string;
  month: Date;
  categories: { [category: string]: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BudgetData {
  budget: { [category: string]: number };
  actualExpenses: { [category: string]: number };
  month: Date;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  utilization: number; // percentage
  overBudgetCategories: string[];
  underBudgetCategories: string[];
}
