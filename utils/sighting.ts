// Everything related to sightings - types and utility functions
// This file contains both the TypeScript types and helper functions

// Types


// A single bird sighting
export interface Sighting {
  id: number; // Unique ID of the sighting from the database
  species: string; // Bird species name (e.g., "Northern Cardinal")
  count: number; // How many birds were spotted
  location: string; // Location name 
  latitude: number; // Latitude coordinate
  longitude: number; // Longitude coordinate
  notes?: string; // Optional notes about the sighting (e.g., "Spotted near the lighthouse")
  date: string; // When the sighting happened (ISO date string like "2024-01-15T14:30:00Z")
  userId?: number; // Optional ID of user who created the sighting
  username?: string; // Optional username of person who created the sighting
  photos?: string[]; // Optional array of photo URLs if user uploaded photos
}

// Filters for searching/filtering sightings on the map screen
// All fields are optional - can filter by any combination
export interface SightingFilters {
  species?: string; // Filter by species name
  location?: string; // Filter by location name
  startDate?: string; // Only show sightings after this date
  endDate?: string; // Only show sightings before this date
  userId?: number; // Only show sightings from this user
  latitude?: number; // Center point for radius search
  longitude?: number; // Center point for radius search
  radius?: number; // Search radius in miles (used with latitude/longitude)
  minLat?: number; // Minimum latitude (for map bounds)
  maxLat?: number; // Maximum latitude (for map bounds)
  minLng?: number; // Minimum longitude (for map bounds)
  maxLng?: number; // Maximum longitude (for map bounds)
}

// Utility functions


/**
 * Figure out what color to use for a sighting marker on the map
 * Newer sightings get green, older ones get orange
 * @param sighting - The sighting we want to get a color for
 * @returns A hex color code (like "#4CAF50" for green)
 */
export function getMarkerColor(sighting: Sighting): string {
  // Calculate how many days ago the sighting was
  // Date.now() gives current time in milliseconds
  // new Date(sighting.date).getTime() gives sighting time in milliseconds
  // Divide by milliseconds in a day to get days
  const daysAgo = Math.floor(
    (Date.now() - new Date(sighting.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Return different colors based on how recent it is
  if (daysAgo <= 1) return '#4CAF50'; // Green for sightings from today or yesterday
  if (daysAgo <= 7) return '#2196F3'; // Blue for sightings from this week
  return '#FF9800'; // Orange for older sightings
}

/**
 * Convert a date to a friendly "time ago" string
 * Examples: "Today", "Yesterday", "5 days ago"
 * @param date - An ISO date string (like "2024-01-15T14:30:00Z")
 * @returns A readable string like "Today" or "3 days ago"
 */
export function formatTimeAgo(date: string): string {
  // Calculate days ago (same calculation as above)
  const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  
  // Return friendly text based on how many days
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return `${daysAgo} days ago`; // For 2+ days ago
}


