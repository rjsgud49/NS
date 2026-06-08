'use client';

import { useState } from 'react';
import { ProjectConfig } from '@ns/shared';

interface Props { config: ProjectConfig; }

interface FileNode {
  name: string;
  path: string;
  children?: FileNode[];
}

function buildTree(files: { path: string }[]): FileNode[] {
  const root: FileNode[] = [];
  for (const file of files) {
    const parts = file.path.split('/');
    let nodes = root;
    for (let i = 0; i < parts.length; i++) {
      const existing = nodes.find((n) => n.name === parts[i]);
      if (i === parts.length - 1) {
        nodes.push({ name: parts[i], path: file.path });
      } else if (existing) {
        nodes = existing.children!;
      } else {
        const dir: FileNode = { name: parts[i], path: parts.slice(0, i + 1).join('/'), children: [] };
        nodes.push(dir);
        nodes = dir.children!;
      }
    }
  }
  return root;
}

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const isDir = !!node.children;
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        className={`flex items-center gap-1.5 py-0.5 px-2 rounded text-xs font-mono cursor-pointer
          ${isDir ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-800/50'}`}
        onClick={() => isDir && setOpen(!open)}
      >
        <span className="w-3 text-gray-600">{isDir ? (open ? '▾' : '▸') : ''}</span>
        <span className={isDir ? 'text-yellow-400' : 'text-gray-400'}>{node.name}</span>
      </div>
      {isDir && open && node.children?.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function Step6Generate({ config }: Props) {
  const [preview, setPreview] = useState<{ path: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/generate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      setPreview(data.files);
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch('http://localhost:4000/api/generate/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const tree = preview ? buildTree(preview) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">프로젝트 생성</h2>
        <p className="text-gray-400 text-sm mt-1">설정을 확인하고 ZIP 파일로 다운로드하세요.</p>
      </div>

      {/* Config summary */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 grid grid-cols-2 gap-3 text-sm">
        {[
          ['프로젝트명', config.name],
          ['포트', String(config.port)],
          ['데이터베이스', config.database],
          ['ORM', config.orm],
          ['인증', config.auth],
          ['엔티티 수', `${config.entities.length}개`],
          ['Swagger', config.features.swagger ? '✓' : '—'],
          ['Validation', config.features.validation ? '✓' : '—'],
          ['CORS', config.features.cors ? '✓' : '—'],
          ['Rate Limit', config.features.rateLimit ? '✓' : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-200 font-mono text-xs">{v}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={fetchPreview}
          disabled={loading}
          className="flex-1 py-2.5 border border-gray-700 rounded-lg text-sm text-gray-300
            hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? '불러오는 중...' : '파일 구조 미리보기'}
        </button>
        <button
          onClick={download}
          disabled={downloading}
          className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm text-white
            font-semibold disabled:opacity-50 transition-colors"
        >
          {downloading ? '생성 중...' : '⬇ ZIP 다운로드'}
        </button>
      </div>

      {/* File tree preview */}
      {tree && (
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-4 max-h-80 overflow-y-auto">
          <p className="text-xs text-gray-600 mb-3 font-mono">생성될 파일 ({preview!.length}개)</p>
          {tree.map((node, i) => <TreeNode key={i} node={node} />)}
        </div>
      )}
    </div>
  );
}
