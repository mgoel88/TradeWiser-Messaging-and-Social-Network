import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Image, LineChart, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { POST_TYPES } from "@/lib/constants";

const createPostSchema = z.object({
  content: z.string().min(5, "Post content must be at least 5 characters"),
  type: z.string().default("update"),
  circleId: z.number().optional(),
  commodityId: z.number().optional(),
  imageUrl: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

const CreatePost = () => {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [postContent, setPostContent] = useState("");

  // Fetch user data for the avatar
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session']
  });

  const user = sessionData?.user;

  // Fetch circles for dropdown
  const { data: circlesData } = useQuery({
    queryKey: ['/api/circles']
  });

  // Fetch commodities for dropdown
  const { data: commoditiesData } = useQuery({
    queryKey: ['/api/commodities']
  });

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
      type: "update"
    }
  });

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostFormValues) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post created",
        description: "Your post has been published successfully."
      });
      form.reset();
      setPostContent("");
      setOpenDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreatePostFormValues) => {
    createPostMutation.mutate(data);
  };

  const handleQuickPost = () => {
    if (postContent.trim().length < 5) {
      toast({
        title: "Post too short",
        description: "Your post must be at least 5 characters long.",
        variant: "destructive"
      });
      return;
    }

    createPostMutation.mutate({
      content: postContent,
      type: "update"
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <Input
            type="text"
            placeholder="Share market updates or commodity news..."
            className="flex-1 bg-gray-100 rounded-full"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickPost();
              }
            }}
          />
        </div>
        <div className="flex mt-3 pt-2 border-t border-gray-100 -mx-4 px-4">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="flex-1 flex items-center justify-center text-gray-600 hover:bg-gray-50 py-1 rounded-md">
                <Image className="text-green-600 mr-2 h-4 w-4" />
                <span className="text-sm">Photo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create a Post</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select post type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POST_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share market updates or commodity news..."
                            {...field}
                            className="resize-none min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="circleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Circle (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a circle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {circlesData?.circles.map((circle) => (
                              <SelectItem key={circle.id} value={circle.id.toString()}>
                                {circle.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="commodityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commodity (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a commodity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {commoditiesData?.commodities.map((commodity) => (
                              <SelectItem key={commodity.id} value={commodity.id.toString()}>
                                {commodity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpenDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-center text-gray-600 hover:bg-gray-50 py-1 rounded-md"
            onClick={() => {
              form.setValue("type", "price_update");
              setOpenDialog(true);
            }}
          >
            <LineChart className="text-blue-600 mr-2 h-4 w-4" />
            <span className="text-sm">Price Update</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-center text-gray-600 hover:bg-gray-50 py-1 rounded-md"
            onClick={() => {
              form.setValue("type", "update");
              setOpenDialog(true);
            }}
          >
            <Tag className="text-yellow-600 mr-2 h-4 w-4" />
            <span className="text-sm">Commodity</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
