import { useEffect, useState } from "react";
import "./ProjectManager.css";
import ProjectIcon from "./ProjectIcon";
import { uploadWebsiteImage, uploadWebsiteImages } from "./mediaUpload";
import {
  isMosqueChild,
  isMosqueProject,
  mosqueProjectParentId,
} from "./mosqueManagement";
import { isWelfareChild } from "./welfareManagement";

function buildItems(systems = [], settings = {}) {
  const profiles = settings.projectProfilesByProject || {};
  return systems.map((system) => {
    const profile = profiles[system.id] || {};
    return {
      id: system.id,
      parentMosqueId: profile.parentMosqueId || mosqueProjectParentId(system, profiles) || "",
      nameEn: profile.nameEn || system.name || "",
      nameUr: profile.nameUr || system.nameUr || "",
      descriptionEn: profile.descriptionEn || system.description || "",
      descriptionUr: profile.descriptionUr || system.descriptionUr || "",
      icon: system.icon || "📁",
      coverImage: profile.coverImage || system.coverImage || "",
      galleryText: Array.isArray(profile.galleryUrls) && profile.galleryUrls.length
        ? profile.galleryUrls.join("\n")
        : Array.isArray(system.galleryUrls)
          ? system.galleryUrls.join("\n")
          : "",
      isActive: system.isActive !== false,
      status: profile.status || system.status || "proposed",
      budget: profile.budget ?? system.budget ?? "",
      completionPercent: Number.isFinite(Number(profile.completionPercent))
        ? Math.max(0, Math.min(100, Number(profile.completionPercent)))
        : 0,
      startDate: profile.startDate || "",
      expectedCompletionDate: profile.expectedCompletionDate || "",
      planEn: profile.planEn || "",
      planUr: profile.planUr || "",
    };
  });
}

