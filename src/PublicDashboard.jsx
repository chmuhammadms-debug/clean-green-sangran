import { useEffect, useMemo, useState } from "react";
import "./PublicDashboard.css";
import { fetchPublicDatabaseData } from "./dataService";
import { supabase } from "./supabase";
import { mergeSiteSettings } from "./siteSettings";
import cemeteryImage from "./assets/projects/cemetery/main.webp";
import cemeteryTeamImage from "./assets/projects/cemetery/team.webp";
import plantationImage from "./assets/projects/plantation/main.webp";
import plantationYouthImage from "./assets/projects/plantation/youth.webp";
import plantationTeamImage from "./assets/projects/plantation/team.webp";
import mosqueImage from "./assets/projects/mosque/main.webp";
import mosqueDetailImage from "./assets/projects/mosque/detail.webp";
import welfareImage from "./assets/projects/welfare/main.webp";
import mosqueVillageImage from "./assets/projects/mosque/village-view.webp";
import mosqueInteriorWideImage from "./assets/projects/mosque/interior-wide.webp";
import mosqueInteriorSideImage from "./assets/projects/mosque/interior-side.webp";
import mosqueMihrabImage from "./assets/projects/mosque/mihrab.webp";
import mosquePrayerHallImage from "./assets/projects/mosque/prayer-hall.webp";
import campaignHandoverImage from "./assets/projects/plantation/campaign-handover.webp";
import treePlantingImage from "./assets/projects/plantation/tree-planting.webp";
import saplingDisplayImage from "./assets/projects/plantation/sapling-display.webp";
import volunteerTeamImage from "./assets/projects/plantation/volunteer-team.webp";
import roadDistributionImage from "./assets/projects/plantation/road-distribution.webp";
import communityDistributionImage from "./assets/projects/plantation/community-distribution.webp";
import saplingGiftImage from "./assets/projects/plantation/sapling-gift.webp";
import campaignPreparationImage from "./assets/projects/plantation/campaign-preparation.webp";
import saplingTransportImage from "./assets/projects/plantation/sapling-transport.webp";
import youthHandoverImage from "./assets/projects/plantation/youth-handover.webp";
import grassRemovalImage from "./assets/projects/cemetery/grass-removal.webp";
import wallCleanupImage from "./assets/projects/cemetery/wall-cleanup.webp";
import cemeteryCommunityTeamImage from "./assets/projects/cemetery/community-team.webp";
import volunteerCleaningImage from "./assets/projects/cemetery/volunteer-cleaning.webp";
import communityCleanupImage from "./assets/projects/cemetery/community-cleanup.webp";
import fieldCleaningImage from "./assets/projects/cemetery/field-cleaning.webp";
import gravesiteCareImage from "./assets/projects/cemetery/gravesite-care.webp";

const fallbackSystems = [
  { id: "cemetery", name: "Cemetery Management", description: "Respectful care, restoration and transparent cemetery funding.", icon: "🌿" },
  { id: "plantation", name: "Plantation Management", description: "Greener roads, healthier spaces and a better future for Sangran.", icon: "🌳" },
  { id: "mosque", name: "Mosque Management", description: "Community-supported maintenance, improvements and transparent records.", icon: "🕌" },
  { id: "welfare", name: "Community Welfare", description: "Dignified support for families and shared village initiatives.", icon: "🤝" },
];

const fallbackTransactions = [
  { id: "cemetery-first-record", systemId: "cemetery", type: "income", person: "Ghulam Mustafa", amount: 15000, date: "2026-07-08", method: "Bank", details: "Cemetery Fund" },
];

const projectImages = {
  cemetery: cemeteryImage,
  plantation: plantationImage,
  mosque: mosqueImage,
  welfare: welfareImage,
};

const heroSlides = [
  {
    id: "cemetery",
    image: cemeteryImage,
    eyebrow: "Dignity & Care",
    title: "Honouring every resting place.",
    copy: "A shared commitment to a clean, peaceful and respectfully maintained cemetery for our community.",
  },
  {
    id: "plantation",
    image: plantationImage,
    eyebrow: "A Greener Tomorrow",
    title: "Planting hope, one tree at a time.",
    copy: "Village-led plantation that brings shade, cleaner air and a greener future to Sangran.",
  },
  {
    id: "mosque",
    image: mosqueImage,
    eyebrow: "Faith & Community",
    title: "Serving our mosque, together.",
    copy: "Transparent community support for maintenance, improvement and a welcoming place of worship.",
  },
  {
    id: "welfare",
    image: welfareImage,
    eyebrow: "Compassion in Action",
    title: "Care that reaches every home.",
    copy: "Organised welfare initiatives that protect dignity and turn collective generosity into real impact.",
  },
];

