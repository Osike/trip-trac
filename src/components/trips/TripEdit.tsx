import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TripEditProps {
  trip: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTripUpdated: () => void;
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

export const TripEdit = ({ trip, open, onOpenChange, onTripUpdated }: TripEditProps) => {
  const [form, setForm] = useState({
    customer_id: "",
    origin: "",
    destination: "",
    driver_id: "",
    truck_id: "",
    scheduled_date: "",
    distance: "",
    rate: "",
    fuel: "",
    mileage: "",
    road_tolls: "",
    status: ""
  });
  // Maintenance items state
  const [maintenanceItems, setMaintenanceItems] = useState<{ description: string; cost: number; id: string }[]>([]);
  const [newMaintenance, setNewMaintenance] = useState({ description: "", cost: "" });
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    if (trip && open) {
      setForm({
        customer_id: trip.customer_id || "",
        origin: trip.origin || "",
        destination: trip.destination || "",
        driver_id: trip.driver_id || "",
        truck_id: trip.truck_id || "",
        scheduled_date: trip.scheduled_date ? trip.scheduled_date.split('T')[0] : "",
        distance: trip.distance ? trip.distance.toString() : "",
        rate: trip.RATE ? trip.RATE.toString() : "",
        fuel: trip.FUEL ? trip.FUEL.toString() : "",
        mileage: trip.MILEAGE ? trip.MILEAGE.toString() : "",
        road_tolls: trip["ROAD TOLLS"] ? trip["ROAD TOLLS"].toString() : "",
        status: trip.status || "scheduled"
      });
      // Load maintenance items if available (for edit)
      if (trip.maintenance && Array.isArray(trip.maintenance)) {
        setMaintenanceItems(trip.maintenance.map((item: any) => ({
          id: item.id || Math.random().toString(),
          description: item.description,
          cost: item.cost
        })));
      } else {
        setMaintenanceItems([]);
      }
      fetchDropdownData();
    }
  }, [trip, open]);

  const fetchDropdownData = async () => {
    try {
      const [driversResponse, customersResponse, trucksResponse] = await Promise.all([
        supabase.from('profiles').select('id, name').order('name'),
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('trucks').select('id, plate_number').order('plate_number')
      ]);

      if (driversResponse.data) setDrivers(driversResponse.data);
      if (customersResponse.data) setCustomers(customersResponse.data);
      if (trucksResponse.data) setTrucks(trucksResponse.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Maintenance item handlers
  const handleAddMaintenance = () => {
    if (!newMaintenance.description.trim() || !newMaintenance.cost.trim()) {
      toast.error('Please fill in both description and cost');
      return;
    }
    const costValue = parseFloat(newMaintenance.cost);
    if (isNaN(costValue) || costValue < 0) {
      toast.error('Please enter a valid cost amount');
      return;
    }
    setMaintenanceItems(prev => [...prev, {
      id: Date.now().toString(),
      description: newMaintenance.description.trim(),
      cost: costValue
    }]);
    setNewMaintenance({ description: "", cost: "" });
    toast.success('Maintenance item added');
  };

  const handleRemoveMaintenance = (id: string) => {
    setMaintenanceItems(prev => prev.filter(item => item.id !== id));
    toast.success('Maintenance item removed');
  };

  const handleUpdateMaintenance = (id: string, field: 'description' | 'cost', value: string) => {
    setMaintenanceItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'cost') {
          const costValue = parseFloat(value);
          if (isNaN(costValue) || costValue < 0) {
            toast.error('Please enter a valid cost amount');
            return item;
          }
          return { ...item, cost: costValue };
        } else {
          return { ...item, [field]: value };
        }
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        customer_id: form.customer_id,
        origin: form.origin,
        destination: form.destination,
        driver_id: form.driver_id,
        truck_id: form.truck_id,
        scheduled_date: form.scheduled_date,
        distance: form.distance ? parseFloat(form.distance) : null,
        RATE: form.rate ? parseFloat(form.rate) : null,
        FUEL: form.fuel ? parseFloat(form.fuel) : null,
        MILEAGE: form.mileage ? parseFloat(form.mileage) : null,
        "ROAD TOLLS": form.road_tolls ? parseFloat(form.road_tolls) : null,
        status: form.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', trip.id);

      if (error) {
        toast.error('Failed to update trip');
        console.error('Error:', error);
        return;
      }

      // Insert maintenance records for this trip
      if (maintenanceItems.length > 0) {
        const maintenancePayload = maintenanceItems.map(item => ({
          trip_id: trip.id,
          truck_id: form.truck_id,
          description: item.description,
          cost: item.cost,
          maintenance_date: form.scheduled_date || new Date().toISOString().split('T')[0]
        }));
        const { error: maintenanceError } = await supabase
          .from('maintenance')
          .insert(maintenancePayload);
        if (maintenanceError) {
          toast.error('Failed to save maintenance records');
          console.error('Maintenance error:', maintenanceError);
          // Do not return; allow trip update to succeed
        }
      }

      toast.success('Trip updated successfully');
      onTripUpdated();
      onOpenChange(false);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip - {trip.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <Select
                value={form.customer_id}
                onValueChange={(value) => handleSelectChange("customer_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <Input
                name="scheduled_date"
                type="date"
                value={form.scheduled_date}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="border rounded-lg p-4 bg-secondary/20 space-y-4">
            <div className="font-semibold mb-2">Maintenance Expenses</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="maintenance-desc" className="block text-sm font-medium">Description</label>
                <textarea
                  id="maintenance-desc"
                  placeholder="Describe maintenance work"
                  value={newMaintenance.description}
                  onChange={e => setNewMaintenance(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="maintenance-cost" className="block text-sm font-medium">Cost ($)</label>
                <input
                  id="maintenance-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newMaintenance.cost}
                  onChange={e => setNewMaintenance(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={handleAddMaintenance} className="w-full">
                  Add Item
                </Button>
              </div>
            </div>
            {/* List of maintenance items */}
            {maintenanceItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Maintenance Items ({maintenanceItems.length})</span>
                  <span className="text-lg font-bold text-primary">Total: ${maintenanceItems.reduce((total, item) => total + item.cost, 0).toFixed(2)}</span>
                </div>
                <div className="space-y-3">
                  {maintenanceItems.map(item => (
                    <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">Description</label>
                            <textarea
                              value={item.description}
                              onChange={e => handleUpdateMaintenance(item.id, 'description', e.target.value)}
                              placeholder="Maintenance description"
                              rows={2}
                              className="w-full border rounded px-2 py-1 mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Cost ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cost}
                              onChange={e => handleUpdateMaintenance(item.id, 'cost', e.target.value)}
                              placeholder="0.00"
                              className="w-full border rounded px-2 py-1 mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveMaintenance(item.id)} className="text-destructive hover:text-destructive">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {maintenanceItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <span>No maintenance items added yet</span>
                <span className="block text-sm">Use the form above to add maintenance expenses</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Origin</label>
              <Input
                name="origin"
                value={form.origin}
                onChange={handleFormChange}
                placeholder="Origin"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Destination</label>
              <Input
                name="destination"
                value={form.destination}
                onChange={handleFormChange}
                placeholder="Destination"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Driver</label>
              <Select
                value={form.driver_id}
                onValueChange={(value) => handleSelectChange("driver_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Truck</label>
              <Select
                value={form.truck_id}
                onValueChange={(value) => handleSelectChange("truck_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.plate_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Distance (kilometers)</label>
              <Input
                name="distance"
                type="number"
                value={form.distance}
                onChange={handleFormChange}
                placeholder="Distance"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Mileage</label>
              <Input
                name="mileage"
                type="number"
                step="0.01"
                value={form.mileage}
                onChange={handleFormChange}
                placeholder="Mileage"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rate ($)</label>
              <Input
                name="rate"
                type="number"
                step="0.01"
                value={form.rate}
                onChange={handleFormChange}
                placeholder="Rate"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Cost ($)</label>
              <Input
                name="fuel"
                type="number"
                step="0.01"
                value={form.fuel}
                onChange={handleFormChange}
                placeholder="Fuel Cost"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Road Tolls ($)</label>
              <Input
                name="road_tolls"
                type="number"
                step="0.01"
                value={form.road_tolls}
                onChange={handleFormChange}
                placeholder="Road Tolls"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={form.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};