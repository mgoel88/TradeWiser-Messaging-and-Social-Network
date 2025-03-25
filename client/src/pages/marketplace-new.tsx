import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QUALITY_OPTIONS } from "@/lib/constants";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Create a schema for the listing form
const listingFormSchema = z.object({
  commodityId: z.number(),
  circleId: z.number(),
  listingType: z.enum(['buy', 'sell']),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  pricePerUnit: z.number().min(1, "Price must be at least 1"),
  minQuantity: z.number().nullable(),
  quality: z.string(),
  availableFrom: z.date(),
  availableTo: z.date(),
  description: z.string().optional()
}).refine((data) => {
  return data.availableFrom <= data.availableTo;
}, {
  message: "Available to date must be after available from date",
  path: ["availableTo"],
});

export default function CreateListingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [listingType, setListingType] = useState('sell');
  
  // Fetch commodities and circles
  const { data: commoditiesData } = useQuery({
    queryKey: ['/api/commodities'],
    queryFn: getQueryFn({ on401: 'throw' })
  });
  
  const { data: circlesData } = useQuery({
    queryKey: ['/api/circles'],
    queryFn: getQueryFn({ on401: 'throw' })
  });
  
  // Create form
  const form = useForm<z.infer<typeof listingFormSchema>>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      listingType: listingType as 'buy' | 'sell',
      quantity: 0,
      pricePerUnit: 0,
      minQuantity: null,
      quality: QUALITY_OPTIONS[0],
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: ''
    }
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setListingType(value);
    form.setValue('listingType', value as 'buy' | 'sell');
  };
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof listingFormSchema>) => {
    try {
      await apiRequest('/api/listings', {
        method: 'POST',
        data
      });
      
      toast({
        title: "Listing created",
        description: "Your listing has been created successfully",
      });
      
      // Invalidate listings query
      queryClient.invalidateQueries({
        queryKey: ['/api/listings']
      });
      
      // Navigate to marketplace
      navigate('/marketplace');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container py-6">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate('/marketplace')}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Create Listing</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Marketplace Listing</CardTitle>
          <CardDescription>
            Create a new listing to buy or sell commodities
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="sell" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sell">I want to Sell</TabsTrigger>
              <TabsTrigger value="buy">I want to Buy</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Commodity */}
                  <FormField
                    control={form.control}
                    name="commodityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commodity</FormLabel>
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
                            {commoditiesData?.commodities?.map((commodity: any) => (
                              <SelectItem 
                                key={commodity.id} 
                                value={commodity.id.toString()}
                              >
                                {commodity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Circle */}
                  <FormField
                    control={form.control}
                    name="circleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Circle</FormLabel>
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
                            {circlesData?.circles?.map((circle: any) => (
                              <SelectItem 
                                key={circle.id} 
                                value={circle.id.toString()}
                              >
                                {circle.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Total amount of commodity available
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Min Quantity */}
                  <FormField
                    control={form.control}
                    name="minQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Order (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum acceptable order size (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="pricePerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Per Kg (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Quality */}
                  <FormField
                    control={form.control}
                    name="quality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {QUALITY_OPTIONS.map((quality) => (
                              <SelectItem key={quality} value={quality}>
                                {quality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Available From */}
                  <FormField
                    control={form.control}
                    name="availableFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available From</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the listing becomes active
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Available To */}
                  <FormField
                    control={form.control}
                    name="availableTo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available Until</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the listing expires
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide additional details about your listing"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Details about quality, delivery options, or other terms
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">
                  Create Listing
                </Button>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}