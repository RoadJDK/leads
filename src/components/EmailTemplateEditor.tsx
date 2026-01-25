import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Plus, Save, Trash2, X, ChevronRight, Sparkles, Hand } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomPlaceholder {
  name: string;
  value: string;
}

interface ManualFields {
  custom_placeholders: CustomPlaceholder[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string | null;
  body_template: string;
  manual_fields: ManualFields;
  created_at: string;
  updated_at: string;
}

const AUTO_PLACEHOLDERS = [
  { key: "{{person_vorname}}", label: "Person Vorname" },
  { key: "{{person_nachname}}", label: "Person Nachname" },
  { key: "{{firma_name}}", label: "Firma Name" },
  { key: "{{firma_branche}}", label: "Firma Branche" },
  { key: "{{ortschaft}}", label: "Ortschaft" },
];

// Helper to extract all {{...}} placeholders from text
function extractPlaceholders(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

// Helper to check if a placeholder is auto (from lead data)
function isAutoPlaceholder(name: string): boolean {
  return AUTO_PLACEHOLDERS.some(p => p.key === `{{${name}}}`);
}

export function EmailTemplateEditor() {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showTemplateList, setShowTemplateList] = useState(true);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [customPlaceholders, setCustomPlaceholders] = useState<CustomPlaceholder[]>([]);
  const [newPlaceholderName, setNewPlaceholderName] = useState("");

  // Refs for cursor position
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  // Extract manual placeholders from subject and body
  const usedManualPlaceholders = useMemo(() => {
    const allText = `${templateSubject} ${templateBody}`;
    const allPlaceholders = extractPlaceholders(allText);
    return allPlaceholders.filter(p => !isAutoPlaceholder(p));
  }, [templateSubject, templateBody]);

  // Sync customPlaceholders with used manual placeholders
  useEffect(() => {
    setCustomPlaceholders(prev => {
      const updated: CustomPlaceholder[] = [];
      for (const name of usedManualPlaceholders) {
        const existing = prev.find(p => p.name === name);
        if (existing) {
          updated.push(existing);
        } else {
          updated.push({ name, value: "" });
        }
      }
      return updated;
    });
  }, [usedManualPlaceholders]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Fehler",
        description: "Vorlagen konnten nicht geladen werden",
        variant: "destructive",
      });
    } else if (data) {
      setTemplates(data.map(item => {
        // Handle legacy format migration
        const rawFields = item.manual_fields as any;
        let manualFields: ManualFields;
        
        if (rawFields && Array.isArray(rawFields.custom_placeholders)) {
          manualFields = rawFields as ManualFields;
        } else {
          // Migrate from old format
          manualFields = { custom_placeholders: [] };
        }
        
        return {
          ...item,
          manual_fields: manualFields
        };
      }));
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
    setCustomPlaceholders([]);
    setNewPlaceholderName("");
    setEditingTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject || "");
    setTemplateBody(template.body_template);
    setCustomPlaceholders(template.manual_fields.custom_placeholders || []);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Vorlagennamen ein",
        variant: "destructive",
      });
      return;
    }

    if (!templateBody.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen E-Mail-Text ein",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const templateData = {
      name: templateName.trim(),
      subject: templateSubject.trim() || null,
      body_template: templateBody,
      manual_fields: JSON.parse(JSON.stringify({ custom_placeholders: customPlaceholders })),
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from("email_templates")
        .update(templateData)
        .eq("id", editingTemplate.id);

      if (error) {
        toast({
          title: "Fehler",
          description: "Vorlage konnte nicht aktualisiert werden",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erfolg",
          description: "Vorlage erfolgreich aktualisiert",
        });
        resetForm();
        fetchTemplates();
      }
    } else {
      const { error } = await supabase
        .from("email_templates")
        .insert([templateData]);

      if (error) {
        toast({
          title: "Fehler",
          description: "Vorlage konnte nicht gespeichert werden",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erfolg",
          description: "Vorlage erfolgreich erstellt",
        });
        resetForm();
        fetchTemplates();
      }
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gelöscht werden",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erfolg",
        description: "Vorlage erfolgreich gelöscht",
      });
      if (editingTemplate?.id === id) {
        resetForm();
      }
      fetchTemplates();
    }
    setDeleteConfirmId(null);
    setIsLoading(false);
  };

  const insertPlaceholder = (placeholder: string) => {
    if (activeField === "subject" && subjectRef.current) {
      const input = subjectRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newSubject = templateSubject.substring(0, start) + placeholder + templateSubject.substring(end);
      setTemplateSubject(newSubject);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else if (bodyRef.current) {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newBody = templateBody.substring(0, start) + placeholder + templateBody.substring(end);
      setTemplateBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const addCustomPlaceholder = () => {
    const name = newPlaceholderName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Platzhalter-Namen ein",
        variant: "destructive",
      });
      return;
    }
    if (isAutoPlaceholder(name)) {
      toast({
        title: "Fehler",
        description: "Dieser Name ist für automatische Platzhalter reserviert",
        variant: "destructive",
      });
      return;
    }
    
    // Insert the placeholder at cursor position
    insertPlaceholder(`{{${name}}}`);
    setNewPlaceholderName("");
  };

  const updatePlaceholderValue = (name: string, value: string) => {
    setCustomPlaceholders(prev => 
      prev.map(p => p.name === name ? { ...p, value } : p)
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            E-Mail Vorlagen
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">E-Mail Vorlagen Editor</DialogTitle>
            <DialogDescription>
              Erstellen und verwalten Sie Ihre E-Mail-Vorlagen mit automatischen und eigenen Platzhaltern.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Collapsible Templates List */}
            <div className={`flex flex-col border-r bg-muted/30 transition-all duration-300 ${showTemplateList ? 'w-56' : 'w-12'}`}>
              <div className="flex items-center justify-between p-3 border-b">
                {showTemplateList && (
                  <span className="text-sm font-medium">Vorlagen</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowTemplateList(!showTemplateList)}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${showTemplateList ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {showTemplateList ? (
                <ScrollArea className="flex-1 p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="w-full mb-3 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Neue Vorlage
                  </Button>
                  
                  {isLoading && templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Lädt...</p>
                  ) : templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Keine Vorlagen
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                            editingTemplate?.id === template.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                          onClick={() => handleEdit(template)}
                        >
                          <span className="truncate flex-1">{template.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                              editingTemplate?.id === template.id ? 'hover:bg-primary-foreground/20' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(template.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center py-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetForm}
                    className="mb-2"
                    title="Neue Vorlage"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {templates.slice(0, 5).map((template) => (
                    <Button
                      key={template.id}
                      variant={editingTemplate?.id === template.id ? "default" : "ghost"}
                      size="icon"
                      className="mb-1"
                      onClick={() => handleEdit(template)}
                      title={template.name}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-5">
                  {/* Template Name */}
                  <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-sm font-medium">
                      Vorlagenname <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="z.B. Erstkontakt Vorlage"
                      maxLength={100}
                      className="h-10"
                    />
                  </div>

                  {/* Placeholders Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">Platzhalter</Label>
                      <span className="text-xs text-muted-foreground">Klicken zum Einfügen in {activeField === "subject" ? "Betreff" : "Text"}</span>
                    </div>
                    
                    {/* Auto Placeholders */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Automatisch (von Lead-Daten)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {AUTO_PLACEHOLDERS.map((p) => (
                          <Badge
                            key={p.key}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 py-1"
                            onClick={() => insertPlaceholder(p.key)}
                          >
                            {p.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Custom Placeholders */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hand className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-medium text-muted-foreground">Eigene Platzhalter (manuell ausfüllen)</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {usedManualPlaceholders.map((name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 py-1 border-orange-500/50"
                            onClick={() => insertPlaceholder(`{{${name}}}`)}
                          >
                            {name}
                          </Badge>
                        ))}
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={newPlaceholderName}
                            onChange={(e) => setNewPlaceholderName(e.target.value)}
                            placeholder="neuer_platzhalter"
                            className="h-7 w-36 text-xs"
                            onKeyPress={(e) => e.key === 'Enter' && addCustomPlaceholder()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={addCustomPlaceholder}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="template-subject" className="text-sm font-medium">Betreff</Label>
                    <Input
                      ref={subjectRef}
                      id="template-subject"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      onFocus={() => setActiveField("subject")}
                      placeholder="z.B. Anfrage bzgl. {{firma_name}}"
                      maxLength={200}
                      className="h-10 font-mono text-sm"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label htmlFor="template-body" className="text-sm font-medium">
                      E-Mail Text <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      ref={bodyRef}
                      id="template-body"
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      onFocus={() => setActiveField("body")}
                      placeholder={`Hallo {{person_vorname}},

ich habe gesehen, dass {{firma_name}} in {{ortschaft}} tätig ist...

Mit freundlichen Grüssen
{{mein_name}}`}
                      className="min-h-[280px] font-mono text-sm resize-y"
                    />
                  </div>

                  {/* Manual Fields - Only show if there are manual placeholders used */}
                  {usedManualPlaceholders.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Hand className="h-4 w-4 text-orange-500" />
                          <Label className="text-sm font-medium">Werte für eigene Platzhalter</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {customPlaceholders.map((placeholder) => (
                            <div key={placeholder.name} className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground font-mono">
                                {`{{${placeholder.name}}}`}
                              </Label>
                              <Input
                                value={placeholder.value}
                                onChange={(e) => updatePlaceholderValue(placeholder.name, e.target.value)}
                                placeholder={`Wert für ${placeholder.name}`}
                                className="h-9"
                                maxLength={500}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-muted/30">
                <div className="text-xs text-muted-foreground">
                  {editingTemplate ? (
                    <span>Bearbeite: <strong>{editingTemplate.name}</strong></span>
                  ) : (
                    <span>Neue Vorlage erstellen</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingTemplate && (
                    <Button variant="outline" onClick={resetForm} size="sm">
                      <X className="h-4 w-4 mr-1.5" />
                      Abbrechen
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={isLoading} size="sm">
                    <Save className="h-4 w-4 mr-1.5" />
                    {editingTemplate ? "Aktualisieren" : "Speichern"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Vorlage wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
