import React from "react";
import { ReportsTemplate } from "./ReportsTemplate";

export const TruckLogReport = () => {
  // Define columns for truck log report matching the image format
  const columns = [
    { key: "driver_name", label: "Driver Name" },
    { key: "company", label: "Company" },
    { key: "week", label: "Week" },
    { key: "truck_number", label: "Truck Number" },
    { key: "starting_odometer", label: "Starting Odometer Reading" },
    { key: "ending_odometer", label: "Ending Odometer Reading" },
    { key: "total_distance", label: "Total Distance" },
  ];

  // Trip record columns
  const tripColumns = [
    { key: "date", label: "Date" },
    { key: "trailer", label: "Trailer" },
    { key: "origin", label: "Origin City" },
    { key: "destination", label: "Destination City" },
    { key: "miles", label: "Miles" },
    { key: "rate", label: "Rate" },
  ];

  // Fuel purchase columns
  const fuelColumns = [
    { key: "date", label: "Date" },
    { key: "odometer", label: "Odometer" },
    { key: "miles_driven", label: "Miles Driven" },
    { key: "gallons", label: "Gallons" },
    { key: "mpg", label: "MPG" },
    { key: "price", label: "Price" },
    { key: "fuel_cost", label: "Cost" },
  ];

  // Maintenance record columns
  const maintenanceColumns = [
    { key: "date", label: "Date" },
    { key: "repair_facility", label: "Repair Facility" },
    { key: "repair_description", label: "Repair Description" },
    { key: "price", label: "Price" },
    { key: "cost", label: "Cost" },
  ];
//there are some errors here ....
  // Filter options
  const filterOptions = [
    {
      label: "Driver",
      key: "driver_id",
      options: [
        { label: "John Smith", value: "driver_1" },
        { label: "Jane Doe", value: "driver_2" },
        { label: "Michael Johnson", value: "driver_3" },
      ],
    },
    {
      label: "Truck",
      key: "truck_id",
      options: [
        { label: "TRK-123", value: "truck_1" },
        { label: "TRK-456", value: "truck_2" },
        { label: "TRK-789", value: "truck_3" },
      ],
    },
  ];

  return (
    <ReportsTemplate
      title="Truck Log Report"
      description="Track driver trips, fuel purchases, and maintenance records for each truck"
      reportType="trucks"
      columns={columns}
      filterOptions={filterOptions}
      customTruckLog={true}
    />
  );
};
