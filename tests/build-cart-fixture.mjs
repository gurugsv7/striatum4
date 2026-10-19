import { build } from 'esbuild';
import path from 'node:path';
await build({
  stdin: {resolveDir:process.cwd(), contents:`
    import {renderCartView,attachCartEvents} from './src/views/CartView.ts';
    window.checkoutCalls=0;
    document.querySelector('#fixture').innerHTML=renderCartView();
    attachCartEvents();
    window.fixtureReady=true;
  `},
  bundle:true,format:'esm',platform:'browser',outfile:'tests/cart-fixture.js',
  plugins:[{name:'synthetic-checkout',setup(b){
    b.onResolve({filter:/registrationService\.ts$/},args=>args.importer.endsWith('CartView.ts')?{path:'checkout-stub',namespace:'fixture'}:undefined);
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({resolveDir:process.cwd(),contents:`
      export * from ${JSON.stringify(path.resolve('src/services/registrationService.ts'))};
      export async function createOrder(){
        window.checkoutCalls++;
        await new Promise(resolve=>setTimeout(resolve,200));
        return {ok:false,message:'OCEANIC ODYSSEY: at most 1 participant from batch 2023 per team. Edit the team details. '+ 'Diagnostic'.repeat(30)};
      }
    `}));
  }}]
});
