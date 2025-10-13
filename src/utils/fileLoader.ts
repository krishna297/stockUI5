import { StockData, Directory } from '../types';

export async function loadJSONFile(path: string): Promise<StockData[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error(`Error loading file ${path}:`, error);
    return [];
  }
}

export async function loadAllData(directories: Directory[]): Promise<StockData[]> {
  const allData: StockData[] = [];

  for (const directory of directories) {
    for (const file of directory.files) {
      const path = `/data/${directory.name}/${file}`;
      const fileData = await loadJSONFile(path);

      const dataWithSource = fileData.map((item) => ({
        ...item,
        sourceFile: `${directory.name}/${file}`,
      }));

      allData.push(...dataWithSource);
    }
  }

  return allData;
}

export async function loadSingleFile(
  directory: string,
  file: string
): Promise<StockData[]> {
  const path = `/data/${directory}/${file}`;
  const fileData = await loadJSONFile(path);

  return fileData.map((item) => ({
    ...item,
    sourceFile: `${directory}/${file}`,
  }));
}

export async function loadMasterFiles(files: string[], masterPath: string = 'master'): Promise<StockData[]> {
  const allData: StockData[] = [];

  for (const file of files) {
    const path = `/data/${masterPath}/${file}`;
    const fileData = await loadJSONFile(path);
    allData.push(...fileData);
  }

  return allData;
}
