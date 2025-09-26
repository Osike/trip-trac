import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, User, Truck, DollarSign, Route, Clock } from "lucide-react";

interface TripDetailsProps {
  trip: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TripDetails = ({ trip, open, onOpenChange }: TripDetailsProps) => {
  if (!trip) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'ongoing': return 'secondary';
      case 'in progress': return 'secondary';
      case 'scheduled': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Trip Details - {trip.id}</span>
            <Badge variant={getStatusBadgeVariant(trip.status)}>
              {trip.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Trip Overview */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Trip Overview
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-20">Customer:</span>
                    <span className="font-medium">{trip.customer}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground w-16">From:</span>
                    <span className="font-medium">{trip.origin}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground w-16">To:</span>
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Date:</span>
                    <span className="font-medium">{trip.scheduledDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Route className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Distance:</span>
                    <span className="font-medium">{trip.distance}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personnel & Equipment */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Personnel & Equipment
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground w-16">Driver:</span>
                  <span className="font-medium">{trip.driver}</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground w-16">Truck:</span>
                  <span className="font-medium">{trip.truck}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          {(trip.RATE || trip.FUEL || trip.MILEAGE || trip["ROAD TOLLS"] || trip.duration) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  Trip Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {trip.RATE && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground w-16">Rate:</span>
                      <span className="font-medium">${trip.RATE}</span>
                    </div>
                  )}
                  {trip.FUEL && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground w-20">Fuel Cost:</span>
                      <span className="font-medium">${trip.FUEL}</span>
                    </div>
                  )}
                  {trip.MILEAGE && (
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-16">Mileage:</span>
                      <span className="font-medium">{trip.MILEAGE}</span>
                    </div>
                  )}
                  {trip["ROAD TOLLS"] && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground w-20">Road Tolls:</span>
                      <span className="font-medium">${trip["ROAD TOLLS"]}</span>
                    </div>
                  )}
                  {trip.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground w-20">Duration:</span>
                      <span className="font-medium">{trip.duration} hours</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};