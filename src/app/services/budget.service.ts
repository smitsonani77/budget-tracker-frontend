import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { Budget, BudgetData, BudgetSummary } from '../models/budget.model';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budget`;

  constructor(private http: HttpClient) {}

  /**
   * Get current month's budget data
   */
  getCurrentBudget(): Observable<BudgetData> {
    return this.http
      .get<BudgetData>(`${this.apiUrl}/current`)
      .pipe(map((data) => this.transformBudgetData(data)));
  }

  /**
   * Get budget for a specific month
   */
  getBudgetByMonth(year: number, month: number): Observable<BudgetData> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http
      .get<BudgetData>(`${this.apiUrl}/month`, { params })
      .pipe(map((data) => this.transformBudgetData(data)));
  }

  /**
   * Update budget for current month
   */
  updateBudget(categories: { [category: string]: number }): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, { categories });
  }

  /**
   * Set budget for a specific category
   */
  setCategoryBudget(category: string, amount: number): Observable<Budget> {
    return this.http.patch<Budget>(`${this.apiUrl}/category`, {
      category,
      amount,
    });
  }

  /**
   * Get budget history (last 6 months)
   */
  getBudgetHistory(): Observable<BudgetData[]> {
    return this.http
      .get<BudgetData[]>(`${this.apiUrl}/history`)
      .pipe(map((data) => data.map((item) => this.transformBudgetData(item))));
  }

  /**
   * Get budget summary with calculations
   */
  getBudgetSummary(): Observable<BudgetSummary> {
    return this.getCurrentBudget().pipe(
      map((budgetData) => this.calculateBudgetSummary(budgetData))
    );
  }

  /**
   * Reset budget for current month
   */
  resetBudget(): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/reset`, {});
  }

  /**
   * Copy previous month's budget to current month
   */
  copyPreviousMonthBudget(): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/copy-previous`, {});
  }

  /**
   * Transform budget data from API
   */
  private transformBudgetData(data: any): BudgetData {
    return {
      budget: data.budget || {},
      actualExpenses: data.actualExpenses || {},
      month: new Date(data.month),
    };
  }

  /**
   * Calculate budget summary
   */
  private calculateBudgetSummary(budgetData: BudgetData): BudgetSummary {
    const totalBudget = Object.values(budgetData.budget).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const totalSpent = Object.values(budgetData.actualExpenses).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const remaining = totalBudget - totalSpent;
    const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const overBudgetCategories: string[] = [];
    const underBudgetCategories: string[] = [];

    Object.keys(budgetData.budget).forEach((category) => {
      const budget = budgetData.budget[category];
      const actual = budgetData.actualExpenses[category] || 0;

      if (actual > budget) {
        overBudgetCategories.push(category);
      } else if (actual <= budget * 0.8) {
        underBudgetCategories.push(category);
      }
    });

    return {
      totalBudget,
      totalSpent,
      remaining,
      utilization,
      overBudgetCategories,
      underBudgetCategories,
    };
  }

  /**
   * Calculate category utilization percentage
   */
  calculateCategoryUtilization(budget: number, actual: number): number {
    if (budget === 0) return 0;
    return (actual / budget) * 100;
  }

  /**
   * Check if category is over budget
   */
  isCategoryOverBudget(budget: number, actual: number): boolean {
    return actual > budget;
  }

  /**
   * Get category status
   */
  getCategoryStatus(
    budget: number,
    actual: number
  ): 'no-spend' | 'under-budget' | 'within-budget' | 'over-budget' {
    if (actual === 0) return 'no-spend';
    if (actual <= budget * 0.8) return 'under-budget';
    if (actual <= budget) return 'within-budget';
    return 'over-budget';
  }

  /**
   * Get recommended budget based on historical spending
   */
  getBudgetRecommendations(historicalData: any): {
    [category: string]: number;
  } {
    const recommendations: { [category: string]: number } = {};

    Object.keys(historicalData).forEach((category) => {
      const spending = historicalData[category];
      if (spending && spending.length > 0) {
        // Simple recommendation: average of last 3 months + 10%
        const avgSpending =
          spending.reduce((sum: number, val: number) => sum + val, 0) /
          spending.length;
        recommendations[category] = Math.round(avgSpending * 1.1);
      }
    });

    return recommendations;
  }
}
