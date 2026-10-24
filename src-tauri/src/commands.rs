use serde_json::{Value, json};
use std::{fs, io::Write, path::Path, sync::Mutex};
use tauri::Manager;
static RECENTS_LOCK: Mutex<()> = Mutex::new(());
const MAX_BYTES: u64 = 256 * 1024 * 1024;
fn validate_story(content: &str) -> Result<Value, String> {
    if content.len() as u64 > MAX_BYTES { return Err("Project exceeds 256 MiB".into()); }
    let value: Value = serde_json::from_str(content).map_err(|e| e.to_string())?;
    if !value.get("nodes").is_some_and(Value::is_array) || !value.get("edges").is_some_and(Value::is_array) {
        return Err("Invalid story: nodes and edges arrays required".into());
    }
    Ok(value)
}
fn atomic_write(path: &Path, content: &[u8]) -> Result<(), String> {
    let parent = path.parent().filter(|p| !p.as_os_str().is_empty()).ok_or("Absolute file path required")?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    temp.write_all(content).map_err(|e| e.to_string())?;
    temp.as_file().sync_all().map_err(|e| e.to_string())?;
    temp.persist(path).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    fs::File::open(parent).and_then(|f| f.sync_all()).map_err(|e| e.to_string())?;
    Ok(())
}
#[tauri::command]
pub async fn open_story_file(app: tauri::AppHandle) -> Result<Option<Value>, String> {
    let file = rfd::AsyncFileDialog::new().add_filter("Story Architect", &["json"]).pick_file().await;
    let Some(file) = file else { return Ok(None) };
    let path = file.path();
    if !path.to_string_lossy().ends_with(".story.json") { return Err("Expected .story.json".into()); }
    if fs::metadata(path).map_err(|e| e.to_string())?.len() > MAX_BYTES { return Err("Project too large".into()); }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let project = validate_story(&content)?;
    let file_path = path.to_string_lossy().into_owned();
    add_recent_project(app, file_path.clone())?;
    Ok(Some(json!({"filePath": file_path, "project": project})))
}
#[tauri::command]
pub fn save_story_file(app: tauri::AppHandle, file_path: String, json_content: String) -> Result<(), String> {
    validate_story(&json_content)?;
    let path = Path::new(&file_path);
    if !path.is_absolute() || !file_path.ends_with(".story.json") { return Err("Absolute .story.json path required".into()); }
    atomic_write(path, json_content.as_bytes())?;
    add_recent_project(app, file_path)
}
#[tauri::command]
pub async fn save_story_file_as(app: tauri::AppHandle, default_name: String, json_content: String) -> Result<Option<String>, String> {
    validate_story(&json_content)?;
    let name = Path::new(&default_name).file_name().and_then(|v| v.to_str()).unwrap_or("project.story.json").to_owned();
    let file = rfd::AsyncFileDialog::new().set_file_name(name).add_filter("Story Architect", &["json"]).save_file().await;
    let Some(file) = file else { return Ok(None) };
    let mut path = file.path().to_string_lossy().into_owned();
    if !path.ends_with(".story.json") { path.push_str(".story.json"); }
    save_story_file(app, path.clone(), json_content)?;
    Ok(Some(path))
}
#[tauri::command]
pub async fn export_html_game(file_path: String, html_content: String) -> Result<Option<String>, String> {
    let file = rfd::AsyncFileDialog::new().set_file_name(Path::new(&file_path).file_name().and_then(|v| v.to_str()).unwrap_or("story.html"))
        .add_filter("HTML game", &["html"]).save_file().await;
    let Some(file) = file else { return Ok(None) };
    atomic_write(file.path(), html_content.as_bytes())?;
    Ok(Some(file.path().to_string_lossy().into_owned()))
}
fn recent_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("recent-projects.json"))
}
#[tauri::command]
pub fn get_recent_projects(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let _guard = RECENTS_LOCK.lock().map_err(|e| e.to_string())?;
    let path = recent_path(&app)?;
    if !path.exists() { return Ok(vec![]); }
    serde_json::from_str(&fs::read_to_string(path).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}
#[tauri::command]
pub fn add_recent_project(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let canonical = fs::canonicalize(path).map_err(|e| e.to_string())?.to_string_lossy().into_owned();
    let _guard = RECENTS_LOCK.lock().map_err(|e| e.to_string())?;
    let config = recent_path(&app)?;
    let mut paths: Vec<String> = if config.exists() {
        serde_json::from_str(&fs::read_to_string(&config).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?
    } else { vec![] };
    paths.retain(|p| p != &canonical);
    paths.insert(0, canonical);
    paths.truncate(20);
    atomic_write(&config, &serde_json::to_vec(&paths).map_err(|e| e.to_string())?)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn atomic_overwrite_and_validation() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.story.json");
        atomic_write(&path, b"old").unwrap();
        atomic_write(&path, b"new").unwrap();
        assert_eq!(fs::read_to_string(path).unwrap(), "new");
        assert!(validate_story("{\"nodes\":[],\"edges\":[]}").is_ok());
        assert!(validate_story("{}").is_err());
    }
}