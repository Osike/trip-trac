import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Calendar, User, Truck } from "lucide-react";
import { useState } from "react";

export const TripsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const trips = [
    { 
      id: "TRP-001", 
      customer: "ABC Corporation", 
      origin: "New York, NY", 
      destination: "Los Angeles, CA",
      driver: "John Smith",
      truck: "ABC-123",
      scheduledDate: "2024-02-25",
      status: "Completed",
      distance: "2,800 miles"
    },
    { 
      id: "TRP-002", 
      customer: "XYZ Limited", 
      origin: "Chicago, IL", 
      destination: "Miami, FL",
      driver: "Sarah Johnson",
      truck: "XYZ-456",
      scheduledDate: "2024-02-26",
      status: "In Progress",
      distance: "1,200 miles"
    },
    { 
      id: "TRP-003", 
      customer: "Tech Solutions Inc", 
      origin: "San Francisco, CA", 
      destination: "Seattle, WA",
      driver: "Mike Davis",
      truck: "DEF-789",
      scheduledDate: "2024-02-27",
      status: "Scheduled",
      distance: "800 miles"
    },
    { 
      id: "TRP-004", 
      customer: "Global Enterprises", 
      origin: "Houston, TX", 
      destination: "Denver, CO",
      driver: "Lisa Wilson",
      truck: "JKL-345",
      scheduledDate: "2024-02-28",
      status: "Scheduled",
      distance: "900 miles"
    },
    { 
      id: "TRP-005", 
      customer: "Prime Industries", 
      origin: "Boston, MA", 
      destination: "Atlanta, GA",
      driver: "Tom Brown",
      truck: "GHI-012",
      scheduledDate: "2024-02-24",
      status: "Completed",
      distance: "1,100 miles"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'destructive';
      case 'Scheduled': return 'secondary';
      case 'Cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trip Management</h1>
          <p className="text-muted-foreground">Plan, track and manage all transportation activities</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Trip
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              All Trips ({filteredTrips.length})
            </span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrips.map((trip, index) => (
              <Card 
                key={trip.id} 
                className="shadow-card hover:shadow-elegant transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{trip.id}</h3>
                        <p className="text-sm text-muted-foreground">{trip.customer}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(trip.status) as any}>
                      {trip.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">From:</span>
                        <span className="ml-2 font-medium">{trip.origin}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">To:</span>
                        <span className="ml-2 font-medium">{trip.destination}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 font-medium">{trip.scheduledDate}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Driver:</span>
                        <span className="ml-2 font-medium">{trip.driver}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Truck:</span>
                        <span className="ml-2 font-medium">{trip.truck}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="ml-2 font-medium">{trip.distance}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    {trip.status === 'Scheduled' && (
                      <Button variant="outline" size="sm">
                        Start Trip
                      </Button>
                    )}
                    {trip.status === 'In Progress' && (
                      <Button variant="outline" size="sm">
                        Complete Trip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};