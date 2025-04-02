import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Send, MoreHorizontal, User, Check, Clock, 
  Plus, Users, PlusCircle, Phone, Video, Image, FileText, 
  MapPin, Smile, Mic, UserPlus, Settings, ChevronLeft,
  Archive, Bell, BellOff, Trash, X, Star, Download, Reply,
  Forward, ChevronRight, ShieldCheck, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { TradeMessageComposer } from "@/components/messages/TradeMessageComposer";
import { MessageTemplateForm } from "@/components/messages/MessageTemplateForm";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatedCardSkeleton, AnimatedSkeleton } from "@/components/ui/animated-skeleton";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Link } from "wouter";

// Interface definitions
interface Chat {
  id: number;
  type: 'direct' | 'group' | 'broadcast';
  name?: string;
  creatorId: number;
  avatarUrl?: string;
  isActive: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  members: ChatMember[];
  unreadCount: number;
  lastMessage?: Message | null;
}

interface ChatMember {
  id: number;
  chatId: number;
  userId: number;
  role: string;
  isActive: boolean;
  user: {
    id: number;
    name: string;
    avatar?: string;
    userType?: string;
    kycVerified?: boolean;
  } | null;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact' | 'system' | 'template';
  content: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  sender?: {
    id: number;
    name: string;
    avatar?: string;
    userType?: string;
    kycVerified?: boolean;
  } | null;
}

interface Contact {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  userType: string;
  business?: string;
  kycVerified: boolean;
  chatId?: number;
}

