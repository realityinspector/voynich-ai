import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Braces, X, BookOpen, Hash } from 'lucide-react';

export type ReferenceType = 'page' | 'symbol';

export interface Reference {
  id: number;
  type: ReferenceType;
  label: string;
}

interface ReferenceSelectorProps {
  onSelect: (reference: Reference) => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
}

export function ReferenceSelector({ onSelect, onBlur, inputRef }: ReferenceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ReferenceType>('page');

  // Fetch manuscript pages
  const { data: pagesData } = useQuery({
    queryKey: ['/api/pages'],
    retry: false,
  });
  
  // Fetch all symbols (expensive operation, but useful for reference)
  const { data: symbolsData } = useQuery({
    queryKey: ['/api/symbols/page/all'],  // This will need to be implemented
    retry: false,
  });
  
  const pages = pagesData?.pages || [];
  const symbols = symbolsData?.symbols || [];
  
  // Filter pages based on search
  const filteredPages = pages.filter((page: any) => {
    const folioNumber = page.folioNumber || '';
    return folioNumber.toLowerCase().includes(search.toLowerCase());
  });
  
  // Filter symbols based on search
  const filteredSymbols = symbols.filter((symbol: any) => {
    const label = `symbol${symbol.id}`;
    const category = symbol.category || '';
    return label.toLowerCase().includes(search.toLowerCase()) || 
           category.toLowerCase().includes(search.toLowerCase());
  }).slice(0, 50); // Limit to 50 symbols for performance

  const handleSelect = (item: any, type: ReferenceType) => {
    let label = '';
    
    if (type === 'page') {
      label = item.folioNumber;
    } else if (type === 'symbol') {
      label = `symbol${item.id}`;
    }
    
    onSelect({
      id: item.id,
      type,
      label
    });
    
    setOpen(false);
    setSearch('');
  };
  
  // Determine which symbol to show based on page
  const getSymbolsByPage = (pageId: number) => {
    return symbols.filter((s: any) => s.pageId === pageId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-sm flex items-center gap-1"
        >
          <Braces className="h-4 w-4 mr-1" />
          Add Reference
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" sideOffset={5} style={{ width: '350px' }}>
        <Command>
          <div className="flex border-b">
            <Button
              variant={activeTab === 'page' ? 'default' : 'ghost'}
              className={`flex-1 rounded-none ${activeTab === 'page' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setActiveTab('page')}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Pages
            </Button>
            <Button
              variant={activeTab === 'symbol' ? 'default' : 'ghost'}
              className={`flex-1 rounded-none ${activeTab === 'symbol' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setActiveTab('symbol')}
            >
              <Hash className="h-4 w-4 mr-1" />
              Symbols
            </Button>
          </div>
          <CommandInput 
            placeholder={activeTab === 'page' ? "Search pages..." : "Search symbols..."}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No {activeTab === 'page' ? 'pages' : 'symbols'} found.</CommandEmpty>
            <CommandGroup>
              {activeTab === 'page' ? (
                filteredPages.map((p: any) => (
                  <CommandItem
                    key={p.id}
                    value={p.folioNumber}
                    onSelect={() => handleSelect(p, 'page')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="flex-1">{p.folioNumber}</span>
                    <Badge variant="outline" className="ml-2">
                      {getSymbolsByPage(p.id).length} symbols
                    </Badge>
                  </CommandItem>
                ))
              ) : (
                filteredSymbols.map((symbol: any) => (
                  <CommandItem
                    key={symbol.id}
                    value={`symbol${symbol.id}`}
                    onSelect={() => handleSelect(symbol, 'symbol')}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    <span>symbol{symbol.id}</span>
                    {symbol.category && (
                      <Badge variant="outline" className="ml-2">
                        {symbol.category}
                      </Badge>
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface ReferenceDisplayProps {
  references: Reference[];
  onRemove: (ref: Reference) => void;
}

export function ReferenceDisplay({ references, onRemove }: ReferenceDisplayProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {references.map((ref) => (
        <Badge 
          key={`${ref.type}-${ref.id}`} 
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          {ref.type === 'page' ? (
            <BookOpen className="h-3 w-3" />
          ) : (
            <Hash className="h-3 w-3" />
          )}
          <span>{ref.label}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onRemove(ref)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}

// Function to find reference patterns in text (like {page123} or {symbol456})
export function findReferencePattern(text: string): { references: string[], newText: string } {
  const refRegex = /\{(page|symbol)(\d+)\}/g;
  const references: string[] = [];
  const matches = text.match(refRegex) || [];
  
  // Extract all references
  matches.forEach((match) => {
    references.push(match);
  });
  
  // Remove references from text (if needed)
  const newText = text.replace(refRegex, '');
  
  return { references, newText };
}

// Function to insert reference at cursor position
export function insertReferenceAtCursor(
  text: string,
  reference: Reference,
  cursorPosition: number
): string {
  const refText = `{${reference.type}${reference.id}}`;
  
  // Insert at cursor position
  const before = text.slice(0, cursorPosition);
  const after = text.slice(cursorPosition);
  
  return before + refText + after;
}

// Format text by highlighting references
export function formatTextWithReferences(text: string): string {
  // You could implement a more sophisticated highlighting here if needed
  return text.replace(/\{(page|symbol)(\d+)\}/g, 
    '<span class="reference-highlight">$&</span>');
}