const tickerMessages = [
  { language: "ur", text: "اپنی مدد آپ، اجتماعی تعاون اور خدمتِ خلق" },
  { language: "ur", text: "اپنے گاؤں سنگراں کو صفائی، شجرکاری، خوبصورتی، نظم و ضبط اور باہمی تعاون کے ذریعے علاقے کا سب سے منفرد، سرسبز اور مثالی گاؤں بنانا ہمارا مشترکہ عزم ہے۔" },
  { language: "ur", text: "صرف گاؤں کی فلاح و بہبود، صفائی، شجرکاری اور تعمیری امور سے متعلق پیغامات شیئر کیے جائیں۔" },
  { language: "ur", text: "باہمی احترام، اخوت اور خوش اخلاقی کو ہر حال میں مقدم رکھا جائے۔" },
  { language: "ur", text: "غیر متعلقہ، سیاسی، مذہبی اختلافی یا اشتہاری مواد سے اجتناب کیا جائے۔" },
  { language: "ur", text: "ہر رکن اپنی استطاعت کے مطابق عملی کردار ادا کرے، کیونکہ گاؤں کی ترقی ہم سب کی مشترکہ ذمہ داری ہے۔" },
  { language: "ur", text: "صاف گاؤں، سرسبز گاؤں، مثالی گاؤں — ہماری مشترکہ پہچان۔ 🌱" },
];

