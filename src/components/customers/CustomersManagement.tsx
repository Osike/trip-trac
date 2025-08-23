import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

export const CustomersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const customers = [
    { 
      id: 1, 
      name: "ABC Corporation", 
      contactPerson: "Robert Johnson", 
      email: "contact@abccorp.com", 
      phone: "+1-555-0101", 
      address: "123 Business Ave, New York, NY",
      tripsCount: 45,
      status: "Active"
    },
    { 
      id: 2, 
      name: "XYZ Limited", 
      contactPerson: "Maria Garcia", 
      email: "info@xyzltd.com", 
      phone: "+1-555-0102", 
      address: "456 Commerce St, Los Angeles, CA",
      tripsCount: 32,
      status: "Active"
    },
    { 
      id: 3, 
      name: "Tech Solutions Inc", 
      contactPerson: "David Chen", 
      email: "support@techsol.com", 
      phone: "+1-555-0103", 
      address: "789 Innovation Dr, San Francisco, CA",
      tripsCount: 28,
      status: "Active"
    },
    { 
      id: 4, 
      name: "Global Enterprises", 
      contactPerson: "Emma Williams", 
      email: "contact@globalent.com", 
      phone: "+1-555-0104", 
      address: "321 Corporate Blvd, Chicago, IL",
      tripsCount: 15,
      status: "Inactive"
    },
    { 
      id: 5, 
      name: "Prime Industries", 
      contactPerson: "James Smith", 
      email: "hello@primeind.com", 
      phone: "+1-555-0105", 
      address: "654 Industrial Way, Houston, TX",
      tripsCount: 52,
      status: "Active"
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Manage your client relationships and accounts</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              All Customers ({filteredCustomers.length})
            </span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer, index) => (
              <Card 
                key={customer.id} 
                className="shadow-card hover:shadow-elegant transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <Badge variant={customer.status === 'Active' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {customer.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {customer.phone}
                    </div>
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contact Person:</span>
                      <span className="font-medium">{customer.contactPerson}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Total Trips:</span>
                      <span className="font-bold text-primary">{customer.tripsCount}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Trips
                    </Button>
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