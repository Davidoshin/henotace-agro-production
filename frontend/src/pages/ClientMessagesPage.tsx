import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { 
  ArrowLeft, 
  MessageSquare,
  Send,
  Search,
  User,
  Mail,
  Phone,
  Clock,
  CheckCheck,
  Loader2,
  Inbox
} from "lucide-react";

interface Conversation {
  client_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  unread_count: number;
  message_count: number;
  last_message: string;
  last_message_time: string | null;
  last_sender: 'client' | 'business';
}

interface Message {
  id: number;
  content: string;
  sender: 'client' | 'business';
  timestamp: string;
  read: boolean;
}

interface ClientInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function ClientMessagesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('business/client-messages/');
      if (response.success) {
        setConversations(response.conversations || []);
        setTotalUnread(response.total_unread || 0);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async (clientId: number) => {
    try {
      setLoadingConversation(true);
      const response = await apiGet(`business/client-messages/${clientId}/`);
      if (response.success) {
        setClientInfo(response.client);
        setMessages(response.messages || []);
        
        // Update unread count in conversation list
        setConversations(prev => prev.map(c => 
          c.client_id === clientId ? { ...c, unread_count: 0 } : c
        ));
        setTotalUnread(prev => Math.max(0, prev - (conversations.find(c => c.client_id === clientId)?.unread_count || 0)));
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSelectClient = (clientId: number) => {
    setSelectedClient(clientId);
    fetchConversation(clientId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;

    try {
      setSendingMessage(true);
      const response = await apiPost(`business/client-messages/${selectedClient}/`, {
        message: newMessage.trim()
      });
      
      if (response.success) {
        // Add new message to the list
        setMessages(prev => [...prev, response.data]);
        setNewMessage("");
        
        // Update conversation list
        setConversations(prev => prev.map(c => 
          c.client_id === selectedClient 
            ? { ...c, last_message: newMessage.trim(), last_message_time: new Date().toISOString(), last_sender: 'business' }
            : c
        ));
        
        toast({
          title: "Sent",
          description: "Message sent successfully"
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Client Messages
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread} unread</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Manage conversations with your clients</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No clients match your search" : "No messages yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Messages from clients will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.client_id}
                      onClick={() => handleSelectClient(conversation.client_id)}
                      className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                        selectedClient === conversation.client_id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conversation.client_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conversation.client_name}</p>
                            {conversation.last_message_time && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.last_message_time)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {conversation.last_sender === 'business' && "You: "}
                            {conversation.last_message || "No messages yet"}
                          </p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          {selectedClient ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                {loadingConversation ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ) : clientInfo && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {clientInfo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{clientInfo.name}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {clientInfo.email}
                          </span>
                          {clientInfo.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {clientInfo.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/business/service-clients/${selectedClient}`)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {loadingConversation ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                          <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'} rounded-lg`} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No messages in this conversation</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start by sending a message below
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id}
                          className={`flex ${message.sender === 'business' ? 'justify-end' : ''}`}
                        >
                          <div 
                            className={`max-w-[75%] rounded-lg p-3 ${
                              message.sender === 'business' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <div className={`flex items-center gap-1 mt-1 text-xs ${
                              message.sender === 'business' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {new Date(message.timestamp).toLocaleString()}
                              {message.sender === 'business' && message.read && (
                                <CheckCheck className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sendingMessage}
                    className="self-end"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a client from the list to view and reply to messages
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