const missionDocument = `کلین اینڈ گرین سنگراں

تعارف: "کلین اینڈ گرین سنگراں" کیا ہے؟

السلام علیکم اہلیانِ سنگراں،

"کلین اینڈ گرین سنگراں" ایک مشن ہے۔ ایک عہد ہے۔ ہم سب اہلیانِ گاؤں سنگراں کا عہد ہے کہ ہم مل کر اپنے گاؤں سنگراں کو اپنی مدد آپ کے تحت علاقے کا سب سے خوبصورت، منفرد، مثالی، صاف اور خود کفیل گاؤں بنائیں گے۔

یہ صرف درخت لگانے یا قبرستان کے اطراف جالی لگانے کا ہی نام نہیں ہے۔ یہ ہمارے مستقبل، ہمارے بزرگوں اور ہماری آنے والی نسلوں کے لیے ایک تحریک ہے۔

A. قبرستان کی بہتری
1. قبرستان کے گرد مضبوط جالی لگانا — تاکہ ہمارے مرحومین کے گھر (قبریں) جانوروں کے فضلے کی وجہ سے بے حرمتی سے محفوظ رہیں۔
2. قبرستان میں پھلدار درخت لگانا — تاکہ مستقبل میں ان کی آمدنی سے "صدقہ جاریہ فنڈ" بنے جس سے گاؤں کے مزید چھوٹے چھوٹے کام ہوتے رہیں۔
3. قبرستان میں سایہ دار درخت لگانا — زائرین کے لیے سایہ۔
4. جنازہ گاہ کا بہترین انتظام کرنا — بارش سے حفاظت کے لیے حفاظتی چھت اور معذوروں کے لیے وہیل چیئر کا انتظام۔

B. پورا گاؤں سرسبز بنانا
5. ہر گھر میں کم از کم 2 پودے لازمی لگانا — الحمدللہ یہ کام ہو بھی چکا ہے۔ نہ صرف ہمارا گاؤں بلکہ دیگر ہمسایہ دیہات میں بھی کلین اینڈ گرین سنگراں کی طرف سے ہر گھر میں پھلدار اور سایہ دار درخت لگائے گئے ہیں۔ جو گھر ابھی رہتے ہیں ان میں بھی پودے لگوانا تاکہ ہمارا گاؤں علاقے میں ایک مثال بن سکے۔
6. گاؤں کی مین سڑکوں اور گلیوں کے دونوں طرف درخت لگانا۔
7. گاؤں میں خالی جگہ پر چھوٹا "گرین زون" یا چھوٹا سا فیملی پارک بنانا۔

C. صفائی اور سہولیات
8. "ہر گھر ایک ڈسٹ بن" مہم چلانا — تاکہ کچرا سڑک، گلیوں اور نالیوں میں نہ پھینکا جائے۔
9. گلیوں اور نالیوں کی چھوٹی ٹوٹ پھوٹ کی مرمت کرنا۔
10. اجتماعی صفائی مہم — سال میں کچھ بار مل کر گاؤں کی مجموعی صفائی کرنا تاکہ ہمارے بچوں میں صفائی کی اہمیت اجاگر ہو اور بچے صفائی کو ہلکا یا بے عزتی والا کام نہ سمجھیں۔
11. گاؤں کی دیواروں پر خوبصورت پینٹنگ کروانا — تاکہ گاؤں کی سڑکوں اور گلیوں کا منظر خوبصورت لگے، باہر سے آنے والے مہمان ایک اچھے گاؤں کا تصور لے کر جائیں اور گاؤں کا مثبت چہرہ اجاگر ہو۔
12. گاؤں میں پینے کے صاف/فلٹر شدہ پانی کا انتظام کرنا۔ اس کام کے لیے گاؤں کے ایک دوست کی طرف سے مبلغ 50 ہزار روپے عطیہ کیے گئے ہیں۔ باقی رقم کا انتظام ہوتے ہی یہ کام بھی سب مل کر پایۂ تکمیل تک پہنچائیں گے، ان شاء اللہ۔

D. بچوں، نوجوانوں اور بزرگوں کے لیے
13. سالانہ سپورٹس ایونٹ کروانا — کرکٹ، والی بال، دوڑ کے مقابلے اور دیگر سرگرمیاں۔
14. کوئز اور تقریری مقابلے کروانا — بچوں میں تعلیم کا شوق پیدا کرنے کے لیے۔
15. "بہترین اور سرسبز گھر" کا مقابلہ — جس گھر میں سب سے زیادہ پودے ہوں۔
16. "بزمِ بزرگاں / دارالشعور" بنانا — گاؤں میں بزرگوں کے لیے باعزت گپ شپ اور مشاورت کی جگہ۔

E. نظام اور فنڈ
17. "سنگراں ویلفیئر کمیٹی" بنانا — جو ہر مہینے میٹنگ کر کے حساب دے۔
18. "صدقہ جاریہ فنڈ" بنانا — قبرستان کے پھلوں کی آمدنی اور چندے سے گاؤں کے کام کرنا۔

ہم نے یہ کرنا کیسے ہے؟
بہت آسان ہے: تھوڑا تھوڑا، ہر مہینہ۔ ہر گھر یا فرد سے ہر مہینے 10، 20، 50، 100، 200، 500 روپے یا زیادہ، جتنی توفیق ہو۔ یہ چندہ "صدقہ جاریہ فنڈ" میں جمع ہوگا اور اسی سے ایک ایک کر کے یہ سارے کام ہوتے جائیں گے۔

آپ سوچ رہے ہوں گے: "ہمارے تھوڑے پیسوں سے کیا ہوگا؟"

دنیا کی 3 مثالیں ہمارے لیے سبق ہیں:
1. ترکی — "شیرن پینار" گاؤں: وہاں پانی کی شدید قلت تھی۔ ہر گھر نے صرف 10 ڈالر دیے۔ ان چھوٹے چندوں سے مل کر انہوں نے ڈیم بنا لیا۔
2. انڈیا — "ہیواری بازار" گاؤں: گاؤں والوں نے ہر گھر سے ماہانہ تعاون جمع کیا اور مل کر اپنے اسکول کی تعمیر مکمل کی۔
3. افریقہ میں مسجد کی تعمیر: لوگوں نے اپنی استطاعت کے مطابق ایک ایک اینٹ کا خرچہ اٹھایا اور اجتماعی تعاون سے مسجد تعمیر ہوگئی۔

نتیجہ: جب نیت ایک ہو، ارادے مضبوط ہوں اور ہاتھ مل جائیں تو کوئی کام مشکل نہیں رہتا۔

آئیں! آج ہم بھی عہد کریں۔ مل کر اپنے گاؤں کو صاف، سرسبز اور خود کفیل بنائیں۔ یہ صدقہ جاریہ بھی ہے اور ہماری پہچان بھی۔

اپنی اگلی نسلوں کے لیے صاف، سرسبز اور بہتر سنگراں ہم سب کی ذمہ داری ہے۔`;

