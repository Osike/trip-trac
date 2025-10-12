import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaintenanceSection } from "@/components/maintenance";

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

interface MaintenanceItem {
  id: string;
  description: string;
  cost: number;
}

export const TripEditWithMaintenance = ({ trip, open, onOpenChange, onTripUpdated }: TripEditProps) => {
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
    salary: "",
    status: ""
  });
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    const loadTripData = async () => {
      if (!trip || !open) return;
      
      // First fetch dropdown data
      await fetchDropdownData();
      
      // Then populate form with trip data
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
        salary: trip.SALARY ? trip.SALARY.toString() : "",
        status: trip.status || "scheduled"
      });
      
      // Finally fetch maintenance items
      await fetchMaintenanceItems();
    };
    
    loadTripData();
  }, [trip?.id, open]);

  const fetchMaintenanceItems = async () => {
    if (!trip?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('id, description, cost')
        .eq('trip_id', trip.id);

      if (error) {
        console.error('Error fetching maintenance items:', error);
        setMaintenanceItems([]);
        return;
      }
      
      // Transform the data to match our interface
      const transformedItems = (data || []).map(item => ({
        id: item.id,
        description: item.description,
        cost: Number(item.cost)
      }));
      
      setMaintenanceItems(transformedItems);
    } catch (error: any) {
      console.error('Error fetching maintenance items:', error);
      setMaintenanceItems([]);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavingMaintenance(false);

    try {
      // Validate required fields
      if (!form.customer_id || !form.origin || !form.destination || !form.driver_id || !form.truck_id) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

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
        SALARY: form.salary ? parseFloat(form.salary) : null,
        status: form.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', trip.id);

      if (error) {
        console.error('Error:', error);
        toast.error('Failed to update trip: ' + error.message);
        return;
      }

      // Handle maintenance items separately
      if (maintenanceItems.length > 0) {
        setSavingMaintenance(true);
        
        // Delete existing maintenance items for this trip
        const { error: deleteError } = await supabase
          .from('maintenance')
          .delete()
          .eq('trip_id', trip.id);

        if (deleteError) {
          console.error('Error deleting old maintenance records:', deleteError);
          // Continue anyway, we'll try to insert new ones
        }

        // Insert new maintenance items
        const maintenanceRecords = maintenanceItems.map(item => ({
          trip_id: trip.id,
          truck_id: form.truck_id,
          description: item.description,
          cost: item.cost,
          maintenance_date: form.scheduled_date || new Date().toISOString().split('T')[0]
        }));

        const { error: maintenanceError } = await supabase
          .from('maintenance')
          .insert(maintenanceRecords);

        if (maintenanceError) {
          console.error('Maintenance error:', maintenanceError);
          toast.error('Trip updated but failed to save maintenance records: ' + maintenanceError.message);
          return;
        }
      } else {
        // If no maintenance items, delete any existing ones for this trip
        await supabase
          .from('maintenance')
          .delete()
          .eq('trip_id', trip.id);
      }

      toast.success('Trip and maintenance records updated successfully');
      onTripUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setSavingMaintenance(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip - {trip.id}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <Select
                key={`customer-${trip?.id}-${form.customer_id}`}
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
                key={`driver-${trip?.id}-${form.driver_id}`}
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
                key={`truck-${trip?.id}-${form.truck_id}`}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div>
              <label className="block text-sm font-medium mb-1">Salary ($)</label>
              <Input
                name="salary"
                type="number"
                step="0.01"
                value={form.salary}
                onChange={handleFormChange}
                placeholder="Driver Salary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              key={`status-${trip?.id}-${form.status}`}
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

          {/* Maintenance Section */}
          <MaintenanceSection
            maintenanceItems={maintenanceItems}
            onMaintenanceChange={setMaintenanceItems}
            tripId={trip?.id}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || savingMaintenance}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || savingMaintenance}>
              {loading ? "Updating Trip..." : savingMaintenance ? "Saving Maintenance..." : "Update Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};