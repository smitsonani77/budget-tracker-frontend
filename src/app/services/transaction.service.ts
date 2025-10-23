// services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { omit } from 'lodash';

export interface Transaction {
  _id?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: Date;
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

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/api/transactions`;

  constructor(private http: HttpClient) {}

  getTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: {
      category?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<TransactionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof typeof filters];
        if (value) {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get<TransactionsResponse>(this.apiUrl, { params });
  }

  addTransaction(transaction: Transaction): Observable<any> {
    transaction = omit(transaction, '_id');
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  updateTransaction(
    id: string,
    transaction: Partial<Transaction>
  ): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, transaction);
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getFinancialSummary(filters?: {
    startDate?: string;
    endDate?: string;
  }): Observable<FinancialSummary> {
    let userData = JSON.parse(localStorage.getItem('user') || '{}');

    return this.http.post<FinancialSummary>(`${this.apiUrl}/summary`, {
      userId: userData._id,
    });
  }
}
