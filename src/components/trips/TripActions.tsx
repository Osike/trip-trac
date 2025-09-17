import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Play, Square, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TripActionsProps {
  trip: any;
  onViewDetails: (trip: any) => void;
  onEdit: (trip: any) => void;
  onStatusUpdate: () => void;
}

export const TripActions = ({ trip, onViewDetails, onEdit, onStatusUpdate }: TripActionsProps) => {
  const handleStatusChange = async (newStatus: 'scheduled' | 'ongoing' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id);

      if (error) {
        toast.error('Failed to update trip status');
        console.error('Error:', error);
        return;
      }

      toast.success(`Trip status updated to ${newStatus}`);
      onStatusUpdate();
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    }
  };

  const canStartTrip = trip.status?.toLowerCase() === 'scheduled';
  const canCompleteTrip = trip.status?.toLowerCase() === 'ongoing' || trip.status?.toLowerCase() === 'in progress';
  const canCancelTrip = trip.status?.toLowerCase() !== 'completed' && trip.status?.toLowerCase() !== 'cancelled';

  return (
    <div className="flex space-x-2">
      {/* Quick Action Buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewDetails(trip)}
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(trip)}
      >
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>

      {/* Status Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canStartTrip && (
            <DropdownMenuItem onClick={() => handleStatusChange('ongoing')}>
              <Play className="h-4 w-4 mr-2" />
              Start Trip
            </DropdownMenuItem>
          )}
          
          {canCompleteTrip && (
            <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Trip
            </DropdownMenuItem>
          )}
          
          {trip.status?.toLowerCase() === 'ongoing' && (
            <DropdownMenuItem onClick={() => handleStatusChange('scheduled')}>
              <Square className="h-4 w-4 mr-2" />
              Pause Trip
            </DropdownMenuItem>
          )}
          
          {canCancelTrip && (
            <DropdownMenuItem 
              onClick={() => handleStatusChange('cancelled')}
              className="text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Trip
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};