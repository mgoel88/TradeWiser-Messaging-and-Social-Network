import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileText, Send } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
    ScrollArea
} from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadgeColor } from './utils'; // Assuming these helper functions are moved to a separate utils.ts file



// Contract form schema (moved from original file)
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


export default function ContractsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all'); // Retained from original
  const [searchQuery, setSearchQuery] = useState(''); // Retained from original

  // Get user session (retained from original)
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const res = await apiRequest('/api/auth/session');
      return res;
    },
  });

  const userId = sessionData?.user?.id;

  // Setup form (retained and modified from original)
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

  // Get all contracts (retained from original)
    const { data: allContractsData, isLoading: isLoadingAllContracts } = useQuery({
      queryKey: ['/api/contracts'],
      queryFn: async () => {
        const res = await apiRequest('/api/contracts');
        return res || [];
      },
      enabled: !!userId,
    });
  
    // Get buyer contracts (retained from original)
    const { data: buyerContractsData, isLoading: isLoadingBuyerContracts } = useQuery({
      queryKey: ['/api/contracts', 'buyer'],
      queryFn: async () => {
        const res = await apiRequest('/api/contracts?role=buyer');
        return res || [];
      },
      enabled: !!userId,
    });
  
    // Get seller contracts (retained from original)
    const { data: sellerContractsData, isLoading: isLoadingSellerContracts } = useQuery({
      queryKey: ['/api/contracts', 'seller'],
      queryFn: async () => {
        const res = await apiRequest('/api/contracts?role=seller');
        return res || [];
      },
      enabled: !!userId,
    });
  
    // Get commodities for dropdown (retained from original)
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
  
    // Get user connections for dropdown (retained from original)
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
  
    // Filter contracts based on search query (retained from original)
    const filterContracts = (contracts: any[]) => {
      if (!searchQuery) return contracts;
      return contracts?.filter(contract =>
        contract.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.commodityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };
  
    // Create contract mutation (retained from original)
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
  
    // Handle form submission (retained and modified from original)
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
  
    const ContractCard = ({ contract }: { contract: any }) => (
      <div className="mb-4"> {/* Simplified card - only showing essential info */}
          <div className="flex items-center justify-between">
              <div>
                  <h3 className="text-lg font-medium">{contract.name}</h3>
                  <p className="text-sm text-muted-foreground">Contract #: {contract.contractNumber}</p>
              </div>
              <Badge variant="outline" className={getStatusBadgeColor(contract.status)}>
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Badge>
          </div>
      </div>
    );

  const ContractLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="h-12 w-full bg-gray-200 rounded"></div>
      <div className="h-12 w-full bg-gray-200 rounded"></div>
      <div className="h-12 w-full bg-gray-200 rounded"></div>
    </div>
  );


  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trade Contracts</h1>
          <p className="text-muted-foreground">Create and manage legally binding contracts</p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <option value="standard">Standard Purchase</option>
            <option value="forward">Forward Contract</option>
            <option value="quality">Quality Assured</option>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-fit">
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="buyer">As Buyer</TabsTrigger>
          <TabsTrigger value="seller">As Seller</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoadingAllContracts ? (
            <ContractLoadingSkeleton />
          ) : allContractsData && filterContracts(allContractsData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Modified to use grid */}
              {filterContracts(allContractsData).map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <div className="p-6"> {/* Simple empty state */}
              <p>No contracts found.</p>
            </div>
          )}
        </TabsContent>

        {/* Buyer and Seller Tabs (similar structure to 'all' tab) */}
        <TabsContent value="buyer">
          {isLoadingBuyerContracts ? (
            <ContractLoadingSkeleton />
          ) : buyerContractsData && filterContracts(buyerContractsData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterContracts(buyerContractsData).map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <div className="p-6">
              <p>No buyer contracts found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="seller">
          {isLoadingSellerContracts ? (
            <ContractLoadingSkeleton />
          ) : sellerContractsData && filterContracts(sellerContractsData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterContracts(sellerContractsData).map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <div className="p-6">
              <p>No seller contracts found.</p>
            </div>
          )}
        </TabsContent>

      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <div className="p-6"> {/* Simple dialog content */}
          <h2 className="text-xl font-bold mb-4">Create New Contract</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Retained form elements from original, but significantly simplified */}
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
              <Button type="submit" disabled={createContractMutation.isPending}>
                {createContractMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </Form>
        </div>
      </Dialog>
    </div>
  );
}

//Helper functions (example implementation)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
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