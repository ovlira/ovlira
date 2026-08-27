import path from 'node:path';
import ts from 'typescript';

/**
 * Collects obvious DOM property assignments so validation can understand
 * `element.label = value` as well as static `label="..."` markup.
 */
export function collectAssignedProperties(fileName: string, source: string): Set<string> {
  const extension = path.extname(fileName).toLowerCase();
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(extension)) return new Set();
  const scriptKind = extension.endsWith('x') ? ts.ScriptKind.TSX : extension === '.js' ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const variableTags = new Map<string, string>();
  const assignments = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const tag = tagFromDomLookup(node.initializer);
      if (tag) variableTags.set(node.name.text, tag);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && ts.isIdentifier(node.left.expression)) {
      const tag = variableTags.get(node.left.expression.text);
      if (tag) assignments.add(`${tag}.${node.left.name.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return assignments;
}

function tagFromDomLookup(node: ts.Expression): string | undefined {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return undefined;
  const method = node.expression.name.text;
  if (method !== 'createElement' && method !== 'querySelector') return undefined;
  const object = node.expression.expression.getText();
  if (object !== 'document') return undefined;
  const first = node.arguments[0];
  return first && ts.isStringLiteral(first) && /^ov-[a-z0-9-]+$/.test(first.text) ? first.text : undefined;
}
