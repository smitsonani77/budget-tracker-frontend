export class DateUtils {
  static getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }

  static formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static getMonthName(date: Date): string {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
}
