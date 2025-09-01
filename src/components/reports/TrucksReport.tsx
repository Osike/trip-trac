import React from "react";
import { ReportsTemplate } from "./ReportsTemplate";

export const TrucksReport = () => {
  // Define columns for trucks report
  const columns = [
    { key: "id", label: "Truck ID" },
    { key: "plate_number", label: "Plate Number" },
    { key: "model", label: "Model" },
    { key: "capacity", label: "Capacity" },
    { key: "assigned_driver", label: "Assigned Driver" },
    { key: "status", label: "Status" },
    { key: "total_trips", label: "Total Trips" },
    { key: "total_distance", label: "Total Distance (miles)" },
    { key: "maintenance_costs", label: "Maintenance Costs ($)" },
    { key: "revenue_generated", label: "Revenue Generated ($)" },
    { key: "utilization_rate", label: "Utilization Rate (%)" }
  ];

  // Define filter options
  const filterOptions = [
    {
      label: "Status",
      key: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "In Maintenance", value: "maintenance" },
        { label: "Out of Service", value: "out_of_service" }
      ]
    },
    {
      label: "Utilization",
      key: "utilization",
      options: [
        { label: "Low (<30%)", value: "low" },
        { label: "Medium (30-70%)", value: "medium" },
        { label: "High (>70%)", value: "high" }
      ]
    }
  ];

  return (
    <ReportsTemplate
      title="Trucks Report"
      description="Generate and analyze reports of all truck activity, maintenance, and performance"
      reportType="trucks"
      columns={columns}
      filterOptions={filterOptions}
    />
  );
};
