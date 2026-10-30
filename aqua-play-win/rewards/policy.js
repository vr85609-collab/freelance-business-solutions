export const POLICY = Object.freeze({
  version: '2026-10-30-draft', timezone: 'America/Chicago',
  starsPerWin: 20, firstWinOfDayBonus: 5, sevenDayBonus: 25,
  maxRewardWinsPerDay: 3, minimumGameSeconds: 20,
  minimumPurchase: '25.00', expiryHours: 72,
  rewards: [
    {id:'coupon5', label:'5% store coupon', points:1000, wins:10, days:3, percent:5},
    {id:'coupon10', label:'10% store coupon', points:2500, wins:25, days:7, percent:10},
    {id:'coupon15', label:'15% store coupon', points:5000, wins:50, days:14, percent:15},
    {id:'bathbomb', label:'Bath-bomb gift request', points:10000, wins:100, days:30, approval:true}
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
