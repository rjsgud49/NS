import ts from 'typescript';

export function syntaxErrors(source: string): string[] {
  const result = ts.transpileModule(source, {
    reportDiagnostics: true,
    fileName: 'generated.ts',
    compilerOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      target: ts.ScriptTarget.ES2021,
      module: ts.ModuleKind.CommonJS,
    },
  });

  return (result.diagnostics ?? [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

const TYPEORM_STUB = `
export function Entity(): any;
export function PrimaryGeneratedColumn(): any;
export function Column(options?: any): any;
export function CreateDateColumn(): any;
export function UpdateDateColumn(): any;
export function ObjectIdColumn(options?: any): any;
export class ObjectId {}
export function OneToMany(type: any, inverse: any, options?: any): any;
export function ManyToOne(type: any, inverseOrOptions?: any, options?: any): any;
export function ManyToMany(type: any, inverseOrOptions?: any, options?: any): any;
export function JoinColumn(options?: any): any;
export function JoinTable(options?: any): any;
`;

/** Typecheck generated entity files against a TypeORM stub, using the generated tsconfig strictness. */
export function entityTypeErrors(files: { path: string; content: string }[]): string[] {
  const root = '/virtual';
  const virtual = new Map<string, string>([[`${root}/typeorm.d.ts`, TYPEORM_STUB]]);
  const entries: string[] = [];
  for (const file of files) {
    if (!file.path.endsWith('.entity.ts')) continue;
    const full = `${root}/${file.path}`;
    virtual.set(full, file.content);
    entries.push(full);
  }
  if (entries.length === 0) return [];

  const options: ts.CompilerOptions = {
    strictNullChecks: false,
    noImplicitAny: false,
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    baseUrl: root,
    paths: { typeorm: ['typeorm.d.ts'] },
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const normalize = (name: string) => name.replace(/\\/g, '/');
  const systemExists = host.fileExists.bind(host);
  const systemRead = host.readFile.bind(host);
  const systemSource = host.getSourceFile.bind(host);
  const systemDirectory = host.directoryExists?.bind(host);
  host.fileExists = (name) => virtual.has(normalize(name)) || systemExists(name);
  host.readFile = (name) => virtual.get(normalize(name)) ?? systemRead(name);
  host.directoryExists = (name) =>
    normalize(name).startsWith(root) || (systemDirectory ? systemDirectory(name) : false);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNew) => {
    const text = virtual.get(normalize(name));
    if (text !== undefined) return ts.createSourceFile(name, text, languageVersion, true);
    return systemSource(name, languageVersion, onError, shouldCreateNew);
  };

  const program = ts.createProgram(entries, options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file && virtual.has(normalize(diagnostic.file.fileName)))
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      return `${diagnostic.file?.fileName}: ${message}`;
    });
}
