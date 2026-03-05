import { useEffect, useState, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, ArrowLeft, Sparkles, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownContent } from '@/components/MarkdownContent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const STARTER_QUESTIONS = [
  "How can I reduce my startup costs?",
  "Who should I target first?",
  "What are my biggest risks?",
  "How do I find my first 10 customers?",
  "What should I build first (MVP)?",
  "Is this idea worth pursuing?"
];

const FOLLOW_UP_SETS = [
  ["Tell me more about this", "What should I do next?", "How does this compare to competitors?"],
  ["Can you elaborate?", "What are the risks?", "Give me an action plan"],
  ["How do I validate this?", "What metrics should I track?", "Who should I hire first?"],
];

/* ── Cora Avatar ── */
const CoraAvatar = ({ size = 28 }: { size?: number }) => (
  <div className="relative shrink-0" style={{ width: size, height: size }}>
    <div
      className="w-full h-full rounded-full flex items-center justify-center"
      style={{ background: 'var(--gradient-hero)' }}
    >
      <Sparkles className="text-white" style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
    <div
      className="absolute -bottom-0.5 -right-0.5 rounded-full bg-success border-2 border-background"
      style={{ width: size * 0.3, height: size * 0.3 }}
    />
  </div>
);

/* ── Typing shimmer ── */
const TypingIndicator = () => (
  <div className="flex justify-start animate-fade-up">
    <div className="max-w-[85%] lg:max-w-[70%] rounded-2xl rounded-tl-md px-5 py-4 bg-card border border-l-[3px] border-l-primary/40">
      <div className="flex items-center gap-3">
        <CoraAvatar size={24} />
        <div className="space-y-1.5">
          <div className="h-2.5 w-48 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 bg-[length:200%_100%] animate-shimmer" />
          <p className="text-xs text-muted-foreground">Cora is analyzing your question...</p>
        </div>
      </div>
    </div>
  </div>
);

