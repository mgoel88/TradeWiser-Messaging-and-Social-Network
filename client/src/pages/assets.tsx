import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Warehouse, Factory, Map, Plus, Loader2, Search, Filter, Building, HomeIcon, PenTool } from "lucide-react";
import { Map as MapComponent } from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { ASSET_TYPES } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n";

// Asset creation form schema
const assetFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string({
    required_error: "Please select an asset type",
  }),
  circleId: z.number({
    required_error: "Please select a circle",
  }),
  capacity: z.string().optional(),
  details: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

const Assets: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [selectedMapCoordinates, setSelectedMapCoordinates] = useState<{lat: number, lng: number} | null>(null);

  // Get user session
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
  });

  // Fetch user's assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/assets'],
    enabled: !!sessionData?.user,
  });

  // Fetch circles for dropdown
  const { data: circlesData, isLoading: circlesLoading } = useQuery({
    queryKey: ['/api/circles'],
  });

  // Form for adding a new asset
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: "",
      type: "",
      details: "",
      capacity: "",
      latitude: 0,
      longitude: 0,
    },
  });

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: (data: AssetFormValues) => {
      return apiRequest('/api/assets', { method: 'POST', data });
    },
    onSuccess: () => {
      toast({
        title: t("assets.success.asset_created"),
        description: t("assets.success.asset_registered_successfully"),
      });
      setIsAddingAsset(false);
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("assets.errors.creation_failed"),
        description: error.toString(),
        variant: "destructive",
      });
    }
  });

  // Filter assets based on search and type
  const filteredAssets = React.useMemo(() => {
    if (!assetsData?.assets) return [];
    
    return assetsData.assets.filter((asset: any) => {
      // Apply search filter
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply type filter
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }
      
      // Apply circle filter
      if (selectedCircleId && asset.circleId !== selectedCircleId) {
        return false;
      }
      
      return true;
    });
  }, [assetsData, searchQuery, typeFilter, selectedCircleId]);

  const mapMarkers = React.useMemo(() => {
    return filteredAssets.map((asset: any) => ({
      lat: asset.latitude,
      lng: asset.longitude,
      name: asset.name,
      type: asset.type,
    }));
  }, [filteredAssets]);

  // Handle form submission
  const onSubmit = (data: AssetFormValues) => {
    if (selectedMapCoordinates) {
      data.latitude = selectedMapCoordinates.lat;
      data.longitude = selectedMapCoordinates.lng;
    }
    createAssetMutation.mutate(data);
  };

  // Handle map click in add asset form
  const handleMapClick = (event: { lat: number; lng: number }) => {
    setSelectedMapCoordinates(event);
    form.setValue('latitude', event.lat);
    form.setValue('longitude', event.lng);
  };

  // Get asset type icon
  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
        return <Warehouse className="h-4 w-4" />;
      case 'processing_plant':
        return <Factory className="h-4 w-4" />;
      case 'mandi':
        return <Building className="h-4 w-4" />;
      default:
        return <HomeIcon className="h-4 w-4" />;
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t("assets.title")}</h1>
            <p className="text-gray-600">{t("assets.description")}</p>
          </div>
          
          <Dialog open={isAddingAsset} onOpenChange={setIsAddingAsset}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> {t("assets.add_new_asset")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{t("assets.add_new_asset")}</DialogTitle>
                <DialogDescription>
                  {t("assets.add_new_asset_description")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("assets.form.name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("assets.form.name_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("assets.form.type")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("assets.form.select_type")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ASSET_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="circleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("assets.form.circle")}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("assets.form.select_circle")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {circlesData?.circles?.map((circle: any) => (
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
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("assets.form.capacity")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("assets.form.capacity_placeholder")} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t("assets.form.capacity_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("assets.form.details")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("assets.form.details_placeholder")} 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>{t("assets.form.location")}</FormLabel>
                    <p className="text-sm text-gray-500 mb-2">
                      {t("assets.form.click_to_select_location")}
                    </p>
                    <div className="border rounded-md overflow-hidden h-[200px]">
                      <MapComponent 
                        height="200px" 
                        width="100%" 
                        onClick={handleMapClick}
                        markers={selectedMapCoordinates ? [{
                          lat: selectedMapCoordinates.lat,
                          lng: selectedMapCoordinates.lng,
                          name: form.getValues().name || "New Asset",
                          type: form.getValues().type || "warehouse"
                        }] : []}
                        center={selectedMapCoordinates ? {
                          lat: selectedMapCoordinates.lat,
                          lng: selectedMapCoordinates.lng
                        } : { lat: 20.5937, lng: 78.9629 }} // Center of India
                        zoom={selectedMapCoordinates ? 12 : 5}
                      />
                    </div>
                    {selectedMapCoordinates && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t("assets.form.selected_coordinates")}: {selectedMapCoordinates.lat.toFixed(6)}, {selectedMapCoordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createAssetMutation.isPending || !selectedMapCoordinates}
                    >
                      {createAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("assets.form.create_asset")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters and Map View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <h2 className="font-heading font-medium">{t("assets.filters")}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("assets.search_assets")}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("assets.asset_type")}
                </label>
                <Select 
                  onValueChange={setTypeFilter} 
                  defaultValue={typeFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("assets.all_types")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("assets.all_types")}</SelectItem>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("assets.filter_by_circle")}
                </label>
                <Select 
                  onValueChange={(value) => setSelectedCircleId(value === 'all' ? null : parseInt(value))} 
                  defaultValue="all"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("assets.all_circles")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("assets.all_circles")}</SelectItem>
                    {circlesData?.circles?.map((circle: any) => (
                      <SelectItem key={circle.id} value={circle.id.toString()}>
                        {circle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <h2 className="font-heading font-medium flex items-center">
                <Map className="mr-2 h-4 w-4 text-primary" />
                {t("assets.map_view")}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <MapComponent
                  height="300px"
                  width="100%"
                  markers={mapMarkers}
                  center={
                    mapMarkers.length > 0 
                      ? { lat: mapMarkers[0].lat, lng: mapMarkers[0].lng } 
                      : { lat: 20.5937, lng: 78.9629 } // Center of India
                  }
                  zoom={mapMarkers.length > 0 ? 8 : 5}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Asset Listing */}
        <Tabs defaultValue="grid" className="space-y-6">
          <Card className="bg-white">
            <TabsList className="p-0 w-full justify-start rounded-none overflow-x-auto">
              <TabsTrigger value="grid">{t("assets.grid_view")}</TabsTrigger>
              <TabsTrigger value="list">{t("assets.list_view")}</TabsTrigger>
            </TabsList>
          </Card>
          
          <TabsContent value="grid" className="m-0">
            {assetsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAssets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map((asset: any) => (
                  <Card key={asset.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-3 bg-primary" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                            {getAssetTypeIcon(asset.type)}
                          </div>
                          <h3 className="font-semibold">{asset.name}</h3>
                        </div>
                        <Badge variant="outline">{ASSET_TYPES.find(t => t.value === asset.type)?.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">{t("assets.circle")}:</p>
                          <p className="font-medium">{asset.circleName}</p>
                        </div>
                        {asset.capacity && (
                          <div>
                            <p className="text-sm text-gray-500">{t("assets.capacity")}:</p>
                            <p>{asset.capacity}</p>
                          </div>
                        )}
                        {asset.details && (
                          <div>
                            <p className="text-sm text-gray-500">{t("assets.details")}:</p>
                            <p className="text-sm">{asset.details}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-end">
                      <Button variant="ghost" size="sm">
                        <PenTool className="h-4 w-4 mr-2" />
                        {t("common.edit")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Warehouse className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-1">{t("assets.no_assets_found")}</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || typeFilter !== "all" || selectedCircleId 
                    ? t("assets.no_matching_assets")
                    : t("assets.no_assets_yet")}
                </p>
                {!searchQuery && typeFilter === "all" && !selectedCircleId && (
                  <Button onClick={() => setIsAddingAsset(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("assets.add_your_first_asset")}
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="m-0">
            {assetsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAssets.length > 0 ? (
              <Card>
                <div className="divide-y">
                  {filteredAssets.map((asset: any) => (
                    <div key={asset.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                            {getAssetTypeIcon(asset.type)}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-semibold mr-2">{asset.name}</h3>
                              <Badge variant="outline">{ASSET_TYPES.find(t => t.value === asset.type)?.label}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{asset.circleName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {asset.capacity && (
                            <div className="text-sm">
                              <span className="text-gray-500">{t("assets.capacity")}: </span>
                              {asset.capacity}
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="mt-1">
                            <PenTool className="h-4 w-4 mr-2" />
                            {t("common.edit")}
                          </Button>
                        </div>
                      </div>
                      {asset.details && (
                        <div className="mt-2 ml-13">
                          <p className="text-sm">{asset.details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Warehouse className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-1">{t("assets.no_assets_found")}</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || typeFilter !== "all" || selectedCircleId 
                    ? t("assets.no_matching_assets")
                    : t("assets.no_assets_yet")}
                </p>
                {!searchQuery && typeFilter === "all" && !selectedCircleId && (
                  <Button onClick={() => setIsAddingAsset(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("assets.add_your_first_asset")}
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Assets;