export interface CacheData {
  [key: string]: any; // Define more specific type if possible
}

export interface CforgeData {
  flow: any; // Define more specific type based on your flow structure
  cache: CacheData;
}
