import Chart from "chart.js/auto";
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
import { Loader as Loader2, Plus, Search, Wrench, Calendar, DollarSign, CreditCard as Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [costPerTruck, setCostPerTruck] = useState<{ truck_id: string; plate_number: string; total_cost: number }[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCostPerTruck();
  }, []); // Only run once on mount

  const fetchCostPerTruck = async () => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('truck_id, cost, trucks:truck_id (plate_number)');
    if (error || !data) return setCostPerTruck([]);
    // Aggregate cost per truck
    const costMap: Record<string, { plate_number: string; total_cost: number }> = {};
    data.forEach((row: any) => {
      if (!row.truck_id || !row.trucks) return;
      if (!costMap[row.truck_id]) {
        costMap[row.truck_id] = { plate_number: row.trucks.plate_number, total_cost: 0 };
      }
      costMap[row.truck_id].total_cost += Number(row.cost);
    });
    setCostPerTruck(Object.entries(costMap).map(([truck_id, v]) => ({ truck_id, plate_number: v.plate_number, total_cost: v.total_cost })));
  };

  // Pie chart data
  const pieData = costPerTruck.map(truck => ({
    id: truck.truck_id,
    label: `${truck.plate_number} ($${truck.total_cost.toFixed(2)})`,
    value: truck.total_cost
  }));

  // Pie chart component (using chart.js)
  const PieChart = () => {
    // Color palette for legend and chart
    const colors = [
      '#3b82f6', '#f59e42', '#10b981', '#ef4444', '#6366f1', '#fbbf24', '#a3e635', '#f472b6', '#38bdf8', '#f87171'
    ];
    // Calculate total cost for percentage labels
    const totalCost = pieData.reduce((sum, d) => sum + d.value, 0);
    // Chart instance
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (!canvasRef.current) return;
      let chartInstance: any = null;
      chartInstance = new Chart(canvasRef.current, {
        type: 'pie',
        data: {
          labels: pieData.map(d => `${d.label.split(' ')[0]} (${((d.value/totalCost)*100).toFixed(1)}%)`),
          datasets: [{ data: pieData.map(d => d.value), backgroundColor: colors.slice(0, pieData.length) }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const label = context.label.split(' ')[0];
                  const value = context.parsed;
                  return `${label}: $${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
      return () => {
        if (chartInstance) chartInstance.destroy();
      };
    }, [pieData]);

    // Legend
    const legend = (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {pieData.map((d, i) => (
          <div key={d.id} className="flex items-center space-x-2">
            <span style={{ background: colors[i], width: 16, height: 16, borderRadius: '50%', display: 'inline-block' }}></span>
            <span className="text-sm font-medium">{d.label.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    );

    return (
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center" style={{ width: '100%', maxWidth: 350, margin: '0 auto' }}>
        <h2 className="text-lg font-bold mb-2">Maintenance Cost Per Truck</h2>
        <div style={{ width: 250, height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <canvas ref={canvasRef} width={250} height={250} style={{ width: '100%', height: '100%' }} />
        </div>
        {legend}
      </div>
    );
  };

  // PDF download (jsPDF)
  const handleDownloadPDF = async () => {
    setDownloading(true);
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.text('Maintenance Cost Per Truck', 10, 10);
    costPerTruck.forEach((truck, i) => {
      doc.text(`${truck.plate_number}: $${truck.total_cost.toFixed(2)}`, 10, 20 + i * 10);
    });
    doc.save('maintenance-cost-per-truck.pdf');
    setDownloading(false);
  };
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Maintenance | null>(null);
  const [dateRange, setDateRange] = useState<any>({});
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [formData, setFormData] = useState({
    truck_id: '',
    trip_id: '',
    description: '',
    cost: '',
    maintenance_date: format(new Date(), 'yyyy-MM-dd')
  });

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

      if (error) {
        console.error('Error fetching maintenance records:', error);
        toast.error('Failed to fetch maintenance records');
        return;
      }

      console.log('Fetched maintenance records:', data);
      setMaintenanceRecords(data || []);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
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
        query = query.or(`description.ilike.%${searchTerm}%`);
      }

      if (dateRange.from) {
        query = query.gte('maintenance_date', format(dateRange.from, 'yyyy-MM-dd'));
      }

      if (dateRange.to) {
        query = query.lte('maintenance_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      if (selectedTruck && selectedTruck !== "all") {
        query = query.eq('truck_id', selectedTruck);
      }

      const { data, error } = await query.order('maintenance_date', { ascending: false });

      if (error) {
        console.error('Error filtering maintenance records:', error);
        toast.error('Failed to filter maintenance records');
        return;
      }

      setMaintenanceRecords(data || []);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
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

      if (error) {
        console.error('Error fetching trucks:', error);
        toast.error('Failed to fetch trucks');
        return;
      }

      setTrucks(data || []);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Failed to fetch trucks');
    }
  };

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, origin, destination')
        .in('status', ['ongoing', 'scheduled'])
        .order('scheduled_date', { ascending: false });

      if (error) {
        console.error('Error fetching trips:', error);
        toast.error('Failed to fetch trips');
        return;
      }

      setTrips(data || []);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Failed to fetch trips');
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      truck_id: '',
      trip_id: '',
      description: '',
      cost: '',
      maintenance_date: format(new Date(), 'yyyy-MM-dd')
    });
    setEditingRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.truck_id || !formData.description || !formData.cost) {
      toast.error('Please fill in all required fields (truck, description, and cost)');
      return;
    }

    try {
      const maintenanceData = {
        truck_id: formData.truck_id,
        trip_id: formData.trip_id || null,
        description: formData.description,
        cost: parseFloat(formData.cost),
        maintenance_date: formData.maintenance_date
      };

      let result;
      if (editingRecord) {
        // Update existing record
        result = await supabase
          .from('maintenance')
          .update(maintenanceData)
          .eq('id', editingRecord.id);
      } else {
        // Create new record
        result = await supabase
          .from('maintenance')
          .insert(maintenanceData);
      }

      if (result.error) {
        console.error('Error saving maintenance record:', result.error);
        toast.error('Failed to save maintenance record');
        return;
      }

      toast.success(editingRecord ? 'Maintenance record updated successfully' : 'Maintenance record created successfully');
      setDialogOpen(false);
      resetForm();
      fetchMaintenanceRecords();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleEdit = (record: Maintenance) => {
    setEditingRecord(record);
    setFormData({
      truck_id: record.truck_id,
      trip_id: record.trip_id || '',
      description: record.description,
      cost: record.cost.toString(),
      maintenance_date: format(new Date(record.maintenance_date), 'yyyy-MM-dd')
    });
    setDialogOpen(true);
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting maintenance record:', error);
        toast.error('Failed to delete maintenance record');
        return;
      }

      toast.success('Maintenance record deleted successfully');
      fetchMaintenanceRecords();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const getTotalMaintenanceCost = () => {
    return maintenanceRecords.reduce((total, record) => total + record.cost, 0);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
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
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord ? 'Update the maintenance record details' : 'Create a new maintenance record for a truck'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="truck_id">Truck *</Label>
                <Select 
                  value={formData.truck_id} 
                  onValueChange={(value) => handleFormChange('truck_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.filter(truck => truck.id && truck.id !== "").map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.plate_number} - {truck.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip_id">Trip (Optional)</Label>
                <Select 
                  value={formData.trip_id || "none"} 
                  onValueChange={(value) => handleFormChange('trip_id', value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No trip selected</SelectItem>
                    {trips.filter(trip => trip.id && trip.id !== "").map((trip) => (
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
                  placeholder="Describe the maintenance work performed"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
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
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRecord ? 'Update Maintenance' : 'Create Maintenance'}
                </Button>
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
            <p className="text-xs text-muted-foreground">
              Maintenance records tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalMaintenanceCost().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total maintenance expenses
            </p>
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
            <p className="text-xs text-muted-foreground">
              Average cost per maintenance
            </p>
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
                  placeholder="Search description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Truck Filter</Label>
              <Select value={selectedTruck || "all"} onValueChange={setSelectedTruck}>
                <SelectTrigger>
                  <SelectValue placeholder="All trucks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trucks</SelectItem>
                  {trucks.filter(truck => truck.id && truck.id !== "").map((truck) => (
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
              setSelectedTruck('all');
              setDateRange({});
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Pie Chart for Maintenance Cost Per Truck */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex justify-end mb-2">
          <Button onClick={handleDownloadPDF} disabled={downloading} variant="outline">
            {downloading ? 'Downloading...' : 'View All (PDF)'}
          </Button>
        </div>
        {costPerTruck.length === 0 ? (
          <div className="text-muted-foreground">No maintenance cost data available</div>
        ) : (
          <PieChart />
        )}
      </div>
    </div>
  );
}