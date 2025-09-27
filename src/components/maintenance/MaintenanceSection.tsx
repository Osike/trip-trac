import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceItem {
  id: string;
  description: string;
  cost: number;
}

interface MaintenanceSectionProps {
  maintenanceItems: MaintenanceItem[];
  onMaintenanceChange: (items: MaintenanceItem[]) => void;
  tripId?: string;
}

export default function MaintenanceSection({ 
  maintenanceItems, 
  onMaintenanceChange,
  tripId 
}: MaintenanceSectionProps) {
  const [newItem, setNewItem] = useState({ description: '', cost: '' });
  const { toast } = useToast();

  const addMaintenanceItem = () => {
    if (!newItem.description || !newItem.cost) {
      toast({
        title: "Error",
        description: "Please fill in both description and cost",
        variant: "destructive",
      });
      return;
    }

    const item: MaintenanceItem = {
      id: Date.now().toString(),
      description: newItem.description,
      cost: parseFloat(newItem.cost)
    };

    onMaintenanceChange([...maintenanceItems, item]);
    setNewItem({ description: '', cost: '' });
  };

  const removeMaintenanceItem = (id: string) => {
    onMaintenanceChange(maintenanceItems.filter(item => item.id !== id));
  };

  const getTotalCost = () => {
    return maintenanceItems.reduce((total, item) => total + item.cost, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new maintenance item */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maintenance-desc">Description</Label>
            <Textarea
              id="maintenance-desc"
              placeholder="Describe maintenance work"
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-cost">Cost</Label>
            <div className="flex gap-2">
              <Input
                id="maintenance-cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newItem.cost}
                onChange={(e) => setNewItem(prev => ({ ...prev, cost: e.target.value }))}
              />
              <Button onClick={addMaintenanceItem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* List of maintenance items */}
        {maintenanceItems.length > 0 && (
          <div className="space-y-2">
            <Label>Maintenance Items</Label>
            <div className="space-y-2">
              {maintenanceItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">${item.cost.toFixed(2)}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaintenanceItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                Total Maintenance: ${getTotalCost().toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}