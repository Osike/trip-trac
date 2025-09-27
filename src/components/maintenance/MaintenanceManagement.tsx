import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Loader2, Plus, Search, Wrench, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Maintenance {
  id: string;
  trip_id?: string;
  truck_id: string;
  description: string;
  cost: number;
  maintenance_date: string;
  created_at: string;
  trucks: {
    plate_number: string;
    model: string;
  };
  trips?: {
    origin: string;
    destination: string;
  };
}

interface Truck {
  id: string;
  plate_number: string;
  model: string;
}

interface Trip {
  id: string;
  origin: string;
  destination: string;
}

export default function MaintenanceManagement() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<any>({});
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [formData, setFormData] = useState({
    truck_id: '',
    trip_id: '',
    description: '',
    cost: '',
    maintenance_date: format(new Date(), 'yyyy-MM-dd')
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchMaintenanceRecords();
    fetchTrucks();
    fetchTrips();
  }, []);

  useEffect(() => {
    if (searchTerm || dateRange.from || selectedTruck) {
      filterMaintenanceRecords();
    } else {
      fetchMaintenanceRecords();
    }
  }, [searchTerm, dateRange, selectedTruck]);

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          *,
          trucks:truck_id (
            plate_number,
            model
          ),
          trips:trip_id (
            origin,
            destination
          )
        `)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      setMaintenanceRecords(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMaintenanceRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('maintenance')
        .select(`
          *,
          trucks:truck_id (
            plate_number,
            model
          ),
          trips:trip_id (
            origin,
            destination
          )
        `);

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,trucks.plate_number.ilike.%${searchTerm}%`);
      }

      if (dateRange.from) {
        query = query.gte('maintenance_date', format(dateRange.from, 'yyyy-MM-dd'));
      }

      if (dateRange.to) {
        query = query.lte('maintenance_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      if (selectedTruck) {
        query = query.eq('truck_id', selectedTruck);
      }

      const { data, error } = await query.order('maintenance_date', { ascending: false });

      if (error) throw error;
      setMaintenanceRecords(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('id, plate_number, model')
        .order('plate_number');

      if (error) throw error;
      setTrucks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, origin, destination')
        .eq('status', 'ongoing')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.truck_id || !formData.description || !formData.cost) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance')
        .insert({
          truck_id: formData.truck_id,
          trip_id: formData.trip_id || null,
          description: formData.description,
          cost: parseFloat(formData.cost),
          maintenance_date: formData.maintenance_date
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance record created successfully",
      });

      setDialogOpen(false);
      setFormData({
        truck_id: '',
        trip_id: '',
        description: '',
        cost: '',
        maintenance_date: format(new Date(), 'yyyy-MM-dd')
      });
      fetchMaintenanceRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTotalMaintenanceCost = () => {
    return maintenanceRecords.reduce((total, record) => total + record.cost, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Management</h1>
          <p className="text-muted-foreground">Track and manage vehicle maintenance records</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
              <DialogDescription>
                Create a new maintenance record for a truck
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="truck_id">Truck *</Label>
                <Select onValueChange={(value) => handleFormChange('truck_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.plate_number} - {truck.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip_id">Trip (Optional)</Label>
                <Select onValueChange={(value) => handleFormChange('trip_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.origin} → {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe the maintenance work"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleFormChange('cost', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_date">Maintenance Date</Label>
                <Input
                  id="maintenance_date"
                  type="date"
                  value={formData.maintenance_date}
                  onChange={(e) => handleFormChange('maintenance_date', e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Maintenance</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalMaintenanceCost().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Record</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${maintenanceRecords.length > 0 ? (getTotalMaintenanceCost() / maintenanceRecords.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Maintenance Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search description or truck..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Truck Filter</Label>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger>
                  <SelectValue placeholder="All trucks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All trucks</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.plate_number} - {truck.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedTruck('');
              setDateRange({});
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Maintenance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
          <CardDescription>
            Showing {maintenanceRecords.length} maintenance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.maintenance_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.trucks.plate_number}</div>
                        <div className="text-sm text-muted-foreground">{record.trucks.model}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.trips ? (
                        <Badge variant="outline">
                          {record.trips.origin} → {record.trips.destination}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell className="font-medium">${record.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {maintenanceRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No maintenance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}