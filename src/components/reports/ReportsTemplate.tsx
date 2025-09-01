import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker, DateRangePickerValue } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Filter, Loader2, RefreshCw, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportsTemplateProps {
  title: string;
  description: string;
  reportType: 'trips' | 'customers' | 'trucks';
  columns: { key: string; label: string }[];
  filterOptions?: { 
    label: string; 
    key: string; 
    options: { label: string; value: string }[] 
  }[];
  customTruckLog?: boolean;
}

export const ReportsTemplate: React.FC<ReportsTemplateProps> = ({
  title,
  description,
  reportType,
  columns,
  filterOptions = [],
  customTruckLog = false
}) => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: new Date(),
    to: new Date()
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [reportData, setReportData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle date range change
  const handleDateRangeChange = (value: DateRangePickerValue) => {
    setDateRange(value);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  // Generate report
  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Format date range for query
      const fromDate = dateRange.from ? dateRange.from.toISOString() : undefined;
      const toDate = dateRange.to ? dateRange.to.toISOString() : undefined;

      // Call the appropriate Supabase Edge Function to get JSON data for display
      const { data, error } = await supabase.functions.invoke(`generate-${reportType}-report`, {
        body: {
          dateRange: { from: fromDate, to: toDate },
          filters,
          format: 'json'
        }
      });

      if (error) {
        toast.error(`Failed to generate ${reportType} report`);
        console.error('Error:', error);
        return;
      }

      if (data && data.length > 0) {
        setReportData(data);
        toast.success(`${title} report generated successfully with ${data.length} records`);
      } else {
        setReportData([]);
        toast.info('No data found for the selected criteria');
      }
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Download report as CSV
  const downloadReport = async () => {
    setIsExporting(true);
    try {
      // Format date range for query
      const fromDate = dateRange.from ? dateRange.from.toISOString() : undefined;
      const toDate = dateRange.to ? dateRange.to.toISOString() : undefined;

      // Call the edge function to get CSV
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `https://xkhsakqmyphneyyartiz.supabase.co/functions/v1/generate-${reportType}-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token || ''}`
          },
          body: JSON.stringify({
            dateRange: { from: fromDate, to: toDate },
            filters,
            format: 'csv'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${title} report downloaded successfully`);
    } catch (error) {
      toast.error('Failed to download report');
      console.error('Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to generate sample data for demonstration/debugging
  const generateSampleData = (type: string, cols: { key: string; label: string }[]) => {
    const sampleSize = 10;
    const result = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const item: Record<string, any> = {};
      
      cols.forEach(col => {
        // Generate appropriate sample data based on column key and report type
        if (col.key === 'id') {
          item[col.key] = `${type.toUpperCase().slice(0, 3)}-${(1000 + i).toString()}`;
        } else if (col.key.includes('date')) {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30));
          item[col.key] = date.toISOString().split('T')[0];
        } else if (col.key.includes('cost') || col.key.includes('revenue')) {
          item[col.key] = (Math.random() * 1000 + 500).toFixed(2);
        } else if (col.key.includes('distance')) {
          item[col.key] = Math.floor(Math.random() * 500 + 50);
        } else if (col.key === 'status') {
          const statuses = ['completed', 'scheduled', 'ongoing', 'cancelled'];
          item[col.key] = statuses[Math.floor(Math.random() * statuses.length)];
        } else if (col.key === 'customer' || col.key === 'name') {
          const names = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Corp', 'Wayne Enterprises'];
          item[col.key] = names[Math.floor(Math.random() * names.length)];
        } else if (col.key === 'driver') {
          const drivers = ['John Smith', 'Jane Doe', 'Michael Johnson', 'Emma Williams'];
          item[col.key] = drivers[Math.floor(Math.random() * drivers.length)];
        } else if (col.key === 'truck' || col.key === 'plate_number') {
          const trucks = ['TRK-123', 'TRK-456', 'TRK-789', 'TRK-012'];
          item[col.key] = trucks[Math.floor(Math.random() * trucks.length)];
        } else if (col.key === 'origin') {
          const origins = ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Miami'];
          item[col.key] = origins[Math.floor(Math.random() * origins.length)];
        } else if (col.key === 'destination') {
          const destinations = ['Boston', 'Seattle', 'Denver', 'Atlanta', 'Dallas'];
          item[col.key] = destinations[Math.floor(Math.random() * destinations.length)];
        } else {
          item[col.key] = `Sample ${col.label} ${i + 1}`;
        }
      });
      
      result.push(item);
    }
    
    return result;
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (reportData.length === 0) {
      toast.warning('No data to export. Generate a report first.');
      return;
    }

    setIsExporting(true);
    try {
      // Convert report data to CSV
      const headers = columns.map(col => col.label).join(',');
      const rows = reportData.map(row => 
        columns.map(col => {
          // Handle values with commas by enclosing in quotes
          const value = row[col.key] !== undefined ? String(row[col.key]) : '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      ).join('\n');
      
      const csvContent = `${headers}\n${rows}`;
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Export to PDF
  const exportToPDF = async () => {
    if (reportData.length === 0) {
      toast.warning('No data to export. Generate a report first.');
      return;
    }

    setIsExporting(true);
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: customTruckLog ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set document properties
      doc.setProperties({
        title: `${title} - ${new Date().toLocaleDateString()}`,
        subject: `${title} Report`,
        author: 'Champions Ltd',
        creator: 'Trip-Trac System',
      });

      if (customTruckLog) {
        // Create a truck log format similar to the provided image
        // Add "TRUCK LOG" header
        doc.setFontSize(24);
        doc.setTextColor(231, 76, 60); // Red color similar to image
        doc.text('TRUCK LOG', 15, 20);
        
        // Add truck icon or logo
        const imgData = "data:image/png;base64,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";
        doc.addImage(imgData, 'PNG', 160, 10, 30, 20);
        
        // Add main header grid
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 25, 190, 10, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(10, 25, 190, 10, 'S');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Header grid titles
        doc.text('Driver Name', 12, 32);
        doc.text('Company', 105, 32);
        doc.text('Week', 170, 32);
        
        // Header grid values
        doc.rect(10, 35, 190, 10, 'S');
        
        // Truck info section
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 45, 190, 10, 'F');
        doc.rect(10, 45, 190, 10, 'S');
        doc.text('Truck Number', 12, 52);
        doc.text('Starting Odometer Reading', 70, 52);
        doc.text('Ending Odometer Reading', 140, 52);
        
        // Truck info values
        doc.rect(10, 55, 190, 10, 'S');
        
        // Trip Record Header
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 70, 190, 10, 'F');
        doc.rect(10, 70, 190, 10, 'S');
        doc.setFontSize(12);
        doc.text('Trip Record', 100, 77, { align: 'center' });
        
        // Trip Record columns
        doc.setFontSize(9);
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 80, 190, 10, 'F');
        doc.rect(10, 80, 190, 10, 'S');
        
        // Draw vertical lines for the trip record header
        doc.line(30, 80, 30, 90); // After Date
        doc.line(60, 80, 60, 90); // After Trailer
        doc.line(90, 80, 90, 90); // After Origin
        doc.line(130, 80, 130, 90); // After Destination
        doc.line(160, 80, 160, 90); // After Miles
        
        // Trip record column headers
        doc.text('Date', 12, 87);
        doc.text('Trailer', 32, 87);
        doc.text('Origin City', 62, 87);
        doc.text('Destination City', 92, 87);
        doc.text('Miles', 132, 87);
        doc.text('Rate', 162, 87);
        
        // Trip record rows - 10 empty rows
        for (let i = 0; i < 10; i++) {
          doc.rect(10, 90 + (i * 10), 190, 10, 'S');
          doc.line(30, 90 + (i * 10), 30, 100 + (i * 10)); // After Date
          doc.line(60, 90 + (i * 10), 60, 100 + (i * 10)); // After Trailer
          doc.line(90, 90 + (i * 10), 90, 100 + (i * 10)); // After Origin
          doc.line(130, 90 + (i * 10), 130, 100 + (i * 10)); // After Destination
          doc.line(160, 90 + (i * 10), 160, 100 + (i * 10)); // After Miles
        }
        
        // Totals row
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 190, 190, 10, 'F');
        doc.rect(10, 190, 190, 10, 'S');
        doc.line(130, 190, 130, 200); // After "Totals"
        doc.line(160, 190, 160, 200); // After Miles
        doc.setFontSize(10);
        doc.text('Totals (Trips, Miles & Revenue)', 12, 197);
        
        // Fuel Purchase Record Header
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 205, 190, 10, 'F');
        doc.rect(10, 205, 190, 10, 'S');
        doc.setFontSize(12);
        doc.text('Fuel Purchase Record', 100, 212, { align: 'center' });
        
        // Fuel Purchase columns
        doc.setFontSize(9);
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 215, 190, 10, 'F');
        doc.rect(10, 215, 190, 10, 'S');
        
        // Draw vertical lines for the fuel purchase header
        doc.line(30, 215, 30, 225); // After Date
        doc.line(60, 215, 60, 225); // After Odometer
        doc.line(90, 215, 90, 225); // After Miles Driven
        doc.line(110, 215, 110, 225); // After Gallons
        doc.line(130, 215, 130, 225); // After MPG
        doc.line(150, 215, 150, 225); // After Price
        doc.line(170, 215, 170, 225); // After Cost
        
        // Fuel purchase column headers
        doc.text('Date', 12, 222);
        doc.text('Odometer', 32, 222);
        doc.text('Miles Driven', 62, 222);
        doc.text('Gallons', 92, 222);
        doc.text('MPG', 112, 222);
        doc.text('Price', 132, 222);
        doc.text('Cost', 152, 222);
        doc.text('Notes', 172, 222);
        
        // Fuel purchase rows - 4 empty rows
        for (let i = 0; i < 4; i++) {
          doc.rect(10, 225 + (i * 10), 190, 10, 'S');
          doc.line(30, 225 + (i * 10), 30, 235 + (i * 10)); 
          doc.line(60, 225 + (i * 10), 60, 235 + (i * 10)); 
          doc.line(90, 225 + (i * 10), 90, 235 + (i * 10)); 
          doc.line(110, 225 + (i * 10), 110, 235 + (i * 10)); 
          doc.line(130, 225 + (i * 10), 130, 235 + (i * 10)); 
          doc.line(150, 225 + (i * 10), 150, 235 + (i * 10)); 
          doc.line(170, 225 + (i * 10), 170, 235 + (i * 10)); 
        }
        
        // Average row
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 265, 190, 10, 'F');
        doc.rect(10, 265, 190, 10, 'S');
        doc.line(90, 265, 90, 275); 
        doc.setFontSize(10);
        doc.text('Average Price Per Gallon', 12, 272);
        doc.text('Average Cost Per Mile Driven', 92, 272);
        
        // Add a second page for maintenance records
        doc.addPage();
        
        // Maintenance Record Header
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 10, 190, 10, 'F');
        doc.rect(10, 10, 190, 10, 'S');
        doc.setFontSize(12);
        doc.text('Maintenance Record', 100, 17, { align: 'center' });
        
        // Maintenance columns
        doc.setFontSize(9);
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 20, 190, 10, 'F');
        doc.rect(10, 20, 190, 10, 'S');
        
        // Draw vertical lines for the maintenance header
        doc.line(30, 20, 30, 30); // After Date
        doc.line(80, 20, 80, 30); // After Repair Facility
        doc.line(160, 20, 160, 30); // After Repair Description
        doc.line(180, 20, 180, 30); // After Price
        
        // Maintenance column headers
        doc.text('Date', 12, 27);
        doc.text('Repair Facility', 32, 27);
        doc.text('Repair Description', 82, 27);
        doc.text('Price', 162, 27);
        doc.text('Cost', 182, 27);
        
        // Maintenance rows - 5 empty rows
        for (let i = 0; i < 5; i++) {
          doc.rect(10, 30 + (i * 10), 190, 10, 'S');
          doc.line(30, 30 + (i * 10), 30, 40 + (i * 10)); 
          doc.line(80, 30 + (i * 10), 80, 40 + (i * 10)); 
          doc.line(160, 30 + (i * 10), 160, 40 + (i * 10)); 
          doc.line(180, 30 + (i * 10), 180, 40 + (i * 10)); 
        }
        
        // Comments section
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 90, 190, 10, 'F');
        doc.rect(10, 90, 190, 10, 'S');
        doc.setFontSize(12);
        doc.text('Comments / Notes', 100, 97, { align: 'center' });
        
        // Comments box
        doc.rect(10, 100, 190, 60, 'S');
        
      } else {
        // Standard report format (original code)
        // Add company logo (using the truck image from public folder)
        const imgData = "data:image/png;base64,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";
        doc.addImage(imgData, 'PNG', 10, 10, 15, 15);
        
        // Add company name in the header center
        doc.setFontSize(18);
        doc.setTextColor(0, 51, 102); // Navy blue color
        doc.text('CHAMPIONS LTD', doc.internal.pageSize.width / 2, 15, { align: 'center' });
        
        // Add report title
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`${title}`, doc.internal.pageSize.width / 2, 25, { align: 'center' });
        
        // Add date range
        let dateRangeText = 'Date range: ';
        if (dateRange.from && dateRange.to) {
          dateRangeText += `${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`;
        } else if (dateRange.from) {
          dateRangeText += `From ${dateRange.from.toLocaleDateString()}`;
        } else if (dateRange.to) {
          dateRangeText += `Until ${dateRange.to.toLocaleDateString()}`;
        } else {
          dateRangeText += 'All dates';
        }
        doc.setFontSize(10);
        doc.text(dateRangeText, doc.internal.pageSize.width / 2, 32, { align: 'center' });
        
        // Add filters applied
        if (Object.keys(filters).length > 0) {
          let filterText = 'Filters: ';
          filterOptions.forEach(filter => {
            if (filters[filter.key]) {
              const option = filter.options.find(opt => opt.value === filters[filter.key]);
              if (option) {
                filterText += `${filter.label}: ${option.label}, `;
              }
            }
          });
          filterText = filterText.slice(0, -2); // Remove trailing comma and space
          doc.text(filterText, doc.internal.pageSize.width / 2, 37, { align: 'center' });
        }
        
        // Create table headers
        const headers = columns.map(col => col.label);
        
        // Create table rows
        const rows = reportData.map(row => 
          columns.map(col => row[col.key] !== undefined ? String(row[col.key]) : '—')
        );
        
        // Add table
        autoTable(doc, {
          startY: 45,
          head: [headers],
          body: rows,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 51, 102], // Navy blue
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          }
        });
      }
      
      // Add footer
      const pageCount = (doc as any).internal.pages.length;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        // Add generation date
        const generationDate = `Generated on: ${new Date().toLocaleString()}`;
        doc.text(generationDate, 10, doc.internal.pageSize.height - 10);
        
        // Add page number
        const pageText = `Page ${i} of ${pageCount}`;
        doc.text(pageText, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
        
        // Add company info at the bottom center
        doc.text('Champions Ltd - Your Logistics Partner', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Save the PDF
      doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF report exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF report');
      console.error('Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter report data based on search term
  const filteredData = (reportData || []).filter(item => 
    Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <DateRangePicker 
                    value={dateRange}
                    onChange={handleDateRangeChange}
                  />
                </div>
                
                {filterOptions.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <Select
                      value={filters[filter.key] || ''}
                      onValueChange={(value) => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({});
                    setDateRange({
                      from: new Date(),
                      to: new Date()
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
                <Button 
                  onClick={generateReport} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Filter className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Recipients</label>
                  <Input placeholder="email@example.com" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">
                  Schedule Report
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Scheduled reports will be automatically generated and sent to the specified email addresses.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {reportData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                <FileText className="h-5 w-5 mr-2 text-primary inline-block" />
                Report Results ({filteredData.length})
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={isExporting}
                    title="Export as CSV"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToPDF}
                    disabled={isExporting}
                    title="Export as PDF"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    {columns.map((column) => (
                      <th key={column.key} className="p-3 text-left font-medium text-sm">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={columns.length} 
                        className="p-4 text-center text-muted-foreground"
                      >
                        No results found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-border hover:bg-muted/30"
                      >
                        {columns.map((column) => (
                          <td key={`${index}-${column.key}`} className="p-3">
                            {item[column.key] !== undefined ? String(item[column.key]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
