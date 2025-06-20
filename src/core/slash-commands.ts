import chalk from 'chalk';
import inquirer from 'inquirer';
import { TransactionService } from '../services/transaction-service';

interface SlashCommand {
  name: string;
  description: string;
  aliases?: string[];
  execute: () => Promise<void>;
}

export class SlashCommandProcessor {
  private commands: Map<string, SlashCommand> = new Map();
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
    this.registerCommands();
  }

  private registerCommands(): void {
    const commands: SlashCommand[] = [
      {
        name: 'help',
        description: 'Show available commands',
        aliases: ['h'],
        execute: this.showHelp.bind(this)
      },
      {
        name: 'status',
        description: 'Show account status and recent activity',
        aliases: ['s'],
        execute: this.showStatus.bind(this)
      },
      {
        name: 'transactions',
        description: 'List recent transactions',
        aliases: ['tx', 't'],
        execute: this.showTransactions.bind(this)
      },
      {
        name: 'categorize',
        description: 'Review and categorize uncategorized transactions',
        aliases: ['cat', 'c'],
        execute: this.categorizeTransactions.bind(this)
      },
      {
        name: 'connect',
        description: 'Connect bank accounts or services',
        aliases: ['conn'],
        execute: this.connectAccount.bind(this)
      },
      {
        name: 'export',
        description: 'Export financial data',
        aliases: ['exp'],
        execute: this.exportData.bind(this)
      },
      {
        name: 'settings',
        description: 'Manage application settings',
        aliases: ['config'],
        execute: this.showSettings.bind(this)
      }
    ];

    commands.forEach(cmd => {
      this.commands.set(cmd.name, cmd);
      if (cmd.aliases) {
        cmd.aliases.forEach(alias => this.commands.set(alias, cmd));
      }
    });
  }

  async process(input: string): Promise<void> {
    const commandName = input.slice(1).toLowerCase(); // Remove the '/'
    
    if (commandName === '') {
      await this.showCommandSuggestions();
      return;
    }

    const command = this.commands.get(commandName);
    
    if (!command) {
      console.log(chalk.red(`Unknown command: /${commandName}`));
      console.log(chalk.gray('Type /help to see available commands'));
      return;
    }

    try {
      await command.execute();
    } catch (error) {
      console.error(chalk.red('Command failed:'), error.message);
    }
  }

  private async showCommandSuggestions(): Promise<void> {
    console.log(chalk.blue('💡 Available slash commands:'));
    console.log();
    
    const uniqueCommands = Array.from(new Set(Array.from(this.commands.values())));
    
    uniqueCommands.forEach(cmd => {
      const aliases = cmd.aliases ? ` (${cmd.aliases.map(a => `/${a}`).join(', ')})` : '';
      console.log(`  ${chalk.cyan(`/${cmd.name}`)}${chalk.gray(aliases)} - ${cmd.description}`);
    });
    
    console.log();
  }

  private async showHelp(): Promise<void> {
    console.log(chalk.blue.bold('🤖 AI Bookkeeping Assistant Help'));
    console.log();
    console.log(chalk.yellow('Natural Language Examples:'));
    console.log('  "What transactions need categorizing?"');
    console.log('  "Show me expenses from last week"');
    console.log('  "Approve all transactions except the coffee one"');
    console.log('  "Categorize the $50 transaction as office supplies"');
    console.log();
    
    await this.showCommandSuggestions();
    
    console.log(chalk.yellow('Tips:'));
    console.log('  • You can mix natural language with slash commands');
    console.log('  • Type "/" to see command suggestions');
    console.log('  • Use "exit" or Ctrl+C to quit');
    console.log();
  }

  private async showStatus(): Promise<void> {
    console.log(chalk.blue('📊 Account Status'));
    console.log();
    
    try {
      const summary = await this.transactionService.getAccountSummary();
      const accounts = await this.transactionService.getAccounts();
      
      console.log(`Connected Accounts: ${accounts.length}`);
      accounts.forEach(account => {
        console.log(`  • ${account.name} (${account.account_type}) - $${account.balance?.toFixed(2) || '0.00'}`);
      });
      console.log();
      console.log(`Recent Transactions (7 days): ${summary.recent_transactions}`);
      console.log(`Uncategorized Transactions: ${summary.uncategorized_transactions}`);
      console.log(`Total Balance: $${summary.total_balance.toFixed(2)}`);
    } catch (error) {
      console.log(chalk.gray('Connected Accounts: 0 (use /connect to add accounts)'));
      console.log(chalk.gray('Recent Transactions: 0'));
      console.log(chalk.gray('Uncategorized Transactions: 0'));
      console.log(chalk.gray('This Month\'s Expenses: $0.00'));
    }
    
    console.log();
    if ((await this.transactionService.getAccounts()).length === 0) {
      console.log(chalk.yellow('💡 Get started by connecting your bank account with /connect'));
    }
    console.log();
  }

  private async showTransactions(): Promise<void> {
    console.log(chalk.blue('💳 Recent Transactions'));
    console.log();
    
    try {
      const transactions = await this.transactionService.getTransactions(10);
      
      if (transactions.length === 0) {
        console.log(chalk.gray('No transactions found. Connect your bank account to see transactions.'));
        console.log(chalk.gray('Use /connect to get started.'));
      } else {
        transactions.forEach((tx, index) => {
          const amountNum = parseFloat(tx.amount);
          const amount = amountNum > 0 ? chalk.green(`+$${amountNum.toFixed(2)}`) : chalk.red(`-$${Math.abs(amountNum).toFixed(2)}`);
          const status = tx.needs_categorization ? chalk.yellow('⚠️  Needs categorization') : chalk.green('✅ Categorized');
          const date = new Date(tx.transaction_date).toISOString().split('T')[0];
          console.log(`${index + 1}. ${tx.description}`);
          console.log(`   ${amount} • ${date} • ${status}`);
          if (tx.category) console.log(`   Category: ${tx.category}`);
          console.log();
        });
      }
    } catch (error) {
      console.log(chalk.red('Error loading transactions:'), error.message);
    }
    
    console.log();
  }

  private async categorizeTransactions(): Promise<void> {
    console.log(chalk.blue('🏷️  Transaction Categorization'));
    console.log();
    
    try {
      const uncategorizedTx = await this.transactionService.getUncategorizedTransactions();
      
      if (uncategorizedTx.length === 0) {
        console.log(chalk.green('✅ All transactions are categorized!'));
      } else {
        console.log(`Found ${uncategorizedTx.length} transactions needing categorization:\n`);
        
        uncategorizedTx.slice(0, 5).forEach((tx, index) => {
          const amountNum = parseFloat(tx.amount);
          const amount = amountNum > 0 ? chalk.green(`+$${amountNum.toFixed(2)}`) : chalk.red(`-$${Math.abs(amountNum).toFixed(2)}`);
          const date = new Date(tx.transaction_date).toISOString().split('T')[0];
          console.log(`${index + 1}. ${tx.description}`);
          console.log(`   ${amount} • ${date}`);
          if (tx.ai_suggested_category) {
            console.log(`   AI suggests: ${chalk.cyan(tx.ai_suggested_category)}`);
          }
          console.log();
        });
        
        if (uncategorizedTx.length > 5) {
          console.log(chalk.gray(`... and ${uncategorizedTx.length - 5} more transactions`));
          console.log();
        }
        
        console.log(chalk.yellow('💡 Use natural language like "categorize transaction 1 as office supplies" to categorize them.'));
      }
    } catch (error) {
      console.log(chalk.red('Error loading uncategorized transactions:'), error.message);
    }
    
    console.log();
  }

  private async connectAccount(): Promise<void> {
    console.log(chalk.blue('🔗 Connect Bank Account'));
    console.log();
    console.log(chalk.yellow('🚧 Bank integration coming soon!'));
    console.log(chalk.gray('This will use Plaid to securely connect your bank accounts.'));
    console.log();
    
    const { mockData } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'mockData',
        message: 'Would you like me to load some sample transactions for testing?',
        default: false
      }
    ]);

    if (mockData) {
      try {
        await this.transactionService.createSampleData();
        console.log(chalk.green('✅ Sample data loaded! Try asking "What transactions need categorizing?"'));
      } catch (error) {
        console.log(chalk.red('Error loading sample data:'), error.message);
      }
    }
    console.log();
  }

  private async exportData(): Promise<void> {
    console.log(chalk.blue('📄 Export Financial Data'));
    console.log();
    console.log(chalk.gray('Available formats: CSV, PDF, QuickBooks (coming soon)'));
    console.log(chalk.gray('No data available to export yet.'));
    console.log();
  }

  private async showSettings(): Promise<void> {
    console.log(chalk.blue('⚙️  Settings'));
    console.log();
    console.log(chalk.gray('• Default transaction categories'));
    console.log(chalk.gray('• AI preferences'));
    console.log(chalk.gray('• Export preferences'));
    console.log(chalk.gray('• Connected accounts'));
    console.log();
    console.log(chalk.yellow('⚠️  Settings configuration coming soon!'));
    console.log();
  }
}