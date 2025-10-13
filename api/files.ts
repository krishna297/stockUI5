import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  const dataDir = path.join(process.cwd(), 'public', 'data');

  try {
    if (!fs.existsSync(dataDir)) {
      return res.status(200).json({ directories: [] });
    }

    const items = fs.readdirSync(dataDir, { withFileTypes: true });

    const directories = items
      .filter((item) => item.isDirectory())
      .map((dir) => {
        const dirPath = path.join(dataDir, dir.name);
        const files = fs.readdirSync(dirPath)
          .filter((file) => file.endsWith('.json'))
          .sort();

        return {
          name: dir.name,
          files: files,
        };
      })
      .filter((dir) => dir.files.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ directories });
  } catch (error) {
    console.error('Error reading directories:', error);
    res.status(500).json({ error: 'Failed to read directories' });
  }
}
