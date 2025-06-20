import { Pool } from 'pg';
import { config } from 'dotenv';

config();

export class DatabaseManager {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async setupDatabase(): Promise<void> {
    try {
      // Test connection
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connection established');

      // Create tables if they don't exist
      await this.createTables();
      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const createAccountsTable = `
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) NOT NULL,
        balance DECIMAL(12, 2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'USD',
        bank_name VARCHAR(255),
        account_number_last4 VARCHAR(4),
        plaid_item_id VARCHAR(255),
        plaid_account_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id),
        plaid_transaction_id VARCHAR(255) UNIQUE,
        amount DECIMAL(12, 2) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        merchant_name VARCHAR(255),
        transaction_date DATE NOT NULL,
        pending BOOLEAN DEFAULT FALSE,
        account_owner VARCHAR(255),
        iso_currency_code VARCHAR(3) DEFAULT 'USD',
        needs_categorization BOOLEAN DEFAULT TRUE,
        ai_suggested_category VARCHAR(100),
        user_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        parent_category VARCHAR(100),
        category_type VARCHAR(50) DEFAULT 'expense',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createUserPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_needs_categorization ON transactions(needs_categorization);
      CREATE INDEX IF NOT EXISTS idx_accounts_plaid_item ON accounts(plaid_item_id);
    `;

    await this.pool.query(createAccountsTable);
    await this.pool.query(createTransactionsTable);
    await this.pool.query(createCategoriesTable);
    await this.pool.query(createUserPreferencesTable);
    await this.pool.query(createIndexes);

    // Insert default categories
    await this.insertDefaultCategories();
  }

  private async insertDefaultCategories(): Promise<void> {
    const defaultCategories = [
      { name: 'Food & Dining', parent_category: null, category_type: 'expense' },
      { name: 'Restaurants', parent_category: 'Food & Dining', category_type: 'expense' },
      { name: 'Groceries', parent_category: 'Food & Dining', category_type: 'expense' },
      { name: 'Transportation', parent_category: null, category_type: 'expense' },
      { name: 'Gas & Fuel', parent_category: 'Transportation', category_type: 'expense' },
      { name: 'Public Transit', parent_category: 'Transportation', category_type: 'expense' },
      { name: 'Office Supplies', parent_category: null, category_type: 'expense' },
      { name: 'Software', parent_category: null, category_type: 'expense' },
      { name: 'Marketing', parent_category: null, category_type: 'expense' },
      { name: 'Travel', parent_category: null, category_type: 'expense' },
      { name: 'Hotels', parent_category: 'Travel', category_type: 'expense' },
      { name: 'Utilities', parent_category: null, category_type: 'expense' },
      { name: 'Internet', parent_category: 'Utilities', category_type: 'expense' },
      { name: 'Phone', parent_category: 'Utilities', category_type: 'expense' },
      { name: 'Income', parent_category: null, category_type: 'income' },
      { name: 'Sales', parent_category: 'Income', category_type: 'income' },
      { name: 'Consulting', parent_category: 'Income', category_type: 'income' },
    ];

    for (const category of defaultCategories) {
      await this.pool.query(
        `INSERT INTO categories (name, parent_category, category_type) 
         VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [category.name, category.parent_category, category.category_type]
      );
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Singleton instance
let databaseManager: DatabaseManager;

export async function setupDatabase(): Promise<void> {
  if (!databaseManager) {
    databaseManager = new DatabaseManager();
    await databaseManager.setupDatabase();
  }
}

export function getDatabaseManager(): DatabaseManager {
  if (!databaseManager) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return databaseManager;
}