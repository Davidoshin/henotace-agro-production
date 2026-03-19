import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DownloadComponentProps {
  elementId?: string;
  elementRef?: React.RefObject<HTMLElement>;
  filename?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showPrint?: boolean;
  onBeforeCapture?: () => void;
  onAfterCapture?: () => void;
}

export function DownloadComponent({
  elementId,
  elementRef,
  filename = "download",
  variant = "outline",
  size = "default",
  className = "",
  showPrint = true,
  onBeforeCapture,
  onAfterCapture,
}: DownloadComponentProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const getElement = (): HTMLElement | null => {
    if (elementRef?.current) {
      return elementRef.current;
    }
    if (elementId) {
      return document.getElementById(elementId);
    }
    return null;
  };

  const captureElement = async (): Promise<HTMLCanvasElement | null> => {
    const element = getElement();
    if (!element) {
      toast({
        title: "Error",
        description: "Could not find element to capture",
        variant: "destructive",
      });
      return null;
    }

    onBeforeCapture?.();

    try {
      // Get device pixel ratio for sharp rendering on all devices
      const pixelRatio = window.devicePixelRatio || 1;
      // Use higher scale for better quality (minimum 3x for sharp text)
      const scale = Math.max(3, pixelRatio * 2);
      
      // Get element dimensions
      const rect = element.getBoundingClientRect();
      
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: rect.width,
        height: rect.height,
        windowWidth: rect.width,
        windowHeight: rect.height,
        // Improve text rendering
        letterRendering: true,
        // Remove scrolling issues
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });
      return canvas;
    } finally {
      onAfterCapture?.();
    }
  };

  const downloadAsPDF = async () => {
    try {
      setIsDownloading(true);
      
      const canvas = await captureElement();
      if (!canvas) return;

      // Use higher quality PNG for PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate PDF dimensions (A4 aspect ratio)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: pdfHeight > 297 ? [pdfWidth, pdfHeight] : 'a4',
        compress: false, // Don't compress for better quality
      });

      // Add image with high quality
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Handle multiple pages if content is very long
      if (pdfHeight > 297) {
        let position = -297;
        while (position > -pdfHeight) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
          position -= 297;
        }
      }
      
      // For mobile: use blob and create object URL for better compatibility
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "Download Complete",
        description: `Saved as ${filename}.pdf`,
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download as PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsJPEG = async () => {
    try {
      setIsDownloading(true);
      
      const canvas = await captureElement();
      if (!canvas) return;

      // Convert to blob for better mobile compatibility
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Download Failed",
            description: "Failed to create image. Please try again.",
            variant: "destructive",
          });
          setIsDownloading(false);
          return;
        }
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${filename}.jpg`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast({
          title: "Download Complete",
          description: `Saved as ${filename}.jpg`,
        });
        setIsDownloading(false);
      }, 'image/jpeg', 1.0); // Maximum quality (1.0)
      
    } catch (error) {
      console.error('JPEG download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download as JPEG. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const element = getElement();
    if (!element) {
      toast({
        title: "Error",
        description: "Could not find element to print",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isDownloading}>
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Processing...' : 'Download'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={downloadAsPDF} disabled={isDownloading}>
          <FileText className="h-4 w-4 mr-2" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadAsJPEG} disabled={isDownloading}>
          <FileImage className="h-4 w-4 mr-2" />
          Download as JPEG
        </DropdownMenuItem>
        {showPrint && (
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DownloadComponent;
