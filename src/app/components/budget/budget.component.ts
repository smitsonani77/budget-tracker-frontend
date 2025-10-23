import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
})
export class BudgetComponent implements OnInit {
  budgetData: any = null;
  budgetForm: FormGroup;
  categories: string[] = [];
  isLoading: boolean = true;
  isEditing: boolean = false;

  // ECharts options
  budgetChartOption: EChartsOption = {};
  budgetVsActualOption: EChartsOption = {};

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.budgetForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadBudgetData();
    this.initializeCategories();
  }

  initializeCategories(): void {
    this.categories = this.categoryService.getExpenseCategories();

    // Initialize form controls for each category
    this.categories.forEach((category) => {
      this.budgetForm.addControl(
        category,
        this.fb.control(0, [Validators.required, Validators.min(0)])
      );
    });
  }

  loadBudgetData(): void {
    this.isLoading = true;
    this.budgetService.getCurrentBudget().subscribe({
      next: (data: any) => {
        this.budgetData = data;
        this.updateFormWithBudgetData();
        this.updateCharts();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading budget data:', error);
        this.isLoading = false;
      },
    });
  }

  updateFormWithBudgetData(): void {
    if (this.budgetData?.budget) {
      Object.keys(this.budgetData.budget).forEach((category) => {
        const control = this.budgetForm.get(category);
        if (control) {
          control.setValue(this.budgetData.budget[category]);
        }
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.updateFormWithBudgetData();
    }
  }

  saveBudget(): void {
    if (this.budgetForm.valid) {
      this.isLoading = true;
      const budgetData = this.budgetForm.value;

      this.budgetService.updateBudget(budgetData).subscribe({
        next: () => {
          this.isEditing = false;
          this.loadBudgetData();
        },
        error: (error: any) => {
          console.error('Error updating budget:', error);
          this.isLoading = false;
        },
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.updateFormWithBudgetData();
  }

  updateCharts(): void {
    this.updateBudgetAllocationChart();
    this.updateBudgetVsActualChart();
  }

  updateBudgetAllocationChart(): void {
    const categories = this.categories;
    const budgetData = categories.map(
      (category) => this.budgetData?.budget[category] || 0
    );

    this.budgetChartOption = {
      title: {
        text: 'Budget Allocation by Category',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ${c}',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        type: 'scroll',
      },
      series: [
        {
          name: 'Budget Allocation',
          type: 'pie',
          radius: '50%',
          data: categories.map((category, index) => ({
            name: category,
            value: budgetData[index],
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }

  updateBudgetVsActualChart(): void {
    const categories = this.categories.filter(
      (category) =>
        (this.budgetData?.budget[category] || 0) > 0 ||
        (this.budgetData?.actualExpenses[category] || 0) > 0
    );

    const budgetData = categories.map(
      (category) => this.budgetData?.budget[category] || 0
    );
    const actualData = categories.map(
      (category) => this.budgetData?.actualExpenses[category] || 0
    );

    // Calculate variance (percentage)
    const varianceData = categories.map((category, index) => {
      const budget = budgetData[index];
      const actual = actualData[index];
      if (budget === 0) return 0;
      return ((actual - budget) / budget) * 100;
    });

    this.budgetVsActualOption = {
      title: {
        text: 'Budget vs Actual Expenses',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Budget', 'Actual', 'Variance %'],
        bottom: 'bottom',
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Amount ($)',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Variance %',
          position: 'right',
          axisLabel: {
            formatter: '{value}%',
          },
        },
      ],
      series: [
        {
          name: 'Budget',
          type: 'bar',
          data: budgetData,
          itemStyle: {
            color: '#5470c6',
          },
        },
        {
          name: 'Actual',
          type: 'bar',
          data: actualData,
          itemStyle: {
            color: '#91cc75',
          },
        },
        {
          name: 'Variance %',
          type: 'line',
          yAxisIndex: 1,
          data: varianceData,
          itemStyle: {
            color: '#ee6666',
          },
          lineStyle: {
            width: 3,
          },
        },
      ],
    };
  }

  getCategoryStatus(category: string): string {
    const budget = this.budgetData?.budget[category] || 0;
    const actual = this.budgetData?.actualExpenses[category] || 0;

    if (actual === 0) return 'no-spend';
    if (actual <= budget * 0.8) return 'under-budget';
    if (actual <= budget) return 'within-budget';
    return 'over-budget';
  }

  getRemainingBudget(category: string): number {
    const budget = this.budgetData?.budget[category] || 0;
    const actual = this.budgetData?.actualExpenses[category] || 0;
    return budget - actual;
  }

  getTotalBudget(): number {
    if (!this.budgetData?.budget) return 0;
    return Object.values(this.budgetData.budget).reduce(
      (sum: number, amount: any) => sum + amount,
      0
    );
  }

  getTotalActual(): number {
    if (!this.budgetData?.actualExpenses) return 0;
    return Object.values(this.budgetData.actualExpenses).reduce(
      (sum: number, amount: any) => sum + amount,
      0
    );
  }

  getTotalRemaining(): number {
    return this.getTotalBudget() - this.getTotalActual();
  }

  getStatusBadgeClass(category: string): string {
    const status = this.getCategoryStatus(category);
    switch (status) {
      case 'no-spend':
        return 'bg-no-spend';
      case 'under-budget':
        return 'bg-under-budget';
      case 'within-budget':
        return 'bg-within-budget';
      case 'over-budget':
        return 'bg-over-budget';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(category: string): string {
    const status = this.getCategoryStatus(category);
    switch (status) {
      case 'no-spend':
        return 'No Spending';
      case 'under-budget':
        return 'Under Budget';
      case 'within-budget':
        return 'Within Budget';
      case 'over-budget':
        return 'Over Budget';
      default:
        return 'Unknown';
    }
  }
}
