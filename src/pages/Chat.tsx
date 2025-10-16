import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  validation_score: number | null;
}

interface Report {
  report_data: any;
}

const STARTER_QUESTIONS = [
  "How can I reduce my startup costs?",
  "Who should I target first?",
  "What are my biggest risks?",
  "How do I find my first 10 customers?",
  "What should I build first (MVP)?",
  "Is this idea worth pursuing?"
];

export default function Chat() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadProjectAndChat();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.role === 'assistant') {
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjectAndChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load report
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .single();

      setReport(reportData);

      // Load or create conversation
      let { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      let convId: string;

      if (conversations && conversations.length > 0) {
        convId = conversations[0].id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            project_id: projectId,
            title: `Chat about ${projectData.name}`
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = newConv.id;
      }

      setConversationId(convId);

      // Load messages
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      setMessages((messagesData || []) as Message[]);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isSending || !conversationId) return;

    setIsSending(true);
    setIsTyping(true);

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Save user message to database
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: messageText
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('chat-with-cora', {
        body: {
          conversation_id: conversationId,
          user_message: messageText,
          project_id: projectId
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      if (error.message?.includes('credits')) {
        toast({
          title: 'Credits Exhausted',
          description: "You've reached your message limit. Upgrade to continue chatting.",
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
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

  const getScoreColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 70) return 'default';
    if (score >= 41) return 'secondary';
    return 'destructive';
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return 'Pending';
    if (score >= 70) return 'Strong Potential';
    if (score >= 41) return 'Moderate Potential';
    return 'Needs Work';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/projects/${projectId}/report`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{project?.name}</h1>
                <p className="text-sm text-muted-foreground">Chat with Cora</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? 'Hide' : 'Show'} Summary
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-80 border-r bg-card/30 backdrop-blur overflow-y-auto`}
          >
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">
                      {project?.validation_score || '—'}
                    </div>
                    <Badge variant={getScoreColor(project?.validation_score || null)}>
                      {getScoreLabel(project?.validation_score || null)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {report?.report_data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {report.report_data.executiveSummary?.strengths?.slice(0, 3).map((strength: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <div className="text-green-500 mt-0.5">✓</div>
                        <div className="text-muted-foreground">{strength}</div>
                      </div>
                    ))}
                    {report.report_data.executiveSummary?.concerns?.slice(0, 2).map((concern: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <div className="text-amber-500 mt-0.5">⚠</div>
                        <div className="text-muted-foreground">{concern}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="max-w-2xl mx-auto space-y-6 py-8">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Ask Cora Anything</h2>
                    <p className="text-muted-foreground">
                      I've analyzed your validation report and I'm here to help you understand it better.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {STARTER_QUESTIONS.map((question, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => sendMessage(question)}
                          disabled={isSending}
                          className="text-left h-auto py-2 whitespace-normal"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] lg:max-w-[60%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-card border'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Cora</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] lg:max-w-[60%] rounded-2xl px-4 py-3 bg-card border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Cora is typing</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-card/50 backdrop-blur p-4">
              <div className="container max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Cora anything about your validation report..."
                    disabled={isSending}
                    className="resize-none min-h-[60px] max-h-[200px]"
                    maxLength={500}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isSending}
                    size="icon"
                    className="h-[60px] w-[60px]"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Shift + Enter for new line, Enter to send</span>
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