import React from "react";
import { ReportsTemplate } from "./ReportsTemplate";

export const CustomersReport = () => {
  // Define columns for customers report
  const columns = [
    { key: "id", label: "Customer ID" },
    { key: "name", label: "Name" },
    { key: "contact_person", label: "Contact Person" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "total_trips", label: "Total Trips" },
    { key: "total_revenue", label: "Total Revenue ($)" },
    { key: "avg_trip_distance", label: "Avg. Trip Distance (miles)" },
    { key: "created_at", label: "Customer Since" }
  ];

  // Define filter options
  const filterOptions = [
    {
      label: "Revenue Range",
      key: "revenue_range",
      options: [
        { label: "Low (<$5,000)", value: "low" },
        { label: "Medium ($5,000-$20,000)", value: "medium" },
        { label: "High (>$20,000)", value: "high" }
      ]
    },
    {
      label: "Trip Count",
      key: "trip_count",
      options: [
        { label: "New (1-5 trips)", value: "new" },
        { label: "Regular (6-20 trips)", value: "regular" },
        { label: "Frequent (>20 trips)", value: "frequent" }
      ]
    }
  ];

  return (
    <ReportsTemplate
      title="Customers Report"
      description="Generate and analyze reports of all customer activity and revenue"
      reportType="customers"
      columns={columns}
      filterOptions={filterOptions}
    />
  );
};
