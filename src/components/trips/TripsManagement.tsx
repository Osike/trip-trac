import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Plus, Search, MapPin, Calendar, User, Truck } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const TripsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    origin: "",
    destination: "",
    driver_id: "",
    truck_id: "",
    scheduled_date: "",
    distance: "",
    cost: "",
    rate_usd: "",
    driver_pay: "",
    mileage: "",
    road_tolls: "",
    comments: "",
    photo: null,
  });
  const [maintenanceRows, setMaintenanceRows] = useState([{ item: "", cost: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trips = [
    { id: "TRP-001", customer: "ABC Corporation", origin: "New York, NY", destination: "Los Angeles, CA", driver: "John Smith", truck: "ABC-123", scheduledDate: "2024-02-25", status: "Completed", distance: "2,800 miles" },
    { id: "TRP-002", customer: "XYZ Ltd", origin: "Chicago, IL", destination: "Houston, TX", driver: "Sarah Lee", truck: "XYZ-456", scheduledDate: "2024-03-01", status: "Scheduled", distance: "1,080 miles" }
  ];

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "photo" && files) {
      setForm((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMaintenanceChange = (idx: number, field: string, value: string) => {
    setMaintenanceRows((rows) => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const addMaintenanceRow = () => setMaintenanceRows((rows) => [...rows, { item: "", cost: "" }]);
  const removeMaintenanceRow = (idx: number) => setMaintenanceRows((rows) => rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6 p-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Management</h1>
            <p className="text-muted-foreground">Plan, track and manage all transportation activities</p>
          </div>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Trip
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Trip</DialogTitle>
            <DialogDescription>
              Fill in the details below to schedule a new trip for your logistics operation.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <Input name="customer_id" placeholder="Customer ID" value={form.customer_id} onChange={handleFormChange} required />
            <Input name="origin" placeholder="Origin" value={form.origin} onChange={handleFormChange} required />
            <Input name="destination" placeholder="Destination" value={form.destination} onChange={handleFormChange} required />
            <Input name="driver_id" placeholder="Driver ID" value={form.driver_id} onChange={handleFormChange} required />
            <Input name="truck_id" placeholder="Truck ID" value={form.truck_id} onChange={handleFormChange} required />
            <Input name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleFormChange} required />
            <Input name="distance" placeholder="Distance (miles)" value={form.distance} onChange={handleFormChange} required />
            <Input name="cost" placeholder="Trip Cost" value={form.cost} onChange={handleFormChange} required />
            <Input name="rate_usd" placeholder="Rate (USD)" value={form.rate_usd} onChange={handleFormChange} required />
            <Input name="driver_pay" placeholder="Driver's Pay" value={form.driver_pay} onChange={handleFormChange} required />
            <Input name="mileage" placeholder="Mileage" value={form.mileage} onChange={handleFormChange} required />
            <Input name="road_tolls" placeholder="Road Tolls" value={form.road_tolls} onChange={handleFormChange} required />
            <Textarea name="comments" placeholder="Comments (optional)" value={form.comments} onChange={handleFormChange} />
            <div>
              <label className="block mb-1">Maintenance (table)</label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input value={row.item} onChange={e => handleMaintenanceChange(idx, "item", e.target.value)} placeholder="Maintenance Item" />
                      </TableCell>
                      <TableCell>
                        <Input value={row.cost} onChange={e => handleMaintenanceChange(idx, "cost", e.target.value)} placeholder="Cost" />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="destructive" onClick={() => removeMaintenanceRow(idx)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button type="button" onClick={addMaintenanceRow} className="mt-2"><Plus className="h-4 w-4 mr-2" />Add Row</Button>
            </div>
            <div>
              <label className="block mb-1">Photo (optional)</label>
              <Input name="photo" type="file" accept="image/*" onChange={handleFormChange} />
            </div>
            {error && <div className="text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Trip"}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              All Trips ({trips.length})
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
            {trips.filter(trip =>
              trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              trip.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
              trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
              trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((trip, index) => (
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
                    <Badge variant={trip.status === 'Completed' ? 'default' : 'secondary'}>
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


// import React, { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
// import { Plus, Search, MapPin, Calendar, User, Truck } from "lucide-react";
// import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";

// export const TripsManagement = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [open, setOpen] = useState(false);
//   const [form, setForm] = useState({
//     customer_id: "",
//     origin: "",
//     destination: "",
//     driver_id: "",
//     truck_id: "",
//     scheduled_date: "",
//     distance: "",
//     cost: "",
//     rate_usd: "",
//     driver_pay: "",
//     mileage: "",
//     road_tolls: "",
//     comments: "",
//     photo: null,
//   });
//   const [maintenanceRows, setMaintenanceRows] = useState([{ item: "", cost: "" }]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const trips = [
//     { id: "TRP-001", customer: "ABC Corporation", origin: "New York, NY", destination: "Los Angeles, CA", driver: "John Smith", truck: "ABC-123", scheduledDate: "2024-02-25", status: "Completed", distance: "2,800 miles" },
//     { id: "TRP-002", customer: "XYZ Ltd", origin: "Chicago, IL", destination: "Houston, TX", driver: "Sarah Lee", truck: "XYZ-456", scheduledDate: "2024-03-01", status: "Scheduled", distance: "1,080 miles" }
//   ];

//   const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value, files } = e.target as HTMLInputElement;
//     if (name === "photo" && files) {
//       setForm((prev) => ({ ...prev, photo: files[0] }));
//     } else {
//       setForm((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleMaintenanceChange = (idx: number, field: string, value: string) => {
//     setMaintenanceRows((rows) => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
//   };
//   const addMaintenanceRow = () => setMaintenanceRows((rows) => [...rows, { item: "", cost: "" }]);
//   const removeMaintenanceRow = (idx: number) => setMaintenanceRows((rows) => rows.filter((_, i) => i !== idx));}
