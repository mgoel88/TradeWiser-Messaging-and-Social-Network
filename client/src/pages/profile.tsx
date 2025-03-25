import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle, 
  Building, 
  CircleDot, 
  Warehouse, 
  Wheat, 
  Edit, 
  CheckCircle,
  Users,
  Loader,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FeedItem from "@/components/feed/FeedItem";
import CircleItem from "@/components/circle/CircleItem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
  business: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Get the current user session to check if viewing own profile
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const currentUser = sessionData?.user;
  const userId = id ? parseInt(id) : currentUser?.id;
  const isOwnProfile = currentUser?.id === userId;
  
  // Fetch user profile data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    enabled: !!userId,
  });
  
  // Fetch user's posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts/user', userId],
    enabled: !!userId,
  });
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      business: "",
      phone: "",
      avatar: "",
    },
  });
  
  // Set form values when user data is loaded
  React.useEffect(() => {
    if (userData?.user) {
      form.reset({
        name: userData.user.name || "",
        bio: userData.user.bio || "",
        business: userData.user.business || "",
        phone: userData.user.phone || "",
        avatar: userData.user.avatar || "",
      });
    }
  }, [userData, form]);
  
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      return apiRequest("PATCH", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const sendConnectionRequest = useMutation({
    mutationFn: () => {
      return apiRequest("POST", "/api/connections", {
        receiverId: userId
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: `You've sent a connection request to ${userData?.user.name}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to send connection request",
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userData?.user) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p className="mb-4">The user you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation('/')}>Go to homepage</Button>
      </div>
    );
  }
  
  const user = userData.user;
  const circles = userData.circles || [];
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-primary h-40 relative"></div>
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end -mt-16 mb-4 gap-4 sm:gap-6">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} 
                alt={`${user.name}'s profile`} 
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow"
              />
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  {user.kycVerified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center w-fit">
                      <CheckCircle className="h-3 w-3 mr-1" /> KYC Verified
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">{user.business || user.userType}</p>
                {user.bio && <p className="mt-2 text-sm text-gray-500">{user.bio}</p>}
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {circles.find((c: any) => c.id === user.nativeCircleId)?.name || "No native circle set"}
                  </span>
                </div>
              </div>
              {isOwnProfile ? (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="sm:self-start">
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell others about yourself..." 
                                  className="resize-none" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="business"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your business name" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Your phone number" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="avatar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/avatar.jpg" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  onClick={() => sendConnectionRequest.mutate()}
                  disabled={sendConnectionRequest.isPending}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {sendConnectionRequest.isPending ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-4 text-sm">
              <div>
                <p className="font-semibold">{userData.connectionsCount || 0}</p>
                <p className="text-gray-500">Connections</p>
              </div>
              <div className="border-l border-r border-gray-100">
                <p className="font-semibold">{circles.length || 0}</p>
                <p className="text-gray-500">Circles</p>
              </div>
              <div>
                <p className="font-semibold">0</p>
                <p className="text-gray-500">Commodities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <Card>
            <TabsList className="w-full flex border-b justify-start rounded-none">
              <TabsTrigger value="posts" className="flex items-center">
                <UserCircle className="h-4 w-4 mr-2" /> Posts
              </TabsTrigger>
              <TabsTrigger value="circles" className="flex items-center">
                <CircleDot className="h-4 w-4 mr-2" /> Circles
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center">
                <Building className="h-4 w-4 mr-2" /> Business
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center">
                <Warehouse className="h-4 w-4 mr-2" /> Assets
              </TabsTrigger>
              <TabsTrigger value="commodities" className="flex items-center">
                <Wheat className="h-4 w-4 mr-2" /> Commodities
              </TabsTrigger>
            </TabsList>
          </Card>
          
          <TabsContent value="posts" className="space-y-6 m-0">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : postsData?.posts?.length > 0 ? (
              postsData.posts.map((post: any) => (
                <FeedItem key={post.id} post={post} />
              ))
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-4">This user hasn't created any posts.</p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation('/')}>
                    Create your first post
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="circles" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-heading font-semibold text-lg">Circles</h3>
              </CardHeader>
              <CardContent>
                {circles.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {circles.map((circle: any) => (
                      <CircleItem 
                        key={circle.id} 
                        circle={circle}
                        isNative={circle.id === user.nativeCircleId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CircleDot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-medium mb-1">No circles yet</h3>
                    <p className="text-gray-500 mb-4">This user hasn't joined any circles.</p>
                    {isOwnProfile && (
                      <Button onClick={() => setLocation('/circles')}>
                        Join circles
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="business" className="m-0">
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-1">Business details coming soon</h3>
                <p className="text-gray-500 mb-4">This feature is still under development.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assets" className="m-0">
            <Card>
              <CardContent className="p-12 text-center">
                <Warehouse className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-1">No assets found</h3>
                <p className="text-gray-500 mb-4">
                  {isOwnProfile 
                    ? "You haven't added any assets yet." 
                    : "This user hasn't added any assets yet."}
                </p>
                {isOwnProfile && (
                  <Button>
                    Add asset
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commodities" className="m-0">
            <Card>
              <CardContent className="p-12 text-center">
                <Wheat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-1">No commodities found</h3>
                <p className="text-gray-500 mb-4">
                  {isOwnProfile
                    ? "You haven't added any commodities to your profile yet."
                    : "This user hasn't added any commodities to their profile yet."}
                </p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation('/commodities')}>
                    Add commodities
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Profile;
