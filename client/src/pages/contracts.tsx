import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileText, Send } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast, toast } from '@/hooks/use-toast';
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
      const res = await apiRequest('GET', '/api/auth/session');
      return res.json();
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
        const res = await apiRequest('GET', '/api/contracts');
        return res.json();
      },
      enabled: !!userId,
    });
  
    // Get buyer contracts (retained from original)
    const { data: buyerContractsData, isLoading: isLoadingBuyerContracts } = useQuery({
      queryKey: ['/api/contracts', 'buyer'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/contracts?role=buyer');
        return res.json();
      },
      enabled: !!userId,
    });
  
    // Get seller contracts (retained from original)
    const { data: sellerContractsData, isLoading: isLoadingSellerContracts } = useQuery({
      queryKey: ['/api/contracts', 'seller'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/contracts?role=seller');
        return res.json();
      },
      enabled: !!userId,
    });
  
    // Get commodities for dropdown (retained from original)
    const { data: commoditiesData } = useQuery({
      queryKey: ['/api/commodities'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/commodities');
        const data = await res.json();
        if (data && 'commodities' in data) {
          return data.commodities || [];
        }
        return [];
      },
      enabled: !!userId,
    });
  
    // Get user connections for dropdown (retained from original)
    const { data: connectionsData } = useQuery({
      queryKey: ['/api/connections'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/connections');
        const data = await res.json();
        if (data && 'connections' in data) {
          return data.connections || [];
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
        const response = await apiRequest('POST', '/api/contracts', contractData);
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
  
    const ContractCard = ({ contract }: { contract: any }) => {
      // Function to generate contract summary text for WhatsApp
      const generateContractSummary = () => {
        return `*Contract Summary: ${contract.name}*
Contract #: ${contract.contractNumber || 'N/A'}
Status: ${contract.status || 'Draft'}
Commodity: ${contract.commodityName || 'N/A'}
Quantity: ${contract.quantity || 0} ${contract.unit || 'units'} at ₹${contract.pricePerUnit || 0}/unit
Total Value: ₹${contract.totalAmount || 0}
Delivery: ${contract.deliveryDate ? formatDate(contract.deliveryDate) : 'Not specified'} at ${contract.deliveryLocation || 'Not specified'}
Quality: ${contract.quality || 'Not specified'}
Payment Terms: ${contract.paymentTerms || 'Not specified'}
      
This is a digital contract generated via WizXConnect. For full details, please login to your account.`;
      };

      // Function to share contract via WhatsApp
      const shareViaWhatsApp = () => {
        const contractText = generateContractSummary();
        const encodedText = encodeURIComponent(contractText);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
      };

      // Function to view contract details (placeholder)
      const viewContract = () => {
        toast({
          title: 'Viewing Contract',
          description: `Opening details for ${contract.name}`,
        });
        // Future implementation: Open contract details view
      };

      // Function to sign contract (placeholder)
      const signContract = () => {
        toast({
          title: 'Signing Contract',
          description: 'This feature will be available soon',
        });
        // Future implementation: Contract signing flow
      };

      return (
        <Card className="mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-medium">{contract.name}</h3>
                <p className="text-sm text-muted-foreground">Contract #: {contract.contractNumber || 'Draft'}</p>
              </div>
              <Badge variant="outline" className={getStatusBadgeColor(contract.status || 'draft')}>
                {contract.status ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1) : 'Draft'}
              </Badge>
            </div>
            
            {/* Contract preview section */}
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-2">
                <div>Commodity: {contract.commodityName || 'N/A'}</div>
                <div>Quantity: {contract.quantity || 0} {contract.unit || 'units'}</div>
                <div>Price: ₹{contract.pricePerUnit || 0}/{contract.unit || 'unit'}</div>
                <div>Total: {formatCurrency(contract.totalAmount || 0)}</div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <Button size="sm" variant="outline" onClick={viewContract}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              {contract.status !== 'signed' && contract.status !== 'completed' && (
                <Button size="sm" variant="outline" onClick={signContract}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Sign
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={shareViaWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <svg 
                  className="h-4 w-4 mr-1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path 
                    d="M17.6 6.3C16.2 5 14.3 4.2 12.3 4.2 8.2 4.2 4.8 7.6 4.8 11.7 4.8 13.1 5.2 14.5 5.9 15.7L4.7 19.3 8.4 18.1C9.5 18.7 10.9 19 12.3 19 16.4 19 19.8 15.6 19.8 11.5 19.8 9.5 19 7.7 17.6 6.3ZM12.3 17.6C11.1 17.6 9.8 17.3 8.8 16.8L8.5 16.6 6.4 17.3 7.1 15.2 6.9 14.9C6.3 13.8 6 12.7 6 11.5 6 8.4 8.9 5.7 12.2 5.7 13.9 5.7 15.5 6.3 16.6 7.5 17.7 8.7 18.3 10.2 18.3 11.9 18.3 15 15.5 17.6 12.3 17.6ZM15.6 13C15.4 12.9 14.5 12.5 14.3 12.4 14.1 12.3 14 12.3 13.8 12.5 13.6 12.7 13.3 13.1 13.2 13.2 13.1 13.3 12.9 13.4 12.7 13.3 11.9 12.9 11.4 12.6 10.8 11.9 10.4 11.4 10.1 10.8 10 10.6 9.9 10.4 10 10.3 10.1 10.2 10.2 10.1 10.3 10 10.4 9.9 10.5 9.8 10.5 9.7 10.6 9.6 10.7 9.5 10.6 9.4 10.6 9.3 10.5 9.2 10.1 8.3 10 8 9.8 7.6 9.7 7.7 9.5 7.7 9.4 7.7 9.3 7.7 9.1 7.7 9 7.7 8.7 7.8 8.5 8 8.3 8.2 8.8 9.1 9.7 10.8 10.7 12 11.1 12.5 11.4 12.9 11.5 13.3 11.6 13.7 11.6 14.2 11.5 14.6 11.4 15.1 11.7 15.4 11.7 15.6 11.6 15.6 11.3 15.7 11 15.7 10.7 15.6 13Z" 
                  />
                </svg>
                Share
              </Button>
            </div>
          </div>
        </Card>
      );
    };

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
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Create New Contract</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic Contract Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <FormField
                  control={form.control}
                  name="commodityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commodity</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => {
                            const commodityId = parseInt(e.target.value);
                            field.onChange(commodityId);
                            
                            // Find commodity name
                            const selectedCommodity = commoditiesData?.find(c => c.id === commodityId);
                            if (selectedCommodity) {
                              form.setValue('commodityName', selectedCommodity.name);
                            }
                          }}
                        >
                          <option value="">Select Commodity</option>
                          {commoditiesData?.map((commodity: any) => (
                            <option key={commodity.id} value={commodity.id}>
                              {commodity.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Parties Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined;
                            field.onChange(value);
                          }}
                        >
                          <option value="">Select Buyer</option>
                          <option value={userId}>Me (as Buyer)</option>
                          {connectionsData?.map((connection: any) => (
                            <option key={connection.id} value={connection.userId}>
                              {connection.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seller</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined;
                            field.onChange(value);
                          }}
                        >
                          <option value="">Select Seller</option>
                          <option value={userId}>Me (as Seller)</option>
                          {connectionsData?.map((connection: any) => (
                            <option key={connection.id} value={connection.userId}>
                              {connection.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Quantity and Price */}
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
                            field.onChange(isNaN(value) ? undefined : value);
                            
                            // Auto-calculate total amount
                            const pricePerUnit = form.getValues('pricePerUnit');
                            if (!isNaN(value) && pricePerUnit) {
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
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="kg">Kilogram (kg)</option>
                          <option value="ton">Metric Ton</option>
                          <option value="quintal">Quintal</option>
                          <option value="bag">Bag</option>
                        </select>
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
                      <FormLabel>Price per Unit (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          placeholder="e.g., 50.00" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? undefined : value);
                            
                            // Auto-calculate total amount
                            const quantity = form.getValues('quantity');
                            if (!isNaN(value) && quantity) {
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
              
              {/* Total Amount (calculated) */}
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        readOnly 
                        disabled
                        {...field}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Input placeholder="e.g., Warehouse at Delhi APMC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Terms Section */}
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality Specifications</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grade A, Moisture 12%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deliveryTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Terms</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Door delivery, Ex-warehouse" {...field} />
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
                      <Input placeholder="e.g., 50% advance, 50% on delivery" {...field} />
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
                      <Input placeholder="Any additional terms or notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
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
              </div>
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