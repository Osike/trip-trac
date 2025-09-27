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
    { key: "distance", label: "Distance (kilometers)" },
    { key: "rate", label: "Rate ($)" },
    { key: "duration", label: "Duration (days)" }
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
        { label: "Short (<1000 kilometers)", value: "short" },
        { label: "Medium (1000-5000 kilometers)", value: "medium" },
        { label: "Long (>5000 kilometers)", value: "long" }
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
