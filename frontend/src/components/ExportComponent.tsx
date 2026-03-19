import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileImage, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => any);
}

interface ExportComponentProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  title?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  // Optional: For PDF/JPEG export with visual content
  elementId?: string;
}

export function ExportComponent({
  data,
  columns,
  filename = "export",
  title = "Export Data",
  variant = "outline",
  size = "default",
  className = "",
  elementId,
}: ExportComponentProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const getValueFromAccessor = (row: any, accessor: string | ((row: any) => any)): string => {
    if (typeof accessor === 'function') {
      const value = accessor(row);
      return value !== null && value !== undefined ? String(value) : '';
    }
    const keys = accessor.split('.');
    let value = row;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== null && value !== undefined ? String(value) : '';
  };

  const exportToCSV = () => {
    try {
      setIsExporting(true);
      
      // Generate headers
      const headers = columns.map(col => col.header);
      
      // Generate rows
      const rows = data.map(row => 
        columns.map(col => {
          const value = getValueFromAccessor(row, col.accessor);
          // Escape quotes and wrap in quotes if contains comma
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
      );
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Data exported as ${filename}.csv`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export as CSV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      if (elementId) {
        // Export visual content from element
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error('Element not found');
        }
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${filename}.pdf`);
      } else {
        // Generate table-based PDF
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        const cellPadding = 3;
        const lineHeight = 8;
        let y = margin;
        
        // Title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, pageWidth / 2, y, { align: 'center' });
        y += 12;
        
        // Date
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
        y += 10;
        
        // Calculate column widths
        const usableWidth = pageWidth - (2 * margin);
        const colWidth = usableWidth / columns.length;
        
        // Table headers
        pdf.setFillColor(37, 99, 235);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        
        let x = margin;
        columns.forEach((col) => {
          pdf.rect(x, y, colWidth, lineHeight, 'F');
          pdf.text(col.header, x + cellPadding, y + lineHeight - 2, { maxWidth: colWidth - (2 * cellPadding) });
          x += colWidth;
        });
        y += lineHeight;
        
        // Table rows
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        data.forEach((row, index) => {
          // Check for page break
          if (y > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
          }
          
          // Alternating row colors
          if (index % 2 === 0) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(margin, y, usableWidth, lineHeight, 'F');
          }
          
          x = margin;
          columns.forEach((col) => {
            const value = getValueFromAccessor(row, col.accessor);
            pdf.text(String(value).substring(0, 30), x + cellPadding, y + lineHeight - 2, { maxWidth: colWidth - (2 * cellPadding) });
            x += colWidth;
          });
          y += lineHeight;
        });
        
        pdf.save(`${filename}.pdf`);
      }
      
      toast({
        title: "Export Successful",
        description: `Data exported as ${filename}.pdf`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export as PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJPEG = async () => {
    try {
      setIsExporting(true);
      
      if (elementId) {
        // Export visual content from element
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error('Element not found');
        }
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        
        const link = document.createElement('a');
        link.download = `${filename}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      } else {
        // Create a temporary table element for export
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '20px';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        
        tempContainer.innerHTML = `
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #1f2937;">${title}</h2>
            <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
                ${columns.map(col => `<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map((row, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                  ${columns.map(col => `<td style="padding: 8px; border: 1px solid #ddd;">${getValueFromAccessor(row, col.accessor)}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        
        document.body.appendChild(tempContainer);
        
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        
        document.body.removeChild(tempContainer);
        
        const link = document.createElement('a');
        link.download = `${filename}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      }
      
      toast({
        title: "Export Successful",
        description: `Data exported as ${filename}.jpg`,
      });
    } catch (error) {
      console.error('JPEG export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export as JPEG. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJPEG} disabled={isExporting}>
          <FileImage className="h-4 w-4 mr-2" />
          Export as JPEG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportComponent;
