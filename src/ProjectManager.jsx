import { useEffect, useState } from "react";
import "./ProjectManager.css";
import ProjectIcon from "./ProjectIcon";

function buildItems(systems = [], settings = {}) {
  const profiles = settings.projectProfilesByProject || {};
  return systems.map((system) => {
    const profile = profiles[system.id] || {};
    return {
      id: system.id,
      nameEn: profile.nameEn || system.name || "",
      nameUr: profile.nameUr || "",
      descriptionEn: profile.descriptionEn || system.description || "",
      descriptionUr: profile.descriptionUr || "",
      icon: system.icon || "📁",
      coverImage: profile.coverImage || "",
      galleryText: Array.isArray(profile.galleryUrls) ? profile.galleryUrls.join("\n") : "",
      isActive: system.isActive !== false,
    };
  });
}

export default function ProjectManager({ systems, setSystems, settings, onSaveSettings, saving }) {
  const [items, setItems] = useState(() => buildItems(systems, settings));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(buildItems(systems, settings));
  }, [systems, settings]);

  const updateItem = (id, key, value) => setItems((current) => current.map((item) => (
    item.id === id ? { ...item, [key]: value } : item
  )));

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
      isActive: true,
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
      <p className="project-manager__intro">یہاں سے ہر منصوبے کا اردو/انگریزی تعارف، آئیکن، کور تصویر، گیلری اور Public حالت تبدیل کریں۔</p>

      <form onSubmit={saveProjects}>
        <div className="project-manager__list">
          {items.map((item, index) => (
            <article className="project-editor" id={`project-editor-${item.id}`} key={item.id}>
              <div className="project-editor__top">
                <div className="project-editor__identity"><ProjectIcon project={item} size={34} /><div><small>PROJECT {index + 1}</small><strong>{item.nameEn || "Untitled Project"}</strong></div></div>
                <label className="project-editor__visibility"><input type="checkbox" checked={item.isActive !== false} onChange={(event) => updateItem(item.id, "isActive", event.target.checked)} /><b>{item.isActive !== false ? "Public" : "Hidden"}</b></label>
              </div>

              <div className="project-editor__grid">
                <label><span>Icon</span><input value={item.icon} onChange={(event) => updateItem(item.id, "icon", event.target.value)} placeholder="🌿" /></label>
                <label><span>Project ID</span><input value={item.id} disabled /></label>
                <label><span>English name</span><input value={item.nameEn} onChange={(event) => updateItem(item.id, "nameEn", event.target.value)} /></label>
                <label><span>اردو نام</span><input dir="rtl" value={item.nameUr} onChange={(event) => updateItem(item.id, "nameUr", event.target.value)} /></label>
                <label><span>English description</span><textarea rows="3" value={item.descriptionEn} onChange={(event) => updateItem(item.id, "descriptionEn", event.target.value)} /></label>
                <label><span>اردو تعارف</span><textarea dir="rtl" rows="3" value={item.descriptionUr} onChange={(event) => updateItem(item.id, "descriptionUr", event.target.value)} /></label>
                <label className="project-editor__wide"><span>Cover image URL</span><input type="url" value={item.coverImage} onChange={(event) => updateItem(item.id, "coverImage", event.target.value)} placeholder="https://..." /></label>
                <label className="project-editor__wide"><span>Gallery image URLs — ہر نئی لائن میں ایک تصویر کا لنک</span><textarea rows="4" value={item.galleryText} onChange={(event) => updateItem(item.id, "galleryText", event.target.value)} placeholder={"https://.../photo-1.jpg\nhttps://.../photo-2.jpg"} /></label>
              </div>

              {item.coverImage && <img className="project-editor__preview" src={item.coverImage} alt="Project cover preview" />}
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
