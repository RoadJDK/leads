import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Plus, Save, Trash2, X, ChevronRight, Sparkles, Hand, GripVertical, Briefcase, Building, User, Star, Heart, Send, MessageSquare, FileText, Zap, Target, Award, Clock, Calendar, Phone, Globe, Rocket, Lightbulb, TrendingUp, Users, ShoppingCart, Gift, Coffee, Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomPlaceholder {
  name: string;
  value: string;
}

interface ManualFields {
  custom_placeholders: CustomPlaceholder[];
  icon?: string;
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

// Available icons for templates
const TEMPLATE_ICONS = [
  { key: "mail", icon: Mail, label: "E-Mail" },
  { key: "briefcase", icon: Briefcase, label: "Aktenkoffer" },
  { key: "building", icon: Building, label: "Gebäude" },
  { key: "user", icon: User, label: "Person" },
  { key: "users", icon: Users, label: "Team" },
  { key: "star", icon: Star, label: "Stern" },
  { key: "heart", icon: Heart, label: "Herz" },
  { key: "send", icon: Send, label: "Senden" },
  { key: "message", icon: MessageSquare, label: "Nachricht" },
  { key: "file", icon: FileText, label: "Dokument" },
  { key: "zap", icon: Zap, label: "Blitz" },
  { key: "target", icon: Target, label: "Ziel" },
  { key: "award", icon: Award, label: "Auszeichnung" },
  { key: "clock", icon: Clock, label: "Uhr" },
  { key: "calendar", icon: Calendar, label: "Kalender" },
  { key: "phone", icon: Phone, label: "Telefon" },
  { key: "globe", icon: Globe, label: "Globus" },
  { key: "rocket", icon: Rocket, label: "Rakete" },
  { key: "lightbulb", icon: Lightbulb, label: "Idee" },
  { key: "trending", icon: TrendingUp, label: "Trend" },
  { key: "cart", icon: ShoppingCart, label: "Warenkorb" },
  { key: "gift", icon: Gift, label: "Geschenk" },
  { key: "coffee", icon: Coffee, label: "Kaffee" },
  { key: "smile", icon: Smile, label: "Lächeln" },
];

// Helper to get icon component by key
function getIconComponent(iconKey: string | null | undefined) {
  const found = TEMPLATE_ICONS.find(i => i.key === iconKey);
  return found?.icon || Mail;
}

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

// Editable text component with live placeholder highlighting
function EditableHighlightedText({
  value,
  onChange,
  onFocus,
  placeholder,
  className,
  minHeight = "200px"
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  // Update content when value changes externally (e.g., placeholder insertion)
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      // Only update if value changed from external source
      const currentText = editorRef.current.innerText || "";
      if (currentText !== value) {
        // Save selection
        const selection = window.getSelection();
        const hadFocus = document.activeElement === editorRef.current;

        editorRef.current.innerText = value;
        lastValueRef.current = value;

        // Restore focus and move cursor to end if we had focus
        if (hadFocus && selection) {
          editorRef.current.focus();
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    lastValueRef.current = text;
    onChange(text);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && minHeight === "40px") {
      // For single-line (subject), prevent enter
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    onFocus?.();
  };

  // Handle drop at cursor position
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const placeholderText = e.dataTransfer.getData("text/plain");
    if (!placeholderText || !editorRef.current) return;

    // Get caret position from drop point
    let caretPos = 0;
    const currentText = editorRef.current.innerText || "";

    // Try to get caret position from drop coordinates
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        // Calculate offset in plain text
        const textBeforeCaret = getTextOffsetFromRange(editorRef.current, range);
        caretPos = textBeforeCaret;
      }
    } else if ((document as any).caretPositionFromPoint) {
      const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        const textBeforeCaret = getTextOffsetFromRange(editorRef.current, pos);
        caretPos = textBeforeCaret;
      }
    }

    // Clamp position to valid range
    caretPos = Math.max(0, Math.min(caretPos, currentText.length));

    // Insert placeholder at caret position
    const newText = currentText.slice(0, caretPos) + placeholderText + currentText.slice(caretPos);
    lastValueRef.current = newText;
    editorRef.current.innerText = newText;
    onChange(newText);

