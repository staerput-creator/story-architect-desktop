mod commands;
use tauri::{Emitter, menu::{Menu, Submenu, MenuItem}};
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let file = Submenu::with_items(app, "Файл", true, &[
                &MenuItem::with_id(app, "new", "Создать", true, Some("CmdOrCtrl+N"))?,
                &MenuItem::with_id(app, "open", "Открыть…", true, Some("CmdOrCtrl+O"))?,
                &MenuItem::with_id(app, "save", "Сохранить", true, Some("CmdOrCtrl+S"))?,
                &MenuItem::with_id(app, "save-as", "Сохранить как…", true, Some("CmdOrCtrl+Shift+S"))?,
                &MenuItem::with_id(app, "export", "Экспорт HTML…", true, None::<&str>)?,
            ])?;
            let edit = Submenu::with_items(app, "Правка", true, &[
                &MenuItem::with_id(app, "undo", "Отмена", true, Some("CmdOrCtrl+Z"))?,
                &MenuItem::with_id(app, "redo", "Повтор", true, Some("CmdOrCtrl+Shift+Z"))?,
            ])?;
            let view = Submenu::with_items(app, "Вид", true, &[
                &MenuItem::with_id(app, "dark", "Тёмная", true, None::<&str>)?,
                &MenuItem::with_id(app, "light", "Светлая", true, None::<&str>)?,
                &MenuItem::with_id(app, "soft", "Мягкая", true, None::<&str>)?,
                &MenuItem::with_id(app, "zoom-in", "Приблизить", true, Some("CmdOrCtrl+Plus"))?,
                &MenuItem::with_id(app, "zoom-out", "Отдалить", true, Some("CmdOrCtrl+-"))?,
            ])?;
            app.set_menu(Menu::with_items(app, &[&file, &edit, &view])?)?;
            Ok(())
        })
        .on_menu_event(|app, event| { let _ = app.emit("desktop-menu", event.id().as_ref()); })
        .invoke_handler(tauri::generate_handler![commands::open_story_file, commands::save_story_file,
            commands::save_story_file_as, commands::export_html_game, commands::get_recent_projects,
            commands::add_recent_project])
        .run(tauri::generate_context!())
        .expect("Story Architect runtime failed");
}