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
    cost: "",
    status: ""
  });
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
        cost: trip.cost ? trip.cost.toString() : "",
        status: trip.status || "scheduled"
      });
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
        cost: form.cost ? parseFloat(form.cost) : null,
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium mb-1">Cost ($)</label>
              <Input
                name="cost"
                type="number"
                step="0.01"
                value={form.cost}
                onChange={handleFormChange}
                placeholder="Cost"
              />
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