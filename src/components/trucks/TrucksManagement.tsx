import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Truck, User, Weight, Settings } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
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

  const trucks = [
    { id: 1, plateNumber: "ABC-123", model: "Volvo FH16", capacity: "40 tons", status: "Active", assignedDriver: "John Smith", mileage: "245,000 km", lastMaintenance: "2024-01-15" },
    { id: 2, plateNumber: "XYZ-456", model: "Mercedes Actros", capacity: "35 tons", status: "Maintenance", assignedDriver: "Sarah Johnson", mileage: "180,500 km", lastMaintenance: "2024-02-20" },
    { id: 3, plateNumber: "DEF-789", model: "Scania R450", capacity: "42 tons", status: "Active", assignedDriver: "Mike Davis", mileage: "320,200 km", lastMaintenance: "2024-01-30" },
    { id: 4, plateNumber: "GHI-012", model: "DAF XF", capacity: "38 tons", status: "Available", assignedDriver: null, mileage: "95,800 km", lastMaintenance: "2024-02-10" },
    { id: 5, plateNumber: "JKL-345", model: "MAN TGX", capacity: "45 tons", status: "Active", assignedDriver: "Lisa Wilson", mileage: "210,400 km", lastMaintenance: "2024-02-01" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Maintenance': return 'destructive';
      case 'Available': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredTrucks = trucks.filter(truck =>
    truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (truck.assignedDriver && truck.assignedDriver.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      } = {
        plate_number: form.plate_number,
        model: form.model,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: statusValue,
        assigned_driver_id: form.assigned_driver_id || null,
      };
      const { error: truckError } = await supabase.from("trucks").insert(payload);
    if (truckError) {
      setError(truckError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    setOpen(false);
    // Optionally, refresh trucks list here
  };

  return (
    <div className="space-y-6 p-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
            <p className="text-muted-foreground">Monitor and manage your truck fleet</p>
          </div>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold">Add New Truck</h2>
            <Input name="plate_number" placeholder="Plate Number" value={form.plate_number} onChange={handleFormChange} required />
            <Input name="model" placeholder="Model" value={form.model} onChange={handleFormChange} required />
            <Input name="capacity" placeholder="Capacity (tons)" value={form.capacity} onChange={handleFormChange} required />
            <Input name="status" placeholder="Status (active/inactive/maintenance)" value={form.status} onChange={handleFormChange} required />
            <Input name="assigned_driver_id" placeholder="Assigned Driver ID (optional)" value={form.assigned_driver_id} onChange={handleFormChange} />
            <Input name="mileage" placeholder="Mileage (km)" value={form.mileage} onChange={handleFormChange} required />
            <Input name="last_maintenance" type="date" value={form.last_maintenance} onChange={handleFormChange} required />
            {error && <div className="text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Truck"}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                Fleet Overview ({filteredTrucks.length})
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrucks.map((truck, index) => (
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
          </CardContent>
        </Card>
      </Dialog>
    </div>
  );
}
