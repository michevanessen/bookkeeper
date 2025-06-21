# AI Bookkeeping Assistant

An AI-powered conversational bookkeeping application that helps small businesses manage their finances through natural language interactions.

## 🌟 Features

- **Natural Language Processing**: Ask questions about your finances in plain English
- **Intelligent Transaction Categorization**: AI-powered expense categorization with confidence scores
- **Multiple Interfaces**: Both CLI and web-based interfaces available
- **Real-time Financial Insights**: Account summaries, spending analysis, and categorization assistance
- **Sample Data**: Pre-loaded realistic business transactions for testing and demonstration

## 🚀 Live Demo

**Web Interface**: [https://michevanessen.github.io/bookkeeper/](https://michevanessen.github.io/bookkeeper/)

*Note: The current web interface runs on sample data for demonstration purposes. Full backend integration with Railway deployment is planned for future releases.*

## 💬 How It Works

The AI Bookkeeping Assistant understands natural language queries and provides intelligent responses about your financial data. You can:

- Ask about account balances and transaction summaries
- Request help with categorizing expenses
- Generate financial reports and insights
- Get AI-powered suggestions for transaction categorization

### Example Interactions

```
You: "What transactions need categorizing?"
AI: "I found 19 transactions that need categorization. Here are the high-priority ones..."

You: "Show me this month's expenses"
AI: "Here's your expense breakdown for June 2024..."

You: "Categorize the Microsoft purchase as software"
AI: "✅ Transaction categorized successfully as Software"
```

## 🖥️ Usage

### Web Interface

1. **Visit**: [https://michevanessen.github.io/bookkeeper/](https://michevanessen.github.io/bookkeeper/)
2. **Start chatting**: Type natural language questions or use slash commands
3. **Try slash commands**:
   - `/status` - Account overview
   - `/transactions` - Recent activity  
   - `/categorize` - Review uncategorized expenses
   - `/help` - Show all available commands

### CLI Version

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run the CLI**:
   ```bash
   npm run start
   # or
   node dist/index.js
   ```

5. **Available CLI commands**:
   - `/status` - View account summary
   - `/transactions` - List recent transactions
   - `/categorize` - Review uncategorized expenses
   - `/connect` - Load sample data
   - `/help` - Show available commands

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- TypeScript
- OpenAI API key (for CLI version)

### Setup

```bash
# Clone the repository
git clone https://github.com/michevanessen/bookkeeper.git
cd bookkeeper

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your OpenAI API key to .env file
OPENAI_API_KEY=your_api_key_here

# Build the project
npm run build

# Start development
npm run dev
```

### Scripts

- `npm run dev` - Start development CLI
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run built CLI application
- `npm run test` - Run tests
- `npm run lint` - Lint TypeScript files

## 🏗️ Architecture

```
src/
├── core/
│   ├── ai-service.ts           # OpenAI integration
│   ├── conversational-interface.ts # CLI interface
│   └── slash-commands.ts       # Command handling
├── services/
│   └── transaction-service.ts  # Transaction management
├── database/
│   └── setup.ts               # Database configuration
└── index.ts                   # Application entry point

docs/
├── index.html                 # Web interface
└── chat.js                    # Frontend JavaScript
```

## 🌐 Deployment

### Web Interface (GitHub Pages)

The web interface is automatically deployed to GitHub Pages at:
[https://michevanessen.github.io/bookkeeper/](https://michevanessen.github.io/bookkeeper/)

### Future: Railway Backend

Full backend deployment with persistent database storage is planned for Railway platform, which will enable:
- Real bank account connections
- Persistent transaction storage
- Multi-user support
- Advanced reporting features

## 📊 Sample Data

The application includes realistic sample business transactions for demonstration:

- **Income**: Consulting fees, product sales, speaking engagements
- **Expenses**: Office supplies, software subscriptions, travel, meals
- **Categories**: 20+ business expense categories
- **Realistic amounts**: $12.50 - $5,500 transaction range
- **Time period**: Recent 3-4 months of activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] Railway backend deployment
- [ ] Real bank account integration (Plaid)
- [ ] Advanced reporting and analytics
- [ ] Mobile-responsive design improvements
- [ ] Export capabilities (PDF, CSV)
- [ ] Multi-user support
- [ ] Webhook integrations

## 📞 Support

For questions, issues, or feature requests, please [open an issue](https://github.com/michevanessen/bookkeeper/issues) on GitHub.

---

**Built with ❤️ for small business financial management**