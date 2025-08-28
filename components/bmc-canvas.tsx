"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BMCData, ProjectContext, AIAnalysis } from "@/types/bmc";
import { Edit, AlertCircle, Lightbulb, Bot } from "lucide-react";

interface BMCCanvasProps {
  bmcData: BMCData;
  onSectionChange: (sectionId: keyof BMCData, content: string) => void;
  onAnalyzeSection: (sectionId: keyof BMCData) => void;
  analyses: Record<string, AIAnalysis>;
  context: ProjectContext;
}

const bmcSections = [
  {
    id: "keyPartners" as keyof BMCData,
    title: "KEY PARTNERS",
    placeholder: "Click to add key partners...",
    color: "bg-pink-50 border-pink-200",
  },
  {
    id: "keyActivities" as keyof BMCData,
    title: "KEY ACTIVITIES",
    placeholder: "Click to add key activities...",
    color: "bg-orange-50 border-orange-200",
  },
  {
    id: "valuePropositions" as keyof BMCData,
    title: "VALUE PROPOSITIONS",
    placeholder: "Click to add value propositions...",
    color: "bg-green-50 border-green-200",
  },
  {
    id: "customerRelationships" as keyof BMCData,
    title: "CUSTOMER RELATIONSHIPS",
    placeholder: "Click to add customer relationships...",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "customerSegments" as keyof BMCData,
    title: "CUSTOMER SEGMENTS",
    placeholder: "Click to add customer segments...",
    color: "bg-purple-50 border-purple-200",
  },
  {
    id: "keyResources" as keyof BMCData,
    title: "KEY RESOURCES",
    placeholder: "Click to add key resources...",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "channels" as keyof BMCData,
    title: "CHANNELS",
    placeholder: "Click to add channels...",
    color: "bg-cyan-50 border-cyan-200",
  },
  {
    id: "costStructure" as keyof BMCData,
    title: "COST STRUCTURE",
    placeholder: "Click to add cost structure...",
    color: "bg-pink-50 border-pink-200",
  },
  {
    id: "revenueStreams" as keyof BMCData,
    title: "REVENUE STREAMS",
    placeholder: "Click to add revenue streams...",
    color: "bg-blue-100 border-blue-300",
  },
];

