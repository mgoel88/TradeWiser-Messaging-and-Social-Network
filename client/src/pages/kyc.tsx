import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader, CheckCircle, Shield, Upload, X, File, FileText, AlertCircle, Paperclip } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ID_TYPES, BUSINESS_TYPES, DOCUMENT_TYPES } from "@/lib/constants";

// Document metadata interface
interface DocumentMetadata {
  fileName: string;
  fileType: string;
  documentType: string;
  size: number;
}

// Form validation schema based on shared schema
const kycFormSchema = z.object({
  idType: z.string().min(1, "Please select an ID type"),
  idNumber: z.string().min(4, "ID number is required"),
  idNumberConfirm: z.string().min(4, "Please confirm your ID number"),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  registrationNumber: z.string().optional(),
  documents: z.array(z.object({
    fileName: z.string(),
    fileType: z.string(),
    documentType: z.string(),
    size: z.number()
  })).optional()
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
  
  // Transform files to document metadata before submitting
  const onSubmit = (data: KycFormValues) => {
    // Convert uploaded files to document metadata format
    const documentMetadata = uploadedFiles.map(file => ({
      fileName: file.name,
      fileType: file.type,
      documentType: file.name.includes('id') ? 'id_proof' : 
                    file.name.includes('address') ? 'address_proof' : 
                    file.name.includes('business') ? 'business_proof' : 
                    file.name.includes('bank') ? 'bank_statement' : 'other',
      size: file.size
    }));
    
    // Include the document metadata in the form data
    const formData = {
      ...data,
      documents: documentMetadata
    };
    
    toast({
      title: documentMetadata.length > 0 
        ? `Submitting with ${documentMetadata.length} document(s)` 
        : "Submitting verification request",
      description: "Your information is being processed."
    });
    
    submitKycMutation.mutate(formData);
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
  
  // State for document type and file upload
  const [selectedDocType, setSelectedDocType] = useState<string>("id_proof");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle document type change
  const handleDocTypeChange = (value: string) => {
    setSelectedDocType(value);
  };
  
  // Handle file selection
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Add the selected files to the uploadedFiles state
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show toast notification
      toast({
        title: "File added",
        description: `${files.length} file(s) added successfully.`,
      });
    }
  };
  
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
                  
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                      <TabsTrigger value="list">Uploaded Documents</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="mt-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 mb-1">
                          Upload scanned copies of your ID and business documents
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          Supported formats: PDF, JPG, PNG (max 5MB)
                        </p>
                        
                        <div className="mb-4">
                          <Select 
                            defaultValue={selectedDocType} 
                            onValueChange={handleDocTypeChange}
                          >
                            <SelectTrigger className="w-full mb-3">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center">
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <p className="text-xs text-gray-500 mb-4 text-left">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {DOCUMENT_TYPES.find(t => t.value === selectedDocType)?.description}
                          </p>
                        </div>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                        />
                        
                        <Button 
                          variant="outline" 
                          type="button" 
                          className="text-sm"
                          onClick={handleFileSelect}
                        >
                          <Paperclip className="h-4 w-4 mr-2" /> Select Files
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="list" className="mt-4">
                      <Table>
                        <TableCaption>Your uploaded documents</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Type</TableHead>
                            <TableHead>File Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedFiles.length > 0 ? (
                            uploadedFiles.map((file, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {file.name.includes('id') ? 'ID Proof' : 
                                   file.name.includes('address') ? 'Address Proof' : 
                                   file.name.includes('business') ? 'Business Proof' : 
                                   file.name.includes('bank') ? 'Bank Statement' : 'Other Document'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {file.type.includes('pdf') ? 
                                      <FileText className="h-4 w-4 mr-2 text-red-500" /> : 
                                      <File className="h-4 w-4 mr-2 text-blue-500" />}
                                    <span className="truncate max-w-[180px]">{file.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                    Pending Upload
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                                      toast({
                                        title: "File removed",
                                        description: "Document removed from upload list."
                                      });
                                    }}
                                  >
                                    <X className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow className="text-gray-500 italic">
                              <TableCell colSpan={4} className="text-center py-8">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No documents uploaded yet</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Important Notice</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        For faster KYC verification, please upload clear scans of your ID and business documents. 
                        Your application can be processed without documents, but document verification 
                        is required for trading above ₹50,000.
                      </p>
                    </div>
                  </div>
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
