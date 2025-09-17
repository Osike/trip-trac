import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, DollarSign, TrendingUp, Truck, Users } from "lucide-react";

interface TripStats {
  totalTrips: number;
  completedTrips: number;
  ongoingTrips: number;
  scheduledTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  totalDistance: number;
  avgTripCost: number;
}

export const TripStatistics = () => {
  const [stats, setStats] = useState<TripStats>({
    totalTrips: 0,
    completedTrips: 0,
    ongoingTrips: 0,
    scheduledTrips: 0,
    cancelledTrips: 0,
    totalRevenue: 0,
    totalDistance: 0,
    avgTripCost: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripStatistics();
  }, []);

  const fetchTripStatistics = async () => {
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('status, cost, distance');

      if (error) {
        console.error('Error fetching trip statistics:', error);
        return;
      }

      const totalTrips = trips?.length || 0;
      const completedTrips = trips?.filter(trip => trip.status === 'completed').length || 0;
      const ongoingTrips = trips?.filter(trip => trip.status === 'ongoing').length || 0;
      const scheduledTrips = trips?.filter(trip => trip.status === 'scheduled').length || 0;
      const cancelledTrips = trips?.filter(trip => trip.status === 'cancelled').length || 0;

      const totalRevenue = trips?.reduce((sum, trip) => sum + (trip.cost || 0), 0) || 0;
      const totalDistance = trips?.reduce((sum, trip) => sum + (trip.distance || 0), 0) || 0;
      const avgTripCost = totalTrips > 0 ? totalRevenue / totalTrips : 0;

      setStats({
        totalTrips,
        completedTrips,
        ongoingTrips,
        scheduledTrips,
        cancelledTrips,
        totalRevenue,
        totalDistance,
        avgTripCost
      });
    } catch (error) {
      console.error('Error calculating trip statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Trips",
      value: stats.totalTrips,
      icon: MapPin,
      color: "text-blue-500"
    },
    {
      title: "Completed",
      value: stats.completedTrips,
      icon: Calendar,
      color: "text-green-500"
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500"
    },
    {
      title: "Avg Trip Cost",
      value: `$${stats.avgTripCost.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2 text-primary" />
            Trip Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">Scheduled</Badge>
              <p className="text-2xl font-bold">{stats.scheduledTrips}</p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">Ongoing</Badge>
              <p className="text-2xl font-bold">{stats.ongoingTrips}</p>
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2">Completed</Badge>
              <p className="text-2xl font-bold">{stats.completedTrips}</p>
            </div>
            <div className="text-center">
              <Badge variant="destructive" className="mb-2">Cancelled</Badge>
              <p className="text-2xl font-bold">{stats.cancelledTrips}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Total Distance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalDistance.toLocaleString()}</p>
            <p className="text-muted-foreground">miles covered</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.totalTrips > 0 ? ((stats.completedTrips / stats.totalTrips) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-muted-foreground">trips completed successfully</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};