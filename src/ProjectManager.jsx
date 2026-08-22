import { useEffect, useState } from "react";
import "./ProjectManager.css";
import ProjectIcon from "./ProjectIcon";
import { uploadWebsiteImage, uploadWebsiteMediaFiles } from "./mediaUpload";
import { isMosqueChild } from "./mosqueManagement";
import { isWelfareChild } from "./welfareManagement";
import { isWorkItem } from "./workItems";

function buildItems(systems = [], settings = {}) {
  const profiles = settings.projectProfilesByProject || {};
  return systems.filter((system) => !isWorkItem(system, profiles)).map((system) => {
    const profile = profiles[system.id] || {};
    const legacyUrls = Array.isArray(profile.galleryUrls) && profile.galleryUrls.length
      ? profile.galleryUrls
      : Array.isArray(system.galleryUrls) ? system.galleryUrls : [];
    const configuredEvents = Array.isArray(profile.galleryEvents) ? profile.galleryEvents : [];
    return {
      id: system.id,
      nameEn: profile.nameEn || system.name || "",
      nameUr: profile.nameUr || system.nameUr || "",
      descriptionEn: profile.descriptionEn || system.description || "",
      descriptionUr: profile.descriptionUr || system.descriptionUr || "",
      icon: system.icon || "📁",
      coverImage: profile.coverImage || system.coverImage || "",
      galleryText: legacyUrls.join("\n"),
      galleryEvents: configuredEvents.length ? configuredEvents : (legacyUrls.length ? [{
        id: `legacy-${system.id}`,
        titleEn: "Previous Gallery",
        titleUr: "پچھلی گیلری",
        date: "",
        description: "",
        media: legacyUrls.map((url, index) => ({ url, type: "image", title: `Photo ${index + 1}` })),
      }] : []),
      isActive: system.isActive !== false,
      status: profile.status || "proposed",
      budget: profile.budget ?? "",
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

  const updateEvents = (projectId, updater) => setItems((current) => current.map((item) => (
    item.id === projectId ? { ...item, galleryEvents: updater(item.galleryEvents || []) } : item
  )));

  const addGalleryEvent = (item) => {
    const eventId = `event-${Date.now()}`;
    updateEvents(item.id, (events) => [...events, { id: eventId, titleEn: "New Event", titleUr: "نیا ایونٹ", date: "", description: "", media: [] }]);
  };

  const updateGalleryEvent = (projectId, eventId, key, value) => updateEvents(projectId, (events) => events.map((entry) => (
    entry.id === eventId ? { ...entry, [key]: value } : entry
  )));

  const removeGalleryEvent = (projectId, eventId) => {
    if (!window.confirm("اس event album کو ختم کریں؟ اس کی media list website سے ہٹ جائے گی۔")) return;
    updateEvents(projectId, (events) => events.filter((entry) => entry.id !== eventId));
  };

  const uploadGallery = async (item, galleryEvent, files) => {
    if (!files?.length) return;
    const key = `${item.id}-${galleryEvent.id}-gallery`;
    setMessage("");
    setUploadState(key, true);
    try {
      const uploaded = await uploadWebsiteMediaFiles(files, `projects/${item.id}/events/${galleryEvent.id}`);
      updateGalleryEvent(item.id, galleryEvent.id, "media", [...(galleryEvent.media || []), ...uploaded.map((asset) => ({ url: asset.url, type: asset.type, title: asset.name }))]);
      setMessage(`${uploaded.length} photo/video event میں upload ہوگئی۔ آخر میں Save & Publish Projects دبائیں۔`);
    } catch (error) {
      setMessage(`گیلری اپلوڈ نہیں ہوسکی: ${error.message}`);
    } finally {
      setUploadState(key, false);
    }
  };

  const removeGalleryImage = (item, galleryEvent, imageIndex) => {
    updateGalleryEvent(item.id, galleryEvent.id, "media", (galleryEvent.media || []).filter((_, index) => index !== imageIndex));
  };

  const moveGalleryImage = (item, galleryEvent, imageIndex, direction) => {
    const urls = [...(galleryEvent.media || [])];
    const nextIndex = imageIndex + direction;
    if (nextIndex < 0 || nextIndex >= urls.length) return;
    [urls[imageIndex], urls[nextIndex]] = [urls[nextIndex], urls[imageIndex]];
    updateGalleryEvent(item.id, galleryEvent.id, "media", urls);
  };

  const addProject = () => {
    const id = `project-${Date.now()}`;
    setItems((current) => [...current, {
      id,
      nameEn: "New Community Project",
      nameUr: "نیا عوامی منصوبہ",
      descriptionEn: "Transparent community project records.",
      descriptionUr: "عوامی منصوبے کا شفاف ریکارڈ۔",
      icon: "📁",
      coverImage: "",
      galleryText: "",
      galleryEvents: [],
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
    const workSystems = systems.filter((system) => isWorkItem(system, settings.projectProfilesByProject || {}));
    const nextSystems = [...cleanItems.map((item) => ({
      id: item.id,
      name: item.nameEn.trim(),
      description: item.descriptionEn.trim() || "Community management system",
      icon: item.icon.trim() || "📁",
      isActive: item.isActive !== false,
    })), ...workSystems];
    const projectProfilesByProject = cleanItems.reduce((profiles, item) => ({
      ...profiles,
      [item.id]: {
        nameEn: item.nameEn.trim(),
        nameUr: item.nameUr.trim(),
        descriptionEn: item.descriptionEn.trim(),
        descriptionUr: item.descriptionUr.trim(),
        coverImage: item.coverImage.trim(),
        galleryUrls: item.galleryText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
        galleryEvents: (item.galleryEvents || []).map((entry) => ({
          id: entry.id,
          titleEn: String(entry.titleEn || "Event").trim(),
          titleUr: String(entry.titleUr || "").trim(),
          date: entry.date || "",
          description: String(entry.description || "").trim(),
          media: (entry.media || []).filter((asset) => asset?.url).map((asset) => ({ url: asset.url, type: asset.type === "video" ? "video" : "image", title: asset.title || "" })),
        })),
        status: item.status || "proposed",
        budget: Math.max(0, Number(item.budget) || 0),
        completionPercent: Math.max(0, Math.min(100, Number(item.completionPercent) || 0)),
        startDate: item.startDate || "",
        expectedCompletionDate: item.expectedCompletionDate || "",
        planEn: item.planEn.trim(),
        planUr: item.planUr.trim(),
      },
    }), { ...(settings.projectProfilesByProject || {}) });

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
      <p className="project-manager__intro">یہاں بڑے منصوبوں کی تفصیل تبدیل کریں۔ کسی منصوبے کے اندر نیا کام بنانے اور اس کا الگ حساب رکھنے کے لیے وہ منصوبہ کھول کر “+ نیا کام” استعمال کریں۔</p>

      <form onSubmit={saveProjects}>
        <div className="project-manager__list">
          {items.map((item, index) => (
            <article className="project-editor" id={`project-editor-${item.id}`} key={item.id}>
              <div className="project-editor__top">
                <div className="project-editor__identity"><ProjectIcon project={item} size={34} /><div><small>{isMosqueChild(item) ? "MOSQUE ACCOUNT" : isWelfareChild(item) ? "WELFARE PROJECT" : `PROJECT ${index + 1}`}</small><strong>{item.nameEn || "Untitled Project"}</strong></div></div>
                <label className="project-editor__visibility"><input type="checkbox" checked={item.isActive !== false} onChange={(event) => updateItem(item.id, "isActive", event.target.checked)} /><b>{item.isActive !== false ? "Public" : "Hidden"}</b></label>
              </div>

              <div className="project-editor__grid">
                <label><span>Icon</span><input value={item.icon} onChange={(event) => updateItem(item.id, "icon", event.target.value)} placeholder="🌿" /></label>
                <label><span>Project ID</span><input value={item.id} disabled /></label>
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
                    <label><span>Status / حالت</span><select value={item.status} onChange={(event) => updateItem(item.id, "status", event.target.value)}><option value="proposed">Proposed</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></label>
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

                <div className="project-editor__wide project-media-control project-event-manager">
                  <div className="project-media-control__heading"><span>Project Event Albums</span><small>ہر event کے اندر الگ photos اور videos رکھیں</small></div>
                  <button className="project-event-add" type="button" onClick={() => addGalleryEvent(item)}>+ نیا Event Album</button>
                  <div className="project-event-list">
                    {(item.galleryEvents || []).map((galleryEvent, eventIndex) => {
                      const uploadKey = `${item.id}-${galleryEvent.id}-gallery`;
                      return <article className="project-event-editor" key={galleryEvent.id}>
                        <div className="project-event-editor__heading"><strong>EVENT {eventIndex + 1}</strong><button type="button" className="danger" onClick={() => removeGalleryEvent(item.id, galleryEvent.id)}>Delete event</button></div>
                        <div className="project-event-editor__fields">
                          <label><span>Event name (English)</span><input value={galleryEvent.titleEn || ""} onChange={(event) => updateGalleryEvent(item.id, galleryEvent.id, "titleEn", event.target.value)} /></label>
                          <label><span>ایونٹ کا نام (اردو)</span><input dir="rtl" value={galleryEvent.titleUr || ""} onChange={(event) => updateGalleryEvent(item.id, galleryEvent.id, "titleUr", event.target.value)} /></label>
                          <label><span>Event date</span><input type="date" value={galleryEvent.date || ""} onChange={(event) => updateGalleryEvent(item.id, galleryEvent.id, "date", event.target.value)} /></label>
                          <label><span>Short description</span><input value={galleryEvent.description || ""} onChange={(event) => updateGalleryEvent(item.id, galleryEvent.id, "description", event.target.value)} /></label>
                        </div>
                        <label className={`project-media-upload ${uploading[uploadKey] ? "is-uploading" : ""}`}>
                          <input type="file" accept="image/*,video/*" multiple disabled={uploading[uploadKey]} onChange={(event) => { uploadGallery(item, galleryEvent, event.target.files); event.target.value = ""; }} />
                          <span>{uploading[uploadKey] ? "Uploading media..." : "+ Add photos / videos"}</span>
                        </label>
                        <div className="project-gallery-editor">
                          {(galleryEvent.media || []).map((asset, mediaIndex) => (
                            <article key={`${asset.url}-${mediaIndex}`}>
                              {asset.type === "video" ? <video src={asset.url} muted playsInline /> : <img src={asset.url} alt={asset.title || `Gallery ${mediaIndex + 1}`} />}
                              <div><button type="button" disabled={mediaIndex === 0} onClick={() => moveGalleryImage(item, galleryEvent, mediaIndex, -1)}>←</button><b>{asset.type === "video" ? "VIDEO" : mediaIndex + 1}</b><button type="button" disabled={mediaIndex === galleryEvent.media.length - 1} onClick={() => moveGalleryImage(item, galleryEvent, mediaIndex, 1)}>→</button><button type="button" className="danger" onClick={() => removeGalleryImage(item, galleryEvent, mediaIndex)}>×</button></div>
                            </article>
                          ))}
                          {!galleryEvent.media?.length && <p>اس event میں ابھی کوئی photo/video شامل نہیں۔</p>}
                        </div>
                      </article>;
                    })}
                    {!item.galleryEvents?.length && <p className="project-event-empty">پہلے “نیا Event Album” بنائیں، پھر اس میں media upload کریں۔</p>}
                  </div>
                  <details className="project-media-url"><summary>Legacy gallery URLs (پرانا ریکارڈ)</summary><textarea rows="4" value={item.galleryText} onChange={(event) => updateItem(item.id, "galleryText", event.target.value)} /></details>
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
