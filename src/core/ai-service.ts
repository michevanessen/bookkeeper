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
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 500,
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