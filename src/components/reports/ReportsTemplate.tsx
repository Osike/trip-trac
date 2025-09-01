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

  // Get appropriate columns for display based on report type
  const getDisplayColumns = () => {
    switch (reportType) {
      case 'trips':
        return [
          { key: 'customer', label: 'Customer' },
          { key: 'origin', label: 'Origin' },
          { key: 'destination', label: 'Destination' },
          { key: 'status', label: 'Status' },
          { key: 'scheduled_date', label: 'Scheduled Date' },
          { key: 'cost', label: 'Cost' },
          { key: 'distance', label: 'Distance' },
          { key: 'duration', label: 'Duration' },
          { key: 'truck', label: 'Truck' },
          { key: 'driver', label: 'Driver' }
        ];
      case 'customers':
        return [
          { key: 'name', label: 'Customer Name' },
          { key: 'contact_person', label: 'Contact Person' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'address', label: 'Address' },
          { key: 'total_trips', label: 'Total Trips' },
          { key: 'created_at', label: 'Created Date' }
        ];
      case 'trucks':
        return [
          { key: 'plate_number', label: 'Plate Number' },
          { key: 'model', label: 'Model' },
          { key: 'status', label: 'Status' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'assigned_driver', label: 'Assigned Driver' },
          { key: 'total_trips', label: 'Total Trips' },
          { key: 'created_at', label: 'Created Date' }
        ];
      default:
        return columns;
    }
  };

  const displayColumns = getDisplayColumns();

  // Export to PDF
  const exportToPDF = async () => {
    if (reportData.length === 0) {
      toast.warning("No data to export. Generate a report first.");
      return;
    }

    setIsExporting(true);
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: displayColumns.length > 6 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set document properties
      doc.setProperties({
        title: `${title} - ${new Date().toLocaleDateString()}`,
        subject: `${title} Report`,
        author: 'Champions Ltd',
        creator: 'Champions Logistics System'
      });

      // Add company header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Champions Ltd', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Logistics & Transportation Services', 20, 28);
      
      // Add report title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 45);
      
      // Add generation date and filters info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const generatedDate = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      doc.text(generatedDate, 20, 55);
      
      // Add date range if specified
      if (dateRange.from || dateRange.to) {
        const fromDate = dateRange.from ? dateRange.from.toLocaleDateString() : 'N/A';
        const toDate = dateRange.to ? dateRange.to.toLocaleDateString() : 'N/A';
        doc.text(`Date Range: ${fromDate} to ${toDate}`, 20, 62);
      }
      
      // Add active filters
      const activeFilters = Object.entries(filters).filter(([key, value]) => value && value !== '');
      if (activeFilters.length > 0) {
        const filterText = activeFilters.map(([key, value]) => `${key}: ${value}`).join(', ');
        doc.text(`Filters: ${filterText}`, 20, 69);
      }
      
      // Add summary
      doc.text(`Total Records: ${filteredData.length}`, 20, 76);
      
      // Prepare table data
      const tableHeaders = displayColumns.map(col => col.label);
      const tableData = filteredData.map(item => 
        displayColumns.map(col => {
          const value = item[col.key];
          // Handle long text by truncating if necessary
          if (typeof value === 'string' && value.length > 30) {
            return value.substring(0, 27) + '...';
          }
          return String(value || 'N/A');
        })
      );
      
      // Add table using autoTable
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 85,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [41, 128, 185], // Blue header
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245] // Light gray for alternate rows
        },
        columnStyles: {
          // Adjust column widths based on content
          0: { cellWidth: 'auto' },
        },
        margin: { top: 10, right: 20, bottom: 20, left: 20 },
        didDrawPage: function (data) {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          
          // Footer with page number
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          const pageText = `Page ${currentPage} of ${pageCount}`;
          const pageWidth = doc.internal.pageSize.getWidth();
          doc.text(pageText, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
          
          // Company footer
          doc.text('Champions Ltd - Your Trusted Logistics Partner', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });
      
      // Save the PDF with a descriptive filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title.replace(/\s+/g, '_')}_Report_${timestamp}.pdf`;
      doc.save(filename);
      
      toast.success("PDF report exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF report");
      console.error("Error:", error);
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
                  className="bg-gradient-primary hover:bg-gradient-primary/90"
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
                    onClick={downloadReport}
                    disabled={isExporting}
                    title="Download as CSV"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
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
                  <tr className="bg-secondary/30">
                    {displayColumns.map((column) => (
                      <th 
                        key={column.key} 
                        className="border border-border px-4 py-3 text-left font-semibold text-foreground"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={displayColumns.length} 
                        className="border border-border px-4 py-8 text-center text-muted-foreground"
                      >
                        No results found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-secondary/20 transition-colors">
                        {displayColumns.map((column) => (
                          <td 
                            key={column.key} 
                            className="border border-border px-4 py-3 text-muted-foreground"
                          >
                            {item[column.key] || 'N/A'}
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