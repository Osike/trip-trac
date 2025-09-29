import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Truck, MapPin, Building2, TrendingUp, ChevronDown, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalTrips: number;
  activeTrips: number;
  totalTrucks: number;
  activeTrucks: number;
  totalCustomers: number;
  totalUsers: number;
  totalDrivers: number;
}

interface RecentTrip {
  id: string;
  customer: string;
  status: string;
  driver: string;
  destination: string;
}

export const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    activeTrips: 0,
    totalTrucks: 0,
    activeTrucks: 0,
    totalCustomers: 0,
    totalUsers: 0,
    totalDrivers: 0
  });
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, status');
      
      if (tripsError) throw tripsError;
      
      // Fetch active trucks
      const { data: trucksData, error: trucksError } = await supabase
        .from('trucks')
        .select('id, status');
      
      if (trucksError) throw trucksError;
      
      // Fetch customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });
      
      if (customersError) throw customersError;
      
      // Fetch users/drivers
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, role');
      
      if (usersError) throw usersError;
      
      // Fetch recent trips
      const { data: recentTripsData, error: recentTripsError } = await supabase
        .from('trips')
        .select(`
          id,
          customers (name),
          profiles (name),
          destination,
          status
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentTripsError) throw recentTripsError;
      
      // Process the data
      const activeTrips = tripsData.filter(trip => 
        trip.status === 'ongoing' || trip.status === 'scheduled'
      ).length;
      
      const activeTrucks = trucksData.filter(truck => 
        truck.status !== 'inactive' && truck.status !== 'maintenance'
      ).length;
      
      const drivers = usersData.filter(user => 
        user.role === 'driver'
      ).length;
      
      // Format recent trips
      const formattedRecentTrips = recentTripsData.map(trip => ({
        id: trip.id,
        customer: trip.customers?.name || 'Unknown Customer',
        status: formatStatus(trip.status),
        driver: trip.profiles?.name || 'Unassigned',
        destination: trip.destination
      }));
      
      // Update state
      setStats({
        totalTrips: tripsData.length,
        activeTrips,
        totalTrucks: trucksData.length,
        activeTrucks,
        totalCustomers: customersCount || 0,
        totalUsers: usersData.length,
        totalDrivers: drivers
      });
      
      setRecentTrips(formattedRecentTrips);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-success';
      case 'Ongoing': return 'text-warning';
      case 'In Progress': return 'text-warning'; // Fallback for display name
      case 'Scheduled': return 'text-primary';
      case 'Cancelled': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const handleReportGeneration = async (reportType: string) => {
    try {
      toast.loading(`Generating ${reportType.toLowerCase()} report...`);
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      let functionName = '';
      switch (reportType) {
        case 'Trips':
          functionName = 'generate-trips-report';
          break;
        case 'Trucks':
          functionName = 'generate-trucks-report';
          break;
        case 'Customers':
          functionName = 'generate-customers-report';
          break;
        default:
          toast.error('Invalid report type selected');
          return;
      }

      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) {
        console.error('Error generating report:', error);
        toast.error('Failed to generate report');
        return;
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`${reportType} report generated successfully!`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-lg text-muted-foreground">Your logistics command center</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 shadow-lg transition-all duration-300 font-medium px-6 py-3">
                <FileText className="h-4 w-4 mr-2" />
                Quick Reports
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md border border-border/50 shadow-xl z-50 rounded-lg">
              <DropdownMenuItem 
                onClick={() => handleReportGeneration('Trips')}
                className="cursor-pointer hover:bg-secondary/80 transition-colors duration-200 px-4 py-3 rounded-md mx-1 first:mt-1 last:mb-1"
              >
                <MapPin className="h-4 w-4 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Trips Report</p>
                  <p className="text-xs text-muted-foreground">Export trip data</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleReportGeneration('Trucks')}
                className="cursor-pointer hover:bg-secondary/80 transition-colors duration-200 px-4 py-3 rounded-md mx-1"
              >
                <Truck className="h-4 w-4 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Trucks Report</p>
                  <p className="text-xs text-muted-foreground">Fleet analytics</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleReportGeneration('Customers')}
                className="cursor-pointer hover:bg-secondary/80 transition-colors duration-200 px-4 py-3 rounded-md mx-1"
              >
                <Building2 className="h-4 w-4 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Customers Report</p>
                  <p className="text-xs text-muted-foreground">Client data export</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="shadow-lg bg-card/80 backdrop-blur-sm animate-pulse border-border/50">
                <CardContent className="p-6 h-32"></CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Total Trips"
                value={stats.totalTrips.toString()}
                change={`${stats.activeTrips} active trips`}
                changeType="positive"
                icon={MapPin}
                className="animate-fade-in shadow-lg bg-card/80 backdrop-blur-sm border-border/50"
                style={{ animationDelay: `0ms` }}
              />
              <StatsCard
                title="Trucks"
                value={stats.totalTrucks.toString()}
                change={`${stats.activeTrucks} active trucks`}
                changeType="positive"
                icon={Truck}
                className="animate-fade-in shadow-lg bg-card/80 backdrop-blur-sm border-border/50"
                style={{ animationDelay: `100ms` }}
              />
              <StatsCard
                title="Customers"
                value={stats.totalCustomers.toString()}
                change="Track customer activity"
                changeType="neutral"
                icon={Building2}
                className="animate-fade-in shadow-lg bg-card/80 backdrop-blur-sm border-border/50"
                style={{ animationDelay: `200ms` }}
              />
              <StatsCard
                title="Team Members"
                value={stats.totalUsers.toString()}
                change={`${stats.totalDrivers} drivers`}
                changeType="positive"
                icon={Users}
                className="animate-fade-in shadow-lg bg-card/80 backdrop-blur-sm border-border/50"
                style={{ animationDelay: `300ms` }}
              />
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <TrendingUp className="h-5 w-5 mr-3 text-primary" />
                Recent Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse"></div>
                  ))}
                </div>
              ) : recentTrips.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">No recent trips found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">New trips will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTrips.map((trip, idx) => (
                    <div 
                      key={trip.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 border border-border/30 animate-fade-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-sm text-primary">#{trip.id.slice(0, 8)}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(trip.status)} bg-current/10`}>
                            {trip.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{trip.customer} → {trip.destination}</p>
                        <p className="text-xs text-muted-foreground">Driver: {trip.driver}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Truck className="h-5 w-5 mr-3 text-primary" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-success/10 to-success/5">
                  <span className="text-sm font-semibold text-foreground">Active Trucks</span>
                  <span className="text-2xl font-bold text-success">{loading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : stats.activeTrucks}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-warning/10 to-warning/5">
                  <span className="text-sm font-semibold text-foreground">In Maintenance</span>
                  <span className="text-2xl font-bold text-warning">{loading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : (stats.totalTrucks - stats.activeTrucks)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                  <span className="text-sm font-semibold text-foreground">Total Fleet</span>
                  <span className="text-2xl font-bold text-primary">{loading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : stats.totalTrucks}</span>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Fleet Utilization</span>
                    <span className="text-sm font-bold text-primary">
                      {loading || stats.totalTrucks === 0
                        ? '--'
                        : `${Math.round((stats.activeTrucks / stats.totalTrucks) * 100)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-primary h-3 rounded-full transition-all duration-1000 ease-out shadow-glow"
                      style={{ width: loading || stats.totalTrucks === 0 ? '0%' : `${Math.round((stats.activeTrucks / stats.totalTrucks) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};