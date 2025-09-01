import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, FileText, Truck as TruckIcon, Users as UsersIcon, ClipboardList } from "lucide-react";

import { TripsReport } from "./TripsReport";
import { CustomersReport } from "./CustomersReport";
import { TrucksReport } from "./TrucksReport";
import { TruckLogReport } from "./TruckLogReport";

export const ReportsManagement = () => {
  const [activeTab, setActiveTab] = useState("trips");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports Management</h1>
        <p className="text-muted-foreground">Generate, view, and export reports for your logistics operations</p>
      </div>
      
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Tabs 
            defaultValue="trips" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-4 rounded-none">
              <TabsTrigger value="trips" className="py-3">
                <FileText className="h-4 w-4 mr-2" />
                Trips
              </TabsTrigger>
              <TabsTrigger value="customers" className="py-3">
                <UsersIcon className="h-4 w-4 mr-2" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="trucks" className="py-3">
                <TruckIcon className="h-4 w-4 mr-2" />
                Trucks
              </TabsTrigger>
              <TabsTrigger value="trucklog" className="py-3">
                <ClipboardList className="h-4 w-4 mr-2" />
                Truck Log
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="trips" className="mt-0">
              <TripsReport />
            </TabsContent>
            
            <TabsContent value="customers" className="mt-0">
              <CustomersReport />
            </TabsContent>
            
            <TabsContent value="trucks" className="mt-0">
              <TrucksReport />
            </TabsContent>
            
            <TabsContent value="trucklog" className="mt-0">
              <TruckLogReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
