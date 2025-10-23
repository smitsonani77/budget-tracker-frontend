import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category } from '../models/Category.modal';
import { Observable } from 'rxjs';
import { isEmpty } from 'lodash';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api`;

  private categories: Category[] = [];

  constructor(private http: HttpClient) {}

  /**
   * Get all categories from API
   */
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl + '/categories');
  }

  /**
   * Get all category names
   */
  getAllCategoryNames(): string[] {
    return this.categories.map((cat) => cat.name);
  }

  /**
   * Get categories by type
   */
  getCategoriesByType(type: 'income' | 'expense', categories?: any): string[] {
    let data = this.categories;
    if (isEmpty(data)) {
      data = categories;
    }

    return data
      .filter((cat: any) => cat.type === type)
      .map((cat: any) => cat.name);
  }

  /**
   * Get full category objects by type
   */
  getCategoriesByTypeFull(type: 'income' | 'expense'): Category[] {
    return this.categories.filter((cat) => cat.type === type);
  }

  /**
   * Get income categories
   */
  getIncomeCategories(): string[] {
    return this.getCategoriesByType('income');
  }

  /**
   * Get expense categories
   */
  getExpenseCategories(): string[] {
    return this.getCategoriesByType('expense');
  }

  /**
   * Get category by name
   */
  getCategoryByName(name: string): Category | undefined {
    return this.categories.find((cat) => cat.name === name);
  }

  /**
   * Get category type
   */
  getCategoryType(name: string): 'income' | 'expense' | undefined {
    const category = this.getCategoryByName(name);
    return category?.type;
  }

  /**
   * Add a new custom category
   */
  addCustomCategory(
    name: string,
    type: 'income' | 'expense',
    description: string = ''
  ): void {
    const newCategory: Category = {
      name,
      type,
      description,
    };

    // Check if category already exists
    if (!this.categories.find((cat) => cat.name === name)) {
      this.categories.push(newCategory);
      this.saveToLocalStorage();
    }
  }

  /**
   * Remove a custom category
   */
  removeCustomCategory(name: string): void {
    const index = this.categories.findIndex((cat) => cat.name === name);
    if (index !== -1) {
      // Only remove custom categories (not predefined ones)
      const predefinedCategories = this.getPredefinedCategoryNames();
      if (!predefinedCategories.includes(name)) {
        this.categories.splice(index, 1);
        this.saveToLocalStorage();
      }
    }
  }

  /**
   * Update category details
   */
  updateCategory(name: string, updates: Partial<Category>): void {
    const category = this.getCategoryByName(name);
    if (category) {
      Object.assign(category, updates);
      this.saveToLocalStorage();
    }
  }

  /**
   * Get predefined category names (non-custom)
   */
  getPredefinedCategoryNames(): string[] {
    const predefinedCategories = [
      'Salary',
      'Freelance',
      'Investment',
      'Bonus',
      'Gift',
      'Other Income',
      'Groceries',
      'Entertainment',
      'Utilities',
      'Transportation',
      'Healthcare',
      'Dining',
      'Shopping',
      'Education',
      'Travel',
      'Rent/Mortgage',
      'Insurance',
      'Savings',
      'Other Expenses',
    ];
    return predefinedCategories;
  }

  /**
   * Check if category is custom
   */
  isCustomCategory(name: string): boolean {
    return !this.getPredefinedCategoryNames().includes(name);
  }

  /**
   * Get categories with statistics
   */
  getCategoriesWithStats(
    transactions: any[]
  ): { category: Category; total: number; count: number }[] {
    const categoryStats = new Map<string, { total: number; count: number }>();

    transactions.forEach((transaction) => {
      const { category, amount } = transaction;
      if (categoryStats.has(category)) {
        const stats = categoryStats.get(category)!;
        stats.total += amount;
        stats.count += 1;
      } else {
        categoryStats.set(category, { total: amount, count: 1 });
      }
    });

    return Array.from(categoryStats.entries())
      .map(([name, stats]) => ({
        category: this.getCategoryByName(name)!,
        total: stats.total,
        count: stats.count,
      }))
      .filter((item) => item.category !== undefined);
  }

  /**
   * Generate random color for custom categories
   */
  private getRandomColor(): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#85C1E9',
      '#D7BDE2',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Save categories to localStorage
   */
  private saveToLocalStorage(): void {
    localStorage.setItem(
      'budget-tracker-categories',
      JSON.stringify(this.categories)
    );
  }
}
