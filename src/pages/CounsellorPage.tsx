import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import { getChatMessages, createChatMessage, getProfile, getUniversities, addToShortlist, lockUniversity, createTask } from '@/db/api';
import type { ChatMessage } from '@/types';
import { toast } from 'sonner';

// Simulated AI responses based on user input
const generateAIResponse = async (
  userMessage: string,
  userId: string
): Promise<string> => {
  const lowerMessage = userMessage.toLowerCase();

  // Get user profile for context
  const profile = await getProfile(userId);
  if (!profile) return "I'm having trouble accessing your profile. Please try again.";

  // Recommendation requests
  if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('university') || lowerMessage.includes('universities')) {
    const universities = await getUniversities({
      countries: profile.preferred_countries.length > 0 ? profile.preferred_countries : undefined,
      programs: profile.preferred_fields.length > 0 ? profile.preferred_fields : undefined,
      budgetMax: profile.budget_max || undefined,
    });

    if (universities.length === 0) {
      return "I couldn't find universities matching your exact criteria. Let me broaden the search. Could you tell me more about what's most important to you - location, program, or budget?";
    }

    const dream = universities.slice(0, 2);
    const target = universities.slice(2, 5);
    const safe = universities.slice(5, 8);

    let response = `Based on your profile (GPA: ${profile.gpa || 'N/A'}, Budget: $${profile.budget_min || 0}-${profile.budget_max || 0}), here are my recommendations:\n\n`;
    
    response += `🌟 **Dream Schools** (Reach):\n`;
    dream.forEach(uni => {
      response += `- **${uni.name}** (${uni.country}): Acceptance rate ${uni.acceptance_rate}%. This is a reach school but your ${profile.field_of_study || 'background'} makes you competitive.\n`;
    });

    response += `\n🎯 **Target Schools** (Match):\n`;
    target.forEach(uni => {
      response += `- **${uni.name}** (${uni.country}): Acceptance rate ${uni.acceptance_rate}%. Your profile aligns well with their requirements.\n`;
    });

    response += `\n✅ **Safe Schools** (Likely):\n`;
    safe.forEach(uni => {
      response += `- **${uni.name}** (${uni.country}): Acceptance rate ${uni.acceptance_rate}%. Strong likelihood of admission.\n`;
    });

    response += `\nWould you like me to add any of these to your shortlist?`;
    return response;
  }

  // Profile analysis
  if (lowerMessage.includes('profile') || lowerMessage.includes('chances') || lowerMessage.includes('strength')) {
    let response = `Let me analyze your profile:\n\n`;
    response += `**Strengths:**\n`;
    if (profile.gpa && profile.gpa >= 3.5) {
      response += `- Strong GPA of ${profile.gpa} - this is competitive for most universities\n`;
    }
    if (profile.exams_taken.length > 0) {
      response += `- You've completed ${profile.exams_taken.join(', ')} - great preparation!\n`;
    }
    response += `- Clear focus on ${profile.preferred_fields.join(', ')}\n`;

    response += `\n**Areas to Strengthen:**\n`;
    if (profile.exams_planned.length > 0) {
      response += `- Complete your planned exams: ${profile.exams_planned.join(', ')}\n`;
    }
    if (!profile.gpa || profile.gpa < 3.5) {
      response += `- Consider ways to improve your academic standing\n`;
    }

    response += `\nYour profile is ${profile.gpa && profile.gpa >= 3.5 ? 'strong' : 'developing'}. Would you like specific advice on improving your application?`;
    return response;
  }

  // Budget questions
  if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('afford') || lowerMessage.includes('expensive')) {
    return `Based on your budget of $${profile.budget_min || 0}-${profile.budget_max || 0} per year, I can help you find affordable options. Countries like Germany and some European nations offer low or no tuition fees. Would you like me to show you universities within your budget range?`;
  }

  // Timeline questions
  if (lowerMessage.includes('timeline') || lowerMessage.includes('when') || lowerMessage.includes('deadline')) {
    return `Here's a typical application timeline:\n\n- **Now**: Research universities and prepare documents\n- **3-6 months before**: Complete standardized tests\n- **2-4 months before**: Write essays and get recommendations\n- **1-2 months before**: Submit applications\n\nMost universities have deadlines between November and February. Would you like me to create a personalized task list?`;
  }

  // Help with next steps
  if (lowerMessage.includes('next') || lowerMessage.includes('what should') || lowerMessage.includes('help')) {
    const stage = profile.current_stage;
    if (stage === 'exploring') {
      return `Your next step is to explore universities! I recommend:\n1. Review my university recommendations\n2. Add 6-10 universities to your shortlist (mix of Dream, Target, and Safe)\n3. Research each university's specific requirements\n\nWould you like me to recommend some universities now?`;
    } else if (stage === 'shortlisting') {
      return `You're building your shortlist! Make sure to:\n1. Include a balanced mix of Dream, Target, and Safe schools\n2. Consider location, program quality, and budget\n3. Lock at least one university when you're ready to commit\n\nNeed help deciding which universities to add?`;
    } else if (stage === 'committed') {
      return `Great! You've locked your choices. Now:\n1. Review application requirements for each university\n2. Start working on your tasks\n3. Prepare documents like transcripts and recommendations\n\nShall I create some tasks to get you started?`;
    }
  }

  // Default helpful response
  return `I'm here to help you with your university applications! I can:\n\n- Recommend universities based on your profile\n- Analyze your strengths and weaknesses\n- Explain admission requirements\n- Help you build a balanced shortlist\n- Create application tasks and timelines\n\nWhat would you like to know?`;
};

export default function CounsellorPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      try {
        const msgs = await getChatMessages(user.id);
        setMessages(msgs);

        // If no messages, send welcome message
        if (msgs.length === 0) {
          const welcomeMsg = await createChatMessage(
            user.id,
            'assistant',
            `Hello ${profile?.full_name || 'there'}! 👋 I'm your AI Counsellor, here to guide you through your university application journey.\n\nI've reviewed your profile and I'm ready to help you find the perfect universities. What would you like to know?`
          );
          if (welcomeMsg) {
            setMessages([welcomeMsg]);
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadMessages();
  }, [user, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Save user message
      const userMsg = await createChatMessage(user.id, 'user', userMessage);
      if (userMsg) {
        setMessages((prev) => [...prev, userMsg]);
      }

      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage, user.id);

      // Save AI message
      const aiMsg = await createChatMessage(user.id, 'assistant', aiResponse);
      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-4xl">
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Counsellor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-5rem)]">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-secondary/10">
                          <User className="h-4 w-4 text-secondary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about universities, applications, or your profile..."
                className="min-h-[60px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-[60px] w-[60px] shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
