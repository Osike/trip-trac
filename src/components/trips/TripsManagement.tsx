import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Plus, Search, MapPin, Calendar, User, Truck, Loader2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TripDetails } from "./TripDetails";
import { TripEdit } from "./TripEdit";
import { TripActions } from "./TripActions";
import { TripStatistics } from "./TripStatistics";

interface TripFromDB {
  id: string;
  customer_id: string;
  origin: string;
  destination: string;
  driver_id: string;
  truck_id: string;
  scheduled_date: string;
  distance: number | null;
  cost: number | null;
  duration: number | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'ongoing';
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
  } | null;
  profiles?: {
    name: string;
  } | null;
  trucks?: {
    plate_number: string;
  } | null;
}

interface DisplayTrip {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  driver: string;
  truck: string;
  scheduledDate: string;
  status: string;
  distance: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Truck {
  id: string;
  plate_number: string;
}

export const TripsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    origin: "",
    destination: "",
    driver_id: "",
    truck_id: "",
    scheduled_date: "",
    distance: "",
    duration: "",
    rate: "",
    fuel: "",
    mileage: "",
    road_tolls: "",
    comments: "",
    photo: null,
  });
  const [maintenanceRows, setMaintenanceRows] = useState([{ item: "", cost: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trips, setTrips] = useState<DisplayTrip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // New state for dropdown options
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // Modal states
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripDetailsOpen, setTripDetailsOpen] = useState(false);
  const [tripEditOpen, setTripEditOpen] = useState(false);

  // Fetch trips from database on component mount
  useEffect(() => {
    fetchTrips();
    fetchDrivers();
    fetchCustomers();
    fetchTrucks();
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchTrips(searchTerm);
      } else {
        fetchTrips();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch all drivers (from profiles table)
  const fetchDrivers = async () => {
    setIsLoadingOptions(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .order('name');

      if (error) {
        toast.error('Failed to fetch drivers');
        console.error('Error:', error);
        return;
      }

      setDrivers(data as Driver[]);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Fetch all customers
  const fetchCustomers = async () => {
    setIsLoadingOptions(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) {
        toast.error('Failed to fetch customers');
        console.error('Error:', error);
        return;
      }

      setCustomers(data as Customer[]);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Fetch all trucks
  const fetchTrucks = async () => {
    setIsLoadingOptions(true);
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('id, plate_number')
        .order('plate_number');

      if (error) {
        toast.error('Failed to fetch trucks');
        console.error('Error:', error);
        return;
      }

      setTrucks(data as Truck[]);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Fetch all trips
  const fetchTrips = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          customers (name),
          profiles (name),
          trucks (plate_number)
        `)
        .order('scheduled_date', { ascending: false });

      if (error) {
        toast.error('Failed to fetch trips');
        console.error('Error:', error);
        return;
      }

      // Transform data for display
      const formattedTrips = (data as TripFromDB[]).map(trip => ({
        id: trip.id,
        customer: trip.customers?.name || 'Unknown Customer',
        origin: trip.origin,
        destination: trip.destination,
        driver: trip.profiles?.name || 'Unassigned',
        truck: trip.trucks?.plate_number || 'Unassigned',
        scheduledDate: new Date(trip.scheduled_date).toLocaleDateString(),
        status: formatStatus(trip.status),
        distance: trip.distance ? `${Math.round(trip.distance * 1.60934)} km` : 'N/A'
      }));

      setTrips(formattedTrips);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search trips
  const searchTrips = async (term: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          customers (name),
          profiles (name),
          trucks (plate_number)
        `)
        .or(`
          origin.ilike.%${term}%,
          destination.ilike.%${term}%,
          customers.name.ilike.%${term}%,
          profiles.name.ilike.%${term}%
        `)
        .order('scheduled_date', { ascending: false });

      if (error) {
        toast.error('Search failed');
        console.error('Error:', error);
        return;
      }

      // Transform data for display
      const formattedTrips = (data as TripFromDB[]).map(trip => ({
        id: trip.id,
        customer: trip.customers?.name || 'Unknown Customer',
        origin: trip.origin,
        destination: trip.destination,
        driver: trip.profiles?.name || 'Unassigned',
        truck: trip.trucks?.plate_number || 'Unassigned',
        scheduledDate: new Date(trip.scheduled_date).toLocaleDateString(),
        status: formatStatus(trip.status),
        distance: trip.distance ? `${Math.round(trip.distance * 1.60934)} km` : 'N/A'
      }));

      setTrips(formattedTrips);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'ongoing': return 'secondary';
      case 'in progress': return 'secondary'; // Fallback for display name
      case 'scheduled': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "photo" && files) {
      setForm((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle select change for dropdowns
  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaintenanceChange = (idx: number, field: string, value: string) => {
    setMaintenanceRows((rows) => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  
  const addMaintenanceRow = () => setMaintenanceRows((rows) => [...rows, { item: "", cost: "" }]);
  
  const removeMaintenanceRow = (idx: number) => setMaintenanceRows((rows) => rows.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Basic validation
      if (!form.customer_id || !form.origin || !form.destination || 
          !form.driver_id || !form.truck_id || !form.scheduled_date) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare the trip data
      const tripPayload = {
        customer_id: form.customer_id,
        origin: form.origin,
        destination: form.destination,
        driver_id: form.driver_id,
        truck_id: form.truck_id,
        scheduled_date: form.scheduled_date,
        distance: form.distance ? Number(form.distance) : null,
        duration: form.duration ? Number(form.duration) : null,
        RATE: form.rate ? Number(form.rate) : null,
        FUEL: form.fuel ? Number(form.fuel) : null,
        MILEAGE: form.mileage ? Number(form.mileage) : null,
        "ROAD TOLLS": form.road_tolls ? Number(form.road_tolls) : null,
        status: 'scheduled' as const
      };

      // Insert trip data to database
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert(tripPayload)
        .select();

      if (tripError) {
        setError(tripError.message);
        setLoading(false);
        return;
      }

      // Handle maintenance items if needed
      // This would require a separate table in the database
      
      // Handle photo upload if provided
      if (form.photo && newTrip && newTrip.length > 0) {
        const fileName = `trip_${newTrip[0].id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('trip-photos')
          .upload(fileName, form.photo);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue anyway as the trip is already created
        }
      }

      toast.success('Trip scheduled successfully');
      setOpen(false);
      
      // Reset form
      setForm({
        customer_id: "",
        origin: "",
        destination: "",
        driver_id: "",
        truck_id: "",
        scheduled_date: "",
        distance: "",
        duration: "",
        rate: "",
        fuel: "",
        mileage: "",
        road_tolls: "",
        comments: "",
        photo: null,
      });
      setMaintenanceRows([{ item: "", cost: "" }]);
      
      // Refresh trips list
      fetchTrips();

    } catch (error) {
      console.error('Error creating trip:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Event handlers for trip actions
  const handleViewDetails = (trip: any) => {
    setSelectedTrip(trip);
    setTripDetailsOpen(true);
  };

  const handleEdit = (trip: any) => {
    setSelectedTrip(trip);
    setTripEditOpen(true);
  };

  const handleTripUpdated = () => {
    fetchTrips(); // Refresh trips list
  };

  return (
    <div className="space-y-6 p-6">
      {/* Trip Statistics */}
      <TripStatistics />
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Management</h1>
            <p className="text-muted-foreground">Plan, track and manage all transportation activities</p>
          </div>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Trip
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Schedule New Trip</DialogTitle>
            <DialogDescription>
              Fill in the details below to schedule a new trip for your logistics operation.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-grow pr-1 -mr-1 pb-4">
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    value={form.customer_id}
                    onValueChange={(value) => handleSelectChange("customer_id", value)}
                    disabled={isLoadingOptions}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleFormChange} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="origin" placeholder="Origin" value={form.origin} onChange={handleFormChange} required />
                <Input name="destination" placeholder="Destination" value={form.destination} onChange={handleFormChange} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    value={form.driver_id}
                    onValueChange={(value) => handleSelectChange("driver_id", value)}
                    disabled={isLoadingOptions}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={form.truck_id}
                    onValueChange={(value) => handleSelectChange("truck_id", value)}
                    disabled={isLoadingOptions}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Truck" />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>{truck.plate_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="distance" placeholder="Distance (kilometers)" value={form.distance} onChange={handleFormChange} required />
                <Input name="duration" placeholder="Duration (hours)" value={form.duration} onChange={handleFormChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="mileage" placeholder="Mileage" value={form.mileage} onChange={handleFormChange} />
                <Input name="rate" placeholder="Rate ($)" value={form.rate} onChange={handleFormChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="fuel" placeholder="Fuel Cost ($)" value={form.fuel} onChange={handleFormChange} />
                <Input name="road_tolls" placeholder="Road Tolls ($)" value={form.road_tolls} onChange={handleFormChange} />
              </div>
              <Textarea name="comments" placeholder="Comments (optional)" value={form.comments} onChange={handleFormChange} />
              <div>
                <label className="block mb-1">Maintenance Items</label>
                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input value={row.item} onChange={e => handleMaintenanceChange(idx, "item", e.target.value)} placeholder="Maintenance Item" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.cost} onChange={e => handleMaintenanceChange(idx, "cost", e.target.value)} placeholder="Cost" />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeMaintenanceRow(idx)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button type="button" onClick={addMaintenanceRow} className="mt-2" size="sm"><Plus className="h-4 w-4 mr-2" />Add Row</Button>
                </div>
              </div>
              <div>
                <label className="block mb-1">Photo (optional)</label>
                <Input name="photo" type="file" accept="image/*" onChange={handleFormChange} />
              </div>
              {error && <div className="text-red-600">{error}</div>}
              {isLoadingOptions && <div className="text-amber-600">Loading data...</div>}
              <div className="flex gap-2 justify-end sticky bottom-0 pt-2 bg-background">
                <Button type="button" onClick={handleSubmit} disabled={loading || isLoadingOptions}>
                  {loading ? "Saving..." : "Save Trip"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              All Trips ({trips.length})
            </span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Searching trips...</p>
              </div>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No trips found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip, index) => (
                <Card 
                  key={trip.id} 
                  className="shadow-card hover:shadow-elegant transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{trip.id}</h3>
                          <p className="text-sm text-muted-foreground">{trip.customer}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(trip.status)}>
                        {trip.status}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">From:</span>
                          <span className="ml-2 font-medium">{trip.origin}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">To:</span>
                          <span className="ml-2 font-medium">{trip.destination}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Date:</span>
                          <span className="ml-2 font-medium">{trip.scheduledDate}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Driver:</span>
                          <span className="ml-2 font-medium">{trip.driver}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Truck:</span>
                          <span className="ml-2 font-medium">{trip.truck}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="ml-2 font-medium">{trip.distance}</span>
                        </div>
                      </div>
                    </div>
                    <TripActions
                      trip={trip}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEdit}
                      onStatusUpdate={handleTripUpdated}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Details Modal */}
      <TripDetails
        trip={selectedTrip}
        open={tripDetailsOpen}
        onOpenChange={setTripDetailsOpen}
      />

      {/* Trip Edit Modal */}
      <TripEdit
        trip={selectedTrip}
        open={tripEditOpen}
        onOpenChange={setTripEditOpen}
        onTripUpdated={handleTripUpdated}
      />
    </div>
  );
};

