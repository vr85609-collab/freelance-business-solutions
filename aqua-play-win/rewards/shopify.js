import {POLICY,REWARD_PRODUCTS} from './policy.js';
export const CREATE_REWARD=`mutation CreateArcadeReward($input: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $input) { codeDiscountNode { id } userErrors { field message } } }`;
export const CREATE_GIFT=`mutation CreateArcadeGift($input: DiscountCodeBxgyInput!) { discountCodeBxgyCreate(bxgyCodeDiscount: $input) { codeDiscountNode { id } userErrors { field message } } }`;
export const FIND_REWARD=`query ArcadeRewardLookup($code: String!) { codeDiscountNodeByCode(code: $code) { id } }`;
export const GIFT_VARIANT=`query ArcadeGiftVariant($id: ID!) { productVariant(id: $id) { id price inventoryQuantity inventoryItem { unitCost { amount currencyCode } } product { status handle } } shop { currencyCode myshopifyDomain } }`;
export const hasShopifyCredentials=env=>!!(env.SHOPIFY_CLIENT_ID&&env.SHOPIFY_API_SECRET||env.SHOPIFY_ADMIN_ACCESS_TOKEN);
// Contribution estimate at issuance, not a guarantee of net profit or future checkout prices.
export function reviewEconomics(products,claim,env={}) {
 const number=(key,fallback)=>{const v=Number(env[key]??fallback);if(!Number.isFinite(v)||v<0)throw Error('Reward cost assumptions need review');return v};
 const fee=number('ARCADE_PAYMENT_FEE_PERCENT',4)/100;if(fee>=1)throw Error('Reward cost assumptions need review');
 const overhead=number('ARCADE_PAYMENT_FEE_FIXED_USD',.30)+number('ARCADE_PACKAGING_USD',1.50)+number('ARCADE_SHIPPING_SUBSIDY_USD',0);
 const minimum=number('ARCADE_MIN_CONTRIBUTION_USD',5);
 if(products.length!==REWARD_PRODUCTS.length||new Set(products.map(p=>p.id)).size!==REWARD_PRODUCTS.length||products.some(p=>!REWARD_PRODUCTS.some(r=>r.id===p.id)||!Number.isFinite(p.price)||p.price<=0||!Number.isFinite(p.cost)||p.cost<0))throw Error('Recorded reward product prices and costs need review');
 const reward=POLICY.rewards.find(r=>r.id===claim.reward_id);if(!reward)throw Error('Unknown reward');
 let contribution;
 if(reward.approval){
  const gift=claim.variant_gid?products.find(p=>p.id===claim.variant_gid):null;
  if(claim.variant_gid&&!gift)throw Error('Gift product is not approved');
  const cap=number('MAX_GIFT_VALUE_USD',6);if((gift?[gift]:products).some(p=>p.price>cap))throw Error('Gift price exceeds the approved reward budget');
  const giftCost=gift?gift.cost:Math.max(...products.map(p=>p.cost));
  contribution=POLICY.giftBuyQuantity*Math.min(...products.map(p=>p.price*(1-fee)-p.cost))-giftCost-overhead;
 }else{
  const spend=Number(reward.minimumPurchase),discount=Number(reward.amount),costRatio=Math.max(...products.map(p=>p.cost/p.price));
  contribution=(spend-discount)*(1-fee)-spend*costRatio-overhead;
 }
 if(contribution<minimum)throw Error('This reward is paused for a product-cost or shipping review. Your points are retained');
 return {estimatedMinimumContributionUSD:Math.floor(contribution*100)/100};
}
export class ShopifyRewards {
 constructor(env=process.env,{request=fetch,clock=Date.now}={}){this.env=env;this.request=request;this.clock=clock;this.cachedToken=null;this.tokenRequest=null}
 domain(){if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(this.env.SHOPIFY_SHOP||''))throw Error('Shopify domain is not configured');return this.env.SHOPIFY_SHOP}
 async accessToken(){
  if(!this.env.SHOPIFY_CLIENT_ID){if(!this.env.SHOPIFY_ADMIN_ACCESS_TOKEN)throw Error('Shopify app credentials are not configured');return this.env.SHOPIFY_ADMIN_ACCESS_TOKEN}
  if(!this.env.SHOPIFY_API_SECRET)throw Error('Shopify app credentials are not configured');
  if(this.cachedToken&&this.cachedToken.until>this.clock()+60000)return this.cachedToken.value;
  if(!this.tokenRequest)this.tokenRequest=(async()=>{
   const r=await this.request('https://'+this.domain()+'/admin/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:this.env.SHOPIFY_CLIENT_ID,client_secret:this.env.SHOPIFY_API_SECRET}).toString(),signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw Error('Shopify app authentication failed. Check installation and credentials in Render');
   const d=await r.json();if(typeof d.access_token!=='string'||!d.access_token||!Number.isFinite(d.expires_in)||d.expires_in<=60)throw Error('Shopify returned an invalid app session');
   this.cachedToken={value:d.access_token,until:this.clock()+d.expires_in*1000};return d.access_token;
  })().finally(()=>{this.tokenRequest=null});
  return this.tokenRequest;
 }
 async query(query,variables) {
  const url='https://'+this.domain()+'/admin/api/2026-10/graphql.json';
  const send=async()=>this.request(url,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':await this.accessToken()},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(15000)});
  let r=await send();if(r.status===401&&this.env.SHOPIFY_CLIENT_ID){this.cachedToken=null;r=await send()}
  if(!r.ok)throw Error('Shopify request failed');const payload=await r.json();if(payload.errors)throw Error('Shopify rejected the operation');return payload.data;
 }
 async products(){return Promise.all(REWARD_PRODUCTS.map(async p=>{
  const d=await this.query(GIFT_VARIANT,{id:p.id}),v=d.productVariant,cost=v?.inventoryItem?.unitCost;
  if(d.shop.currencyCode!=='USD'||!v||v.product.status!=='ACTIVE'||v.inventoryQuantity<1||cost?.currencyCode!=='USD'||cost.amount==null)throw Error('Reward product stock or recorded cost needs review');
  return {...p,price:Number(v.price),cost:Number(cost.amount)};
 }))}
 async reviewEconomics(claim){return reviewEconomics(await this.products(),claim,this.env)}
 async gift(variant){
  if(!REWARD_PRODUCTS.some(p=>p.id===variant)||!(this.env.GIFT_VARIANT_ALLOWLIST||'').split(',').map(s=>s.trim()).includes(variant))throw Error('Select an approved private-label variant');
  const products=await this.products();reviewEconomics(products,{reward_id:'bathbomb',variant_gid:variant},this.env);
  const p=products.find(p=>p.id===variant);return {variant:p.id,amount:p.price.toFixed(2),handle:p.handle};
 }
 async issue(claim) {
  const existing=await this.query(FIND_REWARD,{code:claim.code});if(existing.codeDiscountNodeByCode)return existing.codeDiscountNodeByCode.id;
  // Recheck even on a retry when no code exists yet; existing codes keep their immutable terms.
  await this.reviewEconomics(claim);
  const gift=claim.reward_id==='bathbomb',d=await this.query(gift?CREATE_GIFT:CREATE_REWARD,{input:claim.shopify_input});
  const result=gift?d.discountCodeBxgyCreate:d.discountCodeBasicCreate;
  if(result.userErrors?.length)throw Error('Shopify did not issue the code');
  const id=result.codeDiscountNode?.id;if(!id)throw Error('Shopify did not return a discount');return id;
 }
}
