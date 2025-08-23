import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Truck, MapPin, Building2, TrendingUp, Plus } from "lucide-react";

export const DashboardOverview = () => {
  const stats = [
    {
      title: "Total Trips",
      value: "1,284",
      change: "+20.1% from last month",
      changeType: 'positive' as const,
      icon: MapPin
    },
    {
      title: "Active Trucks",
      value: "42",
      change: "+2 new this week",
      changeType: 'positive' as const,
      icon: Truck
    },
    {
      title: "Customers",
      value: "186",
      change: "+12 this month",
      changeType: 'positive' as const,
      icon: Building2
    },
    {
      title: "Users",
      value: "28",
      change: "+3 new drivers",
      changeType: 'positive' as const,
      icon: Users
    }
  ];

  const recentTrips = [
    { id: "TRP-001", customer: "ABC Corp", status: "Completed", driver: "John Smith", destination: "Los Angeles" },
    { id: "TRP-002", customer: "XYZ Ltd", status: "In Progress", driver: "Sarah Jones", destination: "Chicago" },
    { id: "TRP-003", customer: "Tech Solutions", status: "Scheduled", driver: "Mike Davis", destination: "Houston" },
    { id: "TRP-004", customer: "Global Inc", status: "Completed", driver: "Lisa Wilson", destination: "Miami" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-success';
      case 'In Progress': return 'text-warning';
      case 'Scheduled': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your logistics command center</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Quick Actions
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            {...stat}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Recent Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{trip.id}</span>
                      <span className={`text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{trip.customer} → {trip.destination}</p>
                    <p className="text-xs text-muted-foreground">Driver: {trip.driver}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Trucks</span>
                <span className="text-lg font-bold text-success">38</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Maintenance</span>
                <span className="text-lg font-bold text-warning">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available</span>
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <div className="pt-4">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">90% fleet utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};