export default function ProjectManager({ systems, setSystems, settings, onSaveSettings, saving }) {
  const [items, setItems] = useState(() => buildItems(systems, settings));
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    setItems(buildItems(systems, settings));
  }, [systems, settings]);

  const updateItem = (id, key, value) => setItems((current) => current.map((item) => (
    item.id === id ? { ...item, [key]: value } : item
  )));

  const galleryUrls = (item) => item.galleryText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  const setGalleryUrls = (id, urls) => updateItem(id, "galleryText", urls.join("\n"));
  const setUploadState = (key, value) => setUploading((current) => ({ ...current, [key]: value }));

  const uploadCover = async (item, file) => {
    if (!file) return;
    const key = `${item.id}-cover`;
    setMessage("");
    setUploadState(key, true);
    try {
      const uploaded = await uploadWebsiteImage(file, `projects/${item.id}/cover`);
      updateItem(item.id, "coverImage", uploaded.url);
      setMessage("کور تصویر اپلوڈ ہوگئی ہے۔ آخر میں Save & Publish Projects ضرور دبائیں۔");
    } catch (error) {
      setMessage(`تصویر اپلوڈ نہیں ہوسکی: ${error.message}`);
    } finally {
      setUploadState(key, false);
    }
  };

  const uploadGallery = async (item, files) => {
    if (!files?.length) return;
    const key = `${item.id}-gallery`;
    setMessage("");
    setUploadState(key, true);
    try {
      const uploaded = await uploadWebsiteImages(files, `projects/${item.id}/gallery`);
      setGalleryUrls(item.id, [...galleryUrls(item), ...uploaded.map((image) => image.url)]);
      setMessage(`${uploaded.length} گیلری تصویر${uploaded.length > 1 ? "یں" : ""} اپلوڈ ہوگئی۔ آخر میں Save & Publish Projects دبائیں۔`);
    } catch (error) {
      setMessage(`گیلری اپلوڈ نہیں ہوسکی: ${error.message}`);
    } finally {
      setUploadState(key, false);
    }
  };

  const removeGalleryImage = (item, imageIndex) => {
    setGalleryUrls(item.id, galleryUrls(item).filter((_, index) => index !== imageIndex));
  };

  const moveGalleryImage = (item, imageIndex, direction) => {
    const urls = galleryUrls(item);
    const nextIndex = imageIndex + direction;
    if (nextIndex < 0 || nextIndex >= urls.length) return;
    [urls[imageIndex], urls[nextIndex]] = [urls[nextIndex], urls[imageIndex]];
    setGalleryUrls(item.id, urls);
  };

  const addProject = () => {
    const id = `project-${Date.now()}`;
    setItems((current) => [...current, {
      id,
      parentMosqueId: "",
      nameEn: "New Community Project",
      nameUr: "نیا عوامی منصوبہ",
      descriptionEn: "Transparent community project records.",
      descriptionUr: "عوامی منصوبے کا شفاف ریکارڈ۔",
      icon: "📁",
      coverImage: "",
      galleryText: "",
      isActive: true,
      status: "proposed",
      budget: "",
      completionPercent: 0,
      startDate: "",
      expectedCompletionDate: "",
      planEn: "",
      planUr: "",
    }]);
    window.setTimeout(() => document.getElementById(`project-editor-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const removeUnsavedProject = (id) => {
    if (systems.some((system) => system.id === id)) {
      setMessage("محفوظ شدہ منصوبے کو حذف کرنے کے بجائے Hidden کریں، تاکہ اس کا مالی ریکارڈ محفوظ رہے۔");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const saveProjects = async (event) => {
    event.preventDefault();
    setMessage("");
    const cleanItems = items.filter((item) => item.nameEn.trim());
    const nextSystems = cleanItems.map((item) => ({
      id: item.id,
      parentMosqueId: item.parentMosqueId || undefined,
      name: item.nameEn.trim(),
      description: item.descriptionEn.trim() || "Community management system",
      icon: item.icon.trim() || "📁",
      isActive: item.isActive !== false,
    }));
    const projectProfilesByProject = cleanItems.reduce((profiles, item) => ({
      ...profiles,
      [item.id]: {
        nameEn: item.nameEn.trim(),
        nameUr: item.nameUr.trim(),
        descriptionEn: item.descriptionEn.trim(),
        descriptionUr: item.descriptionUr.trim(),
        coverImage: item.coverImage.trim(),
        galleryUrls: item.galleryText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
        parentMosqueId: item.parentMosqueId || "",
        status: item.status || "proposed",
        budget: Math.max(0, Number(item.budget) || 0),
        completionPercent: Math.max(0, Math.min(100, Number(item.completionPercent) || 0)),
        startDate: item.startDate || "",
        expectedCompletionDate: item.expectedCompletionDate || "",
        planEn: item.planEn.trim(),
        planUr: item.planUr.trim(),
      },
    }), {});

    try {
      setSystems(nextSystems);
      await onSaveSettings({ ...settings, projectProfilesByProject });
      setMessage("تمام منصوبوں کی تبدیلیاں محفوظ اور Publish ہوگئی ہیں۔");
    } catch (error) {
      setMessage(`محفوظ نہیں ہوسکا: ${error.message}`);
    }
  };

  return (
    <section className="project-manager panel" id="project-manager">
      <div className="project-manager__heading">
        <div><span>ADMIN PROJECT CONTROL</span><h2>Project Manager</h2></div>
        <button type="button" onClick={addProject}>+ نیا منصوبہ</button>
      </div>
      <p className="project-manager__intro">یہاں سے ہر منصوبے کا اردو/انگریزی تعارف، آئیکن، کور تصویر، گیلری اور Public حالت تبدیل کریں۔ مسجد اور فلاحی منصوبوں کے تمام ذیلی اکاؤنٹس بھی الگ تبدیل کیے جاسکتے ہیں۔</p>

      <form onSubmit={saveProjects}>
        <div className="project-manager__list">
          {items.map((item, index) => (
            <article className="project-editor" id={`project-editor-${item.id}`} key={item.id}>
              <div className="project-editor__top">
                <div className="project-editor__identity"><ProjectIcon project={item} size={34} /><div><small>{isMosqueProject(item) ? "MOSQUE WORK PROJECT" : isMosqueChild(item) ? "MOSQUE ACCOUNT" : isWelfareChild(item) ? "WELFARE PROJECT" : `PROJECT ${index + 1}`}</small><strong>{item.nameEn || "Untitled Project"}</strong></div></div>
                <label className="project-editor__visibility"><input type="checkbox" checked={item.isActive !== false} onChange={(event) => updateItem(item.id, "isActive", event.target.checked)} /><b>{item.isActive !== false ? "Public" : "Hidden"}</b></label>
              </div>

              <div className="project-editor__grid">
                <label><span>Icon</span><input value={item.icon} onChange={(event) => updateItem(item.id, "icon", event.target.value)} placeholder="🌿" /></label>
                <label><span>Project ID</span><input value={item.id} disabled /></label>
                {item.parentMosqueId && <label><span>Parent mosque account</span><input value={item.parentMosqueId} disabled /></label>}
                <label><span>English name</span><input value={item.nameEn} onChange={(event) => updateItem(item.id, "nameEn", event.target.value)} /></label>
                <label><span>اردو نام</span><input dir="rtl" value={item.nameUr} onChange={(event) => updateItem(item.id, "nameUr", event.target.value)} /></label>
                <label><span>English description</span><textarea rows="3" value={item.descriptionEn} onChange={(event) => updateItem(item.id, "descriptionEn", event.target.value)} /></label>
                <label><span>اردو تعارف</span><textarea dir="rtl" rows="3" value={item.descriptionUr} onChange={(event) => updateItem(item.id, "descriptionUr", event.target.value)} /></label>

                <div className="project-editor__wide project-progress-editor">
                  <div className="project-progress-editor__heading">
                    <div><span>PROJECT PROGRESS & MASTER PLAN</span><strong>منصوبے کی پیش رفت اور ماسٹر پلان</strong></div>
                    <b>{Math.max(0, Math.min(100, Number(item.completionPercent) || 0))}%</b>
                  </div>
                  <div className="project-progress-editor__bar"><span style={{ width: `${Math.max(0, Math.min(100, Number(item.completionPercent) || 0))}%` }} /></div>
                  <div className="project-progress-editor__grid">
                    <label><span>Status / حالت</span><select value={item.status} onChange={(event) => updateItem(item.id, "status", event.target.value)}><option value="proposed">Proposed</option><option value="approved">Approved</option><option value="fundraising">Fundraising</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="on-hold">On Hold</option></select></label>
                    <label><span>Total Budget (Rs.) / بجٹ</span><input type="number" min="0" step="1" value={item.budget} onChange={(event) => updateItem(item.id, "budget", event.target.value)} placeholder="0" /></label>
                    <label><span>Completion % / تکمیل</span><input type="number" min="0" max="100" step="1" value={item.completionPercent} onChange={(event) => updateItem(item.id, "completionPercent", event.target.value)} /></label>
                    <label><span>Start Date / آغاز</span><input type="date" value={item.startDate} onChange={(event) => updateItem(item.id, "startDate", event.target.value)} /></label>
                    <label><span>Expected Completion / متوقع تکمیل</span><input type="date" value={item.expectedCompletionDate} onChange={(event) => updateItem(item.id, "expectedCompletionDate", event.target.value)} /></label>
                    <label className="project-progress-editor__wide"><span>Master Plan / Future Goal (English)</span><textarea rows="3" value={item.planEn} onChange={(event) => updateItem(item.id, "planEn", event.target.value)} placeholder="What will this project achieve next?" /></label>
                    <label className="project-progress-editor__wide"><span>ماسٹر پلان / مستقبل کا ہدف (اردو)</span><textarea dir="rtl" rows="3" value={item.planUr} onChange={(event) => updateItem(item.id, "planUr", event.target.value)} placeholder="اس منصوبے کا اگلا ہدف کیا ہے؟" /></label>
                  </div>
                </div>

                <div className="project-editor__wide project-media-control">
                  <div className="project-media-control__heading"><span>Project cover image</span><small>موبائل یا کمپیوٹر گیلری سے تصویر منتخب کریں</small></div>
                  <div className="project-media-control__actions">
                    <label className={`project-media-upload ${uploading[`${item.id}-cover`] ? "is-uploading" : ""}`}>
                      <input type="file" accept="image/*" disabled={uploading[`${item.id}-cover`]} onChange={(event) => { uploadCover(item, event.target.files?.[0]); event.target.value = ""; }} />
                      <span>{uploading[`${item.id}-cover`] ? "Uploading..." : item.coverImage ? "↻ Replace cover" : "+ Upload cover"}</span>
                    </label>
                    {item.coverImage && <button type="button" className="project-media-remove" onClick={() => updateItem(item.id, "coverImage", "")}>Remove cover</button>}
                  </div>
                  <details className="project-media-url"><summary>یا تصویر کا URL استعمال کریں</summary><input type="url" value={item.coverImage} onChange={(event) => updateItem(item.id, "coverImage", event.target.value)} placeholder="https://..." /></details>
                  {item.coverImage && <img className="project-editor__preview" src={item.coverImage} alt="Project cover preview" />}
                </div>

                <div className="project-editor__wide project-media-control">
                  <div className="project-media-control__heading"><span>Project photo gallery</span><small>ایک ساتھ کئی تصاویر بھی منتخب کی جاسکتی ہیں</small></div>
                  <label className={`project-media-upload ${uploading[`${item.id}-gallery`] ? "is-uploading" : ""}`}>
                    <input type="file" accept="image/*" multiple disabled={uploading[`${item.id}-gallery`]} onChange={(event) => { uploadGallery(item, event.target.files); event.target.value = ""; }} />
                    <span>{uploading[`${item.id}-gallery`] ? "Uploading gallery..." : "+ Add gallery photos"}</span>
                  </label>
                  <div className="project-gallery-editor">
                    {galleryUrls(item).map((url, imageIndex) => (
                      <article key={`${url}-${imageIndex}`}>
                        <img src={url} alt={`Gallery ${imageIndex + 1}`} />
                        <div><button type="button" disabled={imageIndex === 0} onClick={() => moveGalleryImage(item, imageIndex, -1)}>←</button><b>{imageIndex + 1}</b><button type="button" disabled={imageIndex === galleryUrls(item).length - 1} onClick={() => moveGalleryImage(item, imageIndex, 1)}>→</button><button type="button" className="danger" onClick={() => removeGalleryImage(item, imageIndex)}>×</button></div>
                      </article>
                    ))}
                    {!galleryUrls(item).length && <p>ابھی کوئی اضافی تصویر شامل نہیں ہے۔</p>}
                  </div>
                  <details className="project-media-url"><summary>Advanced: gallery URLs manually edit کریں</summary><textarea rows="4" value={item.galleryText} onChange={(event) => updateItem(item.id, "galleryText", event.target.value)} placeholder={"https://.../photo-1.jpg\nhttps://.../photo-2.jpg"} /></details>
                </div>
              </div>
              {!systems.some((system) => system.id === item.id) && <button className="project-editor__remove" type="button" onClick={() => removeUnsavedProject(item.id)}>نیا منصوبہ منسوخ کریں</button>}
            </article>
          ))}
        </div>

        <div className="project-manager__actions">
          <p>{message}</p>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save & Publish Projects"}</button>
        </div>
      </form>
    </section>
  );
}
