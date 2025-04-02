import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  File, 
  CheckCircle, 
  XCircle, 
  Clock,
  Share, 
  FileText,
  Download,
  Clipboard,
  Send,
  Eye
} from 'lucide-react';

// Contract form schema
const contractFormSchema = z.object({
  name: z.string().min(3, { message: 'Contract name is required' }),
  buyerId: z.number().optional(),
  sellerId: z.number().optional(),
  commodityId: z.number(),
  commodityName: z.string(),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1' }),
  unit: z.string(),
  pricePerUnit: z.number().min(0.01, { message: 'Price must be greater than 0' }),
  totalAmount: z.number().optional(),
  deliveryDate: z.string().optional(),
  deliveryLocation: z.string().optional(),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  quality: z.string().optional(),
  legalTerms: z.string().optional(),
  notes: z.string().optional(),
  chatId: z.number().optional()
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

// WhatsApp share schema
const whatsappShareSchema = z.object({
  phoneNumbers: z.array(z.string()),
  message: z.string().optional()
});

type WhatsappShareValues = z.infer<typeof whatsappShareSchema>;

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard'); // Added state for selected template
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  // Get user session
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const res = await apiRequest('/api/auth/session');
      return res;
    },
  });

  const userId = sessionData?.user?.id;

  // Setup form
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      name: '',
      buyerId: undefined,
      sellerId: undefined,
      commodityId: undefined,
      commodityName: '',
      quantity: undefined,
      unit: 'kg',
      pricePerUnit: undefined,
      totalAmount: undefined,
      deliveryDate: '',
      deliveryLocation: '',
      deliveryTerms: '',
      paymentTerms: '',
      quality: '',
      legalTerms: '',
      notes: '',
      chatId: undefined
    }
  });

  // Share form
  const shareForm = useForm<WhatsappShareValues>({
    resolver: zodResolver(whatsappShareSchema),
    defaultValues: {
      phoneNumbers: [],
      message: ''
    }
  });

  // Get all contracts
  const { data: allContractsData, isLoading: isLoadingAllContracts } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: async () => {
      const res = await apiRequest('/api/contracts');
      return res || [];
    },
    enabled: !!userId,
  });

  // Get buyer contracts
  const { data: buyerContractsData, isLoading: isLoadingBuyerContracts } = useQuery({
    queryKey: ['/api/contracts', 'buyer'],
    queryFn: async () => {
      const res = await apiRequest('/api/contracts?role=buyer');
      return res || [];
    },
    enabled: !!userId,
  });

  // Get seller contracts
  const { data: sellerContractsData, isLoading: isLoadingSellerContracts } = useQuery({
    queryKey: ['/api/contracts', 'seller'],
    queryFn: async () => {
      const res = await apiRequest('/api/contracts?role=seller');
      return res || [];
    },
    enabled: !!userId,
  });

  // Get commodities for dropdown
  const { data: commoditiesData } = useQuery({
    queryKey: ['/api/commodities'],
    queryFn: async () => {
      const res = await apiRequest('/api/commodities');
      if (res && 'commodities' in res) {
        return res.commodities || [];
      }
      return [];
    },
    enabled: !!userId,
  });

  // Get user connections for dropdown
  const { data: connectionsData } = useQuery({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const res = await apiRequest('/api/connections');
      if (res && 'connections' in res) {
        return res.connections || [];
      }
      return [];
    },
    enabled: !!userId,
  });

  // Filter contracts based on search query
  const filterContracts = (contracts: any[]) => {
    if (!searchQuery) return contracts;
    return contracts?.filter(contract => 
      contract.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.commodityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (contractData: ContractFormValues) => {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error('Failed to create contract');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contract created',
        description: 'Your contract has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'There was an error creating your contract',
        variant: 'destructive',
      });
      console.error('Error creating contract:', error);
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update contract');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contract updated',
        description: 'Your contract has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      setIsViewDialogOpen(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'There was an error updating your contract',
        variant: 'destructive',
      });
      console.error('Error updating contract:', error);
    },
  });

  // Share contract mutation
  const shareContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: WhatsappShareValues }) => {
      const response = await fetch(`/api/contracts/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to share contract');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Contract shared',
        description: 'Contract has been shared successfully',
      });
      setIsShareDialogOpen(false);
      shareForm.reset();

      // In a real app, this would use the WhatsApp API
      // For demo purposes, we'll just show a success message with the content
      console.log('Shared content:', data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'There was an error sharing your contract',
        variant: 'destructive',
      });
      console.error('Error sharing contract:', error);
    },
  });

  // Handle form submission
  const onSubmit = (data: ContractFormValues) => {
    // Calculate total amount if not provided
    if (!data.totalAmount) {
      data.totalAmount = data.quantity * data.pricePerUnit;
    }

    // Make sure user is either buyer or seller
    if (!data.buyerId && !data.sellerId) {
      if (activeTab === 'buyer') {
        data.buyerId = userId;
      } else {
        data.sellerId = userId;
      }
    }

    createContractMutation.mutate(data);
  };

  // Handle share form submission
  const onShareSubmit = (data: WhatsappShareValues) => {
    if (!selectedContract) return;

    shareContractMutation.mutate({
      id: selectedContract.id,
      data
    });
  };

  // Handle viewing a contract
  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsViewDialogOpen(true);
  };

  // Handle sharing a contract
  const handleShareContract = (contract: any) => {
    setSelectedContract(contract);
    setIsShareDialogOpen(true);

    // Reset form and set initial phone numbers
    shareForm.reset({
      phoneNumbers: ['+91'],
      message: ''
    });
  };

  // Handle signing a contract
  const handleSignContract = (contract: any) => {
    if (contract.status !== 'pending') {
      toast({
        title: 'Cannot sign contract',
        description: 'This contract is not in pending status',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is buyer or seller and not the creator
    const isCreator = contract.createdBy === userId;
    const isBuyer = contract.buyerId === userId;
    const isSeller = contract.sellerId === userId;

    if (isCreator) {
      toast({
        title: 'Cannot sign contract',
        description: 'A contract must be signed by the other party',
        variant: 'destructive',
      });
      return;
    }

    if (!isBuyer && !isSeller) {
      toast({
        title: 'Cannot sign contract',
        description: 'You are not a party to this contract',
        variant: 'destructive',
      });
      return;
    }

    updateContractMutation.mutate({
      id: contract.id,
      data: { status: 'signed' }
    });
  };

  // Handle changing contract status
  const handleChangeStatus = (contract: any, status: string) => {
    updateContractMutation.mutate({
      id: contract.id,
      data: { status }
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add more phone numbers in share form
  const addPhoneNumber = () => {
    const currentPhoneNumbers = shareForm.getValues('phoneNumbers');
    shareForm.setValue('phoneNumbers', [...currentPhoneNumbers, '+91']);
  };

  // Remove phone number from share form
  const removePhoneNumber = (index: number) => {
    const currentPhoneNumbers = shareForm.getValues('phoneNumbers');
    if (currentPhoneNumbers.length > 1) {
      shareForm.setValue('phoneNumbers', currentPhoneNumbers.filter((_, i) => i !== index));
    }
  };

  // Contract card component
  const ContractCard = ({ contract }: { contract: any }) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{contract.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-1">
                <span>Contract #: {contract.contractNumber}</span>
                <span className="mx-1">•</span>
                <span>{formatDate(contract.createdAt)}</span>
              </div>
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusBadgeColor(contract.status)}>
            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-xs text-muted-foreground">Commodity</div>
            <div className="font-medium">{contract.commodityName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quantity</div>
            <div className="font-medium">{contract.quantity} {contract.unit}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="font-medium">{formatCurrency(contract.pricePerUnit)}/{contract.unit}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-medium">{formatCurrency(contract.totalAmount)}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {contract.deliveryDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Delivery: {formatDate(contract.deliveryDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2 gap-2">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => handleViewContract(contract)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {contract.status === 'pending' && contract.createdBy !== userId && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleSignContract(contract)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Sign
          </Button>
        )}
        <Button 
          size="sm"
          onClick={() => handleShareContract(contract)}
        >
          <Share className="h-4 w-4 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );

  // Loading skeleton for contracts
  const ContractLoadingSkeleton = () => (
    <div className="space-y-4">
      <AnimatedSkeleton className="h-48 w-full" />
      <AnimatedSkeleton className="h-48 w-full" />
      <AnimatedSkeleton className="h-48 w-full" />
    </div>
  );

  // Empty state component
  const EmptyState = ({ contractType }: { contractType: string }) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">No contracts found</h3>
        <p className="text-muted-foreground">
          {contractType === 'all' 
            ? "You don't have any contracts yet." 
            : `You don't have any ${contractType} contracts yet.`}
        </p>
      </div>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create New Contract
      </Button>
    </div>
  );

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage legally binding contracts for your trades
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex space-x-2">
            <Select defaultValue="standard" onValueChange={(val) => setSelectedTemplate(val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Purchase</SelectItem>
                <SelectItem value="forward">Forward Contract</SelectItem>
                <SelectItem value="quality">Quality Assured</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-fit">
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="buyer">As Buyer</TabsTrigger>
          <TabsTrigger value="seller">As Seller</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoadingAllContracts ? (
            <ContractLoadingSkeleton />
          ) : allContractsData && filterContracts(allContractsData).length > 0 ? (
            <div>
              {filterContracts(allContractsData).map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <EmptyState contractType="all" />
          )}
        </TabsContent>

        <TabsContent value="buyer" className="space-y-4">
          {isLoadingBuyerContracts ? (
            <ContractLoadingSkeleton />
          ) : buyerContractsData && filterContracts(buyerContractsData).length > 0 ? (
            <div>
              {filterContracts(buyerContractsData).map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <EmptyState contractType="buyer" />
          )}
        </TabsContent>

        <TabsContent value="seller" className="space-y-4">
          {isLoadingSellerContracts ? (
            <ContractLoadingSkeleton />
          ) : sellerContractsData && filterContracts(sellerContractsData).length > 0 ? (
            <div>
              {filterContracts(sellerContractsData).map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <EmptyState contractType="seller" />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Contract Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Contract</DialogTitle>
            <DialogDescription>
              Fill in the details to create a legally binding contract for your trade
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Wheat Trade Contract March 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commodityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commodity</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => {
                            const selectedCommodity = commoditiesData?.find(
                              (c: any) => c.id === parseInt(value)
                            );
                            field.onChange(parseInt(value));
                            form.setValue('commodityName', selectedCommodity?.name || '');
                          }}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select commodity" />
                          </SelectTrigger>
                          <SelectContent>
                            {commoditiesData?.map((commodity: any) => (
                              <SelectItem key={commodity.id} value={commodity.id.toString()}>
                                {commodity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium / Grade A / Standard" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="e.g., 1000" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(value);
                            const pricePerUnit = form.getValues('pricePerUnit');
                            if (pricePerUnit) {
                              form.setValue('totalAmount', value * pricePerUnit);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="quintal">Quintal</SelectItem>
                            <SelectItem value="ton">Metric Ton</SelectItem>
                            <SelectItem value="piece">Pieces</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Unit (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01"
                          step="0.01"
                          placeholder="e.g., 25.50" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(value);
                            const quantity = form.getValues('quantity');
                            if (quantity) {
                              form.setValue('totalAmount', quantity * value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'buyer' ? (
                  <FormField
                    control={form.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select seller" />
                            </SelectTrigger>
                            <SelectContent>
                              {connectionsData?.map((connection: any) => (
                                <SelectItem 
                                  key={connection.user.id} 
                                  value={connection.user.id.toString()}
                                >
                                  {connection.user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          You will be the buyer in this contract
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="buyerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buyer</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select buyer" />
                            </SelectTrigger>
                            <SelectContent>
                              {connectionsData?.map((connection: any) => (
                                <SelectItem 
                                  key={connection.user.id} 
                                  value={connection.user.id.toString()}
                                >
                                  {connection.user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          You will be the seller in this contract
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          readOnly
                          value={field.value || 'Auto-calculated'}
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormDescription>
                        Automatically calculated based on quantity and price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Warehouse Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deliveryTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Terms</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Specify delivery conditions, inspection process, etc."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Specify payment schedule, method, conditions, etc." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="legalTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Terms</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional legal clauses, dispute resolution, etc."
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any other terms or conditions"
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createContractMutation.isPending}
                >
                  {createContractMutation.isPending ? "Creating..." : "Create Contract"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Contract Dialog */}
      {selectedContract && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedContract.name}</DialogTitle>
                <Badge variant="outline" className={getStatusBadgeColor(selectedContract.status)}>
                  {selectedContract.status.charAt(0).toUpperCase() + selectedContract.status.slice(1)}
                </Badge>
              </div>
              <DialogDescription>
                Contract #{selectedContract.contractNumber} • Created on {formatDate(selectedContract.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Buyer</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.buyerName || "Not specified"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Seller</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.sellerName || "Not specified"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Commodity Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Commodity</p>
                    <p className="text-sm">{selectedContract.commodityName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quality</p>
                    <p className="text-sm">{selectedContract.quality || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="text-sm">{selectedContract.quantity} {selectedContract.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-sm">{formatCurrency(selectedContract.pricePerUnit)} per {selectedContract.unit}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-sm font-medium">{formatCurrency(selectedContract.totalAmount)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Delivery Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Date</p>
                    <p className="text-sm">{selectedContract.deliveryDate ? formatDate(selectedContract.deliveryDate) : "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Location</p>
                    <p className="text-sm">{selectedContract.deliveryLocation || "Not specified"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Delivery Terms</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedContract.deliveryTerms || "Not specified"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Payment Terms</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedContract.paymentTerms || "Not specified"}</p>
              </div>

              {selectedContract.legalTerms && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Legal Terms</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedContract.legalTerms}</p>
                  </div>
                </>
              )}

              {selectedContract.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedContract.notes}</p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="text-xs text-muted-foreground">
                  Last updated: {formatDate(selectedContract.updatedAt)}
                </div>
                <div className="flex gap-2">
                  {selectedContract.status === 'pending' && selectedContract.createdBy !== userId && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSignContract(selectedContract)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Sign Contract
                    </Button>
                  )}
                  {selectedContract.status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleChangeStatus(selectedContract, 'completed')}
                    >
                      Mark as Completed
                    </Button>
                  )}
                  {(selectedContract.status === 'pending' || selectedContract.status === 'active') && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleChangeStatus(selectedContract, 'cancelled')}
                    >
                      Cancel Contract
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    onClick={() => handleShareContract(selectedContract)}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Contract Dialog */}
      {selectedContract && (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share Contract via WhatsApp</DialogTitle>
              <DialogDescription>
                Share contract #{selectedContract.contractNumber} with your contacts
              </DialogDescription>
            </DialogHeader>

            <Form {...shareForm}>
              <form onSubmit={shareForm.handleSubmit(onShareSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp Numbers</Label>
                  <div className="space-y-2">
                    {shareForm.getValues('phoneNumbers').map((_, index) => (
                      <div key={index} className="flex gap-2">
                        <FormField
                          control={shareForm.control}
                          name={`phoneNumbers.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="+91 1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {index > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removePhoneNumber(index)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={addPhoneNumber}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Number
                  </Button>
                </div>

                <FormField
                  control={shareForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a personal message to send with the contract"
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty to use the default contract summary
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsShareDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={shareContractMutation.isPending}
                  >
                    {shareContractMutation.isPending ? "Sharing..." : "Share via WhatsApp"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}