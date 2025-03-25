import React, { useState, useEffect } from "react";
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
  MapPin, Smile, Mic, UserPlus, Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  SheetTrigger 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatedCardSkeleton } from "@/components/ui/animated-skeleton";
import { format, formatDistanceToNow } from 'date-fns';

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
  } | null;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: number;
    name: string;
    avatar?: string;
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
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
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
      return apiRequest(`/api/chats/${messageData.chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
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
      return apiRequest('/api/chats', {
        method: 'POST',
        body: JSON.stringify({
          type: 'direct',
          recipientId
        })
      });
    },
    onSuccess: (data) => {
      setIsNewChatOpen(false);
      setSelectedChatId(data.chat.id);
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
      return apiRequest('/api/chats', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setIsCreateGroupOpen(false);
      setGroupName("");
      setSelectedContacts([]);
      setSelectedChatId(data.chat.id);
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

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t("nav.messages")}</h1>
            <p className="text-gray-600">{t("messages.description")}</p>
          </div>
          
          <div className="flex space-x-2">
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
                      <AnimatedCardSkeleton count={3} />
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
                          <AnimatedCardSkeleton count={3} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Chats List */}
          <div className="md:col-span-1">
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
                        <AnimatedCardSkeleton count={5} />
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
                        <AnimatedCardSkeleton count={3} />
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
          </div>

          {/* Conversation Area */}
          <div className="md:col-span-2">
            <Card className="h-[calc(100vh-220px)] flex flex-col">
              {selectedChat ? (
                <>
                  <CardHeader className="px-4 py-3 border-b flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
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
                              // Show online status or last seen for direct chats
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
                        <AnimatedCardSkeleton count={3} />
                      </div>
                    ) : messagesData?.messages?.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="text-xs font-normal py-1">
                            {format(new Date(selectedChat.createdAt), 'MMMM d, yyyy')}
                          </Badge>
                        </div>
                        
                        {messagesData.messages.map((message: Message) => {
                          const isCurrentUser = message.senderId === userId;
                          
                          return (
                            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-gray-100'
                                }`}
                              >
                                {!isCurrentUser && message.sender && (
                                  <p className="text-xs font-medium mb-1">
                                    {message.sender.name}
                                  </p>
                                )}
                                
                                {message.type === 'text' ? (
                                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                ) : message.type === 'image' ? (
                                  <div className="rounded overflow-hidden">
                                    <img 
                                      src={message.content} 
                                      alt="Shared image" 
                                      className="max-w-full h-auto" 
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    {message.type === 'document' && (
                                      <FileText className="h-5 w-5" />
                                    )}
                                    {message.type === 'audio' && (
                                      <Mic className="h-5 w-5" />
                                    )}
                                    {message.type === 'location' && (
                                      <MapPin className="h-5 w-5" />
                                    )}
                                    <span>{message.content}</span>
                                  </div>
                                )}
                                
                                <div className={`text-xs mt-1 flex justify-end ${
                                  isCurrentUser ? 'text-primary-foreground/70' : 'text-gray-500'
                                }`}>
                                  {formatMessageTime(message.createdAt)}
                                  {isCurrentUser && (
                                    <Check className="h-3 w-3 ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium mb-1">{t("messages.no_messages_yet")}</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                          {t("messages.start_conversation")}
                        </p>
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-3 border-t">
                    <div className="flex items-end gap-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <Button variant="ghost" size="icon" className="text-gray-500">
                          <Smile className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-500">
                          <Image className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-500">
                          <FileText className="h-5 w-5" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder={t("messages.type_message")}
                        className="resize-none flex-1"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        size="icon"
                        className="h-10 w-10"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full p-6 text-center">
                  <div className="max-w-md">
                    <Send className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium mb-1">{t("messages.select_conversation")}</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {t("messages.select_to_start")}
                    </p>
                    <Button onClick={() => setIsNewChatOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("messages.new_chat")}
                    </Button>
                  </div>
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