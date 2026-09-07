import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { messages,LANGUAGES,translate } from '../lib/i18n.mjs';
import { STYLES,ANIMATIONS } from '../lib/styles.mjs';

test('all interface messages, preset names and animation labels have three translations',async()=>{
 for(const [key,values] of Object.entries(messages))for(const [lang] of LANGUAGES)assert.ok(values[lang]?.trim(),`${lang}: ${key}`);
 for(const style of STYLES)for(const key of [style.name,style.sample])assert.ok(messages[key],key);
 for(const [,label] of ANIMATIONS)assert.ok(messages[label],label);
 for(const file of ['app/page.tsx','app/overlay.tsx']){
  const source=ts.createSourceFile(file,await readFile(file,'utf8'),ts.ScriptTarget.Latest,true);
  function visit(node){
   if(ts.isCallExpression(node)&&['t','translate'].includes(node.expression.getText(source))){
    const key=node.arguments[0];if(ts.isStringLiteral(key))assert.ok(messages[key.text],`${file}: ${key.text}`);
   }
   if(ts.isJsxText(node)&&node.text.trim()!=='Language / 언어 / 语言')assert.doesNotMatch(node.text,/[\u3400-\u9fff]/,`${file}: untranslated JSX text`);
   ts.forEachChild(node,visit);
  }visit(source);
 }
 assert.equal(translate('上移'),'Move up');assert.equal(translate('上移','unknown'),'Move up');
 assert.equal(translate('参数 width 超出允许范围。','ko'),'설정 width이(가) 허용 범위를 벗어났습니다.');
});
