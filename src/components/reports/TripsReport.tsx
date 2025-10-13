import React from "react";
import { ReportsTemplate } from "./ReportsTemplate";

export const TripsReport = () => {
  // Define columns for trips report - matching database schema
  const columns = [
    { key: "id", label: "Trip ID" },
    { key: "customer", label: "Customer" },
    { key: "origin", label: "Origin" },
    { key: "destination", label: "Destination" },
    { key: "driver", label: "Driver" },
    { key: "truck", label: "Truck" },
    { key: "scheduled_date", label: "Scheduled Date" },
    { key: "status", label: "Status" },
    { key: "distance", label: "Distance" },
    { key: "duration", label: "Duration" },
    { key: "rate", label: "Rate ($)" },
    { key: "profit", label: "Profit ($)" }
  ];

  // Define filter options
  const filterOptions = [
    {
      label: "Status",
      key: "status",
      options: [
        { label: "Scheduled", value: "scheduled" },
        { label: "Ongoing", value: "ongoing" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" }
      ]
    },
    {
      label: "Vehicle Plate Number",
      key: "vehicle_plate",
      type: "truck_select" // Special type to load trucks dynamically
    }
  ];

  return (
    <ReportsTemplate
      title="Trips Report"
      description="Generate and analyze reports of all transportation trips"
      reportType="trips"
      columns={columns}
      filterOptions={filterOptions}
    />
  );
};
