import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTree } from '../src/lib/file-tree';
import { connectionErrorMessage, errorMessage } from '../src/lib/api';

describe('generate client helpers', () => {
  it('groups preview files into one directory node', () => {
    const tree = buildTree([
      { path: 'src/user/user.service.ts' },
      { path: 'src/user/user.module.ts' },
      { path: 'package.json' },
    ]);

    assert.equal(tree.find((node) => node.name === 'package.json')?.children, undefined);
    const src = tree.find((node) => node.name === 'src');
    assert.equal(src?.children?.length, 1);
    assert.equal(src?.children?.[0].children?.length, 2);
  });

  it('reads string and list error messages from the API', async () => {
    const text = new Response(JSON.stringify({ message: 'config 객체가 필요합니다.' }), { status: 400 });
    const list = new Response(JSON.stringify({ message: ['port는 정수여야 합니다.'] }), { status: 400 });
    const empty = new Response('nope', { status: 500 });

    assert.equal(await errorMessage(text, 'fallback'), 'config 객체가 필요합니다.');
    assert.equal(await errorMessage(list, 'fallback'), 'port는 정수여야 합니다.');
    assert.equal(await errorMessage(empty, 'fallback'), 'fallback');
  });

  it('turns a network TypeError into a connection message', () => {
    assert.match(connectionErrorMessage(new TypeError('Failed to fetch'), 'fallback'), /API 서버에 연결하지 못했습니다/);
    assert.equal(connectionErrorMessage(new Error('잘못된 응답입니다.'), 'fallback'), '잘못된 응답입니다.');
  });
});
