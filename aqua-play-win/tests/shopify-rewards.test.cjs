const {test}=require('node:test'),assert=require('node:assert/strict');
const load=()=>Promise.all([import('../rewards/shopify.js'),import('../rewards/policy.js')]);
test('reward economics permits the synthetic fixtures and pauses missing costs, margin erosion or shipping subsidies',async()=>{
 const [{reviewEconomics},{REWARD_PRODUCTS,POLICY}]=await load(),products=REWARD_PRODUCTS.map(p=>({...p,price:6.00,cost:2.50}));
 for(const reward of POLICY.rewards)assert(reviewEconomics(products,{reward_id:reward.id}).estimatedMinimumContributionUSD>=5);
 assert.throws(()=>reviewEconomics(products.slice(1),{reward_id:'coupon2'}));
 assert.throws(()=>reviewEconomics(products.map(p=>({...p,cost:NaN})),{reward_id:'coupon2'}));
 assert.throws(()=>reviewEconomics(products.map(p=>({...p,cost:5.50})),{reward_id:'coupon6'}));
 assert.throws(()=>reviewEconomics(products,{reward_id:'bathbomb'},{ARCADE_SHIPPING_SUBSIDY_USD:'15'}));
 assert.throws(()=>reviewEconomics(products,{reward_id:'coupon2'},{ARCADE_PAYMENT_FEE_PERCENT:'101'}));
 assert.throws(()=>reviewEconomics(products,{reward_id:'bathbomb',variant_gid:'gid://shopify/ProductVariant/999'}));
});
test('Shopify client credentials refresh before expiry, deduplicate requests and recover once from 401',async()=>{
 const [{ShopifyRewards}]=await load();let now=100000,grants=0,api=0,rejectNext=false;const credentials={SHOPIFY_SHOP:'test.myshopify.com',SHOPIFY_CLIENT_ID:'test-client',SHOPIFY_API_SECRET:'test-secret'};
 const client=new ShopifyRewards(credentials,{clock:()=>now,request:async(url,options)=>{
  if(url.endsWith('/admin/oauth/access_token')){grants++;const form=new URLSearchParams(options.body);assert.equal(form.get('grant_type'),'client_credentials');assert.equal(form.get('client_id'),'test-client');return {ok:true,json:async()=>({access_token:'fake-token-'+grants,expires_in:86400})}}
  api++;if(rejectNext){rejectNext=false;return {ok:false,status:401}}return {ok:true,status:200,json:async()=>({data:{ok:true}})};
 }});
 await Promise.all([client.query('query { shop { id } }'),client.query('query { shop { id } }')]);assert.equal(grants,1);assert.equal(api,2);
 now+=86400*1000;await client.query('query { shop { id } }');assert.equal(grants,2);
 rejectNext=true;await client.query('query { shop { id } }');assert.equal(grants,3);assert.equal(api,5);
});
test('Shopify authentication fails without exposing OAuth error bodies or accepting foreign domains',async()=>{
 const [{ShopifyRewards}]=await load();const env={SHOPIFY_SHOP:'test.myshopify.com',SHOPIFY_CLIENT_ID:'client',SHOPIFY_API_SECRET:'secret-not-to-print'};
 const client=new ShopifyRewards(env,{request:async()=>({ok:false,status:403,json:async()=>({error:'secret-not-to-print'})})});
 await assert.rejects(client.accessToken(),e=>!e.message.includes('secret-not-to-print'));
 const foreign=new ShopifyRewards({...env,SHOPIFY_SHOP:'shopify.com.attacker.test'},{request:()=>{throw Error('Network must not be called')}});await assert.rejects(foreign.accessToken(),/domain/);
});
test('gift issuance uses BXGY, rechecks costs before creation and reconciles the same existing code',async()=>{
 const [{ShopifyRewards,CREATE_GIFT,FIND_REWARD,GIFT_VARIANT},{REWARD_PRODUCTS}]=await load();
 const {discountInput}=await import('../rewards/service.js');let existing=false,created=0,reads=0;
 const client=new ShopifyRewards({});
 client.query=async(query,variables)=>{
  if(query===FIND_REWARD)return {codeDiscountNodeByCode:existing?{id:'gid://shopify/DiscountCodeNode/123'}:null};
  if(query===GIFT_VARIANT){reads++;return {shop:{currencyCode:'USD'},productVariant:{id:variables.id,price:'6.00',inventoryQuantity:100,inventoryItem:{unitCost:{amount:'2.50',currencyCode:'USD'}},product:{status:'ACTIVE'}}}}
  assert.equal(query,CREATE_GIFT);assert.equal(variables.input.usesPerOrderLimit,1);created++;existing=true;return {discountCodeBxgyCreate:{codeDiscountNode:{id:'gid://shopify/DiscountCodeNode/123'},userErrors:[]}};
 };
 const claim={reward_id:'bathbomb',variant_gid:REWARD_PRODUCTS[0].id,customer_gid:'gid://shopify/Customer/100',code:'TEST-NOT-LIVE'};claim.shopify_input=discountInput(claim);
 assert.equal(await client.issue(claim),'gid://shopify/DiscountCodeNode/123');assert.equal(reads,3);assert.equal(created,1);
 await client.issue(claim);assert.equal(created,1);assert.equal(reads,3);
});
