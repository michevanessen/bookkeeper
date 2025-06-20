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