import React from "react";
import { ReportsTemplate } from "./ReportsTemplate";

export const TripsReport = () => {
  // Define columns for trips report
  const columns = [
    { key: "id", label: "Trip ID" },
    { key: "customer", label: "Customer" },
    { key: "origin", label: "Origin" },
    { key: "destination", label: "Destination" },
    { key: "driver", label: "Driver" },
    { key: "truck", label: "Truck" },
    { key: "scheduled_date", label: "Scheduled Date" },
    { key: "status", label: "Status" },
    { key: "distance", label: "Distance (miles)" },
    { key: "cost", label: "Cost ($)" },
    { key: "duration", label: "Duration (hours)" }
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
      label: "Distance Range",
      key: "distance_range",
      options: [
        { label: "Short (<100 miles)", value: "short" },
        { label: "Medium (100-500 miles)", value: "medium" },
        { label: "Long (>500 miles)", value: "long" }
      ]
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
