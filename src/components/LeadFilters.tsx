import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "./TagInput";

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
}

export const LeadFilters = ({ filters, onChange }: LeadFiltersProps) => {
  const updateFilter = <K extends keyof LeadFiltersData>(
    key: K,
    value: LeadFiltersData[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-left">
      {/* Firmen-Keywords */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Firmen-Keywords</Label>
        <TagInput
          tags={filters.firmenKeywords}
          onChange={(tags) => updateFilter("firmenKeywords", tags)}
          placeholder="Keyword eingeben und Enter drücken..."
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
        />
      </div>

      {/* Person Titel */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Person Titel</Label>
        <TagInput
          tags={filters.personTitel}
          onChange={(tags) => updateFilter("personTitel", tags)}
          placeholder="Titel eingeben und Enter drücken..."
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
        />
      </div>

      {/* Anzahl Leads */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Anzahl Leads</Label>
        <Input
          type="text"
          value={filters.anzahlLeads}
          onChange={(e) => {
            const val = e.target.value.toLowerCase();
            if (val === "max" || val === "") {
              updateFilter("anzahlLeads", val === "" ? "" : "max");
            } else {
              const num = parseInt(val);
              if (!isNaN(num) && num >= 0) {
                updateFilter("anzahlLeads", num);
              }
            }
          }}
          placeholder='Zahl oder "max"'
          className="text-base py-5 px-4 rounded-xl"
        />
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
