"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Props {
  studentName: string;
  sessionName: string;
}

export function DownloadReportCardButton({ studentName, sessionName }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const element = document.getElementById("report-card-content");
      if (!element) {
        toast.error("Report content not found");
        return;
      }

      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = pageWidth / canvasWidth;

      let heightLeft = canvasHeight * ratio;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, canvasHeight * ratio);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - canvasHeight * ratio;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, canvasHeight * ratio);
        heightLeft -= pageHeight;
      }

      // Download PDF
      const filename = `${studentName}_Report_Card_${sessionName}.pdf`;
      pdf.save(filename);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 bg-blue-600 hover:bg-blue-700"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
