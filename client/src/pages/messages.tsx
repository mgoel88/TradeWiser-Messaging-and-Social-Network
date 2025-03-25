import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Send, MoreHorizontal, User, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

const Messages: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock queries that would be implemented when backend is ready
  const { data: sessionsData } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/connections'],
    select: (data) => {
      // Transform connections into conversations
      if (!data?.connections) return { conversations: [] };
      
      return {
        conversations: data.connections.map((connection: any) => ({
          id: connection.id,
          user: connection.user,
          lastMessage: "No messages yet",
          lastMessageTime: new Date().toISOString(),
          unread: 0
        }))
      };
    }
  });

  const conversations = conversationsData?.conversations || [];
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation: any) => {
    if (!searchQuery) return true;
    return conversation.user.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Mock mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: (message: { recipientId: number; text: string }) => {
      // This would be replaced with a real API call
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      setMessageText("");
      toast({
        title: t("messages.success.message_sent"),
        description: t("messages.success.message_delivered")
      });
    },
    onError: () => {
      toast({
        title: t("messages.errors.message_failed"),
        description: t("messages.errors.connection_failed"),
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      recipientId: selectedConversation,
      text: messageText
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get selected conversation
  const selectedConversationData = conversations.find((c: any) => c.id === selectedConversation);

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t("nav.messages")}</h1>
            <p className="text-gray-600">{t("messages.description")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversations List */}
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
                    {conversationsLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">{t("common.loading")}</p>
                      </div>
                    ) : filteredConversations.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conversation: any) => (
                          <div 
                            key={conversation.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer ${
                              selectedConversation === conversation.id ? 'bg-gray-50' : ''
                            }`}
                            onClick={() => setSelectedConversation(conversation.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conversation.user.avatar} />
                                <AvatarFallback>
                                  {conversation.user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-sm truncate">{conversation.user.name}</h4>
                                  <span className="text-xs text-gray-500">
                                    {new Date(conversation.lastMessageTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                                  {conversation.unread > 0 && (
                                    <Badge variant="default" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                                      {conversation.unread}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
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
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="unread" className="flex-1 m-0 overflow-y-auto">
                    {filteredConversations.filter((c: any) => c.unread > 0).length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {filteredConversations
                          .filter((conversation: any) => conversation.unread > 0)
                          .map((conversation: any) => (
                            <div 
                              key={conversation.id}
                              className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                selectedConversation === conversation.id ? 'bg-gray-50' : ''
                              }`}
                              onClick={() => setSelectedConversation(conversation.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={conversation.user.avatar} />
                                  <AvatarFallback>
                                    {conversation.user.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm truncate">{conversation.user.name}</h4>
                                    <span className="text-xs text-gray-500">
                                      {new Date(conversation.lastMessageTime).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                                    <Badge variant="default" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                                      {conversation.unread}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
              {selectedConversationData ? (
                <>
                  <CardHeader className="px-4 py-3 border-b flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedConversationData.user.avatar} />
                          <AvatarFallback>
                            {selectedConversationData.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{selectedConversationData.user.name}</h4>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs font-normal py-0 h-5">
                              {selectedConversationData.user.userType}
                            </Badge>
                            {selectedConversationData.user.kycVerified && (
                              <Badge variant="secondary" className="text-xs font-normal py-0 h-5">
                                {t("profile.verification_status")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-500">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-xs font-normal py-1">
                        {t("messages.conversation_started")}
                      </Badge>
                    </div>

                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium mb-1">{t("messages.no_messages_yet")}</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        {t("messages.start_conversation")}
                      </p>
                    </div>
                  </CardContent>

                  <div className="p-3 border-t">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder={t("messages.type_message")}
                        className="resize-none"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="flex-shrink-0"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {t("messages.send")}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full p-6 text-center">
                  <Send className="h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium mb-1">{t("messages.select_conversation")}</h3>
                  <p className="text-gray-500 text-sm max-w-md">
                    {t("messages.select_to_start")}
                  </p>
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