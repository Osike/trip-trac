import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader as Loader2, FileDown, TrendingUp, TrendingDown, ChartBar as BarChart3, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TripProfitData {
  id: string;
  origin: string;
  destination: string;
  scheduled_date: string;
  rate: number;
  fuel: number;
  mileage: number;
  salary: number;
  maintenance_cost: number;
  profit: number;
  profit_margin: number;
  customer_name: string;
  truck_plate: string;
  driver_name: string;
}

interface TruckMaintenanceData {
  id: string;
  plate_number: string;
  model: string;
  total_maintenance_cost: number;
  maintenance_count: number;
  avg_maintenance_cost: number;
  last_maintenance_date: string;
}

export default function MaintenanceReports() {
  const [tripProfits, setTripProfits] = useState<TripProfitData[]>([]);
  const [truckMaintenance, setTruckMaintenance] = useState<TruckMaintenanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>({});
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [trucks, setTrucks] = useState<{ id: string; plate_number: string; model: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'profits' | 'maintenance'>('profits');

  useEffect(() => {
    fetchTrucks();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [dateRange, selectedTruck]);

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

  const fetchReports = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTripProfits(), fetchTruckMaintenanceData()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripProfits = async () => {
    try {
      let query = supabase
        .from('trips')
        .select(`
          id,
          origin,
          destination,
          scheduled_date,
          "RATE",
          "FUEL",
          "MILEAGE", 
          "SALARY",
          customers(name),
          trucks(plate_number),
          profiles(name),
          maintenance(cost)
        `)
        .not('"RATE"', 'is', null);

      if (dateRange.from) {
        query = query.gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'));
      }

      if (dateRange.to) {
        query = query.lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      if (selectedTruck && selectedTruck !== "all") {
        query = query.eq('truck_id', selectedTruck);
      }

      const { data, error } = await query.order('scheduled_date', { ascending: false });

      if (error) {
        console.error('Error fetching trip profits:', error);
        toast.error('Failed to fetch trip profit data');
        return;
      }

      const processedData: TripProfitData[] = (data || []).map((trip: any) => {
        const rate = Number(trip.RATE) || 0;
        const fuel = Number(trip.FUEL) || 0;
        const mileage = Number(trip.MILEAGE) || 0;
        const salary = Number(trip.SALARY) || 0;
        const maintenanceCost = (trip.maintenance || []).reduce((sum: number, m: any) => sum + (Number(m.cost) || 0), 0);
        
        const totalCosts = fuel + mileage + salary + maintenanceCost;
        const profit = rate - totalCosts;
        const profitMargin = rate > 0 ? (profit / rate) * 100 : 0;

        return {
          id: trip.id,
          origin: trip.origin,
          destination: trip.destination,
          scheduled_date: trip.scheduled_date,
          rate,
          fuel,
          mileage,
          salary,
          maintenance_cost: maintenanceCost,
          profit,
          profit_margin: profitMargin,
          customer_name: trip.customers?.name || 'Unknown',
          truck_plate: trip.trucks?.plate_number || 'Unknown',
          driver_name: trip.profiles?.name || 'Unassigned'
        };
      });

      setTripProfits(processedData);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Failed to fetch trip profit data');
    }
  };

  const fetchTruckMaintenanceData = async () => {
    try {
      let query = supabase
        .from('trucks')
        .select(`
          id,
          plate_number,
          model,
          maintenance(cost, maintenance_date)
        `);

      if (selectedTruck && selectedTruck !== "all") {
        query = query.eq('id', selectedTruck);
      }

      const { data, error } = await query.order('plate_number');

      if (error) {
        console.error('Error fetching truck maintenance data:', error);
        toast.error('Failed to fetch truck maintenance data');
        return;
      }

      const processedData: TruckMaintenanceData[] = (data || []).map((truck: any) => {
        let maintenanceRecords = truck.maintenance || [];

        // Filter by date range if specified
        if (dateRange.from || dateRange.to) {
          maintenanceRecords = maintenanceRecords.filter((m: any) => {
            const maintenanceDate = new Date(m.maintenance_date);
            const fromDate = dateRange.from ? new Date(dateRange.from) : new Date('1900-01-01');
            const toDate = dateRange.to ? new Date(dateRange.to) : new Date('2100-12-31');
            return maintenanceDate >= fromDate && maintenanceDate <= toDate;
          });
        }

        const totalMaintenanceCost = maintenanceRecords.reduce((sum: number, m: any) => sum + (Number(m.cost) || 0), 0);
        const maintenanceCount = maintenanceRecords.length;
        const avgMaintenanceCost = maintenanceCount > 0 ? totalMaintenanceCost / maintenanceCount : 0;
        
        // Get the most recent maintenance date
        const lastMaintenanceDate = maintenanceRecords.length > 0 
          ? maintenanceRecords.sort((a: any, b: any) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime())[0].maintenance_date
          : null;

        return {
          id: truck.id,
          plate_number: truck.plate_number,
          model: truck.model,
          total_maintenance_cost: totalMaintenanceCost,
          maintenance_count: maintenanceCount,
          avg_maintenance_cost: avgMaintenanceCost,
          last_maintenance_date: lastMaintenanceDate || 'Never'
        };
      });

      setTruckMaintenance(processedData);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Failed to fetch truck maintenance data');
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const getProfitBadgeVariant = (profit: number) => {
    if (profit > 0) return "default";
    if (profit < 0) return "destructive";
    return "secondary";
  };

  const getTotalProfit = () => {
    return tripProfits.reduce((sum, trip) => sum + trip.profit, 0);
  };

  const getAverageProfit = () => {
    return tripProfits.length > 0 ? getTotalProfit() / tripProfits.length : 0;
  };

  const getTotalMaintenanceCost = () => {
    return truckMaintenance.reduce((sum, truck) => sum + truck.total_maintenance_cost, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Reports</h1>
          <p className="text-muted-foreground">Analyze maintenance costs and trip profitability</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${getTotalProfit().toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit/Trip</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAverageProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${getAverageProfit().toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalMaintenanceCost().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trips Analyzed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripProfits.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Truck Filter</label>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
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

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateRange({});
                  setSelectedTruck('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Type Tabs */}
      <div className="flex space-x-4">
        <Button 
          variant={activeTab === 'profits' ? 'default' : 'outline'}
          onClick={() => setActiveTab('profits')}
        >
          Trip Profits Analysis
        </Button>
        <Button 
          variant={activeTab === 'maintenance' ? 'default' : 'outline'}
          onClick={() => setActiveTab('maintenance')}
        >
          Truck Maintenance Summary
        </Button>
      </div>

      {/* Trip Profits Report */}
      {activeTab === 'profits' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Trip Profitability Report</CardTitle>
                <CardDescription>
                  Profit analysis including maintenance costs for each trip
                </CardDescription>
              </div>
              <Button 
                onClick={() => exportToCSV(tripProfits, `trip-profits-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                disabled={tripProfits.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Maintenance</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripProfits.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          {format(new Date(trip.scheduled_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {trip.origin} → {trip.destination}
                          </div>
                        </TableCell>
                        <TableCell>{trip.customer_name}</TableCell>
                        <TableCell>{trip.truck_plate}</TableCell>
                        <TableCell>{trip.driver_name}</TableCell>
                        <TableCell>${trip.rate.toFixed(2)}</TableCell>
                        <TableCell>${trip.fuel.toFixed(2)}</TableCell>
                        <TableCell>${trip.mileage.toFixed(2)}</TableCell>
                        <TableCell>${trip.salary.toFixed(2)}</TableCell>
                        <TableCell>${trip.maintenance_cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getProfitBadgeVariant(trip.profit)}>
                            {trip.profit > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            ${trip.profit.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={trip.profit_margin > 0 ? 'text-green-600' : 'text-red-600'}>
                            {trip.profit_margin.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tripProfits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                          No trip data found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Truck Maintenance Report */}
      {activeTab === 'maintenance' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Truck Maintenance Report</CardTitle>
                <CardDescription>
                  Total maintenance costs and statistics per truck
                </CardDescription>
              </div>
              <Button 
                onClick={() => exportToCSV(truckMaintenance, `truck-maintenance-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                disabled={truckMaintenance.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Truck</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Total Maintenance Cost</TableHead>
                      <TableHead>Maintenance Count</TableHead>
                      <TableHead>Average Cost</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {truckMaintenance.map((truck) => (
                      <TableRow key={truck.id}>
                        <TableCell className="font-medium">{truck.plate_number}</TableCell>
                        <TableCell>{truck.model}</TableCell>
                        <TableCell className="font-semibold">
                          ${truck.total_maintenance_cost.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{truck.maintenance_count}</Badge>
                        </TableCell>
                        <TableCell>${truck.avg_maintenance_cost.toFixed(2)}</TableCell>
                        <TableCell>
                          {truck.last_maintenance_date !== 'Never' 
                            ? format(new Date(truck.last_maintenance_date), 'MMM dd, yyyy')
                            : 'Never'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                    {truckMaintenance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No maintenance data found for the selected criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}