import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './VisitorAnalytics.css';
const pages = {home:'مرکزی صفحہ',project:'منصوبے',event:'تقریبات',records:'عطیات کا ریکارڈ',membership:'ممبرشپ',donation:'عطیہ کی تفصیل'};
const sources = {direct:'براہِ راست / نامعلوم',google:'Google',facebook:'Facebook',instagram:'Instagram',other:'دوسری ویب سائٹس'};
export default function VisitorAnalytics() {
  const [allowed,setAllowed]=useState(false);
  const [opened,setOpened]=useState(false);
  const [report,setReport]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(async ({data})=>{
      if(!data.session) return;
      const result=await supabase.from('analytics_readers').select('user_id').eq('user_id',data.session.user.id).maybeSingle();
      if(active) setAllowed(!result.error && Boolean(result.data));
    }).catch(()=>{});
    return ()=>{active=false;};
  },[]);
  async function refresh(){
    setBusy(true);setError('');
    try {
      const {data,error:problem}=await supabase.rpc('site_analytics_summary');
      if(problem) throw problem;
      setReport(data);
    } catch {setError('رپورٹ لوڈ نہیں ہوئی۔ دوبارہ کوشش کریں۔');}
    finally {setBusy(false);}
  }
  if(!allowed) return null;
  const max=Math.max(1,...(report?.daily || []).map(d=>Number(d.visitors)));
  return <section className="visitor-analytics" dir="rtl">
    <button className="visitor-analytics__toggle" type="button" aria-expanded={opened} onClick={()=>{setOpened(!opened);if(!opened) refresh();}}>📊 وزیٹرز کا حساب — صرف آپ کے لیے {opened?'−':'+'}</button>
    {opened && <div className="visitor-analytics__body">
      <p>پاکستان کے وقت کے مطابق • منفرد براؤزرز کا تخمینہ، لوگوں کی شناخت نہیں</p>
      <button type="button" onClick={refresh} disabled={busy}>{busy?'لوڈ ہو رہا ہے…':'تازہ کریں'}</button>
      {error && <p role="alert">{error}</p>}
      {report && <>
        <div className="visitor-analytics__cards">{[['today','آج'],['week','گزشتہ 7 دن'],['month','اس مہینے']].map(([key,label])=><article key={key}><h3>{label}</h3><strong>{report.periods[key].visitors.toLocaleString()}</strong><span>وزیٹرز (براؤزرز)</span><b>{report.periods[key].views.toLocaleString()} صفحات کے ویوز</b></article>)}</div>
        <h3>گزشتہ 7 دن — روزانہ وزیٹرز</h3>
        <div className="visitor-analytics__chart">{report.daily.map(d=><div className="visitor-analytics__day" key={d.day}><span>{d.day.slice(5)}</span><div><i style={{width:`${Number(d.visitors)/max*100}%`}} /></div><b>{d.visitors}</b></div>)}</div>
        <div className="visitor-analytics__tables">{[['زیادہ دیکھے گئے صفحات',report.pages,pages,'page'],['لوگ کہاں سے آئے',report.sources,sources,'source']].map(([title,rows,labels,key])=><div key={key}><h3>{title} — اس ماہ</h3>{rows.length?<table><thead><tr><th>قسم</th><th>ویوز</th></tr></thead><tbody>{rows.map(r=><tr key={r[key]}><td>{labels[r[key]] || r[key]}</td><td>{r.views}</td></tr>)}</tbody></table>:<p>ابھی کوئی وزٹ ریکارڈ نہیں ہوا۔</p>}</div>)}</div>
        <small>آخری تازہ کاری: {new Date(report.updated_at).toLocaleString('en-PK',{timeZone:'Asia/Karachi'})}</small>
      </>}
      <p className="visitor-analytics__note">گنتی اس نظام کے فعال ہونے سے شروع ہوتی ہے۔ ایک شخص کے مختلف براؤزر الگ شمار ہو سکتے ہیں۔ نجی براؤزنگ، اسٹوریج صاف کرنے، بلاکرز اور بوٹس سے اعداد متاثر ہو سکتے ہیں۔ لاگ اِن وزٹس شمار نہیں ہوتے۔</p>
    </div>}
  </section>;
}
