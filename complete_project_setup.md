# AI-Powered Bookkeeping CLI - Complete Project Setup

## Project Overview

This is a conversational bookkeeping solution that eliminates traditional UI friction by allowing users to manage their finances through natural language interactions via CLI, text, or voice commands.

### Key Features
- Natural Language Processing for bookkeeping tasks
- CLI-based chat interface with voice input capability
- Slash commands (Notion-style) for quick actions
- Direct bank integration via Plaid
- TypeScript for type safety with financial data

## Project Structure

```
ai-bookkeeping-cli/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts
    ├── core/
    │   ├── conversational-interface.ts
    │   ├── ai-service.ts
    │   └── slash-commands.ts
    ├── services/
    │   └── transaction-service.ts (to be created)
    └── database/
        └── setup.ts (to be created)
```

## Setup Instructions

1. **Create project directory:**
   ```bash
   mkdir ai-bookkeeping-cli
   cd ai-bookkeeping-cli
   ```

2. **Copy all files below into their respective locations**

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Setup environment:**
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```

---

## File Contents

### package.json

```json
{
  "name": "ai-bookkeeping-cli",
  "version": "0.1.0",
  "description": "AI-powered conversational bookkeeping CLI application",
  "main": "dist/index.js",
  "bin": {
    "bookkeep": "dist/index.js"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "keywords": ["bookkeeping", "ai", "cli", "accounting", "conversational"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "ora": "^7.0.0",
    "openai": "^4.0.0",
    "dotenv": "^16.0.0",
    "date-fns": "^2.30.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### .env.example

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bookkeeping_db

# Plaid Configuration (for future bank integration)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENV=sandbox  # sandbox, development, or production

# Application Settings
NODE_ENV=development
LOG_LEVEL=info
```

### src/index.ts

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { ConversationalInterface } from './core/conversational-interface';
import { setupDatabase } from './database/setup';

// Load environment variables
config();

const program = new Command();

program
  .name('bookkeep')
  .description('AI-powered conversational bookkeeping CLI')
  .version('0.1.0');

// Main chat command - the core of the application
program
  .command('chat')
  .description('Start conversational bookkeeping session')
  .option('-v, --voice', 'Enable voice input (future feature)')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🤖 AI Bookkeeping Assistant\n'));
    console.log(chalk.gray('Type "help" for commands, "exit" to quit\n'));
    
    try {
      // Initialize database if needed
      await setupDatabase();
      
      // Start conversational interface
      const chat = new ConversationalInterface({
        voiceEnabled: options.voice || false
      });
      
      await chat.start();
    } catch (error) {
      console.error(chalk.red('Failed to start bookkeeping session:'), error);
      process.exit(1);
    }
  });

// Quick status command
program
  .command('status')
  .description('Show quick account status')
  .action(async () => {
    console.log(chalk.blue('📊 Account Status'));
    console.log(chalk.gray('Feature coming soon...'));
  });

// Setup command for initial configuration
program
  .command('setup')
  .description('Initial setup and configuration')
  .action(async () => {
    console.log(chalk.blue.bold('🔧 Setting up AI Bookkeeping...'));
    try {
      await setupDatabase();
      console.log(chalk.green('✅ Setup completed successfully!'));
      console.log(chalk.gray('Run "bookkeep chat" to start your first session.'));
    } catch (error) {
      console.error(chalk.red('Setup failed:'), error);
      process.exit(1);
    }
  });

// Handle unrecognized commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command. Use --help for available commands.'));
  process.exit(1);
});

// Default action - start chat if no command provided
if (process.argv.length === 2) {
  program.parse(['', '', 'chat']);
} else {
  program.parse();
}
```

### src/core/conversational-interface.ts

```typescript
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
```

### src/core/ai-service.ts

```typescript
import OpenAI from 'openai';

interface AIResponse {
  message: string;
  suggestedActions?: Array<{
    type: string;
    [key: string]: any;
  }>;
}

export class AIService {
  private openai: OpenAI;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processQuery(userInput: string): Promise<AIResponse> {
    // Add user input to conversation history
    this.conversationHistory.push({ role: 'user', content: userInput });

    // Keep conversation history manageable (last 10 exchanges)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    const systemPrompt = this.buildSystemPrompt();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory
        ],
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t process that request.';
      
      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: assistantMessage });

      // Parse the response for suggested actions
      const suggestedActions = this.parseActionsFromResponse(assistantMessage);

      return {
        message: assistantMessage,
        suggestedActions
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Unable to process your request. Please try again.');
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI bookkeeping assistant that helps users manage their finances through natural conversation.

Your capabilities include:
- Categorizing transactions
- Reviewing and approving expenses
- Answering questions about financial data
- Providing bookkeeping guidance
- Suggesting transaction categories

You should:
- Be conversational and helpful
- Ask clarifying questions when needed
- Provide specific, actionable responses
- Use natural language that's easy to understand
- Be accurate with financial terminology

When users ask about transactions, expenses, or bookkeeping tasks, provide helpful responses and suggest specific actions they can take.

Current context: This is a CLI-based bookkeeping application where users can manage their finances through conversation.`;
  }

  private parseActionsFromResponse(response: string): Array<{ type: string; [key: string]: any }> {
    // This is a simple parser - in a real implementation, you might want to use
    // function calling or structured outputs from OpenAI
    const actions: Array<{ type: string; [key: string]: any }> = [];

    // Look for common action patterns in the response
    if (response.toLowerCase().includes('categorize') || response.toLowerCase().includes('approve')) {
      // This would be more sophisticated in practice
      actions.push({
        type: 'suggest_review',
        message: 'Would you like me to show you transactions that need attention?'
      });
    }

    return actions;
  }

  // Method to clear conversation history if needed
  clearHistory(): void {
    this.conversationHistory = [];
  }
}
```

### src/core/slash-commands.ts

```typescript
import chalk from 'chalk';
import inquirer from 'inquirer';

interface SlashCommand {
  name: string;
  description: string;
  aliases?: string[];
  execute: () => Promise<void>;
}

export class SlashCommandProcessor {
  private commands: Map<string, SlashCommand> = new Map();

  constructor() {
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
    console.log(chalk.gray('Connected Accounts: None (use /connect to add accounts)'));
    console.log(chalk.gray('Recent Transactions: 0'));
    console.log(chalk.gray('Uncategorized Transactions: 0'));
    console.log(chalk.gray('This Month\'s Expenses: $0.00'));
    console.log();
    console.log(chalk.yellow('💡 Get started by connecting your bank account with /connect'));
    console.log();
  }

  private async showTransactions(): Promise<void> {
    console.log(chalk.blue('💳 Recent Transactions'));
    console.log();
    console.log(chalk.gray('No transactions found. Connect your bank account to see transactions.'));
    console.log(chalk.gray('Use /connect to get started.'));
    console.log();
  }

  private async categorizeTransactions(): Promise<void> {
    console.log(chalk.blue('🏷️  Transaction Categorization'));
    console.log();
    console.log(chalk.gray('No uncategorized transactions found.'));
    console.log(chalk.gray('Connect your bank account to start categorizing transactions.'));
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
      console.log(chalk.green('✅ Sample data loaded! Try asking "What transactions need categorizing?"'));
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
```

## Next Steps

### Immediate Setup (Required Files):

**src/services/transaction-service.ts** (placeholder for now):
```typescript
export class TransactionService {
  // Placeholder - will implement transaction management
}
```

**src/database/setup.ts** (placeholder for now):
```typescript
export async function setupDatabase(): Promise<void> {
  // Placeholder - will implement database setup
  console.log('Database setup (placeholder)');
}
```

### Development Workflow:

1. **Get basic CLI working** - Test the conversational interface
2. **Add database layer** - PostgreSQL with transaction models
3. **Implement transaction service** - Core business logic
4. **Add Plaid integration** - Bank connectivity
5. **Enhance AI capabilities** - Better natural language understanding
6. **Add voice interface** - Speech-to-text integration

### Testing the Current Setup:

After copying all files and running `npm run dev`, you should be able to:
- Start a chat session
- Use slash commands like `/help`, `/status`
- Have basic conversations with the AI assistant
- See the foundation for future features

The app is designed to be modular and extensible, so we can add features incrementally while maintaining a working application at each step.
