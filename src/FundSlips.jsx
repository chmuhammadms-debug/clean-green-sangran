import { useEffect, useRef, useState } from 'react';
import { useFundReports } from './fundReports';
import './FundSlips.css';

export default function FundSlips({ language = 'en' }) {
  const ur = language === 'ur';
  const [month, setMonth] = useState(null);
  const [opened, setOpened] = useState(null);
  const dialog = useRef(null);
  const { reports: items } = useFundReports();
  const months = [...new Set(items.map(i => i.date ? i.date.slice(0, 7) : 'undated'))].sort().reverse();
  const label = value => value === 'undated' ? (ur ? 'تاریخ کی تصدیق باقی' : 'Date to confirm') : new Intl.DateTimeFormat(ur ? 'ur-PK' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T12:00:00Z`));
  useEffect(() => {
    if (opened && !dialog.current.open) dialog.current.showModal();
    else if (!opened && dialog.current.open) dialog.current.close();
  }, [opened]);
  return <section className="fund-slips" dir={ur ? 'rtl' : 'ltr'}>
    <h2>{ur ? 'روزانہ کی سلپ رپورٹس' : 'Daily slip reports'}</h2>
    <p>{ur ? 'مہینہ منتخب کریں۔ روزانہ کی سلپ رپورٹس تاریخ وار دیکھیں۔' : 'Choose a month to see daily slip reports in date order.'}</p>
    <div className="fund-slips__months">{months.map(m => <button type="button" key={m} aria-pressed={month === m} onClick={() => setMonth(month === m ? null : m)}>{label(m)} <span>({items.filter(i => (i.date?.slice(0, 7) || 'undated') === m).length})</span></button>)}</div>
    {month && <div className="fund-slips__grid">{items.filter(i => (i.date?.slice(0, 7) || 'undated') === month).map(item => <button type="button" key={item.id} className="fund-slips__card" onClick={() => setOpened(item)}>
      <img src={item.url} alt={item.person || (ur ? 'سلپ / روزانہ رپورٹ' : 'Slip / daily report')} loading="lazy" />
      <strong>{item.date || label('undated')}</strong><span>{item.person || (item.kind === 'reports' ? (ur ? 'روزانہ کی رپورٹ' : 'Daily report') : (ur ? 'ادائیگی کی سلپ' : 'Payment slip'))}</span>
    </button>)}</div>}
    {!months.length && <p>{ur ? 'ابھی کوئی سلپ موجود نہیں۔' : 'No slips available yet.'}</p>}
    <dialog ref={dialog} className="fund-slips__dialog" onCancel={() => setOpened(null)} onClose={() => setOpened(null)}>
      <header><strong>{opened?.date || (ur ? 'سلپ / رپورٹ' : 'Slip / report')}</strong><button type="button" onClick={() => setOpened(null)} autoFocus aria-label={ur ? 'بند کریں' : 'Close'}>×</button></header>
      {opened && <><a href={opened.url} target="_blank" rel="noreferrer">{ur ? 'مکمل تصویر کھولیں' : 'Open full image'}</a>{/\.pdf(?:\?|$)|^data:application\/pdf/i.test(opened.url) ? <iframe src={opened.url} title="Receipt PDF" /> : <img src={opened.url} alt={opened.person || 'Slip / report'} />}</>}
    </dialog>
  </section>;
}
