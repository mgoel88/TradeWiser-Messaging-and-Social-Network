import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader, CheckCircle, Shield, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ID_TYPES, BUSINESS_TYPES } from "@/lib/constants";

// Form validation schema based on shared schema
const kycFormSchema = z.object({
  idType: z.string().min(1, "Please select an ID type"),
  idNumber: z.string().min(4, "ID number is required"),
  idNumberConfirm: z.string().min(4, "Please confirm your ID number"),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  registrationNumber: z.string().optional(),
  documents: z.array(z.string()).optional()
}).refine(data => data.idNumber === data.idNumberConfirm, {
  message: "ID numbers do not match",
  path: ["idNumberConfirm"],
});

type KycFormValues = z.infer<typeof kycFormSchema>;

const KYC: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if user is authenticated
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const user = sessionData?.user;
  
  // Check if user already has a KYC request
  const { data: kycData, isLoading: kycLoading } = useQuery({
    queryKey: ['/api/kyc-requests/user'],
    enabled: !!user,
    onError: () => {
      // This will 404 if the user doesn't have a KYC request yet, which is fine
    }
  });
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      idType: "",
      idNumber: "",
      idNumberConfirm: "",
      businessName: "",
      businessType: "",
      registrationNumber: "",
      documents: []
    }
  });
  
  const submitKycMutation = useMutation({
    mutationFn: (data: KycFormValues) => {
      return apiRequest("POST", "/api/kyc-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kyc-requests/user'] });
      toast({
        title: "KYC request submitted",
        description: "Your KYC verification request has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit KYC request",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: KycFormValues) => {
    submitKycMutation.mutate(data);
  };
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (sessionData && sessionData.message === "Not authenticated") {
      setLocation('/login');
    }
  }, [sessionData, setLocation]);
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show the KYC status if the user already has a KYC request
  if (kycData?.kycRequest || user.kycVerified) {
    const status = user.kycVerified ? "approved" : kycData?.kycRequest.status;
    
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">KYC Verification</h1>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <h2 className="font-heading font-semibold text-lg">Your KYC Status</h2>
                <Badge 
                  className={`
                    ${status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                      status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
                      'bg-yellow-100 text-yellow-800 border-yellow-200'}
                  `}
                >
                  {status === 'approved' ? 'Approved' : 
                   status === 'rejected' ? 'Rejected' : 
                   'Pending Review'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                {status === 'approved' ? (
                  <>
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-xl font-medium mb-2">Verification Complete</h3>
                    <p className="text-gray-600 mb-6">
                      Your KYC verification has been approved. You now have full access to all features.
                    </p>
                  </>
                ) : status === 'rejected' ? (
                  <>
                    <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-medium mb-2">Verification Rejected</h3>
                    <p className="text-gray-600 mb-6">
                      Your KYC verification was rejected. Please contact support for more information.
                    </p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/kyc-requests/user'] })}>
                      Resubmit KYC
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader className="h-16 w-16 mx-auto mb-4 text-yellow-500 animate-spin" />
                    <h3 className="text-xl font-medium mb-2">Verification in Progress</h3>
                    <p className="text-gray-600 mb-6">
                      Your KYC verification is being reviewed. This usually takes 1-2 business days.
                    </p>
                  </>
                )}
              </div>
              
              {kycData?.kycRequest && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h3 className="font-medium mb-4">Submitted Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">ID Type</p>
                      <p className="font-medium">{kycData.kycRequest.idType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ID Number</p>
                      <p className="font-medium">••••••{kycData.kycRequest.idNumber.slice(-4)}</p>
                    </div>
                    {kycData.kycRequest.businessName && (
                      <>
                        <div>
                          <p className="text-gray-500">Business Name</p>
                          <p className="font-medium">{kycData.kycRequest.businessName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Business Type</p>
                          <p className="font-medium">{kycData.kycRequest.businessType}</p>
                        </div>
                      </>
                    )}
                    {kycData.kycRequest.registrationNumber && (
                      <div>
                        <p className="text-gray-500">Registration Number</p>
                        <p className="font-medium">{kycData.kycRequest.registrationNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Submission Date</p>
                      <p className="font-medium">{new Date(kycData.kycRequest.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
  
  // Show the KYC form if the user doesn't have a KYC request yet
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">KYC Verification</h1>
        <p className="text-gray-600 mb-6">Complete your Know Your Customer (KYC) verification to unlock all features</p>
        
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-heading font-semibold text-lg">Verification Form</h2>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Personal Identification</h3>
                  
                  <FormField
                    control={form.control}
                    name="idType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ID_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a government-issued ID for verification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="idNumberConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm ID Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Re-enter your ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h3 className="font-medium">Business Information (Optional)</h3>
                  
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => (
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
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter business registration number" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h3 className="font-medium">Document Upload</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-1">
                      Upload scanned copies of your ID and business documents
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Supported formats: PDF, JPG, PNG (max 5MB)
                    </p>
                    <Button variant="outline" type="button" className="text-sm">
                      Select Files
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Note: Document upload functionality is coming soon. You can submit the form without documents for now.
                  </p>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitKycMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {submitKycMutation.isPending ? "Submitting..." : "Submit for Verification"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default KYC;
