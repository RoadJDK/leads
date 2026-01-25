import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Plus, Save, Trash2, Edit2, X, GripVertical } from "lucide-react";
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

interface ManualFields {
  absender_vorname: string;
  absender_name: string;
  absender_telefon: string;
  absender_email: string;
  weitere_eigene: string;
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
  { key: "{{person_vorname}}", label: "Person Vorname", type: "auto" },
  { key: "{{person_nachname}}", label: "Person Nachname", type: "auto" },
  { key: "{{firma_name}}", label: "Firma Name", type: "auto" },
  { key: "{{firma_branche}}", label: "Firma Branche", type: "auto" },
  { key: "{{ortschaft}}", label: "Ortschaft", type: "auto" },
];

const MANUAL_PLACEHOLDERS = [
  { key: "{{absender_vorname}}", label: "Absender Vorname", field: "absender_vorname" },
  { key: "{{absender_name}}", label: "Absender Name", field: "absender_name" },
  { key: "{{absender_telefon}}", label: "Absender Telefon", field: "absender_telefon" },
  { key: "{{absender_email}}", label: "Absender E-Mail", field: "absender_email" },
  { key: "{{weitere_eigene}}", label: "Weitere Eigene", field: "weitere_eigene" },
];

export function EmailTemplateEditor() {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [manualFields, setManualFields] = useState<ManualFields>({
    absender_vorname: "",
    absender_name: "",
    absender_telefon: "",
    absender_email: "",
    weitere_eigene: "",
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

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
      setTemplates(data.map(item => ({
        ...item,
        manual_fields: item.manual_fields as unknown as ManualFields
      })));
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
    setManualFields({
      absender_vorname: "",
      absender_name: "",
      absender_telefon: "",
      absender_email: "",
      weitere_eigene: "",
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject || "");
    setTemplateBody(template.body_template);
    setManualFields(template.manual_fields);
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

    // Validate email if provided
    if (manualFields.absender_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualFields.absender_email)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const templateData = {
      name: templateName.trim(),
      subject: templateSubject.trim() || null,
      body_template: templateBody,
      manual_fields: JSON.parse(JSON.stringify(manualFields)),
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
    const textarea = document.getElementById("template-body") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = templateBody.substring(0, start) + placeholder + templateBody.substring(end);
      setTemplateBody(newBody);
      // Set cursor position after placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      setTemplateBody(templateBody + placeholder);
    }
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>E-Mail Vorlagen Editor</DialogTitle>
            <DialogDescription>
              Erstellen und verwalten Sie Ihre E-Mail-Vorlagen für den automatischen Outreach.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Templates List */}
            <div className="w-64 flex flex-col border-r pr-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Vorlagen</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-8 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Neu
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {isLoading && templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Lädt...</p>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Vorlagen vorhanden
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          editingTemplate?.id === template.id
                            ? "border-primary bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => handleEdit(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate flex-1">
                              {template.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(template.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="grid gap-4 flex-1 overflow-auto pb-4">
                <div className="grid gap-2">
                  <Label htmlFor="template-name">Vorlagenname *</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="z.B. Erstkontakt Vorlage"
                    maxLength={100}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template-subject">Betreff</Label>
                  <Input
                    id="template-subject"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    placeholder="z.B. Anfrage bzgl. Zusammenarbeit"
                    maxLength={200}
                  />
                </div>

                {/* Placeholders */}
                <div className="grid gap-2">
                  <Label>Platzhalter (klicken zum Einfügen)</Label>
                  <div className="flex flex-wrap gap-2">
                    {AUTO_PLACEHOLDERS.map((p) => (
                      <Badge
                        key={p.key}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => insertPlaceholder(p.key)}
                      >
                        <GripVertical className="h-3 w-3 mr-1" />
                        {p.label}
                        <span className="ml-1 text-xs opacity-70">(Auto)</span>
                      </Badge>
                    ))}
                    {MANUAL_PLACEHOLDERS.map((p) => (
                      <Badge
                        key={p.key}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => insertPlaceholder(p.key)}
                      >
                        <GripVertical className="h-3 w-3 mr-1" />
                        {p.label}
                        <span className="ml-1 text-xs opacity-70">(Manuell)</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template-body">E-Mail Text *</Label>
                  <Textarea
                    id="template-body"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder={`Hallo {{person_vorname}},\n\nich bin {{absender_vorname}} {{absender_name}} von...\n\nLiebe Grüsse\n{{absender_vorname}} {{absender_name}}`}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <Separator />

                {/* Manual Fields */}
                <div className="grid gap-3">
                  <Label className="font-medium">Manuelle Felder ausfüllen</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="absender_vorname" className="text-xs text-muted-foreground">
                        Absender Vorname
                      </Label>
                      <Input
                        id="absender_vorname"
                        value={manualFields.absender_vorname}
                        onChange={(e) =>
                          setManualFields({ ...manualFields, absender_vorname: e.target.value })
                        }
                        placeholder="Max"
                        maxLength={50}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="absender_name" className="text-xs text-muted-foreground">
                        Absender Name
                      </Label>
                      <Input
                        id="absender_name"
                        value={manualFields.absender_name}
                        onChange={(e) =>
                          setManualFields({ ...manualFields, absender_name: e.target.value })
                        }
                        placeholder="Mustermann"
                        maxLength={50}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="absender_telefon" className="text-xs text-muted-foreground">
                        Absender Telefon
                      </Label>
                      <Input
                        id="absender_telefon"
                        value={manualFields.absender_telefon}
                        onChange={(e) =>
                          setManualFields({ ...manualFields, absender_telefon: e.target.value })
                        }
                        placeholder="+41 79 123 45 67"
                        maxLength={30}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="absender_email" className="text-xs text-muted-foreground">
                        Absender E-Mail
                      </Label>
                      <Input
                        id="absender_email"
                        type="email"
                        value={manualFields.absender_email}
                        onChange={(e) =>
                          setManualFields({ ...manualFields, absender_email: e.target.value })
                        }
                        placeholder="max@beispiel.ch"
                        maxLength={100}
                      />
                    </div>
                    <div className="grid gap-1.5 col-span-2">
                      <Label htmlFor="weitere_eigene" className="text-xs text-muted-foreground">
                        Weitere Eigene
                      </Label>
                      <Input
                        id="weitere_eigene"
                        value={manualFields.weitere_eigene}
                        onChange={(e) =>
                          setManualFields({ ...manualFields, weitere_eigene: e.target.value })
                        }
                        placeholder="Zusätzliche Information..."
                        maxLength={200}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                {editingTemplate && (
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? "Aktualisieren" : "Speichern"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
