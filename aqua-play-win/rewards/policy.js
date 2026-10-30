export const REWARD_PRODUCTS = Object.freeze([
  {id:'gid://shopify/ProductVariant/44033465483460',name:'Citrus Burst Bath Bomb',handle:'citrus-burst-bath-bomb'},
  {id:'gid://shopify/ProductVariant/44033448804548',name:'Sleepy Time Bath Bomb',handle:'sleepy-time-bath-bomb'},
  {id:'gid://shopify/ProductVariant/44033428324548',name:'Love It Bath Bomb',handle:'love-it-bath-bomb'}
]);
export const POLICY = Object.freeze({
  version: '2026-10-30-profit-review', timezone: 'America/Chicago',
  starsPerWin: 20, firstWinOfDayBonus: 5, sevenDayBonus: 25,
  maxRewardWinsPerDay: 3, minimumGameSeconds: 20,
  expiryHours: 168, giftBuyQuantity: 5,
  rewards: [
    {id:'coupon2', label:'$2 off $25 of eligible bath bombs', points:500, wins:20, days:7, amount:'2.00', minimumPurchase:'25.00'},
    {id:'coupon4', label:'$4 off $40 of eligible bath bombs', points:1500, wins:60, days:21, amount:'4.00', minimumPurchase:'40.00'},
    {id:'coupon6', label:'$6 off $50 of eligible bath bombs', points:3000, wins:120, days:45, amount:'6.00', minimumPurchase:'50.00'},
    {id:'bathbomb', label:'Gift review: buy 5 eligible bath bombs, get 1 approved bath bomb free', points:4000, wins:150, days:60, approval:true}
  ]
});
export const ineligibleGames = new Set(['bubbles','higher']);
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:POLICY.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function priorDay(day) { return new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10); }
export function weekKey(day) {
  const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7); return d.toISOString().slice(0,10);
}
export function eligibility(account, reward) {
  return Number(account.balance)>=reward.points && Number(account.wins)>=reward.wins && Number(account.days)>=reward.days;
}