    // Focus and set cursor after inserted placeholder
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection) {
      const newRange = document.createRange();
      const textNode = editorRef.current.firstChild;
      if (textNode) {
        const newPos = caretPos + placeholderText.length;
        newRange.setStart(textNode, Math.min(newPos, textNode.textContent?.length || 0));
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Sync scroll between editor and overlay
  const handleScroll = () => {
    if (editorRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = editorRef.current.scrollTop;
      overlayRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

  // Render highlighted overlay (always visible)
  const renderHighlightedContent = () => {
    if (!value) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const parts = value.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      const match = part.match(/^\{\{([^}]+)\}\}$/);
      if (match) {
        const name = match[1];
        const isAuto = isAutoPlaceholder(name);
        return (
          <span
            key={index}
            className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold mx-0.5 ${
              isAuto
                ? "bg-placeholder-auto-bg text-placeholder-auto"
                : "bg-placeholder-manual-bg text-placeholder-manual"
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="relative">
      {/* Highlighted overlay (always visible, behind text) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 px-3 py-2 pointer-events-none font-mono text-xs md:text-sm whitespace-pre-wrap break-words overflow-auto"
        style={{ minHeight }}
        aria-hidden="true"
      >
        {renderHighlightedContent()}
      </div>
      {/* Editable layer (transparent text, visible caret) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        className={`w-full px-3 py-2 rounded-md border border-input bg-transparent font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-auto whitespace-pre-wrap break-words text-transparent caret-black dark:caret-white relative z-10 ${className}`}
        style={{ minHeight }}
      />
    </div>
  );
}

// Helper to get text offset from a Range or CaretPosition
function getTextOffsetFromRange(container: HTMLElement, rangeOrPos: Range | any): number {
  const fullText = container.innerText || "";

  if (rangeOrPos instanceof Range) {
    // Create a range from start of container to the caret position
    const preCaretRange = document.createRange();
    preCaretRange.selectNodeContents(container);
    preCaretRange.setEnd(rangeOrPos.startContainer, rangeOrPos.startOffset);
    return preCaretRange.toString().length;
  }

  // CaretPosition (Firefox)
  if (rangeOrPos.offsetNode) {
    const preCaretRange = document.createRange();
    preCaretRange.selectNodeContents(container);
    preCaretRange.setEnd(rangeOrPos.offsetNode, rangeOrPos.offset);
    return preCaretRange.toString().length;
  }

  return fullText.length;
}

// Draggable placeholder badge
function DraggablePlaceholder({ 
  placeholder, 
  label, 
  isAuto, 
  onClick 
}: { 
  placeholder: string; 
  label: string; 
  isAuto: boolean;
  onClick: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", placeholder);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Badge
      variant={isAuto ? "secondary" : "outline"}
      className={`cursor-grab active:cursor-grabbing select-none transition-all text-xs px-2 py-1 gap-1 ${
        isAuto 
          ? "hover:bg-placeholder-auto hover:text-primary-foreground border-placeholder-auto/30" 
          : "hover:bg-placeholder-manual hover:text-primary-foreground border-placeholder-manual/50"
      }`}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <GripVertical className="h-3 w-3 opacity-50" />
      {label}
    </Badge>
  );
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
  const [templateIcon, setTemplateIcon] = useState<string>("mail");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // Track active field for placeholder insertion
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  useEffect(() => {
    if (open) {
      fetchTemplates(true); // Auto-select first template when opening
    }
  }, [open]);

  // Only use manually added placeholders (no auto-detection from text)
  const usedManualPlaceholders = useMemo(() => {
    return customPlaceholders.map(p => p.name);
  }, [customPlaceholders]);

  const fetchTemplates = async (autoSelectFirst = false) => {
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
      const mappedTemplates = data.map(item => {
        const rawFields = item.manual_fields as any;
        let manualFields: ManualFields;

        if (rawFields && Array.isArray(rawFields.custom_placeholders)) {
          manualFields = rawFields as ManualFields;
        } else {
          manualFields = { custom_placeholders: [] };
        }

        return {
          ...item,
          manual_fields: manualFields
        };
      });
      setTemplates(mappedTemplates);

      // Auto-select first template when opening the editor
      if (autoSelectFirst && mappedTemplates.length > 0 && !editingTemplate) {
        const firstTemplate = mappedTemplates[0];
        setEditingTemplate(firstTemplate);
        setTemplateName(firstTemplate.name);
        setTemplateSubject(firstTemplate.subject || "");
        setTemplateBody(firstTemplate.body_template);
        setCustomPlaceholders(firstTemplate.manual_fields.custom_placeholders || []);
        setTemplateIcon(firstTemplate.manual_fields.icon || "mail");
      }
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
    setCustomPlaceholders([]);
    setNewPlaceholderName("");
    setTemplateIcon("mail");
    setEditingTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject || "");
    setTemplateBody(template.body_template);
    setCustomPlaceholders(template.manual_fields.custom_placeholders || []);
    setTemplateIcon(template.manual_fields.icon || "mail");
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
      manual_fields: JSON.parse(JSON.stringify({ custom_placeholders: customPlaceholders, icon: templateIcon })),
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

  // Simple placeholder insertion - appends to active field
  const insertPlaceholder = useCallback((placeholder: string) => {
    if (activeField === "subject") {
      setTemplateSubject(prev => prev + placeholder);
    } else {
      setTemplateBody(prev => prev + placeholder);
    }
  }, [activeField]);


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
    if (usedManualPlaceholders.includes(name)) {
      toast({
        title: "Info",
        description: "Dieser Platzhalter existiert bereits",
      });
      setNewPlaceholderName("");
      return;
    }
    
    // Add to custom placeholders list without inserting into text
    setCustomPlaceholders(prev => [...prev, { name, value: "" }]);
    setNewPlaceholderName("");
    toast({
      title: "Platzhalter erstellt",
      description: `{{${name}}} ist jetzt verfügbar. Klicken oder ziehen Sie ihn in den Text.`,
    });
  };

  const updatePlaceholderValue = (name: string, value: string) => {
    setCustomPlaceholders(prev =>
      prev.map(p => p.name === name ? { ...p, value } : p)
    );
  };

  const deleteCustomPlaceholder = (name: string) => {
    setCustomPlaceholders(prev => prev.filter(p => p.name !== name));
    toast({
      title: "Platzhalter entfernt",
      description: `{{${name}}} wurde aus der Liste entfernt.`,
    });
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
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b shrink-0">
            <DialogTitle className="text-lg md:text-xl">E-Mail Vorlagen Editor</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Erstellen und verwalten Sie Ihre E-Mail-Vorlagen. Platzhalter per Klick oder Drag & Drop einfügen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Collapsible Templates List */}
            <div className={`flex flex-col border-r bg-muted/30 transition-all duration-300 shrink-0 ${showTemplateList ? 'w-48 md:w-56' : 'w-10 md:w-12'}`}>
              <div className="flex items-center justify-between p-2 md:p-3 border-b">
                {showTemplateList && (
                  <span className="text-xs md:text-sm font-medium truncate">Vorlagen</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 md:h-7 md:w-7 shrink-0"
                  onClick={() => setShowTemplateList(!showTemplateList)}
                >
                  <ChevronRight className={`h-3 w-3 md:h-4 md:w-4 transition-transform ${showTemplateList ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {showTemplateList ? (
                <ScrollArea className="flex-1 p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="w-full mb-3 gap-1.5 text-xs"
                  >
                    <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Neue Vorlage
                  </Button>
                  
                  {isLoading && templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Lädt...</p>
                  ) : templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Keine Vorlagen
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {templates.map((template) => {
                        const IconComp = getIconComponent(template.manual_fields.icon);
                        return (
                          <div
                            key={template.id}
                            className={`group flex items-center gap-1.5 px-2 py-1.5 md:py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                              editingTemplate?.id === template.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent"
                            }`}
                            onClick={() => handleEdit(template)}
                          >
                            <IconComp className="h-3.5 w-3.5 shrink-0" />
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
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center py-3 gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={resetForm}
                          className="h-7 w-7 md:h-8 md:w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Neue Vorlage</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {templates.slice(0, 6).map((template) => {
                    const IconComp = getIconComponent(template.manual_fields.icon);
                    return (
                      <TooltipProvider key={template.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={editingTemplate?.id === template.id ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => handleEdit(template)}
                            >
                              <IconComp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">{template.name}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <ScrollArea className="flex-1">
                <div className="p-3 md:p-6 space-y-4 md:space-y-5">
                  {/* Template Name with icon picker */}
                  <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-xs md:text-sm font-medium">
                      Vorlagenname <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="z.B. Erstkontakt Vorlage"
                        maxLength={100}
                        className="h-9 md:h-10 flex-1 text-sm"
                      />
                      <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 md:h-10 md:w-10 shrink-0"
                          >
                            {(() => {
                              const IconComp = getIconComponent(templateIcon);
                              return <IconComp className="h-4 w-4" />;
                            })()}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="end">
                          <div className="text-xs font-medium mb-2 text-muted-foreground">Icon auswählen</div>
                          <div className="grid grid-cols-6 gap-1">
                            {TEMPLATE_ICONS.map((item) => {
                              const IconComp = item.icon;
                              return (
                                <TooltipProvider key={item.key}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={templateIcon === item.key ? "default" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setTemplateIcon(item.key);
                                          setIconPickerOpen(false);
                                        }}
                                      >
                                        <IconComp className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">{item.label}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Placeholders Section */}
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                      <Label className="text-xs md:text-sm font-medium">Platzhalter</Label>
                      <span className="text-[10px] md:text-xs text-muted-foreground">
                        Klicken oder ziehen zum Einfügen in {activeField === "subject" ? "Betreff" : "Text"}
                      </span>
                    </div>
                    
                    {/* Auto Placeholders */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5 text-placeholder-auto" />
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Automatisch (von Lead-Daten)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {AUTO_PLACEHOLDERS.map((p) => (
                          <DraggablePlaceholder
                            key={p.key}
                            placeholder={p.key}
                            label={p.label}
                            isAuto={true}
                            onClick={() => insertPlaceholder(p.key)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom Placeholders */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hand className="h-3 w-3 md:h-3.5 md:w-3.5 text-placeholder-manual" />
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Eigene Platzhalter (manuell ausfüllen)</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {usedManualPlaceholders.map((name) => (
                          <div key={name} className="group relative flex items-center">
                            <DraggablePlaceholder
                              placeholder={`{{${name}}}`}
                              label={name}
                              isAuto={false}
                              onClick={() => insertPlaceholder(`{{${name}}}`)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteCustomPlaceholder(name)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={newPlaceholderName}
                            onChange={(e) => setNewPlaceholderName(e.target.value)}
                            placeholder="neuer_platzhalter"
                            className="h-7 w-28 md:w-36 text-xs"
                            onKeyPress={(e) => e.key === 'Enter' && addCustomPlaceholder()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={addCustomPlaceholder}
                          >
                            <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Subject with live highlighting */}
                  <div className="space-y-2">
                    <Label htmlFor="template-subject" className="text-xs md:text-sm font-medium">Betreff</Label>
                    <EditableHighlightedText
                      value={templateSubject}
                      onChange={setTemplateSubject}
                      onFocus={() => setActiveField("subject")}
                      placeholder="z.B. Anfrage bzgl. {{firma_name}}"
                      minHeight="40px"
                      className="min-h-[40px]"
                    />
                  </div>

                  {/* Body with live highlighting */}
                  <div className="space-y-2">
                    <Label htmlFor="template-body" className="text-xs md:text-sm font-medium">
                      E-Mail Text <span className="text-destructive">*</span>
                    </Label>
                    <EditableHighlightedText
                      value={templateBody}
                      onChange={setTemplateBody}
                      onFocus={() => setActiveField("body")}
                      placeholder={`Hallo {{person_vorname}},

ich habe gesehen, dass {{firma_name}} in {{ortschaft}} tätig ist...

Mit freundlichen Grüssen
{{mein_name}}`}
                      minHeight="280px"
                    />
                  </div>

                  {/* Manual Fields - Only show if there are manual placeholders used */}
                  {usedManualPlaceholders.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Hand className="h-3.5 w-3.5 md:h-4 md:w-4 text-placeholder-manual" />
                          <Label className="text-xs md:text-sm font-medium">Werte für eigene Platzhalter</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {customPlaceholders.map((placeholder) => (
                            <div key={placeholder.name} className="space-y-1.5">
                              <Label className="text-[10px] md:text-xs text-muted-foreground font-mono">
                                {`{{${placeholder.name}}}`}
                              </Label>
                              <Input
                                value={placeholder.value}
                                onChange={(e) => updatePlaceholderValue(placeholder.name, e.target.value)}
                                placeholder={`Wert für ${placeholder.name}`}
                                className="h-8 md:h-9 text-sm"
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-3 px-3 md:px-6 py-3 md:py-4 border-t bg-muted/30 shrink-0">
                <div className="text-[10px] md:text-xs text-muted-foreground">
                  {editingTemplate ? (
                    <span>Bearbeite: <strong>{editingTemplate.name}</strong></span>
                  ) : (
                    <span>Neue Vorlage erstellen</span>
                  )}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  {editingTemplate && (
                    <Button variant="outline" onClick={resetForm} size="sm" className="flex-1 md:flex-none text-xs md:text-sm">
                      <X className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" />
                      Abbrechen
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={isLoading} size="sm" className="flex-1 md:flex-none text-xs md:text-sm">
                    <Save className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" />
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
