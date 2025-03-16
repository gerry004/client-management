import axios from 'axios';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

// Load environment variables
dotenv.config();

// Get API key from environment variables
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY is not defined in your .env file');
  process.exit(1);
}

interface SearchPlacesRequest {
  textQuery: string;
  maxResultCount?: number;
}

interface Place {
  displayName?: {
    text: string;
  };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
}

interface SearchPlacesResponse {
  places: Place[];
}

async function searchPlaces(type: string, location: string, maxResults: number = 60): Promise<SearchPlacesResponse> {
  try {
    const textQuery = `${type} in ${location}`;
    
    const request: SearchPlacesRequest = {
      textQuery: textQuery,
      maxResultCount: maxResults
    };
    
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
    } else {
      console.error('Error:', error);
    }
    throw error;
  }
}

interface PlaceRecord {
  name: string;
  address: string;
  phone: string;
  website: string;
  googleMapsLink: string;
  types: string;
}

async function exportToCsv(places: Place[], type: string, location: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${type.toLowerCase()}_${location.replace(/[,\s]/g, '_').toLowerCase()}_${timestamp}.csv`;
  const outputPath = path.join(process.cwd(), 'data', filename);
  
  // Ensure the data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'name', title: 'Name' },
      { id: 'address', title: 'Address' },
      { id: 'phone', title: 'Phone' },
      { id: 'website', title: 'Website' },
      { id: 'googleMapsLink', title: 'Google Maps Link' },
      { id: 'types', title: 'Types' }
    ]
  });
  
  const records: PlaceRecord[] = places.map(place => ({
    name: place.displayName?.text || 'N/A',
    address: place.formattedAddress || 'N/A',
    phone: place.internationalPhoneNumber || 'N/A',
    website: place.websiteUri || 'N/A',
    googleMapsLink: place.googleMapsUri || 'N/A',
    types: place.types ? place.types.join(', ') : 'N/A'
  }));
  
  await csvWriter.writeRecords(records);
  return outputPath;
}

// Example usage
async function main() {
  try {
    const type = 'Businesses'; // Type of place to search for
    const location = 'Rathfarnham, Dublin, Ireland'; // Location to search in
    
    const result = await searchPlaces(
      type,
      location,
    );
    console.log('Search Results:');
    console.log(`Found ${result.places.length} places`);
    const csvPath = await exportToCsv(result.places, type, location);
    console.log(`\nResults exported to: ${csvPath}`);
  } catch (error) {
    console.error('Failed to search places:', error);
  }
}

main();
