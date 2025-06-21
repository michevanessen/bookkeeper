// Chat functionality for AI Bookkeeping Assistant
class BookkeepingChat {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatMessages = document.getElementById('chat-messages');
        this.charCount = document.getElementById('char-count');
        
        this.initializeEventListeners();
        this.autoResizeTextarea();
    }
    
    initializeEventListeners() {
        // Input handling
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
            this.autoResizeTextarea();
        });
        
        // Enter key handling
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Allow new line with Shift+Enter
                    return;
                } else {
                    // Send message with Enter
                    e.preventDefault();
                    this.sendMessage();
                }
            }
        });
        
        // Send button
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Prevent form submission
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
            }
        });
    }
    
    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 800) {
            this.charCount.style.color = '#ef4444'; // red
        } else if (count > 600) {
            this.charCount.style.color = '#f59e0b'; // yellow
        } else {
            this.charCount.style.color = '#6b7280'; // gray
        }
    }
    
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText;
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Process message
        try {
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addMessage(response.message, 'assistant');
            
            // Handle any suggested actions
            if (response.actions && response.actions.length > 0) {
                this.addActionButtons(response.actions);
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'assistant', true);
        }
    }
    
    async processMessage(message) {
        // Check if it's a slash command
        if (message.startsWith('/')) {
            return this.handleSlashCommand(message);
        }
        
        // Simulate API call to your bookkeeping backend
        // In a real implementation, this would call your Node.js API
        return this.simulateAIResponse(message);
    }
    
    handleSlashCommand(command) {
        const cmd = command.toLowerCase().split(' ')[0];
        
        switch (cmd) {
            case '/status':
                return {
                    message: `📊 **Account Status**\n\n• **Connected Accounts:** 2\n  - Business Checking: $15,750.25\n  - Business Credit Card: -$2,847.92\n\n• **Recent Transactions (7 days):** 8\n• **Uncategorized Transactions:** 19\n• **Total Balance:** $12,902.33\n\n💡 You have 19 transactions that need categorizing. Would you like me to help review them?`,
                    actions: [{ type: 'categorize', label: 'Review Uncategorized' }]
                };
                
            case '/transactions':
                return {
                    message: `💳 **Recent Transactions**\n\n1. **Microsoft 365 Business Premium** - $89.99\n   📅 2024-06-19 • ⚠️ Needs categorization\n   💡 AI suggests: Software\n\n2. **Office Supplies - Staples** - $124.50\n   📅 2024-06-18 • ⚠️ Needs categorization\n   💡 AI suggests: Office Supplies\n\n3. **Monthly Office Rent** - $450.00\n   📅 2024-06-16 • ⚠️ Needs categorization\n   💡 AI suggests: Rent\n\n4. **Business Cards - VistaPrint** - $67.89\n   📅 2024-06-14 • ⚠️ Needs categorization\n   💡 AI suggests: Marketing\n\n5. **Flight to Chicago** - $325.00\n   📅 2024-06-13 • ⚠️ Needs categorization\n   💡 AI suggests: Travel\n\n*Showing 5 of 20 transactions*`,
                    actions: [
                        { type: 'categorize', label: 'Categorize All' },
                        { type: 'approve', label: 'Approve AI Suggestions' }
                    ]
                };
                
            case '/categorize':
                return {
                    message: `🏷️ **Transaction Categorization**\n\nFound 19 transactions needing categorization:\n\n**High Priority:**\n1. **Microsoft 365** - $89.99 → Software ✨\n2. **Office Supplies** - $124.50 → Office Supplies ✨\n3. **Office Rent** - $450.00 → Rent ✨\n\nWould you like me to:\n• Apply all AI suggestions automatically?\n• Review each transaction individually?\n• Show specific category options?`,
                    actions: [
                        { type: 'auto-categorize', label: 'Apply All AI Suggestions' },
                        { type: 'review-individual', label: 'Review One by One' },
                        { type: 'show-categories', label: 'Show Categories' }
                    ]
                };
                
            case '/help':
                return {
                    message: `🤖 **AI Bookkeeping Assistant Help**\n\n**Slash Commands:**\n• \`/status\` - Account overview\n• \`/transactions\` - Recent activity\n• \`/categorize\` - Review expenses\n• \`/connect\` - Link accounts\n• \`/export\` - Download data\n\n**Natural Language Examples:**\n• "What transactions need categorizing?"\n• "Show me expenses from last week"\n• "Categorize the coffee purchase as meals"\n• "Generate a monthly report"\n• "Approve all except transaction 3"\n\n**Tips:**\n• Mix natural language with commands\n• Be specific with your requests\n• Use transaction numbers for precision`
                };
                
            default:
                return {
                    message: `❌ Unknown command: \`${cmd}\`\n\nType \`/help\` to see available commands, or ask me a question in natural language!`
                };
        }
    }
    
    simulateAIResponse(message) {
        // Simulate different types of responses based on message content
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('categoriz') || lowerMessage.includes('category')) {
            return {
                message: `I found 19 transactions that need categorization. Here are the ones with highest confidence AI suggestions:\n\n**Ready to Approve:**\n• Microsoft 365 ($89.99) → **Software** ✨ 95% confidence\n• Office Supplies ($124.50) → **Office Supplies** ✨ 98% confidence\n• Office Rent ($450.00) → **Rent** ✨ 99% confidence\n\n**Need Review:**\n• Client Lunch ($78.45) → **Meals & Entertainment** ⚠️ 75% confidence\n• Gas Station ($45.30) → **Transportation** ⚠️ 80% confidence\n\nWould you like me to approve the high-confidence suggestions and review the others?`,
                actions: [
                    { type: 'approve-high-confidence', label: 'Approve High Confidence' },
                    { type: 'review-all', label: 'Review All Manually' }
                ]
            };
        }
        
        if (lowerMessage.includes('expense') || lowerMessage.includes('spending')) {
            return {
                message: `📊 **Expense Analysis**\n\n**This Month (June 2024):**\n• **Total Expenses:** $2,847.92\n• **Top Categories:**\n  - Travel: $514.00 (18%)\n  - Office/Rent: $574.50 (20%)\n  - Software: $389.98 (14%)\n  - Meals: $102.12 (4%)\n\n**Trends:**\n• ⬆️ Travel expenses up 45% vs last month\n• ⬇️ Software expenses down 12%\n• 📈 Overall spending within budget\n\n**Recommendations:**\n• Consider travel policy for frequent trips\n• Review software subscriptions for duplicates`,
                actions: [
                    { type: 'detailed-report', label: 'Generate Detailed Report' },
                    { type: 'budget-analysis', label: 'Budget vs Actual' }
                ]
            };
        }
        
        if (lowerMessage.includes('summary') || lowerMessage.includes('report')) {
            return {
                message: `📈 **Financial Summary**\n\n**Account Balances:**\n• Business Checking: $15,750.25\n• Business Credit Card: -$2,847.92\n• **Net Position:** $12,902.33\n\n**Recent Activity (30 days):**\n• Income: $7,550.00\n• Expenses: $2,847.92\n• **Net Income:** $4,702.08\n\n**Action Items:**\n• 19 transactions need categorization\n• 2 receipts pending upload\n• Quarterly tax estimate due July 15\n\n**Next Steps:**\n1. Categorize pending transactions\n2. Review and approve expense reports\n3. Prepare quarterly filings`,
                actions: [
                    { type: 'export-summary', label: 'Export to PDF' },
                    { type: 'schedule-review', label: 'Schedule Review' }
                ]
            };
        }
        
        // Default response for general queries
        return {
            message: `I understand you're asking about "${message}". \n\nI can help you with:\n• **Transaction categorization** - Review and organize expenses\n• **Financial reporting** - Generate summaries and insights\n• **Account management** - Monitor balances and activity\n• **Expense analysis** - Track spending patterns\n\nCould you be more specific about what you'd like me to help you with? You can also use slash commands like \`/status\` or \`/transactions\` for quick actions.`,
            actions: [
                { type: 'status', label: 'Show Account Status' },
                { type: 'transactions', label: 'View Recent Transactions' }
            ]
        };
    }
    
    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble mb-6';
        
        const isUser = sender === 'user';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}">
                <div class="w-8 h-8 ${isUser ? 'bg-blue-500' : (isError ? 'bg-red-500' : 'bg-orange-500')} rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-sm font-bold">${isUser ? 'You' : (isError ? '!' : 'AI')}</span>
                </div>
                <div class="flex-1 max-w-4xl">
                    <div class="${isUser ? 'bg-blue-500 text-white' : (isError ? 'bg-red-50 border border-red-200' : 'bg-gray-50')} rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} px-4 py-3">
                        <div class="${isUser ? 'text-white' : (isError ? 'text-red-700' : 'text-gray-900')}">
                            ${this.formatMessage(content, isError)}
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : ''}">
                        ${time}
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(content, isError = false) {
        const textColor = isError ? 'text-red-700' : 'text-gray-900';
        
        return content
            .replace(/\*\*(.*?)\*\*/g, `<strong class="${textColor}">$1</strong>`)
            .replace(/\*(.*?)\*/g, `<em class="${textColor}">$1</em>`)
            .replace(/`(.*?)`/g, `<code class="bg-gray-200 px-1 rounded text-sm text-gray-900">$1</code>`)
            .replace(/\n/g, '<br>')
            .replace(/•/g, '&bull;')
            .replace(/(📊|💳|🏷️|📈|⚠️|✅|❌|💡|📅|✨|⬆️|⬇️|📈)/g, '<span class="text-lg">$1</span>');
    }
    
    addActionButtons(actions) {
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'message-bubble mb-6';
        
        const buttonsHtml = actions.map(action => 
            `<button onclick="handleActionClick('${action.type}')" 
                     class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                ${action.label}
             </button>`
        ).join('');
        
        buttonDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8"></div>
                <div class="flex-1">
                    <div class="flex flex-wrap gap-2">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(buttonDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message-bubble mb-6';
        
        typingDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-sm font-bold">AI</span>
                </div>
                <div class="flex-1">
                    <div class="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0ms;"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 150ms;"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 300ms;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Global functions for button actions
function sendQuickMessage(message) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = message;
    chat.sendMessage();
}

function handleActionClick(actionType) {
    const actions = {
        'categorize': 'Review and categorize uncategorized transactions',
        'approve': 'Approve all AI category suggestions',
        'auto-categorize': 'Apply all AI suggestions automatically',
        'review-individual': 'Let me review each transaction individually',
        'show-categories': 'Show me all available expense categories',
        'approve-high-confidence': 'Approve transactions with 90%+ confidence and show me the rest',
        'review-all': 'Show me all transactions for manual review',
        'detailed-report': 'Generate a detailed expense report for this month',
        'budget-analysis': 'Compare actual spending vs budget',
        'export-summary': 'Export financial summary to PDF',
        'schedule-review': 'Schedule a financial review meeting',
        'status': '/status',
        'transactions': '/transactions'
    };
    
    const message = actions[actionType] || `Execute action: ${actionType}`;
    sendQuickMessage(message);
}

// Initialize chat when page loads
let chat;
document.addEventListener('DOMContentLoaded', () => {
    chat = new BookkeepingChat();
    initializeMobileMenu();
});

// Mobile menu functionality
function initializeMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    console.log('Initializing mobile menu...', { hamburgerBtn, sidebar, overlay });
    
    if (!hamburgerBtn || !sidebar || !overlay) {
        console.error('Mobile menu elements not found!');
        return;
    }
    
    function toggleSidebar() {
        const isOpen = !sidebar.classList.contains('-translate-x-full');
        console.log('Toggle sidebar, currently open:', isOpen);
        
        if (isOpen) {
            // Close sidebar
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        } else {
            // Open sidebar
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        }
    }
    
    hamburgerBtn.addEventListener('click', (e) => {
        console.log('Hamburger clicked!');
        e.preventDefault();
        toggleSidebar();
    });
    
    overlay.addEventListener('click', (e) => {
        console.log('Overlay clicked!');
        e.preventDefault();
        toggleSidebar();
    });
    
    // Close sidebar when clicking on quick actions or slash commands
    sidebar.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            // Small delay to allow action to complete
            setTimeout(() => {
                if (window.innerWidth < 768) { // Only on mobile
                    console.log('Auto-closing sidebar on mobile after button click');
                    toggleSidebar();
                }
            }, 100);
        }
    });
    
    console.log('Mobile menu initialized successfully!');
}

// Simulate real-time updates (in a real app, this would come from your backend)
function updateAccountStatus() {
    // This would typically come from WebSocket or periodic API calls
    const statusElements = {
        'account-count': '2',
        'uncategorized-count': Math.max(0, parseInt(document.getElementById('uncategorized-count').textContent) - Math.floor(Math.random() * 2)),
        'total-balance': '$12,902.33'
    };
    
    Object.entries(statusElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && typeof value === 'string') {
            element.textContent = value;
        }
    });
}

// Update status every 30 seconds (simulate real-time updates)
setInterval(updateAccountStatus, 30000);