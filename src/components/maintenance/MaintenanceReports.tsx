import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
}

interface TruckMaintenanceData {
  id: string;
  plate_number: string;
  model: string;
  total_maintenance_cost: number;
  maintenance_count: number;
  avg_maintenance_cost: number;
}

export default function MaintenanceReports() {
  const [tripProfits, setTripProfits] = useState<TripProfitData[]>([]);
  const [truckMaintenance, setTruckMaintenance] = useState<TruckMaintenanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>({});
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [trucks, setTrucks] = useState<{ id: string; plate_number: string; model: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'profits' | 'maintenance'>('profits');

  const { toast } = useToast();

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
          maintenance(cost)
        `)
        .not('"RATE"', 'is', null);

      if (dateRange.from) {
        query = query.gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'));
      }

      if (dateRange.to) {
        query = query.lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('scheduled_date', { ascending: false });

      if (error) throw error;

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
          profit_margin: profitMargin
        };
      });

      setTripProfits(processedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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

      if (selectedTruck) {
        query = query.eq('id', selectedTruck);
      }

      const { data, error } = await query.order('plate_number');

      if (error) throw error;

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

        return {
          id: truck.id,
          plate_number: truck.plate_number,
          model: truck.model,
          total_maintenance_cost: totalMaintenanceCost,
          maintenance_count: maintenanceCount,
          avg_maintenance_cost: avgMaintenanceCost
        };
      });

      setTruckMaintenance(processedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getProfitBadgeVariant = (profit: number) => {
    if (profit > 0) return "default";
    if (profit < 0) return "destructive";
    return "secondary";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Reports</h1>
          <p className="text-muted-foreground">Analyze maintenance costs and trip profitability</p>
        </div>
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
              <label className="text-sm font-medium">Truck (for maintenance report)</label>
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

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateRange({});
                  setSelectedTruck('');
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
          Trip Profits
        </Button>
        <Button 
          variant={activeTab === 'maintenance' ? 'default' : 'outline'}
          onClick={() => setActiveTab('maintenance')}
        >
          Truck Maintenance
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
                onClick={() => exportToCSV(tripProfits, 'trip-profits.csv')}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Route</TableHead>
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
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No trip data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                onClick={() => exportToCSV(truckMaintenance, 'truck-maintenance.csv')}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Total Maintenance Cost</TableHead>
                    <TableHead>Maintenance Count</TableHead>
                    <TableHead>Average Cost</TableHead>
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
                      <TableCell>{truck.maintenance_count}</TableCell>
                      <TableCell>${truck.avg_maintenance_cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {truckMaintenance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No maintenance data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}