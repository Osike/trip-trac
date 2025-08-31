import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Truck, User, Weight, Settings, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TruckFromDB {
  id: string;
  plate_number: string;
  model: string;
  capacity: number | null;
  status: "active" | "inactive" | "maintenance";
  assigned_driver_id: string | null;
  mileage: number | null;
  last_maintenance: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  } | null;
}

interface DisplayTruck {
  id: string;
  plateNumber: string;
  model: string;
  capacity: string;
  status: string;
  assignedDriver: string | null;
  mileage: string;
  lastMaintenance: string;
}
export const TrucksManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    plate_number: "",
    model: "",
    capacity: "",
    status: "active", // must be 'active', 'inactive', or 'maintenance'
    assigned_driver_id: "",
    mileage: "",
    last_maintenance: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trucks, setTrucks] = useState<DisplayTruck[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch trucks from database on component mount
  useEffect(() => {
    fetchTrucks();
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchTrucks(searchTerm);
      } else {
        fetchTrucks();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch all trucks
  const fetchTrucks = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch trucks');
        console.error('Error:', error);
        return;
      }

      // Transform data for display
      const formattedTrucks = (data as TruckFromDB[]).map(truck => ({
        id: truck.id,
        plateNumber: truck.plate_number,
        model: truck.model,
        capacity: `${truck.capacity || 0} tons`,
        status: truck.status.charAt(0).toUpperCase() + truck.status.slice(1),
        assignedDriver: truck.profiles?.name || null,
        mileage: `${truck.mileage || 0} km`,
        lastMaintenance: truck.last_maintenance || 'Not recorded'
      }));

      setTrucks(formattedTrucks);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search trucks
  const searchTrucks = async (term: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*, profiles(name)')
        .or(`plate_number.ilike.%${term}%,model.ilike.%${term}%`)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Search failed');
        console.error('Error:', error);
        return;
      }

      // Transform data for display
      const formattedTrucks = (data as TruckFromDB[]).map(truck => ({
        id: truck.id,
        plateNumber: truck.plate_number,
        model: truck.model,
        capacity: `${truck.capacity || 0} tons`,
        status: truck.status.charAt(0).toUpperCase() + truck.status.slice(1),
        assignedDriver: truck.profiles?.name || null,
        mileage: `${truck.mileage || 0} km`,
        lastMaintenance: truck.last_maintenance || 'Not recorded'
      }));

      setTrucks(formattedTrucks);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'maintenance': return 'destructive';
      case 'available': case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Only allow valid status values
    const allowedStatus = ["active", "inactive", "maintenance"];
    const statusValue = allowedStatus.includes(form.status.toLowerCase())
      ? (form.status.toLowerCase() as "active" | "inactive" | "maintenance")
      : "active";
      const payload: {
        plate_number: string;
        model: string;
        capacity?: number | null;
        status?: "active" | "inactive" | "maintenance";
        assigned_driver_id?: string | null;
        mileage?: number | null;
        last_maintenance?: string | null;
      } = {
        plate_number: form.plate_number,
        model: form.model,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: statusValue,
        assigned_driver_id: form.assigned_driver_id || null,
        mileage: form.mileage ? Number(form.mileage) : null,
        last_maintenance: form.last_maintenance || null
      };
      
      const { error: truckError } = await supabase.from("trucks").insert(payload);
      
    if (truckError) {
      setError(truckError.message);
      setLoading(false);
      return;
    }
    
    toast.success('Truck added successfully');
    setLoading(false);
    setOpen(false);
    
    // Reset form
    setForm({
      plate_number: "",
      model: "",
      capacity: "",
      status: "active",
      assigned_driver_id: "",
      mileage: "",
      last_maintenance: "",
    });
    
    // Refresh trucks list
    fetchTrucks();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground">Monitor and manage your truck fleet</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Truck</DialogTitle>
              <DialogDescription>
                Enter truck details to add it to your fleet.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-grow pr-1 -mr-1 pb-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input name="plate_number" placeholder="Plate Number" value={form.plate_number} onChange={handleFormChange} required />
                  <Input name="model" placeholder="Model" value={form.model} onChange={handleFormChange} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input name="capacity" placeholder="Capacity (tons)" value={form.capacity} onChange={handleFormChange} required />
                  <Input name="mileage" placeholder="Mileage (km)" value={form.mileage} onChange={handleFormChange} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input name="status" placeholder="Status (active/inactive/maintenance)" value={form.status} onChange={handleFormChange} required />
                  <Input name="last_maintenance" type="date" value={form.last_maintenance} onChange={handleFormChange} required />
                </div>
                <Input name="assigned_driver_id" placeholder="Assigned Driver ID (optional)" value={form.assigned_driver_id} onChange={handleFormChange} />
                
                {error && <div className="text-red-600">{error}</div>}
                <div className="flex gap-2 justify-end sticky bottom-0 pt-2 bg-background">
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Truck"}</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                Fleet Overview ({trucks.length})
              </span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trucks..."
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
                  <p className="text-muted-foreground">Searching trucks...</p>
                </div>
              </div>
            ) : trucks.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trucks found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trucks.map((truck, index) => (
                <Card 
                  key={truck.id} 
                  className="shadow-card hover:shadow-elegant transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <Badge variant={getStatusColor(truck.status) as any}>
                        {truck.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{truck.plateNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">{truck.model}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-muted-foreground">
                          <Weight className="h-4 w-4 mr-1" />
                          Capacity:
                        </span>
                        <span className="font-medium">{truck.capacity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-muted-foreground">
                          <User className="h-4 w-4 mr-1" />
                          Driver:
                        </span>
                        <span className="font-medium">{truck.assignedDriver || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Mileage:</span>
                        <span className="font-medium">{truck.mileage}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Service:</span>
                        <span className="font-medium">{truck.lastMaintenance}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
