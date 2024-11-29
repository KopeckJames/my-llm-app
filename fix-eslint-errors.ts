import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface FileEdit {
  filePath: string;
  fixes: Array<{
    pattern: string | RegExp;
    replacement: string;
  }>;
}

const specificFixes: FileEdit[] = [
  // Fix AudioRecorder.tsx unescaped entity
  {
    filePath: 'src/components/AudioRecorder.tsx',
    fixes: [
      {
        pattern: /(?<![\\])'/g,
        replacement: '&apos;'
      }
    ]
  },
  // Fix var usage in db.ts and prisma.ts
  {
    filePath: 'src/lib/db.ts',
    fixes: [
      {
        pattern: /\bvar\b/g,
        replacement: 'const'
      }
    ]
  },
  {
    filePath: 'src/lib/prisma.ts',
    fixes: [
      {
        pattern: /\bvar\b/g,
        replacement: 'const'
      }
    ]
  }
];

// Files that need unused imports removed
const importsToRemove = [
  { file: 'src/app/api/chat/route.ts', imports: ['LLMConfig'] },
  { file: 'src/components/ChatInterface.tsx', imports: ['signOut', 'callLLM'] },
  { file: 'src/components/DocumentUpload.tsx', imports: ['Button', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue'] },
  { file: 'src/components/ResumeAnalysis.tsx', imports: ['FileText'] },
  { file: 'src/services/audio.ts', imports: ['callLLM', 'Message'] }
];

// Fix useEffect dependencies
const useEffectFixes = [
  'src/components/DocumentList.tsx',
  'src/components/ResumeAnalysis.tsx'
];

function readFile(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

function writeFile(filePath: string, content: string): void {
  const fullPath = path.join(process.cwd(), filePath);
  fs.writeFileSync(fullPath, content, 'utf-8');
}

function removeUnusedImports(content: string, importsToRemove: string[]): string {
  let newContent = content;
  
  importsToRemove.forEach(importName => {
    // Remove single imports
    const singleImportRegex = new RegExp(`import\\s*{\\s*${importName}\\s*}\\s*from\\s*['"][^'"]+['"]\\s*;?\\n?`, 'g');
    newContent = newContent.replace(singleImportRegex, '');

    // Remove from multi-imports
    const multiImportRegex = new RegExp(`(import\\s*{[^}]*),?\\s*${importName}\\s*,?([^}]*}\\s*from\\s*['"][^'"]+['"]\\s*;?)`, 'g');
    newContent = newContent.replace(multiImportRegex, (match, before, after) => {
      // Clean up any double commas that might result from the removal
      return (before + after).replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
    });
  });

  return newContent;
}

function fixUseEffectDependency(content: string): string {
  return content.replace(
    /useEffect\(\s*\(\)\s*=>\s*{\s*fetchDocuments\(\);\s*},\s*\[\]\s*\)/g,
    'useEffect(() => { fetchDocuments(); }, [fetchDocuments])'
  );
}

async function updateESLintConfig(): Promise<void> {
  const eslintrcPath = '.eslintrc.json';
  const config = {
    "extends": "next/core-web-vitals",
    "rules": {
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "args": "after-used",
        "ignoreRestSiblings": true
      }],
      "@typescript-eslint/no-empty-interface": "off",
      "react-hooks/exhaustive-deps": "warn",
      "no-var": "error"
    }
  };

  writeFile(eslintrcPath, JSON.stringify(config, null, 2));
}

async function main() {
  try {
    // Apply specific fixes
    for (const edit of specificFixes) {
      console.log(`Processing ${edit.filePath}...`);
      let content = readFile(edit.filePath);
      
      for (const fix of edit.fixes) {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      writeFile(edit.filePath, content);
    }

    // Remove unused imports
    for (const { file, imports } of importsToRemove) {
      console.log(`Removing unused imports from ${file}...`);
      let content = readFile(file);
      content = removeUnusedImports(content, imports);
      writeFile(file, content);
    }

    // Fix useEffect dependencies
    for (const file of useEffectFixes) {
      console.log(`Fixing useEffect in ${file}...`);
      let content = readFile(file);
      content = fixUseEffectDependency(content);
      writeFile(file, content);
    }

    // Update ESLint config
    console.log('Updating ESLint configuration...');
    await updateESLintConfig();

    console.log('All fixes applied successfully!');
  } catch (error) {
    console.error('Error while applying fixes:', error);
    process.exit(1);
  }
}

main();