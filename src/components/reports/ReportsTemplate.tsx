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
          { key: 'rate', label: 'Rate' },
          //planning to remove these section 
          { key: 'distance', label: 'Distance' },
          { key: 'duration', label: 'Duration' },
          //to here 
          { key: 'truck', label: 'Truck' },
          { key: 'driver', label: 'Driver' },
          { key: 'profit', label: 'Profit' }
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
    if (!filteredData || filteredData.length === 0) {
      toast.warning("No data to export. Generate a report first.");
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setProperties({
        title: `Champions Logistics Report - ${new Date().toLocaleDateString()}`,
        subject: 'Vehicle Maintenance Report',
        author: 'Champions Ltd',
        creator: 'Champions Logistics System'
      });

      filteredData.forEach((data, idx) => {
        if (idx > 0) doc.addPage();
        // Default values fallback, use live maintenance array
        // Use actual values from trips table for route details
        data = {
          date: data.date || new Date().toISOString().split('T')[0],
          vehicleNo: data.truck || 'N/A',
          driver: data.driver || 'N/A',
          from: typeof data.origin === 'string' ? data.origin : 'N/A',
          to: typeof data.destination === 'string' ? data.destination : 'N/A',
          tripDate: data.scheduled_date || data.tripDate || 'N/A',
          maintenanceItems: Array.isArray(data.maintenance) ? data.maintenance.map(m => ({ item: m.description || 'Maintenance', cost: m.cost })) : [],
          roadToll: data.road_tolls || data.roadToll || 0,
          mileage: data.mileage || 0,
          drcToll: data.drc_toll || data.drcToll || 0,
          salary: data.salary || 0,
          fuel: data.fuel || 0,
          rate: data.rate || data.RATE || 0
        };

        // Header
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('CHAMPIONS LOGISTICS', 12, 15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Vehicle Trips Report', 12, 23);
        doc.setFontSize(10);
        doc.text('REPORT DATE', 170, 10);
        doc.setFontSize(16);
        doc.text(data.date ? new Date(data.date).toLocaleDateString() : 'N/A', 170, 18);

        // Vehicle Information & Trip Details
        doc.setTextColor(41, 128, 185);
        doc.setFontSize(12);
        doc.text('VEHICLE INFORMATION', 12, 38);
        doc.text('TRIP DETAILS', 110, 38);
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.text('VEHICLE NO:', 12, 45);
        doc.text(String(data.vehicleNo), 40, 45);
        doc.text('DRIVER:', 12, 52);
        doc.text(String(data.driver), 40, 52);
        doc.text('ROUTE:', 110, 45);
        doc.text(`${data.from} → ${data.to}`, 135, 45);
        doc.text('TRIP DATE:', 110, 52);
        doc.text(data.tripDate ? new Date(data.tripDate).toLocaleDateString() : 'N/A', 135, 52);

        // Maintenance Items Table
        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text('MAINTENANCE', 12, 62);
        doc.setTextColor(60, 60, 60);
        let finalY = 65;
        autoTable(doc, {
          head: [['ITEM', 'COST']],
          body: (data.maintenanceItems || []).map((item) => [item.item, `$${item.cost?.toFixed(2) || '0.00'}`]),
          startY: finalY,
          theme: 'grid',
          headStyles: { fillColor: [220, 230, 240], textColor: [41, 128, 185], fontStyle: 'bold' },
          bodyStyles: { textColor: [60, 60, 60] },
          columnStyles: { 1: { halign: 'right' } },
          styles: { fontSize: 9, cellPadding: 2 },
          didDrawPage: function (tableData) {
            finalY = tableData.cursor.y;
          }
        });
        // Calculate maintenance total
        const itemsTotal = (data.maintenanceItems || []).reduce((sum, item) => sum + (item.cost || 0), 0);
        doc.setFontSize(10);
        doc.setTextColor(41, 128, 185);
        doc.text(`TOTAL: $${itemsTotal.toFixed(2)}`, 160, finalY + 6);

        // Cost Breakdown
        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text('COST BREAKDOWN', 12, finalY + 16);
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const breakdownY = finalY + 22;
        const breakdown = [
          ['Road Toll', data.roadToll],
          ['DRC Toll', data.drcToll],
          ['Mileage', data.mileage],
          ['Salary', data.salary],
          ['Fuel', data.fuel],
          ['Maintenance', itemsTotal]
        ];
        breakdown.forEach(([label, value], i) => {
          doc.text(`${label}:`, 12 + (i % 2 === 0 ? 0 : 60), breakdownY + Math.floor(i / 2) * 8);
          doc.text(`$${Number(value).toFixed(2)}`, 40 + (i % 2 === 0 ? 0 : 60), breakdownY + Math.floor(i / 2) * 8);
        });

        // Total Summary
        const summaryY = breakdownY + 28;
        doc.setFillColor(41, 128, 185);
        doc.rect(12, summaryY, 186, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('RATE:', 20, summaryY + 10);
        doc.text(`$${Number(data.rate).toFixed(2)}`, 60, summaryY + 10);
        const totalCost = itemsTotal + Number(data.roadToll) + Number(data.mileage) + Number(data.drcToll) + Number(data.salary) + Number(data.fuel);
        doc.text('TOTAL COST:', 20, summaryY + 20);
        doc.text(`$${totalCost.toFixed(2)}`, 60, summaryY + 20);
        doc.text('BALANCE:', 120, summaryY + 15);
        const balance = Number(data.rate) - totalCost;
        doc.text(`$${balance.toFixed(2)}`, 160, summaryY + 15);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Champions Logistics - Professional Transportation Services', 12, 285);
        doc.text('This is an automatically generated report', 12, 290);
      });

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`ChampionsLogistics_Report_${timestamp}.pdf`);
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