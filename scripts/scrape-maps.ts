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
  pageToken?: string;
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
  primaryType?: string;
  primaryTypeDisplayName?: {
    text: string;
  };
  editorialSummary?: {
    text: string;
  };
}

interface PlaceWithEmail extends Place {
  emails?: string[];
  websiteError?: string;
  searchCategory?: string;
  searchLocation?: string;
}

interface SearchPlacesResponse {
  places: Place[];
  nextPageToken?: string;
}

async function searchPlaces(
  type: string, 
  location: string, 
  maxResults: number = 60,
  pageToken?: string
): Promise<SearchPlacesResponse> {
  try {
    const textQuery = `${type} in ${location}`;
    
    const request: SearchPlacesRequest = {
      textQuery: textQuery,
      maxResultCount: maxResults
    };
    
    if (pageToken) {
      request.pageToken = pageToken;
    }
    
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types,places.editorialSummary,places.primaryType,places.primaryTypeDisplayName,nextPageToken'
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

async function findEmailsOnWebsite(url: string): Promise<{emails: string[], error?: string}> {
  try {
    // Validate the URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return { 
        emails: [], 
        error: `HTTP Error: ${response.status} ${response.statusText}` 
      };
    }

    // Get the HTML content
    const htmlContent = await response.text();

    // Regular expression for email pattern with valid TLDs
    // This matches common business TLDs and avoids image extensions
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|org|net|edu|gov|mil|io|co|ie|uk|co\.uk|eu|biz|info)\b/gi;
    
    // Find all matches
    const emails = htmlContent.match(emailRegex) || [];
    
    // Return unique emails as an array
    return { emails: Array.from(new Set(emails)) };
  } catch (error) {
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for certificate errors
      if (errorMessage.includes('certificate') || 
          errorMessage.includes('SSL') || 
          errorMessage.includes('CERT')) {
        errorMessage = 'Certificate Error: ' + errorMessage;
      }
    }
    
    return { emails: [], error: errorMessage };
  }
}