const gallerySlides = [
  { id: "cemetery-work", image: cemeteryImage, eyebrow: "Cemetery Care", title: "Community-led cleaning and restoration" },
  { id: "cemetery-team", image: cemeteryTeamImage, eyebrow: "Our Volunteers", title: "Together in service of Sangran" },
  { id: "plantation-work", image: plantationImage, eyebrow: "Plantation Drive", title: "Planting for the next generation" },
  { id: "plantation-youth", image: plantationYouthImage, eyebrow: "Youth Participation", title: "Passing a greener future forward" },
  { id: "plantation-team", image: plantationTeamImage, eyebrow: "Community Action", title: "Saplings shared across the village" },
  { id: "mosque-main", image: mosqueImage, eyebrow: "Our Mosque", title: "Faith at the heart of our community" },
  { id: "mosque-detail", image: mosqueDetailImage, eyebrow: "Mosque Care", title: "Preserving a shared place of worship" },
  { id: "welfare", image: welfareImage, eyebrow: "Community Welfare", title: "Compassion translated into action" },
  { id: "mosque-village", image: mosqueVillageImage, eyebrow: "Village Identity", title: "The mosque at the heart of Sangran" },
  { id: "mosque-interior", image: mosqueInteriorWideImage, eyebrow: "Prayer Hall", title: "A peaceful and welcoming worship space" },
  { id: "plantation-campaign", image: campaignHandoverImage, eyebrow: "Youth Campaign", title: "A sapling passed into caring hands" },
  { id: "plantation-display", image: saplingDisplayImage, eyebrow: "One Tree, One Life", title: "Saplings prepared for the community" },
  { id: "plantation-youth-handover", image: youthHandoverImage, eyebrow: "Youth Participation", title: "Young hands carrying a greener future" },
  { id: "cemetery-community", image: cemeteryCommunityTeamImage, eyebrow: "Volunteer Service", title: "Working together with dignity and care" },
  { id: "cemetery-cleanup", image: communityCleanupImage, eyebrow: "Clean Sangran", title: "Community action creating visible change" },
];

const projectGalleries = {
  cemetery: [
    { image: cemeteryImage, title: "Cemetery cleaning and care" },
    { image: cemeteryTeamImage, title: "Community volunteer team" },
    { image: grassRemovalImage, title: "Roadside grass removal" },
    { image: wallCleanupImage, title: "Volunteer cleanup work" },
    { image: cemeteryCommunityTeamImage, title: "Cemetery care committee" },
    { image: volunteerCleaningImage, title: "Volunteers cleaning the grounds" },
    { image: communityCleanupImage, title: "Community cleanup campaign" },
    { image: fieldCleaningImage, title: "Clearing the cemetery grounds" },
    { image: gravesiteCareImage, title: "Respectful gravesite care" },
  ],
  plantation: [
    { image: plantationImage, title: "Community plantation work" },
    { image: plantationYouthImage, title: "Youth receiving a sapling" },
    { image: plantationTeamImage, title: "Saplings shared with residents" },
    { image: campaignHandoverImage, title: "Plantation campaign handover" },
    { image: treePlantingImage, title: "Planting together for Sangran" },
    { image: saplingDisplayImage, title: "Saplings ready for distribution" },
    { image: volunteerTeamImage, title: "Youth plantation volunteers" },
    { image: roadDistributionImage, title: "Saplings delivered across the village" },
    { image: communityDistributionImage, title: "Community sapling distribution" },
    { image: saplingGiftImage, title: "A sapling for a greener future" },
    { image: campaignPreparationImage, title: "Preparing the plantation campaign" },
    { image: saplingTransportImage, title: "Transporting saplings across Sangran" },
    { image: youthHandoverImage, title: "Youth sapling handover" },
  ],
  mosque: [
    { image: mosqueImage, title: "Sangran mosque" },
    { image: mosqueDetailImage, title: "Mosque dome and minarets" },
    { image: mosqueVillageImage, title: "Mosque in the heart of Sangran" },
    { image: mosqueInteriorWideImage, title: "Main prayer hall" },
    { image: mosqueInteriorSideImage, title: "Prayer hall interior" },
    { image: mosqueMihrabImage, title: "Mihrab and prayer area" },
    { image: mosquePrayerHallImage, title: "Clean and peaceful worship space" },
  ],
  welfare: [
    { image: welfareImage, title: "Community welfare" },
  ],
};

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function totalsFor(records) {
  const income = records
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  return { income, expenses, balance: income - expenses };
}

