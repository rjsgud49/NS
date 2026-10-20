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
