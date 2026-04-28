import { useState, useRef, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Bot, Send, Sparkles, User, Trash2, Waves } from 'lucide-react';

const client = createClient();

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  'Summarize my project progress',
  'What are my high priority tasks?',
  'Help me plan next week\'s sprint',
  'Analyze my budget allocation',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef('');

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    streamingContentRef.current = '';

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Build conversation history for context
      const chatHistory = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      await client.ai.gentxt({
        messages: [
          {
            role: 'system',
            content:
              'You are BeachPlan AI, a friendly and helpful project management assistant with a warm, beach-inspired personality. You help users manage their projects, tasks, finances, and resources. Keep responses concise and actionable. Use occasional beach/ocean metaphors when appropriate. Respond in the same language as the user.',
          },
          ...chatHistory,
          { role: 'user', content: content.trim() },
        ],
        model: 'deepseek-v3.2',
        stream: true,
        onChunk: (chunk: any) => {
          const text = chunk.content || '';
          streamingContentRef.current += text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: streamingContentRef.current }
                : m
            )
          );
        },
        onComplete: () => {
          setIsStreaming(false);
        },
        onError: (error: any) => {
          const detail = error?.data?.detail || error?.message || 'AI request failed';
          toast.error(detail);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: 'Sorry, I encountered an error. Please try again. 🌊' }
                : m
            )
          );
          setIsStreaming(false);
        },
        timeout: 60_000,
      });
    } catch (err: any) {
      const detail = err?.data?.detail || err?.message || 'Failed to get AI response';
      toast.error(detail);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, I encountered an error. Please try again. 🌊' }
            : m
        )
      );
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    streamingContentRef.current = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by BeachPlan AI 🌊</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground gap-2">
              <Trash2 className="w-4 h-4" /> Clear
            </Button>
          )}
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Sparkles className="w-3 h-3 mr-1" /> Online
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Waves className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold">Welcome to BeachPlan AI</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                I'm your project management assistant. Ask me anything about your projects,
                tasks, or get help planning your next sprint.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {suggestedPrompts.map((prompt) => (
                <Card
                  key={prompt}
                  className="border-0 shadow-md bg-card/80 backdrop-blur-sm cursor-pointer hover:shadow-lg hover:bg-primary/5 transition-all"
                  onClick={() => sendMessage(prompt)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">{prompt}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card shadow-md border border-border/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {msg.content || (
                      <span className="inline-flex items-center gap-1">
                        <span className="animate-pulse">Thinking</span>
                        <span className="animate-bounce">...</span>
                      </span>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-coral/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-coral" />
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask BeachPlan AI anything..."
            className="min-h-[44px] max-h-32 resize-none rounded-xl border-border/50 bg-background"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}