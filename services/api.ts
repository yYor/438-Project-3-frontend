// This file handles all API calls to the backend 


// The backend is a Spring Boot server (or Supabase)
import type { Sighting, SightingFilters } from '@/utils/sighting';
import Constants from 'expo-constants';

// Get the API URL from config, or use a default
// This lets us change the backend URL without changing code
const API_BASE_URL = 'https://birdwatcher-backend.herokuapp.com/api';
  Constants.expoConfig?.extra?.apiUrl || 
  Constants.manifest?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8080/api'; // Default to localhost for development

/**
 * This class handles all API calls to get and save sightings
 * It's a service class that wraps fetch() calls
 */
class ApiService {
  private baseUrl: string;

  constructor() {
    // Save the base URL when we create the service
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Helper function that wraps fetch() with error handling
   * All API calls go through this function
   * The <T> means it can return any type we specify
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Build the full URL by combining base URL and endpoint
      const url = `${this.baseUrl}${endpoint}`;
      // Make the HTTP request
      const response = await fetch(url, {
        ...options, // Include any options passed in (like method: 'POST')
        headers: {
          'Content-Type': 'application/json', // Tell server we're sending JSON
          ...options.headers, // Include any other headers
        },
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      // If something goes wrong, log it and throw the error
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get all sightings from the database
   * Returns an array of all sightings from all users
   */
  async getAllSightings(): Promise<Sighting[]> {
    return this.fetch<Sighting[]>('/sightings');
  }

  /**
   * Get sightings with optional filters
   * You can filter by species, location, date range, etc.
   * This is useful for the map view to only load sightings in the visible area
   */
  async getSightings(filters?: SightingFilters): Promise<Sighting[]> {
    // Build query string from filters
    // Only add parameters that were actually provided
    const queryParams = new URLSearchParams();
    
    if (filters?.species) queryParams.append('species', filters.species);
    if (filters?.location) queryParams.append('location', filters.location);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.userId) queryParams.append('userId', filters.userId.toString());
    if (filters?.latitude) queryParams.append('latitude', filters.latitude.toString());
    if (filters?.longitude) queryParams.append('longitude', filters.longitude.toString());
    if (filters?.radius) queryParams.append('radius', filters.radius.toString());
    // Map bounds - only get sightings visible on screen (more efficient)
    if (filters?.minLat) queryParams.append('minLat', filters.minLat.toString());
    if (filters?.maxLat) queryParams.append('maxLat', filters.maxLat.toString());
    if (filters?.minLng) queryParams.append('minLng', filters.minLng.toString());
    if (filters?.maxLng) queryParams.append('maxLng', filters.maxLng.toString());

    // Build the endpoint URL with query string
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/sightings?${queryString}` : '/sightings';
    
    return this.fetch<Sighting[]>(endpoint);
  }

  /**
   * Get sightings that are within a specific area on the map
   * This is more efficient than loading all sightings - only load what's visible
   * minLat/maxLat = top and bottom of visible map
   * minLng/maxLng = left and right of visible map
   */
  async getSightingsInBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ): Promise<Sighting[]> {
    return this.getSightings({ minLat, maxLat, minLng, maxLng });
  }

  /**
   * Get sightings near a specific location
   * Useful for "show me sightings near me" feature
   * @param radius - How far to search in kilometers (default 10km)
   */
  async getNearbySightings(
    latitude: number,
    longitude: number,
    radius: number = 10 // Default to 10 kilometers
  ): Promise<Sighting[]> {
    return this.getSightings({ latitude, longitude, radius });
  }

  /**
   * Get sightings from the last 24 hours
   * Useful for showing recent activity
   */
  async getRecentSightings(): Promise<Sighting[]> {
    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get sightings since yesterday
    return this.getSightings({
      startDate: yesterday.toISOString(),
    });
  }

  /**
   * Save a new sighting to the database
   * Omit<Sighting, 'id'> means we don't need to provide an id (backend generates it)
   */
  async createSighting(sighting: Omit<Sighting, 'id'>): Promise<Sighting> {
    return this.fetch<Sighting>('/sightings', {
      method: 'POST', // POST request to create new resource
      body: JSON.stringify(sighting), // Convert object to JSON string
    });
  }

  /**
   * Get all sightings created by a specific user
   * Useful for showing "my sightings" page
   */
  async getUserSightings(userId: number): Promise<Sighting[]> {
    return this.fetch<Sighting[]>(`/sightings/user/${userId}`);
  }
}

// Create one instance of the service and export it
// This is called a "singleton" pattern - we only have one API service
export const apiService = new ApiService();


