import ProjectIcon from "./ProjectIcon";
import { welfareChildSystems } from "./welfareManagement";
import "./WelfareManagementHub.css";

export default function WelfareManagementHub({
  systems,
  onOpenSystem,
  language = "en",
  getName = (system) => system.name,
  getDescription = (system) => system.description,
  getImage = (system) => system.coverImage,
  getPhotoCount = (system) => system.galleryUrls?.length || 0,
  adminMode = false,
}) {
  const ur = language === "ur";
  const projects = welfareChildSystems(systems);

  return (
    <section className="welfare-hub" dir={ur ? "rtl" : "ltr"}>
      <div className="welfare-hub__heading">
        <div>
          <span>{ur ? "خدمت، صحت اور مثبت سرگرمیاں" : "CARE • HEALTH • OPPORTUNITY"}</span>
          <h2>{ur ? "فلاحی منصوبہ منتخب کریں" : "Select a welfare project"}</h2>
          <p>{ur
            ? "تمام عطیات اور اخراجات ایک مرکزی فلاحی فنڈ میں ریکارڈ ہوں گے، جبکہ ہر منصوبے کا تعارف، کور اور تصویری گیلری الگ ہوگی۔"
            : "All donations and expenses are recorded in one central welfare fund, while every initiative has its own overview, cover and photo gallery."}</p>
        </div>
        <div className="welfare-hub__count"><strong>{projects.length}</strong><small>{ur ? "منصوبے" : "PROJECTS"}</small></div>
      </div>

      {adminMode && (
        <div className="welfare-hub__admin-note">
          <b>Admin control:</b> تمام مالی اندراج مرکزی Community Welfare منصوبے میں کریں۔ Project Manager سے ہر ذیلی منصوبے کا نام، تعارف، آئیکن، کور اور گیلری تبدیل کی جاسکتی ہے۔
        </div>
      )}

      <div className="welfare-hub__grid">
        {projects.map((project, index) => {
          const coverImage = getImage(project);
          return (
            <article className="welfare-account-card" key={project.id}>
              <div className="welfare-account-card__cover">
                {coverImage && <img src={coverImage} alt="" />}
                <span className="welfare-account-card__shade" />
                <span className="welfare-account-card__number">0{index + 1}</span>
                <span className="welfare-account-card__icon"><ProjectIcon project={project} size={46} /></span>
              </div>
              <div className="welfare-account-card__body">
                <h3>{getName(project)}</h3>
                <p>{getDescription(project)}</p>
                <div className="welfare-account-card__meta">
                  <span>{ur ? "الگ تصویری گیلری" : "SEPARATE PHOTO GALLERY"}</span>
                  <b>{getPhotoCount(project)} {ur ? "تصاویر" : "PHOTOS"}</b>
                </div>
                <button type="button" onClick={() => onOpenSystem(project.id)}>
                  {ur ? "منصوبہ اور گیلری کھولیں" : "Open project gallery"} <span>{ur ? "←" : "→"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
