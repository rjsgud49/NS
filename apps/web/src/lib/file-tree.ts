export interface PreviewFile {
  path: string;
}

export interface FileNode {
  name: string;
  path: string;
  children?: FileNode[];
}

export function buildTree(files: PreviewFile[]): FileNode[] {
  const root: FileNode[] = [];
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let nodes = root;
    for (let i = 0; i < parts.length; i++) {
      const existing = nodes.find((node) => node.name === parts[i]);
      if (i === parts.length - 1) {
        if (!existing) nodes.push({ name: parts[i], path: file.path });
      } else if (existing?.children) {
        nodes = existing.children;
      } else {
        const children: FileNode[] = [];
        nodes.push({ name: parts[i], path: parts.slice(0, i + 1).join('/'), children });
        nodes = children;
      }
    }
  }
  return root;
}
