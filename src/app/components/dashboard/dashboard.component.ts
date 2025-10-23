import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  financialSummary: any = null;
  recentTransactions: any[] = [];
  isLoading: boolean = true;

  // ECharts options
  incomeExpenseChartOption: any = {};
  categoryChartOption: any = {};

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadFinancialSummary();
    this.loadRecentTransactions();
  }

  loadFinancialSummary(): void {
    this.isLoading = true;
    this.transactionService.getFinancialSummary().subscribe({
      next: (summary) => {
        this.financialSummary = summary;
        this.updateCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading summary:', error);
        this.isLoading = false;
      },
    });
  }

  loadRecentTransactions(): void {
    this.transactionService.getTransactions(1, 5).subscribe({
      next: (response) => {
        this.recentTransactions = response.transactions;
      },
      error: (error) => {
        console.error('Error loading recent transactions:', error);
      },
    });
  }

  // Helper methods for quick stats
  getIncomeCategoriesCount(): number {
    if (!this.financialSummary?.byCategory?.income) return 0;
    return Object.keys(this.financialSummary.byCategory.income).length;
  }

  getExpenseCategoriesCount(): number {
    if (!this.financialSummary?.byCategory?.expense) return 0;
    return Object.keys(this.financialSummary.byCategory.expense).length;
  }

  getUtilizationRate(): number {
    if (!this.financialSummary) return 0;
    const income = this.financialSummary.totalIncome || 0;
    const expenses = this.financialSummary.totalExpenses || 0;
    return income > 0 ? Math.round((expenses / income) * 100) : 0;
  }

  getSavingsRate(): number {
    if (!this.financialSummary) return 0;
    const income = this.financialSummary.totalIncome || 0;
    const balance = this.financialSummary.balance || 0;
    return income > 0 ? Math.round((balance / income) * 100) : 0;
  }

  updateCharts(): void {
    this.updateIncomeExpenseChart();
    this.updateCategoryChart();
  }

  updateIncomeExpenseChart(): void {
    this.incomeExpenseChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ${c} ({d}%)',
      },
      legend: {
        bottom: '5%',
        left: 'center',
      },
      series: [
        {
          name: 'Income vs Expenses',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            {
              value: this.financialSummary.totalIncome,
              name: 'Income',
              itemStyle: { color: '#10b981' },
            },
            {
              value: this.financialSummary.totalExpenses,
              name: 'Expenses',
              itemStyle: { color: '#ef4444' },
            },
          ],
        },
      ],
    };
  }

  updateCategoryChart(): void {
    const expenseCategories = this.financialSummary.byCategory?.expense || {};
    const categoryData = Object.entries(expenseCategories)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 8);

    this.categoryChartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}',
        },
      },
      yAxis: {
        type: 'category',
        data: categoryData.map((item) => item.name),
        axisLabel: {
          interval: 0,
          rotate: 30,
        },
      },
      series: [
        {
          name: 'Expenses',
          type: 'bar',
          data: categoryData.map((item) => ({
            value: item.value,
            itemStyle: {
              color: '#8b5cf6',
            },
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '${c}',
          },
        },
      ],
    };
  }
}
