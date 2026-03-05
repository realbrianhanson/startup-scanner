import { useEffect, useState, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Send, ArrowLeft, WifiOff } from 'lucide-react';
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
  const [connectionLost, setConnectionLost] = useState(false);
  const retryCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Chat with Cora | Validifier"; }, []);
  useEffect(() => { loadProjectAndChat(); }, [projectId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

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
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') { setConnectionLost(false); retryCountRef.current = 0; }
          else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            if (retryCountRef.current < 3) {
              setConnectionLost(true);
              retryCountRef.current++;
              setTimeout(() => { supabase.removeChannel(channel); subscribe(); }, 2000 * retryCountRef.current);
            } else setConnectionLost(true);
          }
        });
    };
    subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [conversationId]);

  const loadProjectAndChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (projectError) throw projectError;
      setProject(projectData);

      let { data: conversations } = await supabase.from('chat_conversations').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1);
      let convId: string;
      if (conversations && conversations.length > 0) {
        convId = conversations[0].id;
      } else {
        const { data: newConv, error: convError } = await supabase.from('chat_conversations').insert({ project_id: projectId, title: `Chat about ${projectData.name}` }).select().single();
        if (convError) throw convError;
        convId = newConv.id;
      }
      setConversationId(convId);

      const { data: messagesData } = await supabase.from('chat_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
      setMessages((messagesData || []) as Message[]);
    } catch {
      toast.error('Failed to load chat.');
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
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      await supabase.from('chat_messages').insert({ conversation_id: conversationId, role: 'user', content: messageText });
      const { data, error } = await supabase.functions.invoke('chat-with-cora', {
        body: { conversation_id: conversationId, user_message: messageText, project_id: projectId }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
    } catch (error: any) {
      setIsTyping(false);
      toast.error(error.message?.includes('credits') ? "Message limit reached. Upgrade to continue." : 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const getFollowUps = () => FOLLOW_UP_SETS[messages.length % FOLLOW_UP_SETS.length];
  const isLastAssistant = (msg: Message) => {
    const assistants = messages.filter(m => m.role === 'assistant');
    return assistants.length > 0 && assistants[assistants.length - 1].id === msg.id;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate(`/projects/${projectId}/report`)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium truncate">{project?.name}</h1>
            <p className="text-xs text-muted-foreground">Cora • AI Advisor</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {connectionLost && (
          <div className="sticky top-0 z-10 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 flex items-center justify-center gap-2 text-sm text-destructive mb-4">
            <WifiOff className="h-4 w-4" />
            {retryCountRef.current >= 3 ? "Connection failed. Refresh the page." : "Reconnecting..."}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto py-16 space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-medium">Ask Cora anything</h2>
              <p className="text-sm text-muted-foreground">I've analyzed your validation report and can help you make better decisions.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={isSending}
                  className="text-left text-sm p-3 rounded-lg border border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ) : (
                <div className="border-l-2 border-primary/20 pl-4">
                  <MarkdownContent
                    content={message.content}
                    className="text-sm text-foreground/90 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
                  />
                </div>
              )}

              {/* Follow-ups */}
              {message.role === 'assistant' && isLastAssistant(message) && !isTyping && !isSending && (
                <div className="flex flex-wrap gap-1.5 mt-3 pl-4">
                  {getFollowUps().map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="border-l-2 border-primary/20 pl-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cora is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isSending}
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isSending}
            className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