export function BMCCanvas({
  bmcData,
  onSectionChange,
  onAnalyzeSection,
  analyses,
}: BMCCanvasProps) {
  const [editingSection, setEditingSection] = useState<keyof BMCData | null>(
    null
  );

  const handleSectionClick = (sectionId: keyof BMCData) => {
    setEditingSection(sectionId);
  };

  const handleContentChange = (sectionId: keyof BMCData, content: string) => {
    onSectionChange(sectionId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingSection(null);
    }
  };

  const handleBlur = () => {
    setEditingSection(null);
  };

  return (
    <div className="w-full h-full bg-white">
      {/* Canvas Grid - Traditional BMC Layout */}
      <div className="px-6 py-6 bmc-canvas-container">
        <div className="grid grid-cols-5 gap-4 h-[600px]" style={{gridTemplateRows: 'repeat(3, minmax(0, 1fr))'}}>
          {/* Key Partners - Tall left column */}
          <BMCSection
            section={bmcSections[0]}
            content={bmcData.keyPartners}
            analysis={analyses["keyPartners"]}
            isEditing={editingSection === "keyPartners"}
            onClick={() => handleSectionClick("keyPartners")}
            onChange={(content) => handleContentChange("keyPartners", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("keyPartners")}
            className="row-span-2"
          />

          {/* Key Activities - Top center left */}
          <BMCSection
            section={bmcSections[1]}
            content={bmcData.keyActivities}
            analysis={analyses["keyActivities"]}
            isEditing={editingSection === "keyActivities"}
            onClick={() => handleSectionClick("keyActivities")}
            onChange={(content) => handleContentChange("keyActivities", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("keyActivities")}
          />

          {/* Value Propositions - Tall center column */}
          <BMCSection
            section={bmcSections[2]}
            content={bmcData.valuePropositions}
            analysis={analyses["valuePropositions"]}
            isEditing={editingSection === "valuePropositions"}
            onClick={() => handleSectionClick("valuePropositions")}
            onChange={(content) => handleContentChange("valuePropositions", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("valuePropositions")}
            className="row-span-2"
          />

          {/* Customer Relationships - Top right center */}
          <BMCSection
            section={bmcSections[3]}
            content={bmcData.customerRelationships}
            analysis={analyses["customerRelationships"]}
            isEditing={editingSection === "customerRelationships"}
            onClick={() => handleSectionClick("customerRelationships")}
            onChange={(content) => handleContentChange("customerRelationships", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("customerRelationships")}
          />

          {/* Customer Segments - Tall right column */}
          <BMCSection
            section={bmcSections[4]}
            content={bmcData.customerSegments}
            analysis={analyses["customerSegments"]}
            isEditing={editingSection === "customerSegments"}
            onClick={() => handleSectionClick("customerSegments")}
            onChange={(content) => handleContentChange("customerSegments", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("customerSegments")}
            className="row-span-2"
          />

          {/* Key Resources - Middle left */}
          <BMCSection
            section={bmcSections[5]}
            content={bmcData.keyResources}
            analysis={analyses["keyResources"]}
            isEditing={editingSection === "keyResources"}
            onClick={() => handleSectionClick("keyResources")}
            onChange={(content) => handleContentChange("keyResources", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("keyResources")}
            className="col-start-2 row-start-2"
          />

          {/* Channels - Middle right */}
          <BMCSection
            section={bmcSections[6]}
            content={bmcData.channels}
            analysis={analyses["channels"]}
            isEditing={editingSection === "channels"}
            onClick={() => handleSectionClick("channels")}
            onChange={(content) => handleContentChange("channels", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("channels")}
            className="col-start-4 row-start-2"
          />

          {/* Cost Structure - Bottom left (spans 2.5 columns) */}
          <BMCSection
            section={bmcSections[7]}
            content={bmcData.costStructure}
            analysis={analyses["costStructure"]}
            isEditing={editingSection === "costStructure"}
            onClick={() => handleSectionClick("costStructure")}
            onChange={(content) => handleContentChange("costStructure", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("costStructure")}
            className="col-span-2 row-start-3"
          />

          {/* Revenue Streams - Bottom right (spans 2.5 columns) */}
          <BMCSection
            section={bmcSections[8]}
            content={bmcData.revenueStreams}
            analysis={analyses["revenueStreams"]}
            isEditing={editingSection === "revenueStreams"}
            onClick={() => handleSectionClick("revenueStreams")}
            onChange={(content) => handleContentChange("revenueStreams", content)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onAnalyze={() => onAnalyzeSection("revenueStreams")}
            className="col-span-3 col-start-3 row-start-3"
          />
        </div>
      </div>
    </div>
  );
}

interface BMCSectionProps {
  section: {
    id: keyof BMCData;
    title: string;
    placeholder: string;
    color: string;
  };
  content: string;
  analysis?: AIAnalysis;
  isEditing: boolean;
  onClick: () => void;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onAnalyze: () => void;
  className?: string;
}

function BMCSection({
  section,
  content,
  analysis,
  isEditing,
  onClick,
  onChange,
  onKeyDown,
  onBlur,
  onAnalyze,
  className = "",
}: BMCSectionProps) {
  return (
    <div
      className={`
        ${section.color} 
        ${className} 
        rounded-lg border-2 border-dashed
        h-full min-h-[160px] p-4 cursor-pointer
        hover:border-solid hover:shadow-sm transition-all duration-200
        ${isEditing ? "border-blue-400 shadow-md bg-blue-50/30" : ""}
        flex flex-col
      `}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-700 tracking-wide">
          {section.title}
        </h3>
        <div className="flex items-center gap-1">
          {analysis && (
            <Badge
              variant="outline"
              className={`text-xs h-5 px-2 ${
                analysis.score >= 80
                  ? "bg-green-50 text-green-700 border-green-200"
                  : analysis.score >= 60
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {analysis.score}%
            </Badge>
          )}
          <Edit className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            autoFocus
            className="w-full flex-1 p-2 text-sm border-0 bg-transparent resize-none focus:outline-none placeholder-gray-400 min-h-[100px]"
            placeholder={section.placeholder}
          />
        ) : (
          <div className="space-y-3">
            {content ? (
              <>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>

                {/* AI Feedback */}
                {analysis && (
                  <div className="space-y-2 mt-3">
                    {analysis.errors.length > 0 && (
                      <div className="space-y-1">
                        {analysis.errors.slice(0, 1).map((error, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-xs text-red-600"
                          >
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{error}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.suggestions.length > 0 && (
                      <div className="space-y-1">
                        {analysis.suggestions
                          .slice(0, 1)
                          .map((suggestion, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-xs text-blue-600"
                            >
                              <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{suggestion}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Analyze Button */}
                {content && !analysis && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyze();
                    }}
                    className="text-xs h-6 px-2 text-purple-600 hover:bg-purple-50"
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    Analyser
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-center">
                <p className="text-sm text-gray-500 italic">
                  {section.placeholder}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
