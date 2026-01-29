import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TagInput } from "./TagInput";
import { Upload, X, FileSpreadsheet } from "lucide-react";

export interface LeadFiltersData {
  firmenKeywords: string[];
  mitarbeiterVon: number | "";
  mitarbeiterBis: number | "";
  firmaOrtschaft: string[];
  personTitel: string[];
  maxUmsatz: number | "";
  anzahlLeads: number | "max" | "";
}

interface LeadFiltersProps {
  filters: LeadFiltersData;
  onChange: (filters: LeadFiltersData) => void;
  disabled?: boolean;
  uploadedFile?: File | null;
  onFileUpload?: (file: File | null) => void;
}

export const LeadFilters = ({ filters, onChange, disabled = false, uploadedFile, onFileUpload }: LeadFiltersProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFilter = <K extends keyof LeadFiltersData>(
    key: K,
    value: LeadFiltersData[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(file.type) || ["csv", "xls", "xlsx"].includes(fileExtension || "")) {
        onFileUpload(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = () => {
    if (onFileUpload) {
      onFileUpload(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 text-left ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Firmen-Keywords with File Upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Firmen-Keywords</Label>
          {onFileUpload && (
            <div className="flex items-center gap-2">
              {uploadedFile ? (
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-1.5 border border-primary/20">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[150px]">{uploadedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">oder</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Hochladen
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <TagInput
          tags={filters.firmenKeywords}
          onChange={(tags) => updateFilter("firmenKeywords", tags)}
          placeholder="Keyword eingeben und Enter drücken..."
          disabled={disabled}
        />
      </div>

      {/* Mitarbeiter Anzahl */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Mitarbeiter Anzahl</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            value={filters.mitarbeiterVon}
            onChange={(e) =>
              updateFilter(
                "mitarbeiterVon",
                e.target.value === "" ? "" : parseInt(e.target.value)
              )
            }
            placeholder="Von"
            className="text-base py-5 px-4 rounded-xl"
            disabled={disabled}
          />
          <span className="text-muted-foreground">bis</span>
          <Input
            type="number"
            min={0}
            value={filters.mitarbeiterBis}
            onChange={(e) =>
              updateFilter(
                "mitarbeiterBis",
                e.target.value === "" ? "" : parseInt(e.target.value)
              )
            }
            placeholder="Bis (leer = unbegrenzt)"
            className="text-base py-5 px-4 rounded-xl"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Firma Ortschaft */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Firma Ortschaft</Label>
        <TagInput
          tags={filters.firmaOrtschaft}
          onChange={(tags) => updateFilter("firmaOrtschaft", tags)}
          placeholder="Ortschaft eingeben und Enter drücken..."
          disabled={disabled}
        />
      </div>

      {/* Person Titel */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Person Titel</Label>
        <TagInput
          tags={filters.personTitel}
          onChange={(tags) => updateFilter("personTitel", tags)}
          placeholder="Titel eingeben und Enter drücken..."
          disabled={disabled}
        />
      </div>

      {/* Maximaler Umsatz */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Maximaler Umsatz</Label>
        <Input
          type="number"
          min={0}
          value={filters.maxUmsatz}
          onChange={(e) =>
            updateFilter(
              "maxUmsatz",
              e.target.value === "" ? "" : parseInt(e.target.value)
            )
          }
          placeholder="0"
          className="text-base py-5 px-4 rounded-xl"
          disabled={disabled}
        />
      </div>

      {/* Anzahl Leads */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Anzahl Leads</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            value={filters.anzahlLeads === "max" ? "" : filters.anzahlLeads}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                updateFilter("anzahlLeads", "");
              } else {
                const num = parseInt(val);
                if (!isNaN(num) && num >= 0) {
                  updateFilter("anzahlLeads", num);
                }
              }
            }}
            placeholder="Anzahl eingeben"
            disabled={disabled || filters.anzahlLeads === "max"}
            className="text-base py-5 px-4 rounded-xl flex-1"
          />
          <Button
            type="button"
            variant={filters.anzahlLeads === "max" ? "default" : "outline"}
            onClick={() => {
              if (filters.anzahlLeads === "max") {
                updateFilter("anzahlLeads", "");
              } else {
                updateFilter("anzahlLeads", "max");
              }
            }}
            className="h-[50px] px-6 rounded-xl font-medium"
            disabled={disabled}
          >
            Max
          </Button>
        </div>
      </div>
    </div>
  );
};

export const isFiltersValid = (filters: LeadFiltersData): boolean => {
  return (
    filters.firmenKeywords.length > 0 &&
    filters.mitarbeiterVon !== "" &&
    filters.firmaOrtschaft.length > 0 &&
    filters.personTitel.length > 0 &&
    filters.maxUmsatz !== "" &&
    filters.anzahlLeads !== ""
  );
};
