import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderCommonFiles } from './common.template';
import { syntaxErrors } from '../testing/syntax';

describe('exception filter', () => {
  it('wraps non-HTTP exceptions in the same JSON shape', () => {
    const file = renderCommonFiles().find((entry) => entry.path.endsWith('http-exception.filter.ts'));
    assert.ok(file);
    const source = file.content;

    assert.equal(syntaxErrors(source).length, 0, syntaxErrors(source).join('\n'));
    assert.match(source, /@Catch\(\)/);
    assert.doesNotMatch(source, /@Catch\(HttpException\)/);
    assert.match(source, /HttpStatus\.INTERNAL_SERVER_ERROR/);
    assert.match(source, /exception instanceof HttpException/);
    assert.match(source, /success: false/);
    assert.match(source, /statusCode: status/);
  });
});
