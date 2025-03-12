import { useState, useRef, useEffect } from 'react';
import { X, Search, Book, Image } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export type ReferenceType = 'page' | 'symbol';

export interface Reference {
  id: number;
  type: ReferenceType;
  label: string;
}

interface ReferenceSelectorProps {
  onSelect: (reference: Reference) => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function ReferenceSelector({ onSelect, onBlur, inputRef }: ReferenceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<ReferenceType>('page');

  // Get pages for reference
  const { data: pagesData } = useQuery({
    queryKey: ['/api/pages'],
    retry: false
  });

  // Get symbols for reference
  const { data: symbolsData } = useQuery({
    queryKey: ['/api/symbols/all'],
    retry: false
  });

  const pages = pagesData?.pages || [];
  const symbols = symbolsData?.symbols || [];

  const filterItems = () => {
    if (activeType === 'page') {
      return pages
        .filter(page => 
          page.folioNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.id.toString().includes(searchQuery)
        )
        .map(page => ({
          id: page.id,
          type: 'page' as ReferenceType,
          label: `Page ${page.folioNumber}`,
          value: page.id.toString(),
          section: page.section
        }));
    } else {
      return symbols
        .filter(symbol => 
          symbol.id.toString().includes(searchQuery) ||
          (symbol.category && symbol.category.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .map(symbol => ({
          id: symbol.id,
          type: 'symbol' as ReferenceType,
          label: `Symbol ${symbol.id}${symbol.category ? ` (${symbol.category})` : ''}`,
          value: symbol.id.toString(),
          pageId: symbol.pageId
        }));
    }
  };

  const filteredItems = filterItems();

  const handleSelect = (item: any) => {
    onSelect({
      id: item.id,
      type: item.type,
      label: item.label
    });
    setOpen(false);
    
    // If the input is part of an editing context, the onBlur helps to restore focus
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Add reference</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="start">
        <Command>
          <CommandInput 
            placeholder="Search pages or symbols..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <div className="flex border-b p-1 px-2">
            <Button
              variant={activeType === 'page' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-7 flex gap-1"
              onClick={() => setActiveType('page')}
            >
              <Book className="h-3.5 w-3.5" />
              Pages
            </Button>
            <Button
              variant={activeType === 'symbol' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-7 flex gap-1"
              onClick={() => setActiveType('symbol')}
            >
              <Image className="h-3.5 w-3.5" />
              Symbols
            </Button>
          </div>
          <CommandList>
            <CommandEmpty>No matches found</CommandEmpty>
            <CommandGroup>
              {filteredItems.slice(0, 50).map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`${item.type}-${item.id}`}
                  onSelect={() => handleSelect(item)}
                >
                  <div className="flex items-center">
                    {item.type === 'page' ? (
                      <Book className="h-4 w-4 mr-2 text-muted-foreground" />
                    ) : (
                      <Image className="h-4 w-4 mr-2 text-muted-foreground" />
                    )}
                    <span>{item.label}</span>
                    {item.type === 'page' && item.section && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.section}
                      </Badge>
                    )}
                    {item.type === 'symbol' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Page {pages.find(p => p.id === item.pageId)?.folioNumber || item.pageId}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
              {filteredItems.length > 50 && (
                <div className="py-2 px-2 text-xs text-muted-foreground">
                  Showing 50 of {filteredItems.length} results. Refine your search.
                </div>
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
  if (references.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {references.map((ref) => (
        <Badge 
          key={`${ref.type}-${ref.id}`} 
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          {ref.type === 'page' ? (
            <Book className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Image className="h-3 w-3 text-muted-foreground" />
          )}
          <span>{ref.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove(ref)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}

export function findReferencePattern(text: string): { references: string[], newText: string } {
  // Match pattern like {page123} or {symbol456}
  const pattern = /{(page|symbol)(\d+)}/g;
  const references: string[] = [];
  
  // Find all matches
  let match;
  while ((match = pattern.exec(text)) !== null) {
    references.push(match[0]);
  }
  
  return {
    references,
    newText: text
  };
}

export function insertReferenceAtCursor(
  text: string,
  reference: Reference,
  cursorPosition: number
): string {
  const referenceText = `{${reference.type}${reference.id}}`;
  return text.substring(0, cursorPosition) + referenceText + text.substring(cursorPosition);
}

export function formatTextWithReferences(text: string): string {
  // Replace {page123} with "Page 123"
  const pagePattern = /{page(\d+)}/g;
  text = text.replace(pagePattern, (match, pageId) => `Page ${pageId}`);
  
  // Replace {symbol456} with "Symbol 456"
  const symbolPattern = /{symbol(\d+)}/g;
  text = text.replace(symbolPattern, (match, symbolId) => `Symbol ${symbolId}`);
  
  return text;
}