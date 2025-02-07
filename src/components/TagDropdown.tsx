import { useRef, useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagDropdownProps {
  tags: Tag[];
  selectedTag: Tag | null;
  onSelect: (tag: Tag) => void;
  onCreateTag: (name: string) => Promise<void>;
  onDeleteTag?: (tagId: number) => Promise<void>;
}

export default function TagDropdown({ tags, selectedTag, onSelect, onCreateTag, onDeleteTag }: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagClick = () => {
    setIsOpen(true);
  };

  const handleSelect = (tag: Tag) => {
    onSelect(tag);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateNewTag = async () => {
    await onCreateTag(searchTerm);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleDeleteTag = async (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();  // Prevent tag selection
    e.preventDefault();   // Prevent form submission
    if (!onDeleteTag) return;
    
    if (confirm('Are you sure you want to delete this tag? This will remove the tag from all leads.')) {
      await onDeleteTag(tagId);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Tag Display / Search Input */}
      <div 
        onClick={handleTagClick}
        className="w-full px-4 py-2 bg-[#2f2f2f] rounded-md border border-gray-700 cursor-pointer"
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-white"
            placeholder="Search or create tag..."
          />
        ) : (
          selectedTag ? (
            <span
              className="px-2 py-1 rounded text-sm inline-block"
              style={{ backgroundColor: selectedTag.color + '20', color: selectedTag.color }}
            >
              {selectedTag.name}
            </span>
          ) : (
            <span className="text-gray-400">Select a tag</span>
          )
        )}
      </div>

      {/* Dropdown Options - Fixed positioning to avoid clipping */}
      {isOpen && (
        <div 
          className="fixed z-50 mt-1 bg-[#2f2f2f] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            minWidth: containerRef.current?.offsetWidth,
            width: containerRef.current?.offsetWidth,
            top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: containerRef.current?.getBoundingClientRect().left
          }}
        >
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <div
                key={tag.id}
                onClick={() => handleSelect(tag)}
                className="px-4 py-2 hover:bg-[#3f3f3f] cursor-pointer flex items-center justify-between group"
              >
                <span
                  className="px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
                {onDeleteTag && (
                  <button
                    onClick={(e) => handleDeleteTag(e, tag.id)}
                    className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : null}
          
          {/* Create New Tag Option */}
          {searchTerm && !filteredTags.find(t => t.name.toLowerCase() === searchTerm.toLowerCase()) && (
            <div
              onClick={handleCreateNewTag}
              className="px-4 py-2 hover:bg-[#3f3f3f] cursor-pointer flex items-center text-blue-400"
            >
              <FiPlus className="mr-2" />
              Create "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}