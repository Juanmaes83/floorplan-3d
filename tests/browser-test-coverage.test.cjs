// Every *.browser.test.cjs is run by some workflow (or by the regression manifest): the guard itself, as a test.
const {test}=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('no browser test file is left without CI coverage; the regression manifest only names existing files',()=>{
 const out=execFileSync(process.execPath,[path.join(__dirname,'../scripts/qa/check-browser-test-coverage.cjs')],{encoding:'utf8'});assert.match(out,/ 0 uncovered/);
});
