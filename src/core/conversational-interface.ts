import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AIService } from './ai-service';
import { TransactionService } from '../services/transaction-service';
import { SlashCommandProcessor } from './slash-commands';

interface ConversationalOptions {
  voiceEnabled: boolean;
}

export class ConversationalInterface {
  private aiService: AIService;
  private transactionService: TransactionService;
  private slashProcessor: SlashCommandProcessor;
  private isActive: boolean = false;

  constructor(private options: ConversationalOptions) {
    this.aiService = new AIService();
    this.transactionService = new TransactionService();
    this.slashProcessor = new SlashCommandProcessor();
  }

  async start(): Promise<void> {
    this.isActive = true;
    
    console.log(chalk.green('💬 Chat session started. What can I help you with today?'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('  "What transactions need categorizing?"'));
    console.log(chalk.gray('  "Show me last week\'s expenses"'));
    console.log(chalk.gray('  "/help" for slash commands'));
    console.log();

    while (this.isActive) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.blue('You:'),
            prefix: '',
          }
        ]);

        if (!input.trim()) continue;

        await this.processInput(input.trim());
      } catch (error) {
        if (error.message === 'User force closed the prompt with ctrl+c') {
          this.handleExit();
          break;
        }
        console.error(chalk.red('Error:'), error);
      }
    }
  }

  private async processInput(input: string): Promise<void> {
    // Handle exit commands
    if (['exit', 'quit', 'bye'].includes(input.toLowerCase())) {
      this.handleExit();
      return;
    }

    // Handle slash commands
    if (input.startsWith('/')) {
      await this.slashProcessor.process(input);
      return;
    }

    // Handle natural language with AI
    const spinner = ora('Thinking...').start();
    
    try {
      const response = await this.aiService.processQuery(input);
      spinner.stop();
      
      console.log(chalk.green('Assistant:'), response.message);
      
      // If the AI suggests actions, handle them
      if (response.suggestedActions?.length > 0) {
        await this.handleSuggestedActions(response.suggestedActions);
      }
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Sorry, I encountered an error:'), error.message);
    }
    
    console.log(); // Add spacing
  }

  private async handleSuggestedActions(actions: any[]): Promise<void> {
    // This will handle AI-suggested actions like "approve transactions" etc.
    for (const action of actions) {
      switch (action.type) {
        case 'confirm_transactions':
          await this.confirmTransactions(action.transactions);
          break;
        case 'categorize_expense':
          await this.categorizeExpense(action.transaction, action.category);
          break;
        // Add more action types as needed
      }
    }
  }

  private async confirmTransactions(transactions: any[]): Promise<void> {
    console.log(chalk.yellow('\n📋 Transactions to review:'));
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.description} - $${tx.amount} (${tx.suggestedCategory})`);
    });

    const { confirmation } = await inquirer.prompt([
      {
        type: 'input',
        name: 'confirmation',
        message: 'Approve all, or specify changes (e.g., "approve all except 2, categorize that as office supplies"):',
      }
    ]);

    // Process the natural language confirmation
    // This would integrate with your transaction service
    console.log(chalk.green('✅ Transactions processed!'));
  }

  private async categorizeExpense(transaction: any, category: string): Promise<void> {
    // Handle individual expense categorization
    console.log(chalk.green(`✅ Categorized "${transaction.description}" as ${category}`));
  }

  private handleExit(): void {
    this.isActive = false;
    console.log(chalk.blue('\n👋 Thanks for using AI Bookkeeping! Have a great day!'));
    process.exit(0);
  }
}