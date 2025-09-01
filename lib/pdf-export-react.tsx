import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { ProjectData, BMCData } from '@/types/bmc';

// Styles pour le PDF avec react-pdf
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 8
  },
  date: {
    fontSize: 10,
    color: '#6b7280'
  },
  bmcGrid: {
    flexDirection: 'column',
    flex: 1,
    gap: 8
  },
  row1: {
    flexDirection: 'row',
    flex: 2,
    gap: 8
  },
  row2: {
    flexDirection: 'row',
    flex: 1,
    gap: 8
  },
  row3: {
    flexDirection: 'row',
    flex: 1,
    gap: 8
  },
  // Sections spécifiques
  keyPartnersSection: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  keyActivitiesSection: {
    flex: 1,
    backgroundColor: '#fff7ed',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  valuePropositionsSection: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  customerRelationshipsSection: {
    flex: 1,
    backgroundColor: '#eff6ff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  customerSegmentsSection: {
    flex: 1,
    backgroundColor: '#faf5ff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  keyResourcesSection: {
    flex: 1,
    backgroundColor: '#fefce8',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  channelsSection: {
    flex: 1,
    backgroundColor: '#ecfeff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  costStructureSection: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  revenueStreamsSection: {
    flex: 1,
    backgroundColor: '#dbeafe',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    padding: 12
  },
  // Textes
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sectionContent: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    flex: 1
  },
  emptyContent: {
    fontSize: 9,
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  // Colonnes pour disposition avancée
  leftColumn: {
    flexDirection: 'column',
    flex: 1,
    gap: 8
  },
  centerColumn: {
    flex: 1
  },
  rightColumn: {
    flexDirection: 'column',
    flex: 1,
    gap: 8
  },
  footer: {
    marginTop: 15,
    paddingTop: 8,
    borderTop: '1px solid #e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerLeft: {
    flex: 2,
    flexDirection: 'column'
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end'
  },
  infoLabel: {
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
    marginBottom: 3
  },
  infoText: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  completionBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  completionText: {
    fontSize: 8,
    color: '#1e40af',
    fontWeight: 'bold'
  }
});

// Composant pour une section BMC
const BMCSection: React.FC<{
  title: string;
  content: string;
  style: any;
}> = ({ title, content, style }) => (
  <View style={style}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={content ? styles.sectionContent : styles.emptyContent}>
      {content || 'Non renseigné'}
    </Text>
  </View>
);

// Document PDF principal
const BMCDocument: React.FC<{ project: ProjectData }> = ({ project }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Business Model Canvas</Text>
        <Text style={styles.subtitle}>{project.name}</Text>
        <Text style={styles.date}>
          Généré le {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Grille BMC - Disposition traditionnelle */}
      <View style={styles.bmcGrid}>
        {/* Ligne 1 */}
        <View style={styles.row1}>
          {/* Key Partners (spans 3 rows) */}
          <View style={styles.leftColumn}>
            <BMCSection
              title="KEY PARTNERS"
              content={project.bmcData.keyPartners}
              style={styles.keyPartnersSection}
            />
          </View>

          {/* Middle sections */}
          <View style={styles.leftColumn}>
            <BMCSection
              title="KEY ACTIVITIES"
              content={project.bmcData.keyActivities}
              style={styles.keyActivitiesSection}
            />
            <BMCSection
              title="KEY RESOURCES"
              content={project.bmcData.keyResources}
              style={styles.keyResourcesSection}
            />
          </View>

          {/* Value Propositions (center, spans 2 rows) */}
          <View style={styles.centerColumn}>
            <BMCSection
              title="VALUE PROPOSITIONS"
              content={project.bmcData.valuePropositions}
              style={styles.valuePropositionsSection}
            />
          </View>

          {/* Right middle sections */}
          <View style={styles.rightColumn}>
            <BMCSection
              title="CUSTOMER RELATIONSHIPS"
              content={project.bmcData.customerRelationships}
              style={styles.customerRelationshipsSection}
            />
            <BMCSection
              title="CHANNELS"
              content={project.bmcData.channels}
              style={styles.channelsSection}
            />
          </View>

          {/* Customer Segments (spans 3 rows) */}
          <View style={styles.rightColumn}>
            <BMCSection
              title="CUSTOMER SEGMENTS"
              content={project.bmcData.customerSegments}
              style={styles.customerSegmentsSection}
            />
          </View>
        </View>

        {/* Ligne 3 - Bottom sections */}
        <View style={styles.row3}>
          <BMCSection
            title="COST STRUCTURE"
            content={project.bmcData.costStructure}
            style={styles.costStructureSection}
          />
          <BMCSection
            title="REVENUE STREAMS"
            content={project.bmcData.revenueStreams}
            style={styles.revenueStreamsSection}
          />
        </View>
      </View>

      {/* Pied de page professionnel */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.infoLabel}>Informations Projet</Text>
          <Text style={styles.infoText}>
            {project.context.secteur} • {project.context.stade}
          </Text>
          <Text style={styles.infoText}>
            {project.context.description.substring(0, 120)}
            {project.context.description.length > 120 ? '...' : ''}
          </Text>
        </View>
        
        <View style={styles.footerRight}>
          <View style={styles.statsContainer}>
            <View style={styles.completionBadge}>
              <Text style={styles.completionText}>
                {Math.round((Object.values(project.bmcData).filter(s => s.trim().length > 0).length / 9) * 100)}% Complété
              </Text>
            </View>
          </View>
          <Text style={styles.infoText}>
            {Object.values(project.bmcData).filter(s => s.trim().length > 0).length}/9 sections renseignées
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

// Classe exporteur React-PDF
export class ReactPDFExporter {
  async exportBMCCanvas(project: ProjectData): Promise<void> {
    console.log('🚀 Starting React-PDF export for:', project.name);
    
    try {
      // Générer le PDF avec react-pdf
      console.log('📄 Generating PDF document...');
      const blob = await pdf(<BMCDocument project={project} />).toBlob();
      
      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_')}_BMC_ReactPDF.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ React-PDF export completed successfully');
      
    } catch (error) {
      console.error('❌ React-PDF export failed:', error);
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Méthode pour prévisualisation (optionnelle)
  async previewBMC(project: ProjectData): Promise<string> {
    const blob = await pdf(<BMCDocument project={project} />).toBlob();
    return URL.createObjectURL(blob);
  }
}