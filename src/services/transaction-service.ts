import { Pool } from 'pg';
import { getDatabaseManager } from '../database/setup';

export interface Transaction {
  id?: number;
  account_id: number;
  plaid_transaction_id?: string;
  amount: number;
  description: string;
  category?: string;
  subcategory?: string;
  merchant_name?: string;
  transaction_date: Date;
  pending?: boolean;
  needs_categorization?: boolean;
  ai_suggested_category?: string;
  user_approved?: boolean;
}

export interface Account {
  id?: number;
  name: string;
  account_type: string;
  balance?: number;
  currency?: string;
  bank_name?: string;
  account_number_last4?: string;
  plaid_item_id?: string;
  plaid_account_id?: string;
}

export class TransactionService {
  private pool: Pool;

  constructor() {
    // Get the pool directly from the database manager
    this.pool = getDatabaseManager().getPool();
  }

  private async getPool(): Promise<Pool> {
    return this.pool;
  }

  async createAccount(account: Account): Promise<Account> {
    const result = await this.pool.query(
      `INSERT INTO accounts (name, account_type, balance, currency, bank_name, account_number_last4, plaid_item_id, plaid_account_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        account.name,
        account.account_type,
        account.balance || 0,
        account.currency || 'USD',
        account.bank_name,
        account.account_number_last4,
        account.plaid_item_id,
        account.plaid_account_id,
      ]
    );
    return result.rows[0];
  }

  async getAccounts(): Promise<Account[]> {
    const result = await this.pool.query('SELECT * FROM accounts ORDER BY created_at DESC');
    return result.rows;
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    const result = await this.pool.query(
      `INSERT INTO transactions (account_id, plaid_transaction_id, amount, description, category, subcategory, merchant_name, transaction_date, pending, needs_categorization, ai_suggested_category, user_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        transaction.account_id,
        transaction.plaid_transaction_id,
        transaction.amount,
        transaction.description,
        transaction.category,
        transaction.subcategory,
        transaction.merchant_name,
        transaction.transaction_date,
        transaction.pending || false,
        transaction.needs_categorization !== false, // Default to true
        transaction.ai_suggested_category,
        transaction.user_approved || false,
      ]
    );
    return result.rows[0];
  }

  async getTransactions(limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT t.*, a.name as account_name 
       FROM transactions t 
       JOIN accounts a ON t.account_id = a.id 
       ORDER BY t.transaction_date DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async getUncategorizedTransactions(): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT t.*, a.name as account_name 
       FROM transactions t 
       JOIN accounts a ON t.account_id = a.id 
       WHERE t.needs_categorization = true 
       ORDER BY t.transaction_date DESC`
    );
    return result.rows;
  }

  async updateTransactionCategory(transactionId: number, category: string, userApproved: boolean = true): Promise<Transaction> {
    const result = await this.pool.query(
      `UPDATE transactions 
       SET category = $1, needs_categorization = false, user_approved = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [category, userApproved, transactionId]
    );
    return result.rows[0];
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT t.*, a.name as account_name 
       FROM transactions t 
       JOIN accounts a ON t.account_id = a.id 
       WHERE t.transaction_date BETWEEN $1 AND $2 
       ORDER BY t.transaction_date DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT t.*, a.name as account_name 
       FROM transactions t 
       JOIN accounts a ON t.account_id = a.id 
       WHERE t.category = $1 
       ORDER BY t.transaction_date DESC`,
      [category]
    );
    return result.rows;
  }

  async getCategories(): Promise<{ name: string; category_type: string }[]> {
    const result = await this.pool.query(
      'SELECT name, category_type FROM categories WHERE is_active = true ORDER BY name'
    );
    return result.rows;
  }

  async getAccountSummary(): Promise<{
    total_accounts: number;
    total_balance: number;
    recent_transactions: number;
    uncategorized_transactions: number;
  }> {
    const accountsResult = await this.pool.query('SELECT COUNT(*) as count, SUM(balance) as total FROM accounts');
    const recentTransactionsResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE transaction_date >= CURRENT_DATE - INTERVAL \'7 days\''
    );
    const uncategorizedResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE needs_categorization = true'
    );

    return {
      total_accounts: parseInt(accountsResult.rows[0].count),
      total_balance: parseFloat(accountsResult.rows[0].total) || 0,
      recent_transactions: parseInt(recentTransactionsResult.rows[0].count),
      uncategorized_transactions: parseInt(uncategorizedResult.rows[0].count),
    };
  }

  // Helper method to create sample data for testing (QuickBooks Online format)
  async createSampleData(): Promise<void> {
    // Create sample accounts matching QuickBooks Online structure
    const checkingAccount = await this.createAccount({
      name: 'Business Checking',
      account_type: 'checking',
      balance: 15750.25,
      bank_name: 'First National Bank',
      account_number_last4: '8943',
    });

    const creditCard = await this.createAccount({
      name: 'Business Credit Card',
      account_type: 'credit_card',
      balance: -2847.92,
      bank_name: 'Chase Bank',
      account_number_last4: '5612',
    });

    // Create 20 sample transactions following QuickBooks Online standard format
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
      // Income transactions
      {
        account_id: checkingAccount.id!,
        amount: 3500.00,
        description: 'Payment from ABC Corp - Invoice #INV001',
        merchant_name: 'ABC Corp',
        transaction_date: new Date('2024-06-18'),
        category: 'Sales',
        subcategory: 'Product Sales',
        ai_suggested_category: 'Income',
        needs_categorization: false,
        user_approved: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: 2250.00,
        description: 'Consulting Services - XYZ LLC',
        merchant_name: 'XYZ LLC',
        transaction_date: new Date('2024-06-17'),
        ai_suggested_category: 'Consulting',
        needs_categorization: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: 1800.00,
        description: 'Monthly Retainer - Tech Solutions Inc',
        merchant_name: 'Tech Solutions Inc',
        transaction_date: new Date('2024-06-15'),
        ai_suggested_category: 'Consulting',
        needs_categorization: true,
      },
      
      // Office & Business Expenses
      {
        account_id: creditCard.id!,
        amount: -89.99,
        description: 'Microsoft 365 Business Premium',
        merchant_name: 'Microsoft',
        transaction_date: new Date('2024-06-19'),
        ai_suggested_category: 'Software',
        needs_categorization: true,
      },
      {
        account_id: creditCard.id!,
        amount: -124.50,
        description: 'Office Supplies - Staples Store #1234',
        merchant_name: 'Staples',
        transaction_date: new Date('2024-06-18'),
        ai_suggested_category: 'Office Supplies',
        needs_categorization: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: -450.00,
        description: 'Monthly Office Rent - June 2024',
        merchant_name: 'Downtown Properties LLC',
        transaction_date: new Date('2024-06-16'),
        ai_suggested_category: 'Rent',
        needs_categorization: true,
      },
      {
        account_id: creditCard.id!,
        amount: -67.89,
        description: 'Business Cards - VistaPrint',
        merchant_name: 'VistaPrint',
        transaction_date: new Date('2024-06-14'),
        ai_suggested_category: 'Marketing',
        needs_categorization: true,
      },
      
      // Travel & Transportation
      {
        account_id: creditCard.id!,
        amount: -325.00,
        description: 'Flight to Chicago - Business Travel',
        merchant_name: 'United Airlines',
        transaction_date: new Date('2024-06-13'),
        ai_suggested_category: 'Travel',
        needs_categorization: true,
      },
      {
        account_id: creditCard.id!,
        amount: -189.00,
        description: 'Hotel Stay - Chicago Marriott',
        merchant_name: 'Marriott Hotels',
        transaction_date: new Date('2024-06-12'),
        ai_suggested_category: 'Hotels',
        needs_categorization: true,
      },
      {
        account_id: creditCard.id!,
        amount: -45.30,
        description: 'Gas Station - Shell #5678',
        merchant_name: 'Shell',
        transaction_date: new Date('2024-06-11'),
        ai_suggested_category: 'Gas & Fuel',
        needs_categorization: true,
      },
      
      // Meals & Entertainment
      {
        account_id: creditCard.id!,
        amount: -78.45,
        description: 'Client Lunch - The Steakhouse',
        merchant_name: 'The Steakhouse',
        transaction_date: new Date('2024-06-10'),
        ai_suggested_category: 'Meals & Entertainment',
        needs_categorization: true,
      },
      {
        account_id: creditCard.id!,
        amount: -23.67,
        description: 'Coffee Meeting - Starbucks #9876',
        merchant_name: 'Starbucks',
        transaction_date: new Date('2024-06-09'),
        ai_suggested_category: 'Food & Dining',
        needs_categorization: true,
      },
      
      // Utilities & Communications
      {
        account_id: checkingAccount.id!,
        amount: -125.60,
        description: 'Business Internet - Comcast',
        merchant_name: 'Comcast',
        transaction_date: new Date('2024-06-08'),
        ai_suggested_category: 'Internet',
        needs_categorization: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: -89.50,
        description: 'Business Phone - Verizon Wireless',
        merchant_name: 'Verizon',
        transaction_date: new Date('2024-06-07'),
        ai_suggested_category: 'Phone',
        needs_categorization: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: -156.78,
        description: 'Electric Bill - June 2024',
        merchant_name: 'ConEd',
        transaction_date: new Date('2024-06-06'),
        ai_suggested_category: 'Utilities',
        needs_categorization: true,
      },
      
      // Professional Services
      {
        account_id: checkingAccount.id!,
        amount: -350.00,
        description: 'Accounting Services - Smith & Associates CPA',
        merchant_name: 'Smith & Associates',
        transaction_date: new Date('2024-06-05'),
        ai_suggested_category: 'Professional Services',
        needs_categorization: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: -250.00,
        description: 'Legal Consultation - Brown Law Firm',
        merchant_name: 'Brown Law Firm',
        transaction_date: new Date('2024-06-04'),
        ai_suggested_category: 'Legal & Professional',
        needs_categorization: true,
      },
      
      // Insurance & Banking
      {
        account_id: checkingAccount.id!,
        amount: -195.00,
        description: 'Business Insurance Premium - State Farm',
        merchant_name: 'State Farm',
        transaction_date: new Date('2024-06-03'),
        ai_suggested_category: 'Insurance',
        needs_categorization: true,
      },
      {
        account_id: checkingAccount.id!,
        amount: -25.00,
        description: 'Bank Service Fee - Monthly Maintenance',
        merchant_name: 'First National Bank',
        transaction_date: new Date('2024-06-02'),
        ai_suggested_category: 'Bank Charges',
        needs_categorization: true,
      },
      
      // Equipment & Software
      {
        account_id: creditCard.id!,
        amount: -299.00,
        description: 'Adobe Creative Suite - Annual Subscription',
        merchant_name: 'Adobe',
        transaction_date: new Date('2024-06-01'),
        ai_suggested_category: 'Software',
        needs_categorization: true,
      },
    ];

    for (const transaction of sampleTransactions) {
      await this.createTransaction(transaction);
    }

    console.log('✅ Sample data created successfully - 20 QuickBooks-style transactions');
  }
}