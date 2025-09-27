import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

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

  const addMaintenanceItem = () => {
    if (!newItem.description.trim() || !newItem.cost.trim()) {
      toast.error('Please fill in both description and cost');
      return;
    }

    const costValue = parseFloat(newItem.cost);
    if (isNaN(costValue) || costValue < 0) {
      toast.error('Please enter a valid cost amount');
      return;
    }

    const item: MaintenanceItem = {
      id: Date.now().toString(),
      description: newItem.description.trim(),
      cost: costValue
    };

    onMaintenanceChange([...maintenanceItems, item]);
    setNewItem({ description: '', cost: '' });
    toast.success('Maintenance item added');
  };

  const removeMaintenanceItem = (id: string) => {
    onMaintenanceChange(maintenanceItems.filter(item => item.id !== id));
    toast.success('Maintenance item removed');
  };

  const updateMaintenanceItem = (id: string, field: 'description' | 'cost', value: string) => {
    const updatedItems = maintenanceItems.map(item => {
      if (item.id === id) {
        if (field === 'cost') {
          const costValue = parseFloat(value);
          if (isNaN(costValue) || costValue < 0) {
            toast.error('Please enter a valid cost amount');
            return item;
          }
          return { ...item, cost: costValue };
        } else {
          return { ...item, [field]: value };
        }
      }
      return item;
    });
    onMaintenanceChange(updatedItems);
  };

  const getTotalCost = () => {
    return maintenanceItems.reduce((total, item) => total + item.cost, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Maintenance Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new maintenance item */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-secondary/20">
          <div className="space-y-2">
            <Label htmlFor="maintenance-desc">Description</Label>
            <Textarea
              id="maintenance-desc"
              placeholder="Describe maintenance work"
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-cost">Cost ($)</Label>
            <Input
              id="maintenance-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newItem.cost}
              onChange={(e) => setNewItem(prev => ({ ...prev, cost: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addMaintenanceItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* List of maintenance items */}
        {maintenanceItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Maintenance Items ({maintenanceItems.length})</Label>
              <div className="text-lg font-bold text-primary">
                Total: ${getTotalCost().toFixed(2)}
              </div>
            </div>
            
            <div className="space-y-3">
              {maintenanceItems.map((item, index) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateMaintenanceItem(item.id, 'description', e.target.value)}
                          placeholder="Maintenance description"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Cost ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost}
                          onChange={(e) => updateMaintenanceItem(item.id, 'cost', e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaintenanceItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {maintenanceItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No maintenance items added yet</p>
            <p className="text-sm">Use the form above to add maintenance expenses</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}