async function findEmailsForPlace(place: Place): Promise<{emails: string[], error?: string}> {
  if (!place.websiteUri) {
    return { emails: [] };
  }
  
  try {
    console.log(`Searching: ${place.websiteUri}`);
    let result = await findEmailsOnWebsite(place.websiteUri);
    
    // If no emails found on main page, try contact page
    if (result.emails.length === 0 && !result.error) {
      const contactUrl = place.websiteUri.endsWith('/') 
        ? `${place.websiteUri}contact` 
        : `${place.websiteUri}/contact`;
      
      console.log(`Trying contact page: ${contactUrl}`);
      const contactResult = await findEmailsOnWebsite(contactUrl);
      
      // If we found emails on the contact page, use those
      // Otherwise, keep the main page result (which might have an error)
      if (contactResult.emails.length > 0) {
        result = contactResult;
      } else if (!result.error && contactResult.error) {
        // If main page had no error but contact page did, keep the contact page error
        result.error = contactResult.error;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error finding emails for ${place.displayName?.text}:`, error);
    return { 
      emails: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

interface PlaceRecord {
  name: string;
  address: string;
  phone: string;
  website: string;
  googleMapsLink: string;
  category: string;
  types: string;
  emails: string;
  websiteError: string;
  searchCategory: string;
  searchLocation: string;
}

async function exportToCsv(places: PlaceWithEmail[], filename: string): Promise<string> {
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
      { id: 'category', title: 'Category' },
      { id: 'types', title: 'Types' },
      { id: 'emails', title: 'Emails' },
      { id: 'websiteError', title: 'Website Error' },
      { id: 'searchCategory', title: 'Search Category' },
      { id: 'searchLocation', title: 'Search Location' }
    ]
  });
  
  const records: PlaceRecord[] = places.map(place => ({
    name: place.displayName?.text || 'N/A',
    address: place.formattedAddress || 'N/A',
    phone: place.internationalPhoneNumber || 'N/A',
    website: place.websiteUri || 'N/A',
    googleMapsLink: place.googleMapsUri || 'N/A',
    category: place.primaryTypeDisplayName?.text || 'N/A',
    types: place.types ? place.types.join(', ') : 'N/A',
    emails: place.emails ? place.emails.join(', ') : 'N/A',
    websiteError: place.websiteError || '',
    searchCategory: place.searchCategory || '',
    searchLocation: place.searchLocation || ''
  }));
  
  await csvWriter.writeRecords(records);
  return outputPath;
}

async function getAllPlacesWithPagination(
  category: string, 
  location: string, 
  county: string, 
  country: string
): Promise<Place[]> {
  const fullLocation = `${location}, ${county}, ${country}`;
  let allPlaces: Place[] = [];
  let nextPageToken: string | undefined;
  let pageCount = 1;
  
  do {
    console.log(`Searching for ${category} in ${fullLocation} - Page ${pageCount}`);
    
    try {
      const result = await searchPlaces(category, fullLocation, 60, nextPageToken);
      
      // Add search metadata to each place
      const placesWithMeta = result.places.map(place => ({
        ...place,
        searchCategory: category,
        searchLocation: fullLocation
      }));
      
      allPlaces = [...allPlaces, ...placesWithMeta];
      nextPageToken = result.nextPageToken;
      
      console.log(`Found ${result.places.length} places on page ${pageCount}`);
      
      // If there's a next page, wait a bit to avoid rate limiting
      if (nextPageToken) {
        console.log('More results available, fetching next page...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      pageCount++;
    } catch (error) {
      console.error(`Error fetching page ${pageCount}:`, error);
      break;
    }
  } while (nextPageToken);
  
  return allPlaces;
}

// Main function to process all categories and locations
async function main() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `business_search_results_${timestamp}.csv`;
    
    // Map to store unique places by Google Maps URL
    const uniquePlacesMap = new Map<string, PlaceWithEmail>();
    
    // Process each category and location
    for (const category of CATEGORIES) {
      for (const location of LOCATIONS) {
        const fullLocation = `${location}, ${COUNTY}, ${COUNTRY}`;
        
        console.log(`\n===== Processing ${category} in ${fullLocation} =====\n`);
        
        // Get all places for this category and location, including pagination
        const places = await getAllPlacesWithPagination(category, location, COUNTY, COUNTRY);
        
        console.log(`Found total of ${places.length} places for ${category} in ${location}`);
        
        // Process each place to find emails
        for (let i = 0; i < places.length; i++) {
          const place = places[i];
          
          // Skip if we've already processed this place (based on Google Maps URL)
          if (place.googleMapsUri && uniquePlacesMap.has(place.googleMapsUri)) {
            console.log(`Skipping duplicate: ${place.displayName?.text}`);
            continue;
          }
          
          const placeWithEmail: PlaceWithEmail = { ...place };
          
          if (place.websiteUri) {
            console.log(`\n[${i + 1}/${places.length}] Processing: ${place.displayName?.text} (${place.primaryTypeDisplayName?.text || 'Unknown category'})`);
            const emailResult = await findEmailsForPlace(place);
            
            placeWithEmail.emails = emailResult.emails;
            placeWithEmail.websiteError = emailResult.error;
            
            console.log(`Found ${emailResult.emails.length} emails: ${emailResult.emails.join(', ')}`);
            
            if (emailResult.error) {
              console.log(`Error: ${emailResult.error}`);
            }
          } else {
            console.log(`\n[${i + 1}/${places.length}] Skipping: ${place.displayName?.text} (${place.primaryTypeDisplayName?.text || 'Unknown category'}) - no website`);
            placeWithEmail.emails = [];
          }
          
          // Store in map using Google Maps URL as key for deduplication
          if (place.googleMapsUri) {
            uniquePlacesMap.set(place.googleMapsUri, placeWithEmail);
          }
        }
        
        // Save progress after each location
        const placesArray = Array.from(uniquePlacesMap.values());
        const csvPath = await exportToCsv(placesArray, filename);
        console.log(`\nProgress saved to: ${csvPath}`);
        
        // Small delay between locations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final export of all unique places
    const allUniquePlaces = Array.from(uniquePlacesMap.values());
    console.log(`\n===== Search Complete =====`);
    console.log(`Total unique places found: ${allUniquePlaces.length}`);
    
    const finalCsvPath = await exportToCsv(allUniquePlaces, filename);
    console.log(`\nFinal results exported to: ${finalCsvPath}`);
  } catch (error) {
    console.error('Failed to complete search:', error);
  }
}

const CATEGORIES = [
  'Real Estate',
  'Consulting',
  'Accounting',
  'Insurance',
  'Financial Services',
  'IT Services',
  'Marketing',
  'Business'
];

const LOCATIONS = [
  "Adamstown",
  "Artane",
  "Ashtown",
  "Athgoe",
  "Balbriggan",
  "Baldoyle",
  "Balgriffin",
  "Ballinteer",
  "Ballsbridge",
  "Ballyboden",
  "Ballybrack",
  "Ballybough",
  "Ballyboughal",
  "Ballyfermot",
  "Ballygall",
  "Ballymount",
  "Ballymun",
  "Ballyroan",
  "Balrothery",
  "Barnacullia",
  "Bayside",
  "Beaumont",
  "Belfield",
  "Blackrock",
  "Blanchardstown",
  "Bluebell",
  "Bohernabreena",
  "Booterstown",
  "Brittas",
  "Broadstone",
  "Cabinteely",
  "Cabra",
  "Carrickmines",
  "Castleknock",
  "Chapelizod",
  "Cherrywood",
  "Cherry Orchard",
  "Churchtown",
  "Citywest",
  "Clondalkin",
  "Clongriffin",
  "Clonsilla",
  "Clonskeagh",
  "Clontarf",
  "Clonturk",
  "Coolmine",
  "Coolock",
  "Corduff",
  "Cornelscourt",
  "Crumlin",
  "Dalkey",
  "Damastown",
  "Darndale",
  "Dartry",
  "Deansgrange",
  "Dollymount",
  "Dolphin's Barn",
  "Donabate",
  "Donaghmede",
  "Donnybrook",
  "Donnycarney",
  "Drimnagh",
  "Drumcondra",
  "Dún Laoghaire",
  "Dundrum",
  "East Wall",
  "Edmondstown",
  "Fairview",
  "Finglas",
  "Firhouse",
  "Foxrock",
  "Garristown",
  "Glasnevin",
  "Glasthule",
  "Glencullen",
  "Glenageary",
  "Goatstown",
  "Grangegorman",
  "Harold's Cross",
  "Hollystown",
  "Howth",
  "Inchicore",
  "Irishtown",
  "Islandbridge",
  "Jobstown",
  "Johnstown",
  "Kill O' The Grange",
  "Kilbarrack",
  "Killester",
  "Killiney",
  "Kilmacud",
  "Kilmainham",
  "Kilnamanagh",
  "Kilternan",
  "Kimmage",
  "Kinsealy",
  "Knocklyon",
  "Leopardstown",
  "The Liberties",
  "Loughlinstown",
  "Loughshinny",
  "Lucan",
  "Lusk",
  "Malahide",
  "Marino",
  "Merrion",
  "Milltown",
  "Monkstown",
  "Mount Merrion",
  "Mulhuddart",
  "Newcastle",
  "Naul",
  "North Strand",
  "North Wall",
  "Oldbawn",
  "Oldtown",
  "Ongar",
  "Palmerstown",
  "Perrystown",
  "Phibsborough",
  "Poppintree",
  "Portmarnock",
  "Portobello",
  "Portrane",
  "Raheny",
  "Ranelagh",
  "Rathcoole",
  "Rathfarnham",
  "Rathgar",
  "Rathmichael",
  "Rathmines",
  "Rialto",
  "Ringsend",
  "Rockbrook",
  "Rolestown",
  "Rush",
  "Rathmintin",
  "Saggart",
  "Sallynoggin",
  "Sandycove",
  "Sandyford",
  "Sandymount",
  "Santry",
  "Shankill",
  "Skerries",
  "Smithfield",
  "Stepaside",
  "Stillorgan",
  "Stoneybatter",
  "Sutton",
  "Swords",
  "Tallaght",
  "Templeogue",
  "Terenure",
  "The Coombe",
  "Ticknock",
  "Tyrrelstown",
  "Walkinstown",
  "Whitechurch",
  "Whitehall",
  "Windy Arbour"
];

const COUNTY = 'Dublin';

const COUNTRY = 'Ireland';

main();

// ===== Processing IT Services in Bayside, Dublin, Ireland ===== 
// This was the last category and location to process.