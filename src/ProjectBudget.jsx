import { budgetSummary } from './projectBudget';
import './ProjectBudget.css';
export default function ProjectBudget({profile={},spent=0,language='ur'}) {
 const ur=language==='ur'; const b=budgetSummary(profile,spent);
 const money=n=>`Rs. ${n.toLocaleString('en-PK',{maximumFractionDigits:2})}`;
 const range=(a,z)=>a===z?money(z):`${money(a)} — ${money(z)}`;
 return <section className="project-budget" dir={ur?'rtl':'ltr'}>
 <h2>{ur?'منصوبے کا تخمینہ اور خرچ':'Project estimate and expenditure'}</h2>
 <div className="project-budget__grid">
 <div><span>{ur?'تقریباً کل تخمینہ':'Estimated total cost'}</span><strong>{b.max?range(b.min,b.max):(ur?'تخمینہ ابھی درج نہیں':'Estimate not set')}</strong></div>
 <div><span>{ur?'اب تک خرچ':'Spent so far'}</span><strong>{money(b.spent)}</strong></div>
 <div><span>{ur?'باقی تخمینی خرچ':'Estimated remaining cost'}</span><strong>{b.max?range(b.remainingMin,b.remainingMax):'—'}</strong></div>
 </div>
 {b.max>0&&<><p><b>{b.percent.toFixed(1)}%</b> {ur?'بجٹ استعمال ہوا':'of budget used'}</p><div className="project-budget__track" role="progressbar" aria-label={ur?'بجٹ کا استعمال':'Budget used'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,b.percent)}><span style={{width:`${Math.min(100,b.percent)}%`}}/></div>{b.over>0&&<p className="project-budget__over">{ur?'زیادہ سے زیادہ تخمینے سے زائد خرچ':'Over the upper estimate'}: {money(b.over)}</p>}<small>{ur?'فیصد زیادہ سے زیادہ تخمینے کے حساب سے ہے۔ یہ مالی پیش رفت ہے؛ تعمیراتی تکمیل کی پیمائش نہیں۔':'Percentage uses the upper estimate. This measures spending, not physical completion.'}</small></>}
 </section>;
}
