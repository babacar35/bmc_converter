import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProjectData, BMCData } from '@/types/bmc';

export class PDFExporter {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF('landscape', 'mm', 'a4');
  }

  async exportBMCCanvas(project: ProjectData): Promise<void> {
    // Get the canvas element
    const canvasElement = document.querySelector('.bmc-canvas-container');
    if (!canvasElement) {
      throw new Error('Canvas element not found');
    }

    // Convert HTML to canvas
    const canvas = await html2canvas(canvasElement as HTMLElement, {
      useCORS: true,
      allowTaint: false,
      background: '#ffffff',
    });

    // Calculate dimensions for A4 landscape
    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add header
    this.addHeader(project);

    // Add canvas image
    const imgData = canvas.toDataURL('image/png');
    this.doc.addImage(imgData, 'PNG', 0, 30, imgWidth, Math.min(imgHeight, 180));

    // Add project details
    this.addProjectDetails(project);

    // Save the PDF
    this.doc.save(`${project.name.replace(/[^a-z0-9]/gi, '_')}_BMC.pdf`);
  }

  private addHeader(project: ProjectData): void {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Business Model Canvas', 148.5, 15, { align: 'center' });
    
    // Project name
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(project.name, 148.5, 25, { align: 'center' });
    
    // Date
    this.doc.setFontSize(10);
    this.doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 10, 10);
  }

  private addProjectDetails(project: ProjectData): void {
    let yPosition = 220;
    
    // Project context
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Contexte du Projet:', 10, yPosition);
    
    yPosition += 10;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const details = [
      `Secteur: ${project.context.secteur}`,
      `Stade: ${project.context.stade}`,
      `Description: ${project.context.description}`,
    ];
    
    details.forEach(detail => {
      this.doc.text(detail, 10, yPosition);
      yPosition += 6;
    });

    // BMC completion stats
    yPosition += 10;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Statistiques:', 10, yPosition);
    
    yPosition += 8;
    this.doc.setFont('helvetica', 'normal');
    
    const filledSections = Object.values(project.bmcData).filter(section => section.trim().length > 0).length;
    const completionRate = Math.round((filledSections / 9) * 100);
    
    this.doc.text(`Sections remplies: ${filledSections}/9 (${completionRate}%)`, 10, yPosition);
    yPosition += 6;
    this.doc.text(`Dernière modification: ${project.lastModified}`, 10, yPosition);
  }

  async exportTextVersion(project: ProjectData): Promise<void> {
    const sectionNames = {
      keyPartners: 'PARTENAIRES CLÉS',
      keyActivities: 'ACTIVITÉS CLÉS', 
      valuePropositions: 'PROPOSITIONS DE VALEUR',
      customerRelationships: 'RELATIONS CLIENTS',
      customerSegments: 'SEGMENTS DE CLIENTÈLE',
      keyResources: 'RESSOURCES CLÉS',
      channels: 'CANAUX',
      costStructure: 'STRUCTURE DES COÛTS',
      revenueStreams: 'FLUX DE REVENUS'
    };

    let yPosition = 20;
    
    // Header
    this.addHeader(project);
    yPosition = 40;

    // BMC Sections
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Détail des Sections BMC', 10, yPosition);
    yPosition += 15;

    Object.entries(project.bmcData).forEach(([key, value]) => {
      const sectionName = sectionNames[key as keyof BMCData];
      
      // Check if we need a new page
      if (yPosition > 250) {
        this.doc.addPage();
        yPosition = 20;
      }
      
      // Section title
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionName, 10, yPosition);
      yPosition += 8;
      
      // Section content
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      
      if (value.trim()) {
        const lines = this.doc.splitTextToSize(value, 270);
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            this.doc.addPage();
            yPosition = 20;
          }
          this.doc.text(line, 15, yPosition);
          yPosition += 5;
        });
      } else {
        this.doc.setFont('helvetica', 'italic');
        this.doc.text('(Section vide)', 15, yPosition);
        yPosition += 5;
        this.doc.setFont('helvetica', 'normal');
      }
      
      yPosition += 10;
    });

    // Save the PDF
    this.doc.save(`${project.name.replace(/[^a-z0-9]/gi, '_')}_BMC_Details.pdf`);
  }
}