export default function Chat() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [connectionLost, setConnectionLost] = useState(false);
  const retryCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { document.title = "Chat with Cora | Validifier"; }, []);
  useEffect(() => { loadProjectAndChat(); }, [projectId]);
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  useEffect(() => {
    if (!conversationId) return;
    let channel: any;

    const subscribe = () => {
      channel = supabase
        .channel('chat-messages')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.role === 'assistant') {
            setNewMessageIds(prev => new Set(prev).add(newMessage.id));
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
            setTimeout(() => setNewMessageIds(prev => {
              const next = new Set(prev);
              next.delete(newMessage.id);
              return next;
            }), 600);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setConnectionLost(false);
            retryCountRef.current = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            if (retryCountRef.current < 3) {
              setConnectionLost(true);
              retryCountRef.current++;
              setTimeout(() => {
                supabase.removeChannel(channel);
                subscribe();
              }, 2000 * retryCountRef.current);
            } else {
              setConnectionLost(true);
            }
          }
        });
    };

    subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjectAndChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: projectData, error: projectError } = await supabase
        .from('projects').select('*').eq('id', projectId).single();
      if (projectError) throw projectError;
      setProject(projectData);

      let { data: conversations } = await supabase
        .from('chat_conversations').select('*').eq('project_id', projectId)
        .order('created_at', { ascending: false }).limit(1);

      let convId: string;
      if (conversations && conversations.length > 0) {
        convId = conversations[0].id;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({ project_id: projectId, title: `Chat about ${projectData.name}` })
          .select().single();
        if (convError) throw convError;
        convId = newConv.id;
      }
      setConversationId(convId);

      const { data: messagesData } = await supabase
        .from('chat_messages').select('*').eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      setMessages((messagesData || []) as Message[]);
    } catch {
      toast.error('Failed to load chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isSending || !conversationId) return;
    setIsSending(true);
    setIsTyping(true);
    trackEvent('chat_message_sent');

    try {
      const userMessage: Message = {
        id: crypto.randomUUID(), role: 'user',
        content: messageText, created_at: new Date().toISOString()
      };
      setNewMessageIds(prev => new Set(prev).add(userMessage.id));
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setTimeout(() => setNewMessageIds(prev => {
        const next = new Set(prev);
        next.delete(userMessage.id);
        return next;
      }), 600);

      await supabase.from('chat_messages').insert({
        conversation_id: conversationId, role: 'user', content: messageText
      });

      const { data, error } = await supabase.functions.invoke('chat-with-cora', {
        body: { conversation_id: conversationId, user_message: messageText, project_id: projectId }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
    } catch (error: any) {
      setIsTyping(false);
      if (error.message?.includes('credits')) {
        toast.error("You've reached your message limit. Upgrade to continue chatting.");
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Pick a semi-random follow-up set based on message count
  const getFollowUps = () => FOLLOW_UP_SETS[messages.length % FOLLOW_UP_SETS.length];

  // Check if message is the last assistant message (for showing follow-ups)
  const isLastAssistantMessage = (msg: Message) => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    return assistantMessages.length > 0 && assistantMessages[assistantMessages.length - 1].id === msg.id;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="flex flex-col items-center gap-3">
          <CoraAvatar size={48} />
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="h-screen flex flex-col">
        {/* ── Glass Header ── */}
        <header className="glass-nav sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${projectId}/report`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CoraAvatar size={36} />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{project?.name}</h1>
              <p className="text-xs text-muted-foreground">Cora • AI Business Advisor</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col">
            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {/* Connection lost banner */}
              {connectionLost && (
                <div className="sticky top-0 z-10 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 flex items-center justify-center gap-2 text-sm text-destructive animate-fade-down">
                  <WifiOff className="h-4 w-4" />
                  {retryCountRef.current >= 3
                    ? "Connection failed. Please refresh the page."
                    : "Connection lost. Reconnecting..."}
                </div>
              )}

              {/* ── Empty State ── */}
              {messages.length === 0 && (
                <div className="max-w-2xl mx-auto py-12 space-y-8">
                  {/* Welcome card */}
                  <div className="relative rounded-2xl p-[1px] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer opacity-40" />
                    <div className="relative rounded-2xl bg-card p-8 text-center space-y-4">
                      <div className="animate-float mx-auto w-fit">
                        <CoraAvatar size={64} />
                      </div>
                      <h2 className="text-2xl font-bold">Ask Cora Anything</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        I've analyzed your validation report and I'm here to help you make the best decisions for your business.
                      </p>
                      {/* Gradient accent line */}
                      <div className="w-24 h-[2px] mx-auto rounded-full bg-gradient-to-r from-primary to-secondary" />
                    </div>
                  </div>

                  {/* Starter questions grid */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Suggested questions:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {STARTER_QUESTIONS.map((question, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(question)}
                          disabled={isSending}
                          className="group relative rounded-xl p-[1px] text-left transition-all duration-300 hover:scale-[1.01]"
                        >
                          {/* Hover gradient border */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/0 to-secondary/0 group-hover:from-primary/40 group-hover:via-secondary/30 group-hover:to-primary/40 transition-all duration-300" />
                          <div className="relative rounded-[11px] bg-card border border-border/60 group-hover:border-transparent px-4 py-3 transition-all">
                            <span className="text-sm">{question}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Message Bubbles ── */}
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                      newMessageIds.has(message.id)
                        ? message.role === 'user'
                          ? 'animate-slide-in-right'
                          : 'animate-fade-up'
                        : ''
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="max-w-[80%] lg:max-w-[60%] rounded-3xl rounded-tr-lg px-5 py-3 bg-primary text-primary-foreground shadow-md">
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%] lg:max-w-[70%] rounded-2xl rounded-tl-md px-5 py-4 bg-gradient-to-br from-card to-muted/30 border border-l-[3px] border-l-primary/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CoraAvatar size={20} />
                          <span className="text-xs font-medium text-muted-foreground">Cora</span>
                        </div>
                        <MarkdownContent
                          content={message.content}
                          className="text-foreground/90 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ol]:my-2 [&_li]:text-foreground/90"
                        />
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestions after last Cora message */}
                  {message.role === 'assistant' && isLastAssistantMessage(message) && !isTyping && !isSending && (
                    <div className="flex justify-start mt-2 ml-1 animate-fade-up delay-300">
                      <div className="flex flex-wrap gap-1.5">
                        {getFollowUps().map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(suggestion)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/[0.04] text-muted-foreground hover:text-foreground transition-all duration-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="border-t p-4 glass" style={{ background: 'hsl(var(--card) / 0.7)', backdropFilter: 'blur(16px)' }}>
              <div className="container max-w-4xl mx-auto">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative group">
                    {/* Gradient focus ring */}
                    <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-focus-within:opacity-40 transition-opacity duration-300 blur-[1px]" />
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Cora anything about your validation report..."
                      disabled={isSending}
                      className="relative resize-none min-h-[52px] max-h-[200px] rounded-xl border-border/60 bg-card focus-visible:ring-0 focus-visible:ring-offset-0"
                      maxLength={500}
                    />
                  </div>
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isSending}
                    className={`shrink-0 h-[52px] w-[52px] rounded-xl flex items-center justify-center text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                      input.trim() && !isSending
                        ? 'animate-pulse-glow'
                        : ''
                    }`}
                    style={{ background: 'var(--gradient-hero)' }}
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground/60">
                  <span>Shift + Enter for new line</span>
                  <span>{input.length}/500</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
