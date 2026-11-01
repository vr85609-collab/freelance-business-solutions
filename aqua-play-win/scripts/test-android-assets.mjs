import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['--test','tests/games.test.cjs','tests/expanded.test.cjs'],{
 stdio:'inherit',env:{...process.env,ARCADE_TEST_ASSETS:'android/app/src/main/assets'}
});
process.exit(result.status??1);
