export function budgetSummary(profile={},expense=0) {
 const positive=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const upper=positive(profile.budgetMax??profile.budget);
 const lower=positive(profile.budgetMin??upper);
 const max=Math.max(lower,upper),min=lower||max,spent=positive(expense);
 return {min,max,spent,percent:max?spent/max*100:0,remainingMin:Math.max(0,min-spent),remainingMax:Math.max(0,max-spent),over:Math.max(0,spent-max)};
}
