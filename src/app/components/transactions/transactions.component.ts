import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Transaction,
  TransactionService,
  TransactionsResponse,
} from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  transactionForm: FormGroup;
  isEditing: boolean = false;
  currentPage: number = 1;
  totalPages: number = 1;
  limit: number = 10;
  total: number = 0;
  isLoading: boolean = false;
  showTransactionForm: boolean = false;

  // Filter properties
  filters = {
    category: '',
    type: '',
    startDate: '',
    endDate: '',
  };

  categories: any = [];
  filteredCategories: string[] = [];

  // Statistics
  totalIncome: number = 0;
  totalExpenses: number = 0;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.transactionForm = this.createForm();
  }

  async ngOnInit(): Promise<void> {
    this.loadTransactions();
    this.loadCategories();
  }

  createForm(): FormGroup {
    return this.fb.group({
      _id: '',
      type: ['expense', Validators.required],
      category: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: [''],
      date: [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService
      .getTransactions(this.currentPage, this.limit, this.filters)
      .subscribe({
        next: (response: TransactionsResponse) => {
          this.transactions = response.transactions;
          this.totalPages = response.totalPages;
          this.total = response.total;
          this.calculateStatistics();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.isLoading = false;
        },
      });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe((res: any) => {
      this.categories = res.categories;
      this.updateFilteredCategories();
    });
  }

  updateFilteredCategories(): void {
    const type = this.transactionForm.get('type')?.value ?? 'expense';
    this.filteredCategories = this.categoryService.getCategoriesByType(
      type,
      this.categories
    );
  }

  onTypeChange(): void {
    this.updateFilteredCategories();
    // Reset category when type changes
    this.transactionForm.patchValue({ category: '' });
  }

  calculateStatistics(): void {
    this.totalIncome = this.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalExpenses = this.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.isLoading = true;
      const formValue = this.transactionForm.value;

      if (this.isEditing && formValue._id) {
        this.transactionService
          .updateTransaction(formValue._id, formValue)
          .subscribe({
            next: () => {
              this.resetForm();
              this.loadTransactions();
              this.closeTransactionForm();
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error updating transaction:', error);
              this.isLoading = false;
            },
          });
      } else {
        this.transactionService.addTransaction(formValue).subscribe({
          next: () => {
            this.resetForm();
            this.loadTransactions();
            this.closeTransactionForm();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding transaction:', error);
            this.isLoading = false;
          },
        });
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  editTransaction(transaction: Transaction): void {
    this.transactionForm.patchValue({
      ...transaction,
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
    this.isEditing = true;
    this.showTransactionForm = true;
    this.updateFilteredCategories();
  }

  deleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.isLoading = true;
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.isLoading = false;
        },
      });
    }
  }

  resetForm(): void {
    this.transactionForm.reset({
      type: 'expense',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
    this.isEditing = false;
    this.updateFilteredCategories();
  }

  closeTransactionForm(): void {
    this.showTransactionForm = false;
    this.resetForm();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filters = {
      category: '',
      type: '',
      startDate: '',
      endDate: '',
    };
    this.currentPage = 1;
    this.loadTransactions();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.transactionForm.controls).forEach((key) => {
      const control = this.transactionForm.get(key);
      control?.markAsTouched();
    });
  }
}
