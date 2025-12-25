/**
 * PDF Export Utility for FreshLogic Reports
 * Uses jsPDF for PDF generation
 */

export async function exportReportAsPDF(data: any, context: any) {
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors
    const green: [number, number, number] = [34, 197, 94];
    const red: [number, number, number] = [239, 68, 68];
    const yellow: [number, number, number] = [245, 158, 11];
    const blue: [number, number, number] = [59, 130, 246];
    const darkGray: [number, number, number] = [31, 41, 55];
    
    // Header Background
    pdf.setFillColor(31, 41, 55);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo/Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🌾 FreshLogic', 15, 22);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AI-Powered Crop Spoilage Prevention', 15, 32);
    
    // Date
    pdf.setFontSize(10);
    pdf.text(`Report Generated: ${new Date().toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, pageWidth - 15, 22, { align: 'right' });
    
    // Route Summary Box
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(15, 55, pageWidth - 30, 40, 3, 3, 'F');
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, 55, pageWidth - 30, 40, 3, 3, 'S');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Transport Route Summary', 20, 65);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Origin: ${context?.origin || 'N/A'}`, 20, 75);
    pdf.text(`Destination: ${context?.destination || 'N/A'}`, 20, 83);
    pdf.text(`Crop: ${context?.crop || 'N/A'}`, 100, 75);
    pdf.text(`Distance: ${data?.route?.distance_km?.toFixed(1) || 'N/A'} km`, 100, 83);
    pdf.text(`Transit Time: ${data?.route?.duration_hours?.toFixed(1) || 'N/A'} hours`, 100, 91);
    
    // Risk Assessment Section
    const riskScore = data?.risk_analysis?.spoilage_risk || 0;
    const riskStatus = data?.risk_analysis?.status || 'Unknown';
    const riskColor = riskScore > 0.5 ? red : riskScore > 0.2 ? yellow : green;
    
    // Risk Score Box
    pdf.setFillColor(...riskColor);
    pdf.roundedRect(15, 105, 55, 35, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(riskScore * 100).toFixed(0)}%`, 42, 122, { align: 'center' });
    pdf.setFontSize(9);
    pdf.text('Spoilage Risk', 42, 132, { align: 'center' });
    
    // Status Box
    pdf.setFillColor(...darkGray);
    pdf.roundedRect(75, 105, 55, 35, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text(riskStatus, 102, 122, { align: 'center' });
    pdf.setFontSize(9);
    pdf.text('Status', 102, 132, { align: 'center' });
    
    // Days Remaining Box
    pdf.setFillColor(...blue);
    pdf.roundedRect(135, 105, 55, 35, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text(`${data?.risk_analysis?.days_remaining?.toFixed(1) || 'N/A'}`, 162, 122, { align: 'center' });
    pdf.setFontSize(9);
    pdf.text('Days Remaining', 162, 132, { align: 'center' });
    
    // AI Analysis Section
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI Analysis & Recommendations', 15, 155);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 158, pageWidth - 15, 158);
    
    // Agent Insight (word-wrapped)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    const agentInsight = data?.agent_insight || 'No analysis available.';
    // Remove markdown formatting for PDF
    const cleanInsight = agentInsight
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,3}\s/g, '')
        .replace(/- /g, '• ');
    
    const lines = pdf.splitTextToSize(cleanInsight, pageWidth - 35);
    let yPosition = 165;
    
    for (const line of lines) {
        if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
        }
        pdf.text(line, 18, yPosition);
        yPosition += 5;
    }
    
    // Footer
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Powered by FreshLogic AI • Gemini 2.5 • ML Ensemble Model • 92 Crop Knowledge Base', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Data Sources badges
    pdf.setFontSize(7);
    pdf.text('Data: OpenWeatherMap • OSRM Routing • OpenStreetMap', pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Save
    const filename = `FreshLogic-Report-${context?.origin || 'Origin'}-to-${context?.destination || 'Dest'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
}