function LogoMark({ compact = false }) {
  return (
    <span className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 72 72" role="img">
        <circle cx="36" cy="36" r="33" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.45" />
        <path d="M36 56V30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 35C21 35 15 25 17 14c13 0 23 6 24 17-1 2-3 3-5 4Z" fill="currentColor" />
        <path d="M39 43c13 0 20-8 19-19-12 0-21 5-23 15 0 2 2 3 4 4Z" fill="currentColor" opacity="0.78" />
        <path d="M25 58h23" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function SplashIntro({ visible }) {
  if (!visible) return null;
  return (
    <div className="splash-intro" aria-label="Clean and Green Sangran loading">
      <div className="splash-glow" />
      <div className="splash-logo-wrap">
        <LogoMark />
        <p className="splash-kicker">COMMUNITY • TRUST • PROGRESS</p>
        <h1>Clean &amp; Green</h1>
        <h2>Sangran</h2>
        <div className="splash-line"><span /></div>
      </div>
    </div>
  );
}

function MissionWelcome({ visible, full, onFull, onEnter, settings }) {
  if (!visible) return null;
  return (
    <div className="mission-welcome" dir="rtl" lang="ur">
      <div className={`mission-welcome__card ${full ? "mission-welcome__card--full" : ""}`}>
        <span className="mission-welcome__eyebrow">اپنی مدد آپ • اجتماعی تعاون • خدمتِ خلق</span>
        <h1>{settings.introTitle}</h1>
        {full ? (
          <pre className="mission-document">{missionDocument}</pre>
        ) : (
          <>
            <h2>{settings.introSubtitle}</h2>
            <p>{settings.introSummary}</p>
          </>
        )}
        <div className="mission-welcome__actions">
          {!full && <button className="mission-read-button" onClick={onFull}>مکمل تعارف اور منصوبہ پڑھیں</button>}
          <button className="mission-enter-button" onClick={onEnter}>ویب سائٹ پر جائیں</button>
        </div>
      </div>
    </div>
  );
}

function MoneyCards({ totals, light = false }) {
  const cards = [
    ["Total Donations", totals.income, "↗"],
    ["Total Expenses", totals.expenses, "↘"],
    ["Current Balance", totals.balance, "●"],
  ];
  return (
    <div className={`money-grid ${light ? "money-grid--light" : ""}`}>
      {cards.map(([label, amount, icon]) => (
        <article className="money-card reveal" key={label}>
          <div className="money-card__top"><span>{label}</span><b>{icon}</b></div>
          <strong>Rs. {amount.toLocaleString()}</strong>
          <small>Verified community record</small>
        </article>
      ))}
    </div>
  );
}

function RecordsTable({ records, systems, limit }) {
  const rows = typeof limit === "number" ? records.slice(0, limit) : records;
  const projectName = (id) => systems.find((system) => system.id === id)?.name || "Community Project";

  if (!rows.length) {
    return <div className="public-empty">No public records found.</div>;
  }

  return (
    <div className="public-table-wrap">
      <table className="public-table">
        <thead>
          <tr><th>Date</th><th>Type</th><th>Name / Purpose</th><th>Project</th><th>Amount</th><th>Method</th></tr>
        </thead>
        <tbody>
          {rows.map((record) => (
            <tr key={record.id}>
              <td>{record.date}</td>
              <td><span className={`record-pill record-pill--${record.type}`}>{record.type === "income" ? "Donation" : "Expense"}</span></td>
              <td><strong>{record.person}</strong><small>{record.details || "Community record"}</small></td>
              <td>{projectName(record.systemId)}</td>
              <td className="record-amount">Rs. {Number(record.amount).toLocaleString()}</td>
              <td>{record.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PublicDashboard({ onAdminLogin, siteSettings }) {
  const settings = mergeSiteSettings(siteSettings);
  const dynamicTicker = settings.tickerText.split("|").map((text) => ({ language: "ur", text: text.trim() })).filter((item) => item.text);
  const themeStyle = {
    "--forest": settings.colors.forest, "--forest-2": settings.colors.forest2,
    "--leaf": settings.colors.leaf, "--lime": settings.colors.lime,
    "--cream": settings.colors.cream, "--ink": settings.colors.ink,
  };
  const [systems, setSystems] = useState(() => loadArray("sangrahnSystems", fallbackSystems));
  const [transactions, setTransactions] = useState(() => loadArray("sangrahnTransactions", fallbackTransactions));
  const [showIntro, setShowIntro] = useState(() => sessionStorage.getItem("cgs-intro-seen") !== "yes");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFullMission, setShowFullMission] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [recordType, setRecordType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const loadPublicData = async () => {
      try {
        const data = await fetchPublicDatabaseData();
        if (!active) return;
        if (data.systems.length) setSystems(data.systems);
        setTransactions(data.transactions);
      } catch (error) {
        console.error("Public database load failed", error);
      }
    };
    loadPublicData();
    const channel = supabase.channel("public-dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, loadPublicData)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, loadPublicData)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!showIntro) return undefined;
    const timer = window.setTimeout(() => {
      setShowIntro(false);
      setShowWelcome(true);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [showIntro]);

  const enterWebsite = () => {
    sessionStorage.setItem("cgs-intro-seen", "yes");
    setShowWelcome(false);
    setShowFullMission(false);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [selectedSystemId]);

  const totals = useMemo(() => totalsFor(transactions), [transactions]);
  const selectedSystem = systems.find((system) => system.id === selectedSystemId);
  const selectedAllRecords = transactions.filter((record) => record.systemId === selectedSystemId);
  const selectedTotals = totalsFor(selectedAllRecords);
  const filteredRecords = selectedAllRecords
    .filter((record) => recordType === "all" || record.type === recordType)
    .filter((record) => String(record.person || "").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  const recentRecords = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const donorCount = new Set(
    transactions.filter((record) => record.type === "income").map((record) => String(record.person).trim().toLowerCase()),
  ).size;

  const imageFor = (system) => projectImages[system.id] || welfareImage;
  const photosFor = (system) => projectGalleries[system.id] || [{ image: imageFor(system), title: system.name }];
  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (selectedSystem) {
    return (
      <div className="public-site project-page" style={themeStyle}>
        <header className="site-nav site-nav--solid">
          <button className="brand-button" onClick={() => setSelectedSystemId(null)}>
            <LogoMark compact /><span><b>Clean &amp; Green</b><small>SANGRAN</small></span>
          </button>
          <div className="nav-actions"><button className="nav-link" onClick={() => setSelectedSystemId(null)}>← Public Home</button><button className="admin-button" onClick={onAdminLogin}>Admin Login</button></div>
        </header>

        <section className="project-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(3,24,13,.88), rgba(3,24,13,.25)), url(${imageFor(selectedSystem)})` }}>
          <div className="project-hero__content reveal is-visible">
            <span className="section-kicker">PUBLIC PROJECT LEDGER</span>
            <h1>{selectedSystem.name}</h1>
            <p>{selectedSystem.description || selectedSystem.englishName || "Transparent community project records."}</p>
          </div>
        </section>

        <main>
          <section className="content-section project-finance">
            <MoneyCards totals={selectedTotals} />
            <div className="project-gallery reveal">
              <div className="section-heading section-heading--compact">
                <div><span className="section-kicker">PROJECT PHOTO FOLDER</span><h2>{selectedSystem.name} Gallery</h2></div>
                <p>{photosFor(selectedSystem).length} community photos</p>
              </div>
              <div className="project-gallery__grid">
                {photosFor(selectedSystem).map((photo, index) => (
                  <figure key={`${selectedSystem.id}-photo-${index}`}>
                    <img src={photo.image} alt={photo.title} />
                    <figcaption><span>PHOTO {String(index + 1).padStart(2, "0")}</span><b>{photo.title}</b></figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div className="ledger-card reveal">
              <div className="section-heading section-heading--compact"><div><span className="section-kicker">LIVE TRANSPARENCY</span><h2>Public financial records</h2></div><p>Attachments and administrative controls remain private.</p></div>
              <div className="ledger-toolbar">
                <div className="filter-tabs">
                  {[["all", "All Records"], ["income", "Donations"], ["expense", "Expenses"]].map(([id, label]) => (
                    <button className={recordType === id ? "active" : ""} key={id} onClick={() => setRecordType(id)}>{label}</button>
                  ))}
                </div>
                <label className="record-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search public records" /></label>
              </div>
              <RecordsTable records={filteredRecords} systems={systems} />
            </div>
          </section>
        </main>
        <footer className="site-footer"><LogoMark compact /><div><b>Clean &amp; Green Sangran</b><p>Trust through transparency. Progress through community.</p></div><button onClick={() => setSelectedSystemId(null)}>Back to Public Home ↑</button></footer>
      </div>
    );
  }

  return (
    <div className="public-site" style={themeStyle}>
      <SplashIntro visible={showIntro} />
      <MissionWelcome visible={showWelcome} full={showFullMission} onFull={() => setShowFullMission(true)} onEnter={enterWebsite} settings={settings} />

      <header className="site-nav">
        <button className="brand-button" onClick={() => scrollTo("home")}>
          <LogoMark compact /><span><b>Clean &amp; Green</b><small>SANGRAN</small></span>
        </button>
        <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu"><i /><i /><i /></button>
        <nav className={menuOpen ? "nav-links nav-links--open" : "nav-links"}>
          <button onClick={() => scrollTo("home")}>Home</button>
          <button onClick={() => scrollTo("mission")}>Mission</button>
          <button onClick={() => scrollTo("projects")}>Projects</button>
          <button onClick={() => scrollTo("transparency")}>Transparency</button>
          <button onClick={() => scrollTo("about")}>About</button>
          <button className="admin-button" onClick={onAdminLogin}>Admin Login</button>
        </nav>
      </header>

      <section className="hero" id="home">
        {heroSlides.map((slide, index) => (
          <div className={`hero-slide ${index === slideIndex ? "hero-slide--active" : ""}`} key={slide.id} style={{ backgroundImage: `url(${slide.image})` }} />
        ))}
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-eyebrow">{heroSlides[slideIndex].eyebrow}</span>
          <h1>{heroSlides[slideIndex].title}</h1>
          <p>{heroSlides[slideIndex].copy}</p>
          <div className="hero-actions"><button className="button-primary" onClick={() => scrollTo("projects")}>Explore our projects <span>→</span></button><button className="button-ghost" onClick={() => scrollTo("transparency")}>View public records</button></div>
        </div>
        <div className="hero-progress">
          {heroSlides.map((slide, index) => <button aria-label={`Show ${slide.eyebrow}`} className={index === slideIndex ? "active" : ""} key={slide.id} onClick={() => setSlideIndex(index)}><span /></button>)}
        </div>
        <div className="hero-scroll"><span>SCROLL TO DISCOVER</span><i /></div>
      </section>

      <div className="impact-ticker" aria-hidden="true">
        <div className="impact-ticker__track">
          {[...(dynamicTicker.length ? dynamicTicker : tickerMessages), ...(dynamicTicker.length ? dynamicTicker : tickerMessages)].map((message, index) => (
            <span className={message.language === "ur" ? "ticker-urdu" : "ticker-english"} dir={message.language === "ur" ? "rtl" : "ltr"} lang={message.language} key={`${message.language}-${index}`}>
              {message.text}<b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <main>
        <section className="mission-section content-section" id="mission">
          <div className="mission-copy reveal">
            <span className="section-kicker">OUR SHARED MISSION • ہمارا مشترکہ عزم</span>
            <div className="mission-urdu" dir="rtl" lang="ur">
              <h2>اپنی مدد آپ، اجتماعی تعاون اور خدمتِ خلق</h2>
              <p>اپنے گاؤں سنگراں کو صفائی، شجرکاری، خوبصورتی، نظم و ضبط اور باہمی تعاون کے ذریعے علاقے کا سب سے منفرد، سرسبز اور مثالی گاؤں بنانا ہمارا مشترکہ عزم ہے۔</p>
            </div>
            <div className="mission-english">
              <h3>Self-help, collective cooperation, and service to humanity.</h3>
              <p>Our shared commitment is to make Sangran the region’s most distinctive, green, organised, and exemplary village through cleanliness, tree plantation, beautification, discipline, and mutual cooperation.</p>
            </div>
            <div className="mission-points"><span><b>01</b>Community-led decisions</span><span><b>02</b>Transparent financial records</span><span><b>03</b>Long-term local impact</span></div>
          </div>
          <div className="mission-visual reveal"><img src={plantationImage} alt="Community plantation work" /><div className="mission-badge"><strong>100%</strong><span>Community<br />Transparency</span></div></div>
        </section>

        <section className="impact-section" id="transparency">
          <div className="content-section">
            <div className="section-heading section-heading--light reveal"><div><span className="section-kicker">LIVE FINANCIAL IMPACT</span><h2>Every rupee, visible.</h2></div><p>Updated directly from verified community records.</p></div>
            <MoneyCards totals={totals} light />
            <div className="impact-numbers reveal"><div><strong>{systems.length}</strong><span>Active Projects</span></div><div><strong>{donorCount}</strong><span>Community Donors</span></div><div><strong>{transactions.length}</strong><span>Verified Records</span></div><div><strong>24/7</strong><span>Public Access</span></div></div>
          </div>
        </section>

        <section className="projects-section content-section" id="projects">
          <div className="section-heading reveal"><div><span className="section-kicker">WHAT WE CARE FOR</span><h2>Projects that shape<br />our shared future.</h2></div><p>Select any project to explore its public financial record.</p></div>
          <div className="project-grid">
            {systems.map((system, index) => {
              const projectTotals = totalsFor(transactions.filter((record) => record.systemId === system.id));
              return (
                <article className="project-card reveal" key={system.id} onClick={() => setSelectedSystemId(system.id)}>
                  <img src={imageFor(system)} alt={system.name} />
                  <div className="project-card__shade" />
                  <span className="project-card__number">0{index + 1}</span>
                  <div className="project-card__content"><span>{system.icon} COMMUNITY PROJECT</span><h3>{system.name}</h3><p>{system.description || system.englishName || "Transparent community initiative."}</p><div><b>Balance</b><strong>Rs. {projectTotals.balance.toLocaleString()}</strong></div><button>View project record →</button></div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="visual-reel-section">
          <div className="section-heading content-section reveal"><div><span className="section-kicker">SANGRAN IN MOTION</span><h2>Small actions.<br />Lasting change.</h2></div></div>
          <div className="visual-reel"><div className="visual-reel__track">{[...gallerySlides, ...gallerySlides].map((slide, index) => <figure key={`${slide.id}-reel-${index}`}><img src={slide.image} alt={slide.title} /><figcaption><span>{slide.eyebrow}</span><b>{slide.title}</b></figcaption></figure>)}</div></div>
        </section>

        <section className="records-section content-section">
          <div className="section-heading reveal"><div><span className="section-kicker">LATEST ACTIVITY</span><h2>Transparency,<br />as it happens.</h2></div><p>The latest public donations and expenses across all projects.</p></div>
          <div className="ledger-card reveal"><RecordsTable records={recentRecords} systems={systems} limit={8} /></div>
        </section>

        <section className="about-section" id="about">
          <div className="about-image"><img src={cemeteryImage} alt="A clean green community space" /></div>
          <div className="about-copy reveal"><span className="section-kicker">BUILT ON TRUST</span><h2>One village.<br />One shared responsibility.</h2><p>This platform is more than a record book. It is a public promise that community contributions will remain visible, organised and connected to meaningful work.</p><button className="button-primary" onClick={onAdminLogin}>Committee admin access <span>→</span></button></div>
        </section>
      </main>

      <footer className="site-footer"><LogoMark compact /><div><b>Clean &amp; Green Sangran</b><p>Trust through transparency. Progress through community.</p></div><nav><button onClick={() => scrollTo("projects")}>Projects</button><button onClick={() => scrollTo("transparency")}>Public Records</button><button onClick={onAdminLogin}>Admin</button></nav><small>© {new Date().getFullYear()} Clean &amp; Green Sangran</small></footer>
    </div>
  );
}

export default PublicDashboard;
