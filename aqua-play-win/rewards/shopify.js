export const CREATE_REWARD=`mutation CreateArcadeReward($input: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $input) { codeDiscountNode { id } userErrors { field message } } }`;
export const FIND_REWARD=`query ArcadeRewardLookup($code: String!) { codeDiscountNodeByCode(code: $code) { id } }`;
export const GIFT_VARIANT=`query ArcadeGiftVariant($id: ID!) { productVariant(id: $id) { id price inventoryQuantity product { status handle } } shop { currencyCode myshopifyDomain } }`;
export class ShopifyRewards {
 constructor(env=process.env){this.env=env}
 async query(query,variables) {
  if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(this.env.SHOPIFY_SHOP||''))throw Error('Shopify domain is not configured');
  const r=await fetch('https://'+this.env.SHOPIFY_SHOP+'/admin/api/2026-10/graphql.json',{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':this.env.SHOPIFY_ADMIN_ACCESS_TOKEN},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Shopify request failed');const payload=await r.json();if(payload.errors)throw Error('Shopify rejected the operation');return payload.data;
 }
 async gift(variant){
  if(!(this.env.GIFT_VARIANT_ALLOWLIST||'').split(',').map(s=>s.trim()).includes(variant))throw Error('Select an approved private-label variant');
  const cap=Number(this.env.MAX_GIFT_VALUE_USD||10);if(!Number.isFinite(cap)||cap<=0)throw Error('Gift value limit is not configured correctly');
  const d=await this.query(GIFT_VARIANT,{id:variant});const v=d.productVariant;
  if(d.shop.currencyCode!=='USD'||!v||v.product.status!=='ACTIVE'||v.inventoryQuantity<1||Number(v.price)<=0||Number(v.price)>cap)throw Error('Gift variant unavailable or over budget');
  return {variant:v.id,amount:v.price,handle:v.product.handle};
 }
 async issue(claim) {
  // Stable random code and immutable input are persisted BEFORE any network call.
  // A timeout can be retried: first look up exactly this same code, never mint a new one.
  const existing=await this.query(FIND_REWARD,{code:claim.code});if(existing.codeDiscountNodeByCode)return existing.codeDiscountNodeByCode.id;
  const d=await this.query(CREATE_REWARD,{input:claim.shopify_input});
  if(d.discountCodeBasicCreate.userErrors?.length)throw Error('Shopify did not issue the code');
  const id=d.discountCodeBasicCreate.codeDiscountNode?.id;if(!id)throw Error('Shopify did not return a discount');return id;
 }
}
