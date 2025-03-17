import { useState, useRef, useCallback } from 'react';
import Modal from './Modal';
import { FiUpload, FiCheck, FiX } from 'react-icons/fi';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mappedData: any[]) => Promise<boolean>;
  fields: { key: string; label: string }[];
}

export default function ImportCSVModal({ isOpen, onClose, onImport, fields }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setHeaders([]);
    setMapping({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    // Parse headers from the CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const firstLine = text.split('\n')[0];
        const csvHeaders = firstLine.split(',').map(header => 
          header.trim().replace(/^"|"$/g, '') // Remove quotes if present
        );
        setHeaders(csvHeaders);
        
        // Initialize mapping with best-guess matches
        const initialMapping: Record<string, string> = {};
        csvHeaders.forEach(header => {
          const normalizedHeader = header.toLowerCase();
          const matchedField = fields.find(field => 
            field.label.toLowerCase() === normalizedHeader || 
            field.key.toLowerCase() === normalizedHeader
          );
          if (matchedField) {
            initialMapping[header] = matchedField.key;
          }
        });
        setMapping(initialMapping);
      } catch (err) {
        setError('Failed to parse CSV headers');
        console.error(err);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingChange = (csvHeader: string, dbField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: dbField === 'none' ? '' : dbField
    }));
  };

  const processCSV = useCallback(async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          
          const batchSize = 100;
          const totalRecords = lines.length - 1; // Excluding header
          let processedRecords = 0;
          
          const mappedData = [];
          
          // Process in batches
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Handle quoted values with commas inside them
            const values: string[] = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"') {
                insideQuotes = !insideQuotes;
              } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.replace(/^"|"$/g, ''));
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            
            // Add the last value
            values.push(currentValue.replace(/^"|"$/g, ''));
            
            const record: Record<string, string> = {};
            
            // Map CSV values to database fields
            headers.forEach((header, index) => {
              const dbField = mapping[header];
              if (dbField && values[index] !== undefined) {
                // Special handling for segment - keep as string for API to handle
                record[dbField] = values[index].trim();
              }
            });
            
            if (Object.keys(record).length > 0) {
              mappedData.push(record);
            }
            
            processedRecords++;
            
            // Update progress
            if (processedRecords % 10 === 0 || processedRecords === totalRecords) {
              setProgress(Math.floor((processedRecords / totalRecords) * 100));
            }
            
            // Process in batches to avoid UI freezing
            if (mappedData.length === batchSize || i === lines.length - 1) {
              if (mappedData.length > 0) {
                await onImport(mappedData.splice(0, mappedData.length));
              }
            }
          }
          
          setProgress(100);
          setTimeout(() => {
            setIsProcessing(false);
            onClose();
            resetState();
          }, 1000);
          
        } catch (err) {
          console.error('Error processing CSV:', err);
          setError('Failed to process CSV file');
          setIsProcessing(false);
        }
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read CSV file');
      setIsProcessing(false);
    }
  }, [file, mapping, onImport, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCSV();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {
      if (!isProcessing) {
        onClose();
        resetState();
      }
    }} title="Import Leads from CSV">
      <div className="text-white">
        {!file ? (
          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <FiUpload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="mb-4 text-gray-300">Upload a CSV file to import leads</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select CSV File
              </button>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="mb-4">
            <p className="mb-2 text-center">Processing {file.name}...</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-400">{progress}% complete</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-4">
              Map the columns from your CSV file to the appropriate fields:
            </p>
            
            <div className="max-h-64 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="text-left p-2">CSV Header</th>
                    <th className="text-left p-2">Database Field</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header) => (
                    <tr key={header} className="border-b border-gray-700">
                      <td className="p-2">{header}</td>
                      <td className="p-2">
                        <select
                          value={mapping[header] || 'none'}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          className="w-full bg-gray-700 text-white p-1 rounded"
                        >
                          <option value="none">-- Select Field --</option>
                          {fields.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                disabled={Object.keys(mapping).length === 0 || Object.values(mapping).every(v => !v)}
              >
                <FiCheck className="mr-2" />
                Import Leads
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
} 