const Messages: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

  // Get authenticated user session
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const userId = sessionData?.user?.id;
  
  // Get contacts (for creating new chats)
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: !!userId
  });
  
  // Get user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/chats'],
    enabled: !!userId
  });
  
  const chats: Chat[] = chatsData?.chats || [];
  
  // Get unread message counts
  const { data: unreadData } = useQuery({
    queryKey: ['/api/unread-messages'],
    enabled: !!userId
  });
  
  // Get messages for selected chat
  const { 
    data: messagesData, 
    isLoading: messagesLoading
  } = useQuery({
    queryKey: ['/api/chats', selectedChatId, 'messages'],
    enabled: !!selectedChatId,
  });
  
  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    
    // For direct chats, search by the other user's name
    if (chat.type === 'direct') {
      const otherMember = chat.members.find(m => m.userId !== userId);
      if (otherMember?.user) {
        return otherMember.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
    }
    
    // For groups and broadcasts, search by the chat name
    if (chat.name) {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return false;
  });
  
  // Get contacts that don't have an existing chat
  const filteredContacts = contactsData?.contacts?.filter((contact: Contact) => {
    if (!searchQuery) return true;
    return contact.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];
  
  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { chatId: number; content: string; type: string }) => {
      return apiRequest('POST', `/api/chats/${messageData.chatId}/messages`, messageData);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', selectedChatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/unread-messages'] });
    },
    onError: () => {
      toast({
        title: t("messages.errors.message_failed"),
        description: t("messages.errors.connection_failed"),
        variant: "destructive"
      });
    }
  });

  // Mutation for creating a new direct chat
  const createDirectChatMutation = useMutation({
    mutationFn: (recipientId: number) => {
      return apiRequest('POST', '/api/chats', {
        type: 'direct',
        recipientId
      });
    },
    onSuccess: (data) => {
      setIsNewChatOpen(false);
      setSelectedChatId(data.chat?.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    },
    onError: () => {
      toast({
        title: t("messages.errors.chat_creation_failed"),
        description: t("messages.errors.try_again"),
        variant: "destructive"
      });
    }
  });
  
  // Mutation for creating a group chat
  const createGroupChatMutation = useMutation({
    mutationFn: (data: { name: string; members: number[]; type: 'group' | 'broadcast' }) => {
      return apiRequest('POST', '/api/chats', data);
    },
    onSuccess: (data) => {
      setIsCreateGroupOpen(false);
      setGroupName("");
      setSelectedContacts([]);
      setSelectedChatId(data.chat?.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: () => {
      toast({
        title: t("messages.errors.group_creation_failed"),
        description: t("messages.errors.try_again"),
        variant: "destructive"
      });
    }
  });

  // Mark messages as read when selecting a chat
  useEffect(() => {
    if (selectedChatId) {
      // Mark messages as read when viewing them - this happens automatically in the backend
      queryClient.invalidateQueries({ queryKey: ['/api/unread-messages'] });
    }
  }, [selectedChatId]);

  // Send message handler
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChatId) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content: messageText,
      type: 'text'
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Create a new direct chat
  const startDirectChat = (contactId: number) => {
    createDirectChatMutation.mutate(contactId);
  };
  
  // Create a new group chat
  const createGroupChat = (type: 'group' | 'broadcast') => {
    if (!groupName.trim() || selectedContacts.length === 0) return;
    
    createGroupChatMutation.mutate({
      name: groupName,
      members: selectedContacts,
      type
    });
  };
  
  // Toggle contact selection for group creation
  const toggleContactSelection = (contactId: number) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };
  
  // Get selected chat data
  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  
  // For direct chats, get the other user's info
  let chatTitle = "";
  let chatAvatar = "";
  let chatInfo = "";
  
  if (selectedChat) {
    if (selectedChat.type === 'direct') {
      const otherMember = selectedChat.members.find(m => m.userId !== userId);
      if (otherMember?.user) {
        chatTitle = otherMember.user.name;
        chatAvatar = otherMember.user.avatar || "";
      }
    } else {
      chatTitle = selectedChat.name || "Group";
      chatAvatar = selectedChat.avatarUrl || "";
      chatInfo = `${selectedChat.members.length} members`;
    }
  }
  
  // Format message timestamps
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If within the last week, show day of week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return format(date, 'EEEE');
    }
    
    // Otherwise show date
    return format(date, 'MM/dd/yyyy');
  };

  // Scroll to bottom when new messages are added
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messagesData) {
      scrollToBottom();
    }
  }, [messagesData]);

  // For mobile view
  const [showChatList, setShowChatList] = useState(true);
  const [showChatDetail, setShowChatDetail] = useState(false);
  
  // Update UI for selected chat
  useEffect(() => {
    if (selectedChatId) {
      setShowChatList(window.innerWidth >= 768);
      setShowChatDetail(true);
    }
  }, [selectedChatId]);

  // Handle back button in mobile view
  const handleBackToList = () => {
    setShowChatList(true);
    setShowChatDetail(false);
  };

  // Check if the message is from the current user
  const isCurrentUserMessage = (message: Message) => {
    return message.senderId === userId;
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[] = []) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt);
      let dateKey = '';
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        dateKey = format(date, 'EEEE'); // Day name
      } else {
        dateKey = format(date, 'MMM d, yyyy'); // Jan 1, 2025
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  // Custom message rendering based on type
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden max-w-xs">
            <img src={message.content} alt="Shared image" className="w-full h-auto" />
            {message.metadata?.caption && (
              <div className="p-2 text-sm bg-background">{message.metadata.caption}</div>
            )}
          </div>
        );
        
      case 'document':
        return (
          <div className="flex items-center bg-gray-50 p-3 rounded-lg space-x-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{message.metadata?.filename || "Document"}</p>
              <p className="text-xs text-gray-500">{message.metadata?.size || ""}</p>
            </div>
            <Button size="sm" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
        
      case 'location':
        return (
          <div className="rounded-lg overflow-hidden max-w-xs">
            <div className="bg-gray-200 h-32 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div className="p-3 bg-background">
              <p className="font-medium">{message.metadata?.name || "Shared location"}</p>
              <p className="text-sm text-gray-500 truncate">
                {message.metadata?.address || `${message.metadata?.lat}, ${message.metadata?.lng}`}
              </p>
            </div>
          </div>
        );
        
      case 'system':
        return (
          <div className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full mx-auto">
            {message.content}
          </div>
        );
        
      case 'template':
        return (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {message.metadata?.templateType || "Template Message"}
              </Badge>
              {message.metadata?.commodityId && (
                <Badge variant="outline">
                  {message.metadata.commodityName || `Commodity #${message.metadata.commodityId}`}
                </Badge>
              )}
            </div>
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          </div>
        );
      
      default: // text
        return (
          <div className="whitespace-pre-wrap">{message.content}</div>
        );
    }
  };

  // Add a trade message composer state
  const [isTradeMessageOpen, setIsTradeMessageOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  
  // Handler for trade message submission
  const handleTradeMessageSent = (messageData: any) => {
    // Refresh chats and messages
    queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    if (messageData.chatId) {
      setSelectedChatId(messageData.chatId);
      queryClient.invalidateQueries({ queryKey: ['/api/chats', messageData.chatId, 'messages'] });
    }
    setIsTradeMessageOpen(false);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t("nav.messages")}</h1>
            <p className="text-gray-600">{t("messages.description")}</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                const otherMember = selectedChat?.members.find(m => m.userId !== userId);
                if (otherMember) {
                  setSelectedRecipientId(otherMember.userId);
                  setIsTradeMessageOpen(true);
                } else {
                  setIsNewChatOpen(true);
                }
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              {t("messages.trade_message")}
            </Button>
            
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("messages.new_chat")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("messages.new_chat_title")}</DialogTitle>
                  <DialogDescription>{t("messages.select_contact")}</DialogDescription>
                </DialogHeader>
                <div className="relative my-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t("messages.search_contacts")}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[300px] pr-4">
                  {contactsLoading ? (
                    <div className="py-4">
                      <AnimatedSkeleton className="h-20 w-full" />
                      <AnimatedSkeleton className="h-20 w-full" />
                      <AnimatedSkeleton className="h-20 w-full" />
                    </div>
                  ) : filteredContacts.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {filteredContacts.map((contact: Contact) => (
                        <div 
                          key={contact.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                          onClick={() => startDirectChat(contact.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback>
                              {contact.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                              {contact.chatId && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {t("messages.existing_chat")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              {contact.kycVerified && (
                                <ShieldCheck className="h-3 w-3 text-green-500 mr-1" />
                              )}
                              <span className="truncate">
                                {contact.business || contact.userType}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium mb-1">{t("messages.no_contacts")}</h3>
                      <p className="text-gray-500 text-sm">
                        {searchQuery 
                          ? t("messages.no_contacts_search") 
                          : t("messages.connect_first")}
                      </p>
                    </div>
                  )}
                </ScrollArea>
                <DialogFooter className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => setIsCreateGroupOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    {t("messages.create_group")}
                  </Button>
                  <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("messages.create_group_title")}</DialogTitle>
                  <DialogDescription>{t("messages.create_group_desc")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Input
                      placeholder={t("messages.group_name")}
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t("messages.select_members")} 
                      {selectedContacts.length > 0 && ` (${selectedContacts.length})`}
                    </p>
                    <ScrollArea className="h-[200px] pr-4">
                      {contactsLoading ? (
                        <div className="py-4">
                          <AnimatedSkeleton className="h-20 w-full" />
                          <AnimatedSkeleton className="h-20 w-full" />
                          <AnimatedSkeleton className="h-20 w-full" />
                        </div>
                      ) : filteredContacts.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {filteredContacts.map((contact: Contact) => (
                            <div 
                              key={contact.id}
                              className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-3 ${
                                selectedContacts.includes(contact.id) ? 'bg-gray-50' : ''
                              }`}
                              onClick={() => toggleContactSelection(contact.id)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={contact.avatar} />
                                <AvatarFallback>
                                  {contact.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                                  {selectedContacts.includes(contact.id) && (
                                    <Badge variant="default" className="text-xs font-normal">
                                      {t("messages.selected")}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {contact.business || contact.userType}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium mb-1">{t("messages.no_contacts")}</h3>
                          <p className="text-gray-500 text-sm">
                            {t("messages.connect_first")}
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    onClick={() => createGroupChat('group')}
                    disabled={!groupName.trim() || selectedContacts.length === 0 || createGroupChatMutation.isPending}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t("messages.create_group")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TradeMessageComposer
          isOpen={isTradeMessageOpen}
          onClose={() => setIsTradeMessageOpen(false)}
          userId={userId}
          recipientId={selectedRecipientId || undefined}
          messageType="template"
          onSend={handleTradeMessageSent}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            {(showChatList || !selectedChatId) && (
              <Card className="h-[calc(100vh-220px)] flex flex-col">
                <CardHeader className="px-4 py-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t("messages.search_conversations")}
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <Tabs defaultValue="all" className="h-full flex flex-col">
                    <TabsList className="w-full grid grid-cols-2 rounded-none">
                      <TabsTrigger value="all">{t("messages.all_messages")}</TabsTrigger>
                      <TabsTrigger value="unread">{t("messages.unread")}</TabsTrigger>
                    </TabsList>
                  
                    <TabsContent value="all" className="flex-1 m-0 overflow-y-auto">
                      {chatsLoading ? (
                        <div className="p-4">
                          <AnimatedSkeleton className="h-20 w-full" />
                          <AnimatedSkeleton className="h-20 w-full" />
                          <AnimatedSkeleton className="h-20 w-full" />
                        </div>
                      ) : filteredChats.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {filteredChats.map((chat: Chat) => {
                            // For direct chats, show the other user's info
                            let chatName = "";
                            let chatAvatar = "";
                            
                            if (chat.type === 'direct') {
                              const otherMember = chat.members.find(m => m.userId !== userId);
                              if (otherMember?.user) {
                                chatName = otherMember.user.name;
                                chatAvatar = otherMember.user.avatar || "";
                              }
                            } else {
                              chatName = chat.name || "Group";
                              chatAvatar = chat.avatarUrl || "";
                            }
                            
                            return (
                              <div 
                                key={chat.id}
                                className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                  selectedChatId === chat.id ? 'bg-gray-50' : ''
                                }`}
                                onClick={() => setSelectedChatId(chat.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={chatAvatar} />
                                    <AvatarFallback>
                                      {chatName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium text-sm truncate">
                                        {chatName}
                                        {chat.type !== 'direct' && (
                                          <Badge variant="outline" className="ml-1 text-xs">
                                            {chat.type === 'group' ? t("messages.group") : t("messages.broadcast")}
                                          </Badge>
                                        )}
                                      </h4>
                                      <span className="text-xs text-gray-500">
                                        {chat.lastMessage ? formatMessageTime(chat.lastMessage.createdAt) : 
                                          formatMessageTime(chat.createdAt)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <p className="text-xs text-gray-500 truncate">
                                        {chat.lastMessage ? 
                                          (chat.lastMessage.type === 'text' ? 
                                            chat.lastMessage.content : 
                                            t(`messages.${chat.lastMessage.type}`)) : 
                                          t("messages.no_messages")}
                                      </p>
                                      {chat.unreadCount > 0 && (
                                        <Badge variant="default" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                                          {chat.unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full p-6 text-center">
                          <User className="h-12 w-12 text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium mb-1">{t("messages.no_conversations")}</h3>
                          <p className="text-gray-500 text-sm mb-4">
                            {searchQuery 
                              ? t("messages.no_conversations_search") 
                              : t("messages.start_by_connecting")}
                          </p>
                          <Button onClick={() => setIsNewChatOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t("messages.start_conversation")}
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="unread" className="flex-1 m-0 overflow-y-auto">
                      {chatsLoading ? (
                        <div className="p-4">
                          <AnimatedSkeleton className="h-20 w-full" />
                          <AnimatedSkeleton className="h-20 w-full" />
                          <AnimatedSkeleton className="h-20 w-full" />
                        </div>
                      ) : filteredChats.filter(c => c.unreadCount > 0).length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {filteredChats
                            .filter(chat => chat.unreadCount > 0)
                            .map((chat: Chat) => {
                              // For direct chats, show the other user's info
                              let chatName = "";
                              let chatAvatar = "";
                              
                              if (chat.type === 'direct') {
                                const otherMember = chat.members.find(m => m.userId !== userId);
                                if (otherMember?.user) {
                                  chatName = otherMember.user.name;
                                  chatAvatar = otherMember.user.avatar || "";
                                }
                              } else {
                                chatName = chat.name || "Group";
                                chatAvatar = chat.avatarUrl || "";
                              }
                              
                              return (
                                <div 
                                  key={chat.id}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                    selectedChatId === chat.id ? 'bg-gray-50' : ''
                                  }`}
                                  onClick={() => setSelectedChatId(chat.id)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={chatAvatar} />
                                      <AvatarFallback>
                                        {chatName.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center">
                                        <h4 className="font-medium text-sm truncate">{chatName}</h4>
                                        <span className="text-xs text-gray-500">
                                          {chat.lastMessage ? formatMessageTime(chat.lastMessage.createdAt) : 
                                            formatMessageTime(chat.createdAt)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 truncate">
                                          {chat.lastMessage ? 
                                            (chat.lastMessage.type === 'text' ? 
                                              chat.lastMessage.content : 
                                              t(`messages.${chat.lastMessage.type}`)) : 
                                            t("messages.no_messages")}
                                        </p>
                                        <Badge variant="default" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                                          {chat.unreadCount}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full p-6 text-center">
                          <Check className="h-12 w-12 text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium mb-1">{t("messages.no_unread")}</h3>
                          <p className="text-gray-500 text-sm">
                            {t("messages.all_caught_up")}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-2">
            <Card className="h-[calc(100vh-220px)] flex flex-col">
              {selectedChat ? (
                <>
                  <CardHeader className="px-4 py-3 border-b flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {!showChatList && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden mr-1"
                            onClick={handleBackToList}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                        )}
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chatAvatar} />
                          <AvatarFallback>
                            {chatTitle.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{chatTitle}</h4>
                          <div className="flex items-center space-x-1">
                            {selectedChat.type !== 'direct' ? (
                              <Badge variant="outline" className="text-xs font-normal py-0 h-5">
                                {chatInfo}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {t("messages.online")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {selectedChat.type === 'direct' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-gray-500">
                              <Phone className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500">
                              <Video className="h-5 w-5" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {selectedChat.type === 'direct' ? (
                              <>
                                <DropdownMenuItem>
                                  <User className="h-4 w-4 mr-2" />
                                  {t("messages.view_profile")}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  {t("messages.shared_files")}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem>
                                  <Users className="h-4 w-4 mr-2" />
                                  {t("messages.view_members")}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  {t("messages.add_members")}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="h-4 w-4 mr-2" />
                                  {t("messages.group_settings")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        <AnimatedSkeleton className="h-20 w-full" />
                        <AnimatedSkeleton className="h-20 w-full" />
                        <AnimatedSkeleton className="h-20 w-full" />
                      </div>
                    ) : (messagesData as any)?.messages?.length > 0 ? (
                      <div className="space-y-6">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="py-1 px-3">
                            {format(new Date(selectedChat.createdAt), 'MMMM d, yyyy')}
                          </Badge>
                        </div>
                        
                        {Object.entries(groupMessagesByDate((messagesData as any)?.messages || [])).map(([date, messages]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex justify-center">
                              <Badge variant="outline" className="bg-gray-50">
                                {date}
                              </Badge>
                            </div>
                            
                            {messages.map((message: Message) => {
                              const isCurrentUser = isCurrentUserMessage(message);
                              return (
                                <div 
                                  key={message.id} 
                                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[85%]`}>
                                    {!isCurrentUser && (
                                      <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src={message.sender?.avatar} />
                                        <AvatarFallback>
                                          {message.sender?.name?.substring(0, 2).toUpperCase() || ""}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    
                                    <div>
                                      {!isCurrentUser && message.type !== 'system' && (
                                        <div className="flex items-center mb-1">
                                          <span className="text-xs font-medium">
                                            {message.sender?.name}
                                          </span>
                                          {message.sender?.kycVerified && (
                                            <ShieldCheck className="h-3 w-3 text-green-500 ml-1" />
                                          )}
                                        </div>
                                      )}
                                      
                                      <div 
                                        className={`rounded-lg px-4 py-2 ${
                                          message.type === 'system' 
                                            ? 'mx-auto bg-gray-100' 
                                            : isCurrentUser 
                                              ? 'bg-primary text-primary-foreground' 
                                              : 'bg-muted'
                                        }`}
                                      >
                                        {renderMessage(message)}
                                      </div>
                                      
                                      <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-xs text-gray-500">
                                          {format(new Date(message.createdAt), 'h:mm a')}
                                        </span>
                                        {isCurrentUser && (
                                          <Check className={`h-3 w-3 ml-1 ${
                                            message.isRead ? 'text-blue-500' : 'text-gray-400'
                                          }`} />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center items-center h-full text-center">
                        <FileText className="h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium mb-1">{t("messages.no_messages_yet")}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          {t("messages.send_first_message")}
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="p-4 border-t">
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder={t("messages.type_message")}
                        className="flex-1 min-h-[60px] max-h-[120px]"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <div className="flex flex-col gap-2">
                        <Button 
                          className="rounded-full p-2 h-10 w-10" 
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          onClick={handleSendMessage}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full p-6 text-center">
                  <FileText className="h-16 w-16 text-gray-200 mb-4" />
                  <h3 className="text-xl font-medium mb-2">{t("messages.select_conversation")}</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    {t("messages.select_conversation_desc")}
                  </p>
                  <Button onClick={() => setIsNewChatOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("messages.new_chat")}